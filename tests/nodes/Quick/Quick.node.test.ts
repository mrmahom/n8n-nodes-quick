import { Quick } from '../../../nodes/Quick/Quick.node';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

const node = new Quick();

async function run(parameters: Record<string, unknown>, httpResponse: unknown = {}) {
  const handle = createMockExecuteFunctions({ parameters, httpResponse });
  const out = await node.execute.call(handle.context);
  return { out, calls: handle.httpCalls };
}

describe('Quick.execute → Expense', () => {
  it('getAll (limit) egyetlen oldalt kér le, page és page_size paraméterekkel', async () => {
    const { calls } = await run(
      {
        resource: 'expense',
        operation: 'getAll',
        returnAll: false,
        limit: 25,
        filters: { from_date: '2026-01-01', date_field: 'fulfilled_at' },
      },
      { count: 1, next: null, results: [{ id: 1 }] },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/expenses/');
    expect(calls[0].qs).toMatchObject({
      page: 1,
      page_size: 25,
      from_date: '2026-01-01',
      date_field: 'fulfilled_at',
    });
  });

  it('getAll (returnAll) végiglapoz a paginált válaszon', async () => {
    let n = 0;
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'expense', operation: 'getAll', returnAll: true, filters: {} },
      httpResponse: () => {
        n++;
        return {
          count: 3,
          next: n < 3 ? `next-${n}` : null,
          results: [{ id: n }],
        };
      },
    });
    const out = await node.execute.call(handle.context);
    expect(handle.httpCalls).toHaveLength(3);
    expect(out[0]).toHaveLength(3);
  });

  it('getAll filterben az ids-t (string) számtömbbé alakítja', async () => {
    const { calls } = await run(
      {
        resource: 'expense',
        operation: 'getAll',
        returnAll: false,
        limit: 50,
        filters: { ids: '101, 102, 103', with_tag_ids: '5' },
      },
      { count: 0, next: null, results: [] },
    );
    expect(calls[0].qs).toMatchObject({ ids: [101, 102, 103], with_tag_ids: [5] });
  });

  it('get a /2/expenses/{id}/ végpontot szólítja meg', async () => {
    const { calls } = await run(
      { resource: 'expense', operation: 'get', expenseId: '777' },
      { id: 777 },
    );
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/expenses/777/');
  });

  it('update PATCH-csel hívja a /2/expenses/{id}/update/-et a kitöltött mezőkkel', async () => {
    const { calls } = await run(
      {
        resource: 'expense',
        operation: 'update',
        expenseId: '42',
        updateFields: { accounting_id: 'A-001', vat_period_type: 'monthly' },
      },
      { id: 42 },
    );
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/expenses/42/update/');
    expect(calls[0].body).toEqual({ accounting_id: 'A-001', vat_period_type: 'monthly' });
  });

  it('approve POST a /1/expenses/approve/-ra ids tömbbel', async () => {
    const { calls } = await run(
      { resource: 'expense', operation: 'approve', ids: '101, 102, 103' },
      { success_ids: [101, 102, 103], failed_ids: [], errors: [] },
    );
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/expenses/approve/');
    expect(calls[0].body).toEqual({ ids: [101, 102, 103] });
  });

  it.each([
    ['unapprove', '/1/expenses/unapprove/'],
    ['check', '/1/expenses/check/'],
    ['uncheck', '/1/expenses/uncheck/'],
    ['export', '/1/expenses/export/'],
    ['quarantineAccept', '/1/expenses/quarantine-accept/'],
  ])('%s → %s', async (operation, expectedPath) => {
    const { calls } = await run(
      { resource: 'expense', operation, ids: '1' },
      { success_ids: [1], failed_ids: [], errors: [] },
    );
    expect(calls[0].url).toBe(`https://api.quick.riport.co.hu${expectedPath}`);
    expect(calls[0].body).toEqual({ ids: [1] });
  });

  it('create az artifact tartalmát egy expenses tömbbe csomagolja', async () => {
    const { calls } = await run(
      {
        resource: 'expense',
        operation: 'create',
        filename: 'invoice.pdf',
        content: 'BASE64DATA',
        source: 'public_api',
      },
      { processed: [9001] },
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/expenses/create/');
    expect(calls[0].body).toEqual({
      expenses: [{ filename: 'invoice.pdf', content: 'BASE64DATA' }],
      source: 'public_api',
    });
  });

  it('searchArtifact a company_ids-t parsolja és POST-ol', async () => {
    const { calls } = await run(
      {
        resource: 'expense',
        operation: 'searchArtifact',
        name: 'a.pdf',
        size: 12345,
        company_ids: '1,2',
      },
      {},
    );
    expect(calls[0].url).toBe(
      'https://api.quick.riport.co.hu/2/expenses/artifact-search/',
    );
    expect(calls[0].body).toEqual({ name: 'a.pdf', size: 12345, company_ids: [1, 2] });
  });
});

