import { QuickApiError } from '../../client/errors';
import { createFetchTransport } from '../../client/transport';

interface FetchCall {
  url: string;
  init: RequestInit;
}

interface MockResponseSpec {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  /** Ha throw-ol — szimulált network hiba. */
  throw?: unknown;
}

function makeMockFetch(
  responses: MockResponseSpec | MockResponseSpec[] | ((call: FetchCall) => MockResponseSpec),
): { fetch: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const queue = Array.isArray(responses) ? [...responses] : [];
  const fn = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const call: FetchCall = { url: typeof url === 'string' ? url : url.toString(), init: init ?? {} };
    calls.push(call);
    let spec: MockResponseSpec;
    if (typeof responses === 'function') {
      spec = responses(call);
    } else if (Array.isArray(responses)) {
      // Tömb esetén sorra fogyasztunk; ha kifogyott, az utolsót ismételjük.
      spec = (queue.shift() ?? responses[responses.length - 1]) as MockResponseSpec;
    } else {
      // Egyetlen spec — minden hívásra ugyanaz.
      spec = responses;
    }
    if (spec.throw) throw spec.throw;
    const status = spec.status ?? 200;
    const body =
      typeof spec.body === 'string' || spec.body === undefined
        ? (spec.body as string | undefined)
        : JSON.stringify(spec.body);
    // 204 / 205 / 304 nem fogadhatnak body-t a Response constructor-ban
    const allowsBody = status !== 204 && status !== 205 && status !== 304;
    return new Response(allowsBody ? (body ?? '') : null, {
      status,
      headers: spec.headers,
    });
  };
  return { fetch: fn as typeof fetch, calls };
}

describe('createFetchTransport — request', () => {
  it('GET — Authorization fejlécet és Accept-et beállít', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: { ok: true } });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const res = await t.request<{ ok: boolean }>({ method: 'GET', path: '/2/company-info/' });
    expect(res).toEqual({ ok: true });
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/company-info/');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Token tok');
    expect((calls[0].init.headers as Record<string, string>).Accept).toBe('application/json');
  });

  it('Quick-Company-Id fejlécet beilleszt, ha credential tartalmazza', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: { ok: true } });
    const t = createFetchTransport({ apiToken: 'tok', companyId: '42', fetch: f });
    await t.request({ method: 'GET', path: '/x' });
    expect((calls[0].init.headers as Record<string, string>)['Quick-Company-Id']).toBe('42');
  });

  it('whitespace-only companyId nem kerül át', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: {} });
    const t = createFetchTransport({ apiToken: 'tok', companyId: '   ', fetch: f });
    await t.request({ method: 'GET', path: '/x' });
    expect((calls[0].init.headers as Record<string, string>)['Quick-Company-Id']).toBeUndefined();
  });

  it('POST body JSON-ben + Content-Type fejléc', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: { processed: [1] } });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await t.request({ method: 'POST', path: '/x', body: { ids: [1, 2] } });
    expect(calls[0].init.method).toBe('POST');
    expect((calls[0].init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
    expect(calls[0].init.body).toBe(JSON.stringify({ ids: [1, 2] }));
  });

  it('query string serializálás — array → ismétlődő paraméter', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: [] });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await t.request({
      method: 'GET',
      path: '/x',
      query: { tags: ['a', 'b'], page: 1, page_size: 10 },
    });
    expect(calls[0].url).toContain('tags=a');
    expect(calls[0].url).toContain('tags=b');
    expect(calls[0].url).toContain('page=1');
    expect(calls[0].url).toContain('page_size=10');
  });

  it('null/undefined query értékek kihagyva', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: [] });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await t.request({ method: 'GET', path: '/x', query: { a: 1, b: null, c: undefined } });
    expect(calls[0].url).toContain('a=1');
    expect(calls[0].url).not.toContain('b=');
    expect(calls[0].url).not.toContain('c=');
  });

  it('204 No Content válasz → undefined', async () => {
    const { fetch: f } = makeMockFetch({ status: 204 });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const res = await t.request({ method: 'POST', path: '/x' });
    expect(res).toBeUndefined();
  });

  it('üres válasz törzs → undefined', async () => {
    const { fetch: f } = makeMockFetch({ status: 200, body: '' });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const res = await t.request({ method: 'GET', path: '/x' });
    expect(res).toBeUndefined();
  });

  it('400 hibára QuickApiError-t dob, body parsed-ként', async () => {
    const { fetch: f } = makeMockFetch({ status: 400, body: { _error: 'rossz id' } });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await expect(t.request({ method: 'GET', path: '/x' })).rejects.toBeInstanceOf(QuickApiError);
    try {
      await t.request({ method: 'GET', path: '/x' });
    } catch (err) {
      const e = err as QuickApiError;
      expect(e.statusCode).toBe(400);
      expect(e.body).toEqual({ _error: 'rossz id' });
      expect(e.message).toContain('rossz id');
      expect(e.endpoint).toBe('GET /x');
    }
  });

  it('nem-JSON hiba body szövegként marad', async () => {
    const { fetch: f } = makeMockFetch({ status: 500, body: 'Internal Server Error' });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f, maxRetries: 0 });
    try {
      await t.request({ method: 'GET', path: '/x' });
    } catch (err) {
      expect((err as QuickApiError).body).toBe('Internal Server Error');
    }
  });

  it.each([
    ['_error', { _error: 'rossz' }, 'rossz'],
    ['detail', { detail: 'részlet' }, 'részlet'],
    ['message', { message: 'üzenet' }, 'üzenet'],
  ])('shortMessage extrakció: %s mezőből', async (_label, body, expected) => {
    const { fetch: f } = makeMockFetch({ status: 422, body });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f, maxRetries: 0 });
    try {
      await t.request({ method: 'GET', path: '/x' });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as QuickApiError).message).toContain(expected);
    }
  });

  it('nem-JSON hosszú szöveges body nem kerül a message-be', async () => {
    const longText = 'x'.repeat(500);
    const { fetch: f } = makeMockFetch({ status: 500, body: longText });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f, maxRetries: 0 });
    try {
      await t.request({ method: 'GET', path: '/x' });
    } catch (err) {
      // A message csak a statusText-et használja, ha a body túl hosszú
      const msg = (err as QuickApiError).message;
      expect(msg.length).toBeLessThan(longText.length);
    }
  });
});

