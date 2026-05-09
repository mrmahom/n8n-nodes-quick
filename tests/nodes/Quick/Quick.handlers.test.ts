import { Quick } from '../../../nodes/Quick/Quick.node';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

const node = new Quick();

interface RunOptions {
  parameters: Record<string, unknown>;
  httpResponse?: unknown;
}

async function run({ parameters, httpResponse = {} }: RunOptions) {
  const handle = createMockExecuteFunctions({ parameters, httpResponse });
  const out = await node.execute.call(handle.context);
  return { out, calls: handle.httpCalls };
}

/**
 * Minden olyan operation, amely az alaptesztekben nem szerepelt explicit happy-path
 * teszttel — itt minimum egyszer minden erőforrás-művelet csapódik mock-on,
 * hogy a Quick.node.ts execute() switch-ágait teljes szélességben fedjük.
 */
describe('Quick.execute kimerítő operation lefedettség', () => {
  describe('Account', () => {
    it('returnAll → /1/accounts/-en végiglapoz', async () => {
      let n = 0;
      const handle = createMockExecuteFunctions({
        parameters: { resource: 'account', operation: 'getAll', returnAll: true, filters: {} },
        httpResponse: () => {
          n++;
          return {
            count: 2,
            next: n < 2 ? 'more' : null,
            results: [{ id: n }],
          };
        },
      });
      const out = await node.execute.call(handle.context);
      expect(handle.httpCalls).toHaveLength(2);
      expect(out[0]).toHaveLength(2);
    });

    it('limit → egy oldal, page+page_size kerül a qs-be', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'account',
          operation: 'getAll',
          returnAll: false,
          limit: 7,
          filters: { name: 'Bank' },
        },
        httpResponse: { count: 0, next: null, results: [] },
      });
      expect(calls[0].qs).toMatchObject({ page: 1, page_size: 7, name: 'Bank' });
    });
  });

  describe('Partner', () => {
    it('returnAll → /1/partners/-en végiglapoz', async () => {
      let n = 0;
      const handle = createMockExecuteFunctions({
        parameters: { resource: 'partner', operation: 'getAll', returnAll: true, filters: {} },
        httpResponse: () => {
          n++;
          return { count: 2, next: n < 2 ? 'm' : null, results: [{ id: n }] };
        },
      });
      const out = await node.execute.call(handle.context);
      expect(handle.httpCalls).toHaveLength(2);
      expect(out[0]).toHaveLength(2);
    });
  });

  describe('Income', () => {
    it('returnAll → végiglapoz', async () => {
      let n = 0;
      const handle = createMockExecuteFunctions({
        parameters: { resource: 'income', operation: 'getAll', returnAll: true, filters: {} },
        httpResponse: () => {
          n++;
          return { count: 4, next: n < 2 ? 'm' : null, results: [{ id: n }, { id: n + 1 }] };
        },
      });
      const out = await node.execute.call(handle.context);
      expect(handle.httpCalls).toHaveLength(2);
      expect(out[0]).toHaveLength(4);
    });

    it('limit egy oldalt szed le', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'income',
          operation: 'getAll',
          returnAll: false,
          limit: 3,
          filters: {},
        },
        httpResponse: { count: 0, next: null, results: [] },
      });
      expect(calls[0].qs).toMatchObject({ page: 1, page_size: 3 });
    });
  });

  describe('Tax full CRUD', () => {
    it('update fixedCollection → {taxes: [...]}', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'tax',
          operation: 'update',
          taxes: { tax: [{ id: 11, amount: 1000, name: 'Adó' }] },
        },
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/taxes/update/');
      expect(calls[0].body).toEqual({ taxes: [{ id: 11, amount: 1000, name: 'Adó' }] });
    });

    it('üres fixedCollection → üres tömb body', async () => {
      const { calls } = await run({
        parameters: { resource: 'tax', operation: 'create', taxes: {} },
      });
      expect(calls[0].body).toEqual({ taxes: [] });
    });
  });

  describe('Salary full CRUD', () => {
    it('getAll a /1/monthly-salaries/-et hívja, fields tömbként parse-olódik', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'salary',
          operation: 'getAll',
          filters: { from_date: '2026-01-01', fields: 'amount, name' },
        },
        httpResponse: [],
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/monthly-salaries/');
      expect(calls[0].qs).toEqual({ from_date: '2026-01-01', fields: ['amount', 'name'] });
    });

    it('create üres mezőket eldob', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'salary',
          operation: 'create',
          salaries: {
            salary: [
              {
                title: '2026-01-01',
                name: 'Anna',
                amount: 500000,
                external_id: '',
                account_number: '',
              },
            ],
          },
        },
      });
      expect(calls[0].body).toEqual({
        salaries: [{ title: '2026-01-01', name: 'Anna', amount: 500000 }],
      });
    });

    it('delete sikerre lokálisan visszaadja az id-kat', async () => {
      const { out, calls } = await run({
        parameters: { resource: 'salary', operation: 'delete', ids: '7, 8' },
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/salaries/delete/');
      expect(calls[0].body).toEqual({ ids: [7, 8] });
      expect(out[0][0].json).toEqual({ success: true, deleted: [7, 8] });
    });
  });

  describe('Tax Code', () => {
    it('getAll a /1/tax-codes/-et hívja paraméter nélkül', async () => {
      const { calls } = await run({
        parameters: { resource: 'taxCode', operation: 'getAll' },
        httpResponse: [],
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/tax-codes/');
      expect(calls[0].body).toBeUndefined();
      expect(calls[0].qs).toBeUndefined();
    });
  });

  describe('Document teljes paletta', () => {
    it('get → /2/documents/{id}/', async () => {
      const { calls } = await run({
        parameters: { resource: 'document', operation: 'get', documentId: '42' },
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/documents/42/');
      expect(calls[0].method).toBe('GET');
    });

    it('update → /2/documents/update/{id}/, keywords/simple_tag_ids parse-olva', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'document',
          operation: 'update',
          documentId: '99',
          updateFields: {
            title: 'Új cím',
            keywords: 'a,b,c',
            simple_tag_ids: '1,2,3',
            sender: '',
          },
        },
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/documents/update/99/');
      expect(calls[0].body).toEqual({
        title: 'Új cím',
        keywords: ['a', 'b', 'c'],
        simple_tag_ids: [1, 2, 3],
      });
    });

    it('detach külön végpontot hív, attach-al megegyező body-val', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'document',
          operation: 'detach',
          ids: '5',
          target_type: 'income',
          target_id: 100,
        },
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/documents/detach/');
      expect(calls[0].body).toEqual({ ids: [5], target_type: 'income', target_id: 100 });
    });

    it('delete sikerre lokálisan visszaadja az id-kat', async () => {
      const { out } = await run({
        parameters: { resource: 'document', operation: 'delete', ids: '1, 2, 3' },
      });
      expect(out[0][0].json).toEqual({ success: true, deleted: [1, 2, 3] });
    });

    it('search → /2/documents/search/, company_ids parse-olva', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'document',
          operation: 'search',
          name: 'kep.png',
          size: 999,
          company_ids: '1, 2',
        },
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/documents/search/');
      expect(calls[0].body).toEqual({ name: 'kep.png', size: 999, company_ids: [1, 2] });
    });
  });

  describe('Document Type', () => {
    it('getAll → /2/document-types/', async () => {
      const { calls } = await run({
        parameters: { resource: 'documentType', operation: 'getAll' },
        httpResponse: [],
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/document-types/');
    });
  });

  describe('Ledger Number CRUD', () => {
    it('create → wrap {ledger_numbers: [...]}', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'ledgerNumber',
          operation: 'create',
          ledger_numbers: { item: [{ code: '38', name: 'Pénztár' }] },
        },
      });
      expect(calls[0].url).toBe(
        'https://api.quick.riport.co.hu/2/accounting/ledger-numbers/create/',
      );
      expect(calls[0].body).toEqual({ ledger_numbers: [{ code: '38', name: 'Pénztár' }] });
    });

    it('delete → ids body, lokális success válasz', async () => {
      const { calls, out } = await run({
        parameters: { resource: 'ledgerNumber', operation: 'delete', ids: '11, 22' },
      });
      expect(calls[0].url).toBe(
        'https://api.quick.riport.co.hu/2/accounting/ledger-numbers/delete/',
      );
      expect(calls[0].body).toEqual({ ids: [11, 22] });
      expect(out[0][0].json).toEqual({ success: true, deleted: [11, 22] });
    });
  });

  describe('VAT Category CRUD', () => {
    it('getAll → /2/accounting/vat-categories/', async () => {
      const { calls } = await run({
        parameters: { resource: 'vatCategory', operation: 'getAll' },
        httpResponse: [],
      });
      expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/accounting/vat-categories/');
    });

    it('update → /2/accounting/vat-categories/update/{id}/, üres mező eldobva', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'vatCategory',
          operation: 'update',
          companyVatCategoryId: '5',
          updateFields: { percent: 5, vat_area: 'EU', code: '', country: '' },
        },
      });
      expect(calls[0].url).toBe(
        'https://api.quick.riport.co.hu/2/accounting/vat-categories/update/5/',
      );
      expect(calls[0].body).toEqual({ percent: 5, vat_area: 'EU' });
    });

    it('delete → ids body, lokális success válasz', async () => {
      const { calls, out } = await run({
        parameters: { resource: 'vatCategory', operation: 'delete', ids: '3' },
      });
      expect(calls[0].url).toBe(
        'https://api.quick.riport.co.hu/2/accounting/vat-categories/delete/',
      );
      expect(calls[0].body).toEqual({ ids: [3] });
      expect(out[0][0].json).toEqual({ success: true, deleted: [3] });
    });
  });

  describe('Date filter cleanup', () => {
    it('expense getAll a teljesen üres filter objektummal nem okoz hibát', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'expense',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: {},
        },
        httpResponse: { count: 0, next: null, results: [] },
      });
      expect(calls[0].qs).toEqual({ page: 1, page_size: 10 });
    });

    it('income filterben üres tags string-et eldobja, nem array-esíti', async () => {
      const { calls } = await run({
        parameters: {
          resource: 'income',
          operation: 'getAll',
          returnAll: false,
          limit: 10,
          filters: { tags: '' },
        },
        httpResponse: { count: 0, next: null, results: [] },
      });
      // Üres string filter nem kerül a query-be
      expect(calls[0].qs).not.toMatchObject({ tags: expect.anything() });
    });
  });

  describe('Response shape variánsok', () => {
    it('limit-es lekérés tömb választ ad vissza, ha az API egyből tömböt ad', async () => {
      const { out } = await run({
        parameters: {
          resource: 'expense',
          operation: 'getAll',
          returnAll: false,
          limit: 5,
          filters: {},
        },
        httpResponse: [{ id: 1 }, { id: 2 }],
      });
      expect(out[0]).toHaveLength(2);
      expect(out[0].map((d) => d.json)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('limit-es lekérés results mezőben tömböt ad', async () => {
      const { out } = await run({
        parameters: {
          resource: 'expense',
          operation: 'getAll',
          returnAll: false,
          limit: 5,
          filters: {},
        },
        httpResponse: { count: 1, next: null, results: [{ id: 99 }] },
      });
      expect(out[0]).toHaveLength(1);
      expect(out[0][0].json).toEqual({ id: 99 });
    });
  });
});
