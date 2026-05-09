import {
  addOptionalQueryParams,
  parseIdList,
  stripEmpty,
  unwrapListResponse,
} from '../../../nodes/Quick/utils';

describe('parseIdList', () => {
  it.each([
    ['undefined', undefined, []],
    ['empty', '', []],
    ['whitespace', '   ', []],
    ['simple', '1,2,3', [1, 2, 3]],
    ['extra whitespace', ' 10 ,  20,,30 ', [10, 20, 30]],
    ['mixed garbage', '1, foo, 2, bar, 3', [1, 2, 3]],
    ['negative numbers', '-1, -2, 3', [-1, -2, 3]],
    ['leading zeros', '007, 042', [7, 42]],
    ['decimal truncated by parseInt', '1.5, 2.7', [1, 2]],
    ['only commas', ',,,,,', []],
    ['single value no commas', '99', [99]],
  ])('parseIdList(%s) → várt érték', (_label, input, expected) => {
    expect(parseIdList(input as string | undefined)).toEqual(expected);
  });
});

describe('stripEmpty', () => {
  it('undefined / null / üres string eldobva, többi marad', () => {
    expect(
      stripEmpty({
        a: 'x',
        b: '',
        c: undefined,
        d: null,
        e: 0,
        f: false,
      }),
    ).toEqual({ a: 'x', e: 0, f: false });
  });

  it('NaN eldobva, többi szám marad', () => {
    expect(stripEmpty({ n: Number.NaN, m: 0, big: 1e9 })).toEqual({ m: 0, big: 1e9 });
  });

  it('üres tömb eldobva, nem üres megmarad', () => {
    expect(stripEmpty({ ids: [], tags: [1, 2] })).toEqual({ tags: [1, 2] });
  });

  it('beágyazott objektumokat változatlanul továbbenged', () => {
    const nested = { a: { foo: 'bar' }, b: [{ id: 1 }] };
    expect(stripEmpty(nested)).toEqual(nested);
  });

  it('teljesen üres bemenetre üres objektumot ad vissza', () => {
    expect(stripEmpty({})).toEqual({});
    expect(stripEmpty({ a: '', b: undefined, c: [] })).toEqual({});
  });

  it('nem mutálja az eredeti objektumot', () => {
    const input = { a: 'x', b: '' };
    const output = stripEmpty(input);
    expect(input).toEqual({ a: 'x', b: '' });
    expect(output).not.toBe(input);
  });
});

describe('addOptionalQueryParams', () => {
  it('csak a kitöltött mezőket adja át a query stringbe', () => {
    const out = addOptionalQueryParams(
      { from_date: '2026-01-01', to_date: '', search: undefined, ids: [] },
      ['from_date', 'to_date', 'search', 'ids'],
    );
    expect(out).toEqual({ from_date: '2026-01-01' });
  });

  it('false értékű boolean is átkerül (a hamis érték is szűrési feltétel)', () => {
    const out = addOptionalQueryParams({ is_paid: false }, ['is_paid']);
    expect(out).toEqual({ is_paid: false });
  });

  it('a meglévő qs objektumot egészíti ki, nem felülírja', () => {
    const qs = { existing: 1 };
    addOptionalQueryParams({ extra: 'x' }, ['extra'], qs);
    expect(qs).toEqual({ existing: 1, extra: 'x' });
  });
});

describe('unwrapListResponse', () => {
  it('array-ből az array-t adja', () => {
    expect(unwrapListResponse([{ id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('paginated objektumból a results-et adja', () => {
    expect(unwrapListResponse({ count: 1, next: null, results: [{ id: 1 }] })).toEqual([
      { id: 1 },
    ]);
  });

  it('nem-paginált objektumot változatlanul továbbad (1 elemes responseként)', () => {
    expect(unwrapListResponse({ meta: 'value' })).toEqual({ meta: 'value' });
  });

  it('null/undefined választ változatlanul továbbad', () => {
    expect(unwrapListResponse(null)).toBeNull();
    expect(unwrapListResponse(undefined)).toBeUndefined();
  });
});
