/**
 * Targeted edge-case tesztek a fennmaradó branch-ek lefedésére:
 * - `?? []` fallback: fixedCollection-ök üres bemenete
 * - response shape: nem-array, nem-paginált objektum válasz
 * - parseIdList → üres lista esetén delete qs[key]
 * - quickApiRequestAllItems: nem-array eredmény (objektum) push-olása
 */
import { Quick } from '../../../nodes/Quick/Quick.node';
// A `quickApiRequestAllItems` régi shim eltávolítva — a transport.paginate
// viselkedést a tests/client/transport.test.ts közvetlenül teszteli.
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

const node = new Quick();

async function exec(parameters: Record<string, unknown>, httpResponse: unknown = {}) {
  const handle = createMockExecuteFunctions({ parameters, httpResponse });
  const out = await node.execute.call(handle.context);
  return { out, calls: handle.httpCalls };
}

describe('Branch coverage edge case-ek', () => {
  describe('Üres fixedCollection (?? [] fallback)', () => {
    it('tax update üres taxes={} → üres taxes tömb body', async () => {
      const { calls } = await exec({ resource: 'tax', operation: 'update', taxes: {} });
      expect(calls[0].body).toEqual({ taxes: [] });
    });

    it('salary create üres salaries={} → üres salaries tömb body', async () => {
      const { calls } = await exec({ resource: 'salary', operation: 'create', salaries: {} });
      expect(calls[0].body).toEqual({ salaries: [] });
    });

    it('salary update üres salaries={} → üres salaries tömb body', async () => {
      const { calls } = await exec({ resource: 'salary', operation: 'update', salaries: {} });
      expect(calls[0].body).toEqual({ salaries: [] });
    });

    it('document create üres documents={} → no API call (createMany no-op)', async () => {
      const { calls, out } = await exec({
        resource: 'document',
        operation: 'create',
        source: 'public_api',
        documents: {},
      });
      expect(calls).toHaveLength(0);
      expect(out[0][0].json).toEqual({ processed: [] });
    });

    it('ledgerNumber create üres ledger_numbers={} → üres ledger_numbers tömb body', async () => {
      const { calls } = await exec({
        resource: 'ledgerNumber',
        operation: 'create',
        ledger_numbers: {},
      });
      expect(calls[0].body).toEqual({ ledger_numbers: [] });
    });

    it('vatCategory create üres vat_categories={} → üres vat_categories tömb body', async () => {
      const { calls } = await exec({
        resource: 'vatCategory',
        operation: 'create',
        vat_categories: {},
      });
      expect(calls[0].body).toEqual({ vat_categories: [] });
    });
  });

  describe('Response shape — nem-array, nem-paginált válasz', () => {
    it('expense getAll: ha az API egyszerű objektumot ad vissza (pl. summary), azt adja tovább', async () => {
      const { out } = await exec(
        {
          resource: 'expense',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: {},
        },
        { single: 'object', no_results_key: true },
      );
      expect(out[0]).toHaveLength(1);
      expect(out[0][0].json).toEqual({ single: 'object', no_results_key: true });
    });

    it('income getAll: hasonlóan kezeli a non-paginált választ', async () => {
      const { out } = await exec(
        {
          resource: 'income',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: {},
        },
        { meta: 'value' },
      );
      expect(out[0][0].json).toEqual({ meta: 'value' });
    });

    it('partner getAll: ugyanígy', async () => {
      const { out } = await exec(
        {
          resource: 'partner',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: {},
        },
        { x: 1 },
      );
      expect(out[0][0].json).toEqual({ x: 1 });
    });

    it('account getAll: ugyanígy', async () => {
      const { out } = await exec(
        {
          resource: 'account',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: {},
        },
        { y: 2 },
      );
      expect(out[0][0].json).toEqual({ y: 2 });
    });
  });

  describe('parseIdList → üres lista filterben kiesik', () => {
    it('expense getAll filterben üres ids string → query-ből hiányzik', async () => {
      const { calls } = await exec(
        {
          resource: 'expense',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: { ids: '   ,  ,  ', with_tag_ids: 'foo' },
        },
        { count: 0, next: null, results: [] },
      );
      const qs = (calls[0].qs ?? {}) as Record<string, unknown>;
      expect(qs).not.toHaveProperty('ids');
      expect(qs).not.toHaveProperty('with_tag_ids');
    });

    it('document getAll filterben üres ids string → query-ből hiányzik', async () => {
      const { calls } = await exec(
        {
          resource: 'document',
          operation: 'getAll',
          filters: { ids: '   ', with_document_type_ids: 'abc' },
        },
        [],
      );
      const qs = (calls[0].qs ?? {}) as Record<string, unknown>;
      expect(qs).not.toHaveProperty('ids');
      expect(qs).not.toHaveProperty('with_document_type_ids');
    });
  });

  describe('execute() — responseData ?? {} fallback', () => {
    it('handler null válaszát üres objektummá konvertálja', async () => {
      // A pulse handler az API választ közvetlenül továbbadja. Ha az responder
      // FÜGGVÉNY-ből null jön, akkor a mock nem ?? {}-zi le, és a handler null-t
      // ad vissza. Az execute() `responseData ?? {}` branch-ét így triggereljük.
      const handle = createMockExecuteFunctions({
        parameters: { resource: 'pulse', operation: 'get' },
        httpResponse: () => null,
      });
      const out = await node.execute.call(handle.context);
      expect(out[0][0].json).toEqual({});
    });
  });

  describe('Array.isArray=true ág a limit módú getAll-ra', () => {
    it.each([
      ['income', '/1/incomes/'],
      ['partner', '/1/partners/'],
      ['account', '/1/accounts/'],
    ])('%s getAll: az array választ közvetlenül továbbadja', async (resource, path) => {
      const { out, calls } = await exec(
        {
          resource,
          operation: 'getAll',
          returnAll: false,
          limit: 5,
          filters: {},
        },
        [{ id: 1 }, { id: 2 }],
      );
      expect(calls[0].url).toBe(`https://api.quick.riport.co.hu${path}`);
      expect(out[0]).toHaveLength(2);
      expect(out[0].map((d) => d.json)).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('response?.results short-circuit null/undefined válaszra', () => {
    it.each([
      ['expense', '/2/expenses/'],
      ['income', '/1/incomes/'],
      ['partner', '/1/partners/'],
      ['account', '/1/accounts/'],
    ])(
      '%s getAll: null válasz → null továbbpropagál, üres jsonra esik vissza',
      async (resource, path) => {
        const handle = createMockExecuteFunctions({
          parameters: {
            resource,
            operation: 'getAll',
            returnAll: false,
            limit: 5,
            filters: {},
          },
          httpResponse: () => null,
        });
        const out = await node.execute.call(handle.context);
        expect(handle.httpCalls[0].url).toBe(`https://api.quick.riport.co.hu${path}`);
        // Az execute() `responseData ?? {}` fallback miatt üres json érkezik vissza
        expect(out[0][0].json).toEqual({});
      },
    );
  });
});