describe('createFetchTransport — retry middleware', () => {
  it('429 → retry, 2. próbálkozásra siker', async () => {
    let attempt = 0;
    const { fetch: f, calls } = makeMockFetch(() => {
      attempt++;
      if (attempt === 1) return { status: 429, body: { _error: 'rate limited' } };
      return { status: 200, body: { ok: true } };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const res = await t.request<{ ok: boolean }>({ method: 'GET', path: '/x' });
    expect(res).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
  });

  it('5xx-ek után megáll max retry-nál', async () => {
    let attempt = 0;
    const { fetch: f, calls } = makeMockFetch(() => {
      attempt++;
      return { status: 503, body: 'down' };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await expect(t.request({ method: 'GET', path: '/x' })).rejects.toBeInstanceOf(QuickApiError);
    // 1 alaphívás + 3 retry = 4 attempt
    expect(calls).toHaveLength(4);
    expect(attempt).toBe(4);
  });

  it('400 (nem-transient) — azonnali fail', async () => {
    const { fetch: f, calls } = makeMockFetch({ status: 400, body: 'bad' });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await expect(t.request({ method: 'GET', path: '/x' })).rejects.toBeInstanceOf(QuickApiError);
    expect(calls).toHaveLength(1);
  });

  it('network error (fetch throws) → QuickApiError statusCode 0', async () => {
    const { fetch: f } = makeMockFetch({ throw: new Error('ECONNRESET') });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f, maxRetries: 0 });
    try {
      await t.request({ method: 'GET', path: '/x' });
    } catch (err) {
      expect(err).toBeInstanceOf(QuickApiError);
      expect((err as QuickApiError).statusCode).toBe(0);
    }
  });

  it('Retry-After fejléc tiszteletben — n8n-szerű hibából (response.headers)', async () => {
    let attempt = 0;
    const { fetch: f, calls } = makeMockFetch(() => {
      attempt++;
      if (attempt === 1) {
        return { status: 429, body: { _error: 'rl' }, headers: { 'retry-after': '0' } };
      }
      return { status: 200, body: { ok: true } };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const start = Date.now();
    await t.request({ method: 'GET', path: '/x' });
    expect(calls).toHaveLength(2);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('Retry-After parse-olhatatlan értéket csendesen ignorálja', async () => {
    let attempt = 0;
    const { fetch: f } = makeMockFetch(() => {
      attempt++;
      if (attempt === 1) {
        return { status: 429, body: 'rl', headers: { 'retry-after': 'not-a-number' } };
      }
      return { status: 200, body: { ok: true } };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    await t.request({ method: 'GET', path: '/x' });
    expect(attempt).toBe(2);
  });

  it('extra defaultHeaders-t felülírja az auth-ot, ha kell — de Authorization-t felül íródik', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: {} });
    const t = createFetchTransport({
      apiToken: 'tok',
      fetch: f,
      defaultHeaders: { 'X-App': 'demo' },
    });
    await t.request({ method: 'GET', path: '/x' });
    expect((calls[0].init.headers as Record<string, string>)['X-App']).toBe('demo');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Token tok');
  });

  it('üres baseUrl → default-ra esik vissza', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: {} });
    const t = createFetchTransport({ apiToken: 'tok', baseUrl: '', fetch: f });
    await t.request({ method: 'GET', path: '/x' });
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/x');
  });

  it('trailing slash a baseUrl-ben levágódik', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: {} });
    const t = createFetchTransport({
      apiToken: 'tok',
      baseUrl: 'https://api.quick.riport.co.hu/',
      fetch: f,
    });
    await t.request({ method: 'GET', path: '/x' });
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/x');
  });
});