describe('Quick.execute → Income / Partner / Account / Payment / Pulse', () => {
  it('income getAll a tags / revenue_types stringet listává alakítja', async () => {
    const { calls } = await run(
      {
        resource: 'income',
        operation: 'getAll',
        returnAll: false,
        limit: 10,
        filters: { tags: 'foo, bar', revenue_types: 'a,b' },
      },
      { count: 0, next: null, results: [] },
    );
    expect(calls[0].qs).toMatchObject({
      tags: ['foo', 'bar'],
      revenue_types: ['a', 'b'],
    });
  });

  it('income get a v1 detail végpontot hívja', async () => {
    const { calls } = await run(
      { resource: 'income', operation: 'get', incomeId: '5' },
      { id: 5 },
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/incomes/5/');
  });

  it('partner getAll a /1/partners/-et hívja a megadott limit-tel', async () => {
    const { calls } = await run(
      { resource: 'partner', operation: 'getAll', returnAll: false, limit: 5, filters: {} },
      { count: 0, next: null, results: [] },
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/partners/');
    expect(calls[0].qs).toMatchObject({ page: 1, page_size: 5 });
  });

  it('account getAll a /1/accounts/-ot hívja', async () => {
    const { calls } = await run(
      { resource: 'account', operation: 'getAll', returnAll: false, limit: 10, filters: {} },
      { count: 0, next: null, results: [] },
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/accounts/');
  });

  it('payment getAll-ben nincs paginálás, csak filter-ek', async () => {
    const { calls } = await run(
      {
        resource: 'payment',
        operation: 'getAll',
        filters: { from_date: '2026-01-01', to_date: '2026-01-31' },
      },
      [],
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/payments/');
    expect(calls[0].qs).toEqual({ from_date: '2026-01-01', to_date: '2026-01-31' });
  });

  it('pulse get a /1/pulse/-ot hívja paraméterek nélkül', async () => {
    const { calls } = await run({ resource: 'pulse', operation: 'get' }, { summary: 0 });
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/pulse/');
    expect(calls[0].qs).toBeUndefined();
  });
});

describe('Quick.execute → Tax / Salary', () => {
  it('tax create a fixedCollection-t a {taxes: [...]} body-vé alakítja', async () => {
    const { calls } = await run(
      {
        resource: 'tax',
        operation: 'create',
        taxes: {
          tax: [
            {
              title: '2026-01-01',
              due_at: '2026-02-12',
              amount: 100000,
              code: 'TAX-1',
              currency: 'HUF',
              external_id: '',
            },
          ],
        },
      },
      {},
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/taxes/create/');
    expect(calls[0].body).toEqual({
      taxes: [
        {
          title: '2026-01-01',
          due_at: '2026-02-12',
          amount: 100000,
          code: 'TAX-1',
          currency: 'HUF',
        },
      ],
    });
  });

  it('tax delete az ids-t parsolja és sikerre lokálisan visszaadja', async () => {
    const { out, calls } = await run(
      { resource: 'tax', operation: 'delete', ids: '1, 2' },
      undefined,
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/taxes/delete/');
    expect(calls[0].body).toEqual({ ids: [1, 2] });
    expect(out[0][0].json).toEqual({ success: true, deleted: [1, 2] });
  });

  it('salary update a fixedCollection-t {salaries: [...]} body-vé alakítja', async () => {
    const { calls } = await run(
      {
        resource: 'salary',
        operation: 'update',
        salaries: {
          salary: [{ id: 5, amount: 250000, name: 'Salary January' }],
        },
      },
      {},
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/salaries/update/');
    expect(calls[0].body).toEqual({
      salaries: [{ id: 5, amount: 250000, name: 'Salary January' }],
    });
  });

  it('tax getAll a /1/monthly-taxes/-et hívja a megadott szűrőkkel', async () => {
    const { calls } = await run(
      {
        resource: 'tax',
        operation: 'getAll',
        filters: { from_date: '2026-01-01', fields: 'amount,code' },
      },
      [],
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/monthly-taxes/');
    expect(calls[0].qs).toEqual({ from_date: '2026-01-01', fields: ['amount', 'code'] });
  });
});

describe('Quick.execute → Document', () => {
  it('getAll filterben az ids/with_tag_ids stringet listává alakítja', async () => {
    const { calls } = await run(
      {
        resource: 'document',
        operation: 'getAll',
        filters: { ids: '1,2,3', with_tag_ids: '7' },
      },
      [],
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/documents/');
    expect(calls[0].qs).toMatchObject({ ids: [1, 2, 3], with_tag_ids: [7] });
  });

  it('getFiles a /1/documents/files/-et hívja, ugyanazon szűrőkkel', async () => {
    const { calls } = await run(
      { resource: 'document', operation: 'getFiles', filters: { is_attached: true } },
      [],
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/documents/files/');
    expect(calls[0].qs).toMatchObject({ is_attached: true });
  });

  it('attach a megadott target-tel POST-ol', async () => {
    const { calls } = await run(
      {
        resource: 'document',
        operation: 'attach',
        ids: '1, 2',
        target_type: 'expense',
        target_id: 999,
      },
      undefined,
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/documents/attach/');
    expect(calls[0].body).toEqual({ ids: [1, 2], target_type: 'expense', target_id: 999 });
  });

  it('create-ben a keywords/simple_tag_ids stringet listává alakítja', async () => {
    const { calls } = await run(
      {
        resource: 'document',
        operation: 'create',
        source: 'public_api',
        documents: {
          document: [
            {
              filename: 'd.pdf',
              content: 'BASE64',
              keywords: 'kulcs, szó, kulcsszó',
              simple_tag_ids: '10, 20',
              title: '',
            },
          ],
        },
      },
      { processed: [{ success: true, id: 1 }] },
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/documents/create/');
    expect(calls[0].body).toEqual({
      source: 'public_api',
      documents: [
        {
          filename: 'd.pdf',
          content: 'BASE64',
          keywords: ['kulcs', 'szó', 'kulcsszó'],
          simple_tag_ids: [10, 20],
        },
      ],
    });
  });
});

describe('Quick.execute → Accounting (ledger / vat / tax-code)', () => {
  it('ledgerNumber getAll a /2/accounting/ledger-numbers/-et hívja', async () => {
    const { calls } = await run({ resource: 'ledgerNumber', operation: 'getAll' }, []);
    expect(calls[0].url).toBe(
      'https://api.quick.riport.co.hu/2/accounting/ledger-numbers/',
    );
  });

  it('ledgerNumber update a megadott ID-jú végpontot hívja', async () => {
    const { calls } = await run(
      {
        resource: 'ledgerNumber',
        operation: 'update',
        ledgerNumberId: '88',
        updateFields: { name: 'Új név' },
      },
      {},
    );
    expect(calls[0].url).toBe(
      'https://api.quick.riport.co.hu/2/accounting/ledger-numbers/update/88/',
    );
    expect(calls[0].body).toEqual({ name: 'Új név' });
  });

  it('vatCategory create a payload-ot {vat_categories: [...]}-be csomagolja', async () => {
    const { calls } = await run(
      {
        resource: 'vatCategory',
        operation: 'create',
        vat_categories: { item: [{ percent: 27, vat_area: 'HU', code: 'F27' }] },
      },
      {},
    );
    expect(calls[0].url).toBe(
      'https://api.quick.riport.co.hu/2/accounting/vat-categories/create/',
    );
    expect(calls[0].body).toEqual({
      vat_categories: [{ percent: 27, vat_area: 'HU', code: 'F27' }],
    });
  });

  it('taxCode getAll a /1/tax-codes/-et hívja', async () => {
    const { calls } = await run({ resource: 'taxCode', operation: 'getAll' }, []);
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/1/tax-codes/');
  });
});

describe('Quick.execute → Company / Audit XML / Artifact', () => {
  it('company getInfo a /2/company-info/-ot hívja', async () => {
    const { calls } = await run({ resource: 'company', operation: 'getInfo' }, {});
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/company-info/');
  });

  it('company updateInfo PATCH-csel a megadott id-ra', async () => {
    const { calls } = await run(
      {
        resource: 'company',
        operation: 'updateInfo',
        companyId: '7',
        updateFields: { name: 'Új cégnév' },
      },
      {},
    );
    expect(calls[0].method).toBe('PATCH');
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/company-info/update/7/');
    expect(calls[0].body).toEqual({ name: 'Új cégnév' });
  });

  it('auditXml upload a payload-ot {audit_xmls: [...]}-be csomagolja', async () => {
    const { calls, out } = await run(
      { resource: 'auditXml', operation: 'upload', filename: 'a.xml', content: 'BASE64' },
      {},
    );
    expect(calls[0].url).toBe('https://api.quick.riport.co.hu/2/audit-xml/');
    expect(calls[0].body).toEqual({ audit_xmls: [{ filename: 'a.xml', content: 'BASE64' }] });
    expect(out[0][0].json).toEqual({ success: true, filename: 'a.xml' });
  });

  it('artifact getExpense / getIncome külön végpontot hív', async () => {
    const a = await run({ resource: 'artifact', operation: 'getExpense', ids: '1,2' }, {});
    expect(a.calls[0].url).toBe('https://api.quick.riport.co.hu/1/artifacts/expense/');
    expect(a.calls[0].body).toEqual({ ids: [1, 2] });

    const b = await run({ resource: 'artifact', operation: 'getIncome', ids: '3' }, {});
    expect(b.calls[0].url).toBe('https://api.quick.riport.co.hu/1/artifacts/income/');
    expect(b.calls[0].body).toEqual({ ids: [3] });
  });
});

describe('Quick.execute → error handling', () => {
  it('continueOnFail = false → a hiba dobódik tovább', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'expense', operation: 'get', expenseId: '1' },
      httpResponse: () => {
        throw Object.assign(new Error('boom'), { httpCode: '500' });
      },
    });
    await expect(node.execute.call(handle.context)).rejects.toThrow();
  });

  it('continueOnFail = true → a hiba az "Error" output ágra kerül (out[1])', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'expense', operation: 'get', expenseId: '1' },
      httpResponse: () => {
        throw new Error('boom');
      },
      continueOnFail: true,
    });
    const out = await node.execute.call(handle.context);
    // Main output üres
    expect(out[0]).toHaveLength(0);
    // Error output a hibát tartalmazza
    expect(out[1]).toHaveLength(1);
    expect(out[1][0].json).toMatchObject({ error: expect.any(String) });
    expect(out[1][0].pairedItem).toEqual({ item: 0 });
  });

  it('több bemeneti elemen iterál, az item index megőrződik a pairedItem-ben', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'pulse', operation: 'get' },
      inputItems: [{ json: {} }, { json: {} }, { json: {} }],
      httpResponse: { ok: true },
    });
    const out = await node.execute.call(handle.context);
    expect(handle.httpCalls).toHaveLength(3);
    expect(out[0]).toHaveLength(3);
    expect(out[0].map((d) => d.pairedItem)).toEqual([
      { item: 0 },
      { item: 1 },
      { item: 2 },
    ]);
  });
});
