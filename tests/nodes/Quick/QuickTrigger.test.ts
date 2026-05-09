import { IPollFunctions } from 'n8n-workflow';
import { QuickTrigger } from '../../../nodes/Quick/QuickTrigger.node';

interface MockPollOptions {
  parameters?: Record<string, unknown>;
  staticData?: Record<string, unknown>;
  // eslint-disable-next-line
  httpResponse?: unknown | ((opts: any) => unknown);
}

function createMockPollFunctions(options: MockPollOptions = {}): {
  context: IPollFunctions;
  // eslint-disable-next-line
  httpCalls: any[];
  staticData: Record<string, unknown>;
} {
  const params = options.parameters ?? {};
  const staticData = options.staticData ?? {};
  // eslint-disable-next-line
  const httpCalls: any[] = [];

  // eslint-disable-next-line
  const httpRequestWithAuthentication = jest.fn(async (_credName: string, opts: any) => {
    httpCalls.push(opts);
    if (typeof options.httpResponse === 'function') {
      // eslint-disable-next-line
      return (options.httpResponse as (o: any) => unknown)(opts);
    }
    return options.httpResponse ?? {};
  });

  const context = {
    getNodeParameter: jest.fn(
      (name: string, fallback?: unknown) => params[name] ?? fallback,
    ),
    getCredentials: jest.fn(async () => ({
      apiToken: 'test-token',
      baseUrl: 'https://api.quick.riport.co.hu',
    })),
    getNode: () => ({
      id: 'trigger-test',
      name: 'QUiCK Trigger Test',
      type: 'n8n-nodes-quick.quickTrigger',
      typeVersion: 1,
      position: [0, 0] as [number, number],
      parameters: {},
    }),
    getWorkflowStaticData: jest.fn(() => staticData),
    helpers: {
      httpRequestWithAuthentication,
      // eslint-disable-next-line
      returnJsonArray: (input: any | any[]) => {
        const arr = Array.isArray(input) ? input : [input];
        return arr.map((entry) => ({ json: entry ?? {} }));
      },
    },
  } as unknown as IPollFunctions;

  return { context, httpCalls, staticData };
}

const trigger = new QuickTrigger();

describe('QuickTrigger description', () => {
  it('polling node, version: [1], 1 main output, 0 input', () => {
    expect(trigger.description.polling).toBe(true);
    expect(trigger.description.version).toEqual([1]);
    expect(trigger.description.outputs).toEqual(['main']);
    expect(trigger.description.inputs).toEqual([]);
    expect(trigger.description.credentials).toEqual([
      expect.objectContaining({ name: 'quickApi', required: true }),
    ]);
  });

  it('event opciók sentence-case-ben, az events alfabetikusak', () => {
    const eventProp = trigger.description.properties.find((p) => p.name === 'event');
    const optionNames = ((eventProp?.options ?? []) as Array<{ name: string }>).map(
      (o) => o.name,
    );
    expect(optionNames.length).toBeGreaterThan(0);
  });
});

