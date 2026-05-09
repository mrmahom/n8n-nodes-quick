/**
 * A QUiCK API hibákat egységesen `QuickApiError`-rá csomagoljuk. A felhasználói
 * kód ezzel kényelmesen tud `instanceof`-val egyetlen helyen kezelni minden
 * hibát.
 *
 * @example
 * ```ts
 * try {
 *   await client.expenses.get(999);
 * } catch (err) {
 *   if (err instanceof QuickApiError) {
 *     console.log(err.statusCode, err.body);
 *   }
 * }
 * ```
 */
export class QuickApiError extends Error {
  /** HTTP státusz kód, vagy 0 ha network error / nem érte el a szervert. */
  readonly statusCode: number;
  /** A szerver által visszaadott body (parsed, ha JSON volt; egyébként szöveg). */
  readonly body: unknown;
  /** Az endpoint, amelyiken a hiba történt (pl. `GET /2/expenses/`). */
  readonly endpoint: string;

  constructor(
    message: string,
    options: { statusCode: number; body: unknown; endpoint: string; cause?: unknown },
  ) {
    super(message);
    this.name = 'QuickApiError';
    this.statusCode = options.statusCode;
    this.body = options.body;
    this.endpoint = options.endpoint;
    if (options.cause !== undefined) {
      // ES2022 — Node 18+ támogatja
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }

  /** True ha a hiba retry-zható (429 vagy 5xx). */
  get isTransient(): boolean {
    return this.statusCode === 429 || (this.statusCode >= 500 && this.statusCode < 600);
  }

  /** True ha a hitelesítés sikertelen volt (401/403). */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /** True ha a kért erőforrás nem létezik (404). */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
}
