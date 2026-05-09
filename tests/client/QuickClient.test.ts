import { QuickClient } from '../../client/QuickClient';
import type { Transport, RequestOptions } from '../../client/transport';

interface MockedCall {
  request: RequestOptions;
}

function makeMockTransport(
  responder: (req: RequestOptions) => unknown,
): { transport: Transport; calls: MockedCall[] } {
  const calls: MockedCall[] = [];
  const transport: Transport = {
    async request<T>(req: RequestOptions): Promise<T> {
      calls.push({ request: req });
      return responder(req) as T;
    },
    async paginate<T>(req: RequestOptions): Promise<T[]> {
      calls.push({ request: req });
      return responder(req) as T[];
    },
  };
  return { transport, calls };
}

describe('QuickClient', () => {
  it('a 16 resource-hoz tartozó accessor mind elérhető', () => {
    const { transport } = makeMockTransport(() => ({}));
    const client = new QuickClient(transport);
    expect(client.expenses).toBeDefined();
    expect(client.incomes).toBeDefined();
    expect(client.partners).toBeDefined();
    expect(client.accounts).toBeDefined();
    expect(client.payments).toBeDefined();
    expect(client.pulse).toBeDefined();
    expect(client.documents).toBeDefined();
    expect(client.documentTypes).toBeDefined();
    expect(client.taxes).toBeDefined();
    expect(client.taxCodes).toBeDefined();
    expect(client.salaries).toBeDefined();
    expect(client.ledgerNumbers).toBeDefined();
    expect(client.vatCategories).toBeDefined();
    expect(client.company).toBeDefined();
    expect(client.artifacts).toBeDefined();
    expect(client.auditXml).toBeDefined();
  });

  it('konstruktorba átadott Transport-ot megőrzi (egyedi auth/proxy esetére)', () => {
    const { transport } = makeMockTransport(() => ({}));
    const client = new QuickClient(transport);
    expect(client.transport).toBe(transport);
  });

  it('options-szal createFetchTransport-et hoz létre — request() működik', async () => {
    const fetchSpy = jest.fn(async () =>
      new Response(JSON.stringify({ id: 1, name: 'Test Co' }), { status: 200 }),
    );
    const client = new QuickClient({
      apiToken: 'tok',
      fetch: fetchSpy as unknown as typeof fetch,
    });
    const info = await client.company.getInfo();
    expect(info).toEqual({ id: 1, name: 'Test Co' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('fromN8n() factory ↔ n8n-szerű kontextusból transport-ot épít', async () => {
    const httpSpy = jest.fn(async () => ({ summary: 7, accounts: [] }));
    const ctx = {
      helpers: { httpRequestWithAuthentication: httpSpy },
    };
    const client = QuickClient.fromN8n(ctx);
    const pulse = await client.pulse.get();
    expect(pulse.summary).toBe(7);
    expect(httpSpy).toHaveBeenCalledTimes(1);
  });

  it('fromN8n() companyId opcióval Quick-Company-Id fejlécet ad', async () => {
    let captured: { headers?: Record<string, string> } | undefined;
    const ctx = {
      helpers: {
        httpRequestWithAuthentication: jest.fn(async (_name: string, opts: typeof captured) => {
          captured = opts;
          return {};
        }),
      },
    };
    const client = QuickClient.fromN8n(ctx, { companyId: '42' });
    await client.pulse.get();
    expect(captured?.headers).toMatchObject({ 'Quick-Company-Id': '42' });
  });
});

describe('Resources — Expenses', () => {
  it('list() — GET /2/expenses/ + query param-ekkel', async () => {
    const { transport, calls } = makeMockTransport(() => ({
      count: 0,
      next: null,
      previous: null,
      results: [],
    }));
    const client = new QuickClient(transport);
    await client.expenses.list({ from_date: '2026-01-01', is_paid: false });
    expect(calls[0].request).toMatchObject({
      method: 'GET',
      path: '/2/expenses/',
      query: { from_date: '2026-01-01', is_paid: false },
    });
  });

  it('paginate() — átadja a Transport.paginate-nek', async () => {
    const { transport, calls } = makeMockTransport(() => [{ id: 1 }, { id: 2 }]);
    const client = new QuickClient(transport);
    const all = await client.expenses.paginate();
    expect(all).toHaveLength(2);
    expect(calls[0].request.path).toBe('/2/expenses/');
  });

  it('iterate() — async iterator-t ad', async () => {
    const { transport } = makeMockTransport(() => [{ id: 10 }, { id: 20 }, { id: 30 }]);
    const client = new QuickClient(transport);
    const ids: number[] = [];
    for await (const e of client.expenses.iterate()) {
      ids.push(e.id);
    }
    expect(ids).toEqual([10, 20, 30]);
  });

  it('get(id) → /2/expenses/{id}/', async () => {
    const { transport, calls } = makeMockTransport(() => ({ id: 42 }));
    const client = new QuickClient(transport);
    await client.expenses.get(42);
    expect(calls[0].request.path).toBe('/2/expenses/42/');
  });

  it('update — PATCH /2/expenses/{id}/update/', async () => {
    const { transport, calls } = makeMockTransport(() => ({ id: 42 }));
    const client = new QuickClient(transport);
    await client.expenses.update(42, { accounting_id: 'A-001' });
    expect(calls[0].request).toMatchObject({
      method: 'PATCH',
      path: '/2/expenses/42/update/',
      body: { accounting_id: 'A-001' },
    });
  });

  it('create — POST /2/expenses/create/', async () => {
    const { transport, calls } = makeMockTransport(() => ({ processed: [1] }));
    const client = new QuickClient(transport);
    await client.expenses.create({ filename: 'a.pdf', content: 'BASE64' });
    expect(calls[0].request).toMatchObject({
      method: 'POST',
      path: '/2/expenses/create/',
      body: { expenses: [{ filename: 'a.pdf', content: 'BASE64' }], source: 'public_api' },
    });
  });

  it('createMany — 6 file → 2 batch (5+1) — processed aggregálva', async () => {
    let n = 0;
    const { transport, calls } = makeMockTransport(() => {
      n++;
      return { processed: n === 1 ? [1, 2, 3, 4, 5] : [6] };
    });
    const client = new QuickClient(transport);
    const files = Array.from({ length: 6 }, (_, i) => ({
      filename: `${i}.pdf`,
      content: 'X',
    }));
    const result = await client.expenses.createMany(files);
    expect(calls).toHaveLength(2);
    expect(result.processed).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('createMany — üres lista → empty processed, no API call', async () => {
    const { transport, calls } = makeMockTransport(() => ({ processed: [] }));
    const client = new QuickClient(transport);
    const result = await client.expenses.createMany([]);
    expect(calls).toHaveLength(0);
    expect(result.processed).toEqual([]);
  });

  it('searchArtifact', async () => {
    const { transport, calls } = makeMockTransport(() => ({}));
    const client = new QuickClient(transport);
    await client.expenses.searchArtifact({ name: 'a.pdf', size: 100, company_ids: [1] });
    expect(calls[0].request).toMatchObject({
      method: 'POST',
      path: '/2/expenses/artifact-search/',
      body: { name: 'a.pdf', size: 100, company_ids: [1] },
    });
  });

  it.each([
    ['approve', '/1/expenses/approve/'],
    ['unapprove', '/1/expenses/unapprove/'],
    ['check', '/1/expenses/check/'],
    ['uncheck', '/1/expenses/uncheck/'],
    ['export', '/1/expenses/export/'],
  ] as const)('%s → POST %s', async (op, path) => {
    const { transport, calls } = makeMockTransport(() => ({
      success_ids: [1, 2],
      failed_ids: [],
      errors: [],
    }));
    const client = new QuickClient(transport);
    await (client.expenses[op] as (ids: number[]) => Promise<unknown>)([1, 2]);
    expect(calls[0].request).toMatchObject({ method: 'POST', path, body: { ids: [1, 2] } });
  });

  it('approve üres ID listával → empty result, no API call', async () => {
    const { transport, calls } = makeMockTransport(() => ({}));
    const client = new QuickClient(transport);
    const r = await client.expenses.approve([]);
    expect(calls).toHaveLength(0);
    expect(r).toEqual({ success_ids: [], failed_ids: [], errors: [] });
  });

  it('approve 250 ID-vel → 3 batch (100/100/50), aggregálva', async () => {
    let n = 0;
    const { transport, calls } = makeMockTransport((req) => {
      n++;
      const ids = (req.body as { ids: number[] }).ids;
      return { success_ids: ids, failed_ids: [], errors: [] };
    });
    const client = new QuickClient(transport);
    const ids = Array.from({ length: 250 }, (_, i) => i + 1);
    const r = await client.expenses.approve(ids);
    expect(calls).toHaveLength(3);
    expect(n).toBe(3);
    expect(r.success_ids).toHaveLength(250);
  });

  it('quarantineAccept üres ID → no call', async () => {
    const { transport, calls } = makeMockTransport(() => ({}));
    const client = new QuickClient(transport);
    const r = await client.expenses.quarantineAccept([]);
    expect(calls).toHaveLength(0);
    expect(r).toEqual({ success_ids: [], success_count: 0, failure_count: 0 });
  });

  it('quarantineAccept egy batch alá fér be → 1 call, közvetlen response', async () => {
    const { transport, calls } = makeMockTransport(() => ({
      success_ids: [1],
      success_count: 1,
      failure_count: 0,
    }));
    const client = new QuickClient(transport);
    const r = await client.expenses.quarantineAccept([1]);
    expect(calls).toHaveLength(1);
    expect(r.success_count).toBe(1);
  });

  it('quarantineAccept 250 ID → batch chunked, count aggregálva', async () => {
    let n = 0;
    const { transport, calls } = makeMockTransport(() => {
      n++;
      return { success_ids: [n], success_count: 100, failure_count: 0 };
    });
    const client = new QuickClient(transport);
    const ids = Array.from({ length: 250 }, (_, i) => i + 1);
    const r = await client.expenses.quarantineAccept(ids);
    expect(calls).toHaveLength(3);
    expect(r.success_count).toBe(300); // 100 × 3 a mock alapján
  });
});

describe('Resources — Documents (CRUD egészében)', () => {
  it('get → /2/documents/{id}/', async () => {
    const { transport, calls } = makeMockTransport(() => ({ id: 1 }));
    const client = new QuickClient(transport);
    await client.documents.get(99);
    expect(calls[0].request.path).toBe('/2/documents/99/');
  });

  it('update → POST /2/documents/update/{id}/', async () => {
    const { transport, calls } = makeMockTransport(() => ({ id: 1 }));
    const client = new QuickClient(transport);
    await client.documents.update(7, { title: 'Új' });
    expect(calls[0].request).toMatchObject({
      method: 'POST',
      path: '/2/documents/update/7/',
      body: { title: 'Új' },
    });
  });

  it('create → POST /2/documents/create/ — egy doc', async () => {
    const { transport, calls } = makeMockTransport(() => ({ processed: [] }));
    const client = new QuickClient(transport);
    await client.documents.create({ filename: 'a.pdf', content: 'X' }, 'custom_source');
    expect(calls[0].request.body).toEqual({
      documents: [{ filename: 'a.pdf', content: 'X' }],
      source: 'custom_source',
    });
  });

  it('search → POST /2/documents/search/', async () => {
    const { transport, calls } = makeMockTransport(() => ({}));
    const client = new QuickClient(transport);
    await client.documents.search({ name: 'a.pdf', size: 100, company_ids: [1] });
    expect(calls[0].request).toMatchObject({
      method: 'POST',
      path: '/2/documents/search/',
      body: { name: 'a.pdf', size: 100, company_ids: [1] },
    });
  });
});

describe('Resources — Documents (alap listázás)', () => {
  it('list() — non-paginated', async () => {
    const { transport, calls } = makeMockTransport(() => [{ id: 1, document_type_name: 'X' }]);
    const client = new QuickClient(transport);
    await client.documents.list();
    expect(calls[0].request.path).toBe('/1/documents/');
  });

  it('listFiles() — non-paginated', async () => {
    const { transport, calls } = makeMockTransport(() => [{ id: 1, url: 'https://...' }]);
    const client = new QuickClient(transport);
    await client.documents.listFiles({ search: 'pdf' });
    expect(calls[0].request).toMatchObject({
      method: 'GET',
      path: '/1/documents/files/',
      query: { search: 'pdf' },
    });
  });

  it('attach()', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    const r = await client.documents.attach({ ids: [1], target_type: 'expense', target_id: 99 });
    expect(calls[0].request).toMatchObject({
      method: 'POST',
      path: '/1/documents/attach/',
      body: { ids: [1], target_type: 'expense', target_id: 99 },
    });
    expect(r).toEqual({ success: true });
  });

  it('detach()', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    await client.documents.detach({ ids: [1], target_type: 'income', target_id: 5 });
    expect(calls[0].request.path).toBe('/1/documents/detach/');
  });

  it('createMany 6 docs → 2 batch (5+1)', async () => {
    let n = 0;
    const { transport, calls } = makeMockTransport(() => {
      n++;
      return {
        processed:
          n === 1
            ? [{ success: true, id: 1 }, { success: true, id: 2 }, { success: true, id: 3 }, { success: true, id: 4 }, { success: true, id: 5 }]
            : [{ success: true, id: 6 }],
      };
    });
    const client = new QuickClient(transport);
    const docs = Array.from({ length: 6 }, (_, i) => ({
      filename: `${i}.pdf`,
      content: 'X',
    }));
    const r = await client.documents.createMany(docs);
    expect(calls).toHaveLength(2);
    expect(r.processed).toHaveLength(6);
  });

  it('createMany üres lista → no call', async () => {
    const { transport, calls } = makeMockTransport(() => ({ processed: [] }));
    const client = new QuickClient(transport);
    const r = await client.documents.createMany([]);
    expect(calls).toHaveLength(0);
    expect(r.processed).toEqual([]);
  });

  it('delete üres lista → no call, success: true', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    const r = await client.documents.delete([]);
    expect(calls).toHaveLength(0);
    expect(r).toEqual({ success: true, deleted: [] });
  });

  it('delete ID-kkal → POST + lokális válasz', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    const r = await client.documents.delete([1, 2]);
    expect(calls[0].request.body).toEqual({ ids: [1, 2] });
    expect(r).toEqual({ success: true, deleted: [1, 2] });
  });
});

describe('Resources — egyéb resource-ok happy path', () => {
  it('incomes.list/get/paginate/iterate', async () => {
    const { transport, calls } = makeMockTransport(() => [{ id: 1 }]);
    const client = new QuickClient(transport);
    await client.incomes.list();
    await client.incomes.get(5);
    await client.incomes.paginate();
    for await (const _x of client.incomes.iterate()) void _x;
    expect(calls.map((c) => c.request.path)).toEqual([
      '/1/incomes/',
      '/1/incomes/5/',
      '/1/incomes/',
      '/1/incomes/',
    ]);
  });

  it('partners + accounts paginate/iterate', async () => {
    const { transport } = makeMockTransport(() => [{ id: 1, name: 'X' }]);
    const client = new QuickClient(transport);
    expect(await client.partners.list()).toEqual([{ id: 1, name: 'X' }]);
    expect(await client.partners.paginate()).toEqual([{ id: 1, name: 'X' }]);
    for await (const _ of client.partners.iterate()) void _;
    expect(await client.accounts.list()).toEqual([{ id: 1, name: 'X' }]);
    expect(await client.accounts.paginate()).toEqual([{ id: 1, name: 'X' }]);
    for await (const _ of client.accounts.iterate()) void _;
  });

  it('payments.list', async () => {
    const { transport, calls } = makeMockTransport(() => []);
    const client = new QuickClient(transport);
    await client.payments.list({ from_date: '2026-01-01' });
    expect(calls[0].request).toMatchObject({
      method: 'GET',
      path: '/1/payments/',
      query: { from_date: '2026-01-01' },
    });
  });

  it('payments.list paraméter nélkül is hív', async () => {
    const { transport, calls } = makeMockTransport(() => []);
    const client = new QuickClient(transport);
    await client.payments.list();
    expect(calls[0].request.path).toBe('/1/payments/');
  });

  const noArgCases: Array<readonly [string, () => unknown]> = [
    ['expenses.list', () => ({ count: 0, next: null, results: [] })],
    ['expenses.paginate', () => []],
    ['incomes.list', () => ({ count: 0, next: null, results: [] })],
    ['incomes.paginate', () => []],
    ['partners.list', () => ({ count: 0, next: null, results: [] })],
    ['partners.paginate', () => []],
    ['accounts.list', () => ({ count: 0, next: null, results: [] })],
    ['accounts.paginate', () => []],
    ['documents.list', () => []],
    ['documents.listFiles', () => []],
    ['taxes.list', () => []],
    ['salaries.list', () => []],
  ];

  it.each(noArgCases)('%s — paraméter nélkül', async (path, responder) => {
    const { transport } = makeMockTransport(responder);
    const client = new QuickClient(transport);
    const [resource, method] = path.split('.') as [keyof QuickClient, string];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ((client[resource] as any)[method] as () => Promise<unknown>)();
  });

  it('pulse.get', async () => {
    const { transport, calls } = makeMockTransport(() => ({ summary: 1, accounts: [] }));
    const client = new QuickClient(transport);
    await client.pulse.get();
    expect(calls[0].request.path).toBe('/1/pulse/');
  });

  it('documentTypes — array, single, null', async () => {
    let response: unknown = [{ id: 1, name: 'A' }];
    const { transport } = makeMockTransport(() => response);
    const client = new QuickClient(transport);
    expect(await client.documentTypes.list()).toEqual([{ id: 1, name: 'A' }]);
    response = { id: 2, name: 'B' };
    expect(await client.documentTypes.list()).toEqual([{ id: 2, name: 'B' }]);
    response = null;
    expect(await client.documentTypes.list()).toEqual([]);
  });

  it('taxCodes — array, single, null', async () => {
    let response: unknown = [{ code: 'X', name: 'Y' }];
    const { transport } = makeMockTransport(() => response);
    const client = new QuickClient(transport);
    expect(await client.taxCodes.list()).toEqual([{ code: 'X', name: 'Y' }]);
    response = { code: 'A', name: 'B' };
    expect(await client.taxCodes.list()).toEqual([{ code: 'A', name: 'B' }]);
    response = null;
    expect(await client.taxCodes.list()).toEqual([]);
  });

  it('taxes full CRUD', async () => {
    const { transport, calls } = makeMockTransport(() => []);
    const client = new QuickClient(transport);
    await client.taxes.list({ from_date: '2026-01-01' });
    await client.taxes.create([{ due_at: '2026-02-12', amount: 100 }]);
    await client.taxes.update([{ id: 1, amount: 200 }]);
    const delResult = await client.taxes.delete([1, 2]);
    expect(calls.map((c) => c.request.path)).toEqual([
      '/1/monthly-taxes/',
      '/1/taxes/create/',
      '/1/taxes/update/',
      '/1/taxes/delete/',
    ]);
    expect(delResult).toEqual({ success: true, deleted: [1, 2] });
  });

  it('taxes.delete üres lista → no call', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    await client.taxes.delete([]);
    expect(calls).toHaveLength(0);
  });

  it('salaries full CRUD', async () => {
    const { transport, calls } = makeMockTransport(() => []);
    const client = new QuickClient(transport);
    await client.salaries.list();
    await client.salaries.create([{ title: '2026-01-01', amount: 500000, name: 'Anna' }]);
    await client.salaries.update([{ id: 1, amount: 600000 }]);
    await client.salaries.delete([1]);
    expect(calls.map((c) => c.request.path)).toEqual([
      '/1/monthly-salaries/',
      '/1/salaries/create/',
      '/1/salaries/update/',
      '/1/salaries/delete/',
    ]);
  });

  it('salaries.delete üres lista → no call', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    await client.salaries.delete([]);
    expect(calls).toHaveLength(0);
  });

  it('ledgerNumbers full CRUD', async () => {
    let response: unknown = [{ id: 1, code: '38' }];
    const { transport, calls } = makeMockTransport(() => response);
    const client = new QuickClient(transport);
    await client.ledgerNumbers.list();
    response = { id: 2 };
    await client.ledgerNumbers.list();
    response = null;
    await client.ledgerNumbers.list();
    response = {};
    await client.ledgerNumbers.create([{ code: '38', name: 'Pénztár' }]);
    await client.ledgerNumbers.update(1, { name: 'X' });
    await client.ledgerNumbers.delete([1]);
    expect(calls.map((c) => c.request.path)).toEqual([
      '/2/accounting/ledger-numbers/',
      '/2/accounting/ledger-numbers/',
      '/2/accounting/ledger-numbers/',
      '/2/accounting/ledger-numbers/create/',
      '/2/accounting/ledger-numbers/update/1/',
      '/2/accounting/ledger-numbers/delete/',
    ]);
  });

  it('ledgerNumbers.delete üres lista → no call', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    await client.ledgerNumbers.delete([]);
    expect(calls).toHaveLength(0);
  });

  it('vatCategories full CRUD', async () => {
    let response: unknown = [{ id: 1, percent: 27 }];
    const { transport, calls } = makeMockTransport(() => response);
    const client = new QuickClient(transport);
    await client.vatCategories.list();
    response = { id: 2 };
    await client.vatCategories.list();
    response = null;
    await client.vatCategories.list();
    response = {};
    await client.vatCategories.create([{ percent: 27, vat_area: 'HU' }]);
    await client.vatCategories.update(1, { percent: 5 });
    await client.vatCategories.delete([1, 2]);
    expect(calls.map((c) => c.request.path)).toEqual([
      '/2/accounting/vat-categories/',
      '/2/accounting/vat-categories/',
      '/2/accounting/vat-categories/',
      '/2/accounting/vat-categories/create/',
      '/2/accounting/vat-categories/update/1/',
      '/2/accounting/vat-categories/delete/',
    ]);
  });

  it('vatCategories.delete üres lista → no call', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    await client.vatCategories.delete([]);
    expect(calls).toHaveLength(0);
  });

  it('company.getInfo + updateInfo', async () => {
    const { transport, calls } = makeMockTransport(() => ({ id: 1 }));
    const client = new QuickClient(transport);
    await client.company.getInfo();
    await client.company.updateInfo(7, { name: 'Új' });
    expect(calls.map((c) => c.request.path)).toEqual([
      '/2/company-info/',
      '/2/company-info/update/7/',
    ]);
  });

  it('artifacts.forExpenses + forIncomes — array, single, null', async () => {
    let response: unknown = [{ url: 'a' }];
    const { transport, calls } = makeMockTransport(() => response);
    const client = new QuickClient(transport);
    expect(await client.artifacts.forExpenses([1])).toEqual([{ url: 'a' }]);
    response = { url: 'b' };
    expect(await client.artifacts.forIncomes([2])).toEqual([{ url: 'b' }]);
    response = null;
    expect(await client.artifacts.forExpenses([3])).toEqual([]);
    expect(calls).toHaveLength(3);
    expect(await client.artifacts.forExpenses([])).toEqual([]);
    expect(await client.artifacts.forIncomes([])).toEqual([]);
    expect(calls).toHaveLength(3); // no extra call
  });

  it('auditXml.upload', async () => {
    const { transport, calls } = makeMockTransport(() => undefined);
    const client = new QuickClient(transport);
    const r = await client.auditXml.upload({ filename: 'a.xml', content: 'BASE64' });
    expect(calls[0].request).toMatchObject({
      method: 'POST',
      path: '/2/audit-xml/',
      body: { audit_xmls: [{ filename: 'a.xml', content: 'BASE64' }] },
    });
    expect(r).toEqual({ success: true, filename: 'a.xml' });
  });
});

describe('normalizeListResponse', () => {
  it.each([
    ['null', null, []],
    ['undefined', undefined, []],
    ['array', [{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }]],
    ['paginated', { results: [{ id: 7 }] }, [{ id: 7 }]],
    ['single object', { id: 9, name: 'X' }, [{ id: 9, name: 'X' }]],
    ['primitive (string)', 'foo', []],
    ['primitive (number)', 42, []],
  ] as const)('%s response → várt', async (_label, input, expected) => {
    const { normalizeListResponse } = await import('../../client/resources/base');
    expect(normalizeListResponse(input)).toEqual(expected);
  });
});

describe('chunked + aggregateBulkResponses re-export', () => {
  it('chunked input validation', async () => {
    const { chunked } = await import('../../client/resources/base');
    expect(() => chunked([1, 2], 0)).toThrow();
    expect(chunked([], 5)).toEqual([]);
    expect(chunked([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });

  it('aggregateBulkResponses üres tömbre üres aggregálást ad', async () => {
    const { aggregateBulkResponses } = await import('../../client/resources/base');
    expect(aggregateBulkResponses([])).toEqual({
      success_ids: [],
      failed_ids: [],
      errors: [],
    });
  });
});
