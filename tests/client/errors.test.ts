import { QuickApiError } from '../../client/errors';

describe('QuickApiError', () => {
  it('alap mezőket beállítja', () => {
    const err = new QuickApiError('boom', {
      statusCode: 500,
      body: { _error: 'oops' },
      endpoint: 'GET /1/x',
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('QuickApiError');
    expect(err.message).toBe('boom');
    expect(err.statusCode).toBe(500);
    expect(err.body).toEqual({ _error: 'oops' });
    expect(err.endpoint).toBe('GET /1/x');
  });

  it('cause opcionális propagálása', () => {
    const root = new Error('root');
    const err = new QuickApiError('wrapped', {
      statusCode: 0,
      body: undefined,
      endpoint: 'GET /x',
      cause: root,
    });
    expect((err as Error & { cause?: unknown }).cause).toBe(root);
  });

  it.each([
    [429, true, false, false],
    [500, true, false, false],
    [503, true, false, false],
    [599, true, false, false],
    [600, false, false, false],
    [401, false, true, false],
    [403, false, true, false],
    [404, false, false, true],
    [200, false, false, false],
    [400, false, false, false],
  ])('statusCode=%i → isTransient=%s, isAuthError=%s, isNotFound=%s', (code, t, a, n) => {
    const err = new QuickApiError('x', { statusCode: code, body: undefined, endpoint: 'GET /x' });
    expect(err.isTransient).toBe(t);
    expect(err.isAuthError).toBe(a);
    expect(err.isNotFound).toBe(n);
  });
});