describe('QuickTrigger.poll', () => {
  it('newExpense → /2/expenses/?is_new=true', async () => {
    const { context, httpCalls } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      httpResponse: { count: 0, next: null, results: [] },
    });
    const result = await trigger.poll.call(context);
    expect(httpCalls[0].url).toBe('https://api.quick.riport.co.hu/2/expenses/');
    expect(httpCalls[0].qs).toMatchObject({ is_new: true, ordering: '-id' });
    // 0 elem → null (a trigger nem fire-ol)
    expect(result).toBeNull();
  });

  it('új találatokra a json kimenetet adja, és lastId-t frissíti', async () => {
    const staticData: Record<string, unknown> = {};
    const { context, staticData: sd } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      staticData,
      httpResponse: {
        count: 2,
        next: null,
        results: [
          { id: 100, partner_name: 'A' },
          { id: 101, partner_name: 'B' },
        ],
      },
    });
    const result = await trigger.poll.call(context);
    expect(result).toHaveLength(1);
    expect(result?.[0]).toHaveLength(2);
    expect(sd.lastId).toBe(101);
    expect(sd.lastSeenAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('második pollnál csak az új ID-kat (lastId-nél nagyobbat) adja vissza', async () => {
    const staticData: Record<string, unknown> = { lastId: 100 };
    const { context } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      staticData,
      httpResponse: {
        count: 3,
        next: null,
        results: [
          { id: 100, partner_name: 'régi' },
          { id: 101, partner_name: 'új-1' },
          { id: 102, partner_name: 'új-2' },
        ],
      },
    });
    const result = await trigger.poll.call(context);
    expect(result?.[0]).toHaveLength(2);
    expect(staticData.lastId).toBe(102);
  });

  it('ha minden találat régi, null-t ad (nem fire-ol)', async () => {
    const staticData: Record<string, unknown> = { lastId: 200 };
    const { context } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      staticData,
      httpResponse: { count: 1, next: null, results: [{ id: 100 }] },
    });
    expect(await trigger.poll.call(context)).toBeNull();
    expect(staticData.lastId).toBe(200); // változatlan
  });

  it.each([
    ['updatedExpense', '/2/expenses/', 'is_updated'],
    ['expenseDueSoon', '/2/expenses/', 'is_expiring'],
    ['expenseExpired', '/2/expenses/', 'is_expired'],
    ['newDocument', '/1/documents/', 'is_new'],
    ['incomeDueSoon', '/1/incomes/', 'is_due_soon'],
  ])('event %s → %s endpoint, %s filter', async (event, path, filterFlag) => {
    const { context, httpCalls } = createMockPollFunctions({
      parameters: { event, filters: {} },
      httpResponse: { results: [] },
    });
    await trigger.poll.call(context);
    expect(httpCalls[0].url).toBe(`https://api.quick.riport.co.hu${path}`);
    expect(httpCalls[0].qs).toMatchObject({ [filterFlag]: true });
  });

  it('ismeretlen event → hiba', async () => {
    const { context } = createMockPollFunctions({
      parameters: { event: 'noSuchEvent', filters: {} },
      httpResponse: {},
    });
    await expect(trigger.poll.call(context)).rejects.toThrow(/Unknown event/);
  });

  it('extra filters (partner, with_tag_ids, has_artifact) átadásra kerülnek', async () => {
    const { context, httpCalls } = createMockPollFunctions({
      parameters: {
        event: 'newExpense',
        filters: { partner: 'Acme', with_tag_ids: '1, 2', has_artifact: true },
      },
      httpResponse: { results: [] },
    });
    await trigger.poll.call(context);
    expect(httpCalls[0].qs).toMatchObject({
      partner: 'Acme',
      with_tag_ids: [1, 2],
      has_artifact: true,
    });
  });

  it('üres szöveges filter mező nem kerül a query-be', async () => {
    const { context, httpCalls } = createMockPollFunctions({
      parameters: {
        event: 'newExpense',
        filters: { partner: '', with_tag_ids: '   ', has_artifact: false },
      },
      httpResponse: { results: [] },
    });
    await trigger.poll.call(context);
    const qs = httpCalls[0].qs as Record<string, unknown>;
    expect(qs).not.toHaveProperty('partner');
    expect(qs).not.toHaveProperty('with_tag_ids');
    expect(qs).not.toHaveProperty('has_artifact');
  });

  it('incomeDueSoon → partner-t át tudja adni, ha van', async () => {
    const { context, httpCalls } = createMockPollFunctions({
      parameters: { event: 'incomeDueSoon', filters: { partner: 'CustomerCo' } },
      httpResponse: { results: [] },
    });
    await trigger.poll.call(context);
    expect(httpCalls[0].qs).toMatchObject({ partner: 'CustomerCo', is_due_soon: true });
  });

  it('válasz: tömb formátum is bejár', async () => {
    const { context } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      httpResponse: [{ id: 5 }],
    });
    const result = await trigger.poll.call(context);
    expect(result?.[0]).toHaveLength(1);
  });

  it('válasz: nem-tömb, nem-results objektum → üres lista', async () => {
    const { context } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      httpResponse: { unrelated: 'meta' },
    });
    expect(await trigger.poll.call(context)).toBeNull();
  });

  it('válasz: id nélküli rekordot is csak akkor ad át, ha 0-nál nagyobbnak számít (egyébként kihagyja)', async () => {
    const staticData: Record<string, unknown> = {};
    const { context } = createMockPollFunctions({
      parameters: { event: 'newExpense', filters: {} },
      staticData,
      httpResponse: { results: [{ partner_name: 'no-id' }] },
    });
    // id hiányában 0-nak számítjuk → 0 > 0 = false → kihagyva
    expect(await trigger.poll.call(context)).toBeNull();
  });
});