describe('createFetchTransport — paginate', () => {
  it('count-alapú párhuzamos pagináció — 250/100 → 3 call', async () => {
    const responseFor = (page: number) => ({
      count: 250,
      next: page < 3 ? `next-${page}` : null,
      previous: null,
      results: page === 3 ? [{ id: 21 }, { id: 22 }] : Array.from({ length: 100 }, (_, i) => ({ id: page * 100 + i })),
    });
    const { fetch: f, calls } = makeMockFetch((call) => {
      const url = new URL(call.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      return { body: responseFor(page) };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate({ method: 'GET', path: '/x' });
    expect(calls).toHaveLength(3);
    expect(all).toHaveLength(202); // 100 + 100 + 2
  });

  it('sequential next-link követés ha nincs count', async () => {
    let n = 0;
    const { fetch: f, calls } = makeMockFetch(() => {
      n++;
      return { body: { next: n < 3 ? 'go' : null, results: [{ id: n }] } };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate<{ id: number }>({ method: 'GET', path: '/x' });
    expect(calls).toHaveLength(3);
    expect(all.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('egyszer (count <= pageSize) → csak első oldal', async () => {
    const { fetch: f, calls } = makeMockFetch({
      body: { count: 5, next: null, results: [{ id: 1 }, { id: 2 }] },
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate({ method: 'GET', path: '/x' });
    expect(calls).toHaveLength(1);
    expect(all).toHaveLength(2);
  });

  it('nem-paginált tömb response → egyetlen kérés', async () => {
    const { fetch: f, calls } = makeMockFetch({ body: [{ id: 1 }, { id: 2 }] });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate({ method: 'GET', path: '/x' });
    expect(calls).toHaveLength(1);
    expect(all).toHaveLength(2);
  });

  it('sorrendet megőrzi a párhuzamos módban is', async () => {
    const { fetch: f } = makeMockFetch((call) => {
      const url = new URL(call.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      return {
        body: {
          count: 300,
          next: page < 3 ? 'go' : null,
          results: [{ p: page }],
        },
      };
    });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate<{ p: number }>({ method: 'GET', path: '/x' });
    expect(all.map((r) => r.p)).toEqual([1, 2, 3]);
  });

  it('nem-array, nem-results, csak objektum válasz → egyetlen elem', async () => {
    const { fetch: f } = makeMockFetch({ body: { ok: true } });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate({ method: 'GET', path: '/x' });
    expect(all).toEqual([{ ok: true }]);
  });

  it('primitív (string) válasz → üres lista', async () => {
    const { fetch: f } = makeMockFetch({ body: '"plain string"' });
    const t = createFetchTransport({ apiToken: 'tok', fetch: f });
    const all = await t.paginate({ method: 'GET', path: '/x' });
    expect(all).toEqual([]);
  });
});
