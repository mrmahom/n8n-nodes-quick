import { Quick } from '../../../nodes/Quick/Quick.node';
import { createMockExecuteFunctions } from '../../helpers/mockExecuteFunctions';

const node = new Quick();

describe('Quick.execute hibaágak és edge case-ek', () => {
  it('ismeretlen resource → execute dob', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'doesNotExist', operation: 'getAll' },
    });
    await expect(node.execute.call(handle.context)).rejects.toThrow(/Unknown resource/);
  });

  it('ismeretlen expense operation → execute dob', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'expense', operation: 'noSuchOp' },
    });
    await expect(node.execute.call(handle.context)).rejects.toThrow(/Unknown expense operation/);
  });

  it.each([
    ['income', 'noop'],
    ['partner', 'noop'],
    ['account', 'noop'],
    ['payment', 'noop'],
    ['pulse', 'noop'],
    ['tax', 'noop'],
    ['salary', 'noop'],
    ['taxCode', 'noop'],
    ['document', 'noop'],
    ['documentType', 'noop'],
    ['ledgerNumber', 'noop'],
    ['vatCategory', 'noop'],
    ['company', 'noop'],
    ['auditXml', 'noop'],
    ['artifact', 'noop'],
  ])('%s resource ismeretlen operationre dob', async (resource, operation) => {
    const handle = createMockExecuteFunctions({
      parameters: { resource, operation, ids: '1' },
    });
    await expect(node.execute.call(handle.context)).rejects.toThrow(/Unknown/);
  });

  it('üres bemeneti tömbre üres kimenetet ad mindkét output ágon, hívás nélkül', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'pulse', operation: 'get' },
      inputItems: [],
      httpResponse: {},
    });
    const out = await node.execute.call(handle.context);
    expect(out).toEqual([[], []]);
    expect(handle.httpCalls).toHaveLength(0);
  });

  it('continueOnFail több bemeneti elem között a sikeres elemek main-be, a hibás Error ágra kerül', async () => {
    let calledTimes = 0;
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'pulse', operation: 'get' },
      inputItems: [{ json: { i: 0 } }, { json: { i: 1 } }, { json: { i: 2 } }],
      httpResponse: () => {
        calledTimes++;
        if (calledTimes === 2) throw new Error('csak a 2. tételre dob');
        return { ok: calledTimes };
      },
      continueOnFail: true,
    });
    const out = await node.execute.call(handle.context);

    // Main output: 2 sikeres item (item 0 és item 2)
    expect(out[0]).toHaveLength(2);
    expect(out[0][0].json).toEqual({ ok: 1 });
    expect(out[0][1].json).toEqual({ ok: 3 });
    expect(out[0][0].pairedItem).toEqual({ item: 0 });
    expect(out[0][1].pairedItem).toEqual({ item: 2 });

    // Error output: 1 hibás item (item 1) — az eredeti json + error mező
    expect(out[1]).toHaveLength(1);
    expect(out[1][0].json).toMatchObject({ i: 1, error: expect.stringMatching(/2\. tételre/) });
    expect(out[1][0].pairedItem).toEqual({ item: 1 });
  });

  it('NodeApiError-t a continueOnFail string üzenetté konvertálva az Error ágra ad', async () => {
    const handle = createMockExecuteFunctions({
      parameters: { resource: 'expense', operation: 'get', expenseId: '1' },
      httpResponse: () => {
        // 400 → nem retry-zik, gyors fail
        const e = new Error('upstream 400');
        (e as Error & { httpCode?: string }).httpCode = '400';
        throw e;
      },
      continueOnFail: true,
    });
    const out = await node.execute.call(handle.context);
    expect(out[0]).toHaveLength(0);
    expect(out[1]).toHaveLength(1);
    expect(typeof (out[1][0].json as { error: unknown }).error).toBe('string');
  });
});
