import { QuickApiError } from './errors';

/** A QUiCK API alapértelmezett base URL-je. */
export const DEFAULT_BASE_URL = 'https://api.quick.riport.co.hu';

/** Maximum párhuzamos oldalkérés a {@link Transport.paginate} workerpool-ban. */
export const PAGINATION_CONCURRENCY = 5;
/** Loop guard a végtelen `next` lánc ellen. */
export const PAGINATION_MAX_PAGES = 500;
/** Default lapméret. */
export const DEFAULT_PAGE_SIZE = 100;

/** Retry: max próbálkozás transient hiba (429 / 5xx) esetén. */
export const MAX_RETRIES = 3;
/** Retry: exponenciális backoff alapja (ms). */
export const RETRY_BASE_MS = 100;
/** Retry: backoff felső határa (ms). */
export const MAX_BACKOFF_MS = 2000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method: HttpMethod;
  /** Path relative to base URL (`/2/expenses/`). */
  path: string;
  /** Query string params. Tömb értékek `key=v1&key=v2` formában serializálódnak. */
  query?: Record<string, unknown>;
  /** Request body (object → JSON serializálódik). */
  body?: unknown;
}

/**
 * A {@link QuickClient} mögötti HTTP réteg. Két beépített implementáció:
 * - {@link createFetchTransport} — natív fetch (Node 18+, Bun, Deno, Workers)
 * - {@link createN8nTransport} — n8n `httpRequestWithAuthentication` helper
 *
 * A felhasználó saját implementációt is biztosíthat (pl. egyedi auth, proxy).
 */
export interface Transport {
  request<T = unknown>(opts: RequestOptions): Promise<T>;
  /**
   * Az összes oldalt egy tömbbe gyűjti. count-alapú párhuzamos fetch ha lehet,
   * fallback sequential next-link követés ha az API nem ad count-ot.
   */
  paginate<T = unknown>(opts: RequestOptions, pageSize?: number): Promise<T[]>;
}

// ---------- fetch-based transport ----------

export interface FetchTransportOptions {
  apiToken: string;
  baseUrl?: string;
  companyId?: string;
  /** Custom fetch implementáció (pl. teszteléshez vagy Workers env-hez). */
  fetch?: typeof fetch;
  /** Override a max retry számra. Default: {@link MAX_RETRIES}. */
  maxRetries?: number;
  /** Extra fejlécek minden kérésre. */
  defaultHeaders?: Record<string, string>;
}

/**
 * Natív fetch-alapú transport. A QUiCK API auth-okat (`Authorization: Token …`,
 * opcionális `Quick-Company-Id`) automatikusan beilleszti.
 */
export function createFetchTransport(opts: FetchTransportOptions): Transport {
  const baseUrl = (opts.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
  const fetchImpl = opts.fetch ?? fetch;
  const maxRetries = opts.maxRetries ?? MAX_RETRIES;

  async function executeOne<T>(req: RequestOptions): Promise<T> {
    const url = new URL(`${baseUrl}${req.path}`);
    appendQuery(url, req.query);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Token ${opts.apiToken}`,
      ...(opts.defaultHeaders ?? {}),
    };
    if (opts.companyId && opts.companyId.trim()) {
      headers['Quick-Company-Id'] = opts.companyId.trim();
    }
    if (req.body !== undefined && req.body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    const init: RequestInit = {
      method: req.method,
      headers,
      body: req.body !== undefined && req.body !== null ? JSON.stringify(req.body) : undefined,
    };

    return await runWithRetry<T>(req, async () => {
      const response = await fetchImpl(url.toString(), init);
      if (!response.ok) {
        const text = await response.text();
        let parsed: unknown = text;
        try {
          parsed = JSON.parse(text);
        } catch {
          /* nem JSON, hagyjuk text-ként */
        }
        throw new QuickApiError(
          `QUiCK API ${response.status}: ${shortMessage(parsed) ?? response.statusText}`,
          {
            statusCode: response.status,
            body: parsed,
            endpoint: `${req.method} ${req.path}`,
          },
        );
      }
      // 204 No Content vagy üres test
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    }, maxRetries);
  }

  return makeTransport(executeOne);
}

// ---------- n8n adapter ----------

interface N8nLikeContext {
  helpers: {
    httpRequestWithAuthentication: (
      credentialType: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Promise<any>;
  };
}

/**
 * n8n {@link IExecuteFunctions} / {@link ILoadOptionsFunctions} /
 * {@link IPollFunctions} kontextushoz adapter. Az n8n credential rendszerét
 * használja (a `quickApi` credential-t a `httpRequestWithAuthentication`
 * automatikusan injektálja).
 */
export function createN8nTransport(
  context: N8nLikeContext,
  options: { baseUrl?: string; companyId?: string } = {},
): Transport {
  const baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');

  async function executeOne<T>(req: RequestOptions): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.companyId && options.companyId.trim()) {
      headers['Quick-Company-Id'] = options.companyId.trim();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const httpOptions: any = {
      method: req.method,
      url: `${baseUrl}${req.path}`,
      headers,
      json: true,
    };
    if (req.query && Object.keys(req.query).length > 0) httpOptions.qs = req.query;
    if (req.body !== undefined && req.body !== null) httpOptions.body = req.body;

    return await runWithRetry<T>(req, async () => {
      try {
        return (await context.helpers.httpRequestWithAuthentication.call(
          context,
          'quickApi',
          httpOptions,
        )) as T;
      } catch (error) {
        const e = error as { httpCode?: string | number; message?: string; response?: unknown };
        const status = Number.parseInt(String(e.httpCode ?? '0'), 10) || 0;
        throw new QuickApiError(`QUiCK API ${status || 'error'}: ${e.message ?? 'unknown'}`, {
          statusCode: status,
          body: e.response,
          endpoint: `${req.method} ${req.path}`,
          cause: error,
        });
      }
    }, MAX_RETRIES);
  }

  return makeTransport(executeOne);
}

// ---------- shared infra ----------

/**
 * A {@link Transport} interface-ét csomagolja egy `executeOne` köré, és
 * implementálja a `paginate`-et a {@link RequestOptions} alapján.
 */
function makeTransport(
  executeOne: <T>(req: RequestOptions) => Promise<T>,
): Transport {
  async function paginate<T>(opts: RequestOptions, pageSize = DEFAULT_PAGE_SIZE): Promise<T[]> {
    const firstQuery = { ...(opts.query ?? {}), page: 1, page_size: pageSize };
    const first = (await executeOne<PaginatedResponse<T> | T[]>({
      ...opts,
      query: firstQuery,
    })) as PaginatedResponse<T> | T[];

    const firstItems = extractPageItems<T>(first);
    if (!isPaginated(first) || !first.next) return firstItems;

    // Fast path: count → párhuzamos fetch
    if (typeof first.count === 'number' && first.count > pageSize) {
      const totalPages = Math.min(Math.ceil(first.count / pageSize), PAGINATION_MAX_PAGES);
      const restItems = await fetchPagesInParallel<T>(executeOne, opts, pageSize, 2, totalPages);
      return [...firstItems, ...restItems];
    }

    // Fallback: sequential next-link követés
    const items: T[] = [...firstItems];
    let page = 2;
    let response: PaginatedResponse<T> | T[] | undefined = first;
    while (page <= PAGINATION_MAX_PAGES && isPaginated(response) && response.next) {
      response = await executeOne<PaginatedResponse<T> | T[]>({
        ...opts,
        query: { ...(opts.query ?? {}), page, page_size: pageSize },
      });
      items.push(...extractPageItems<T>(response));
      page += 1;
    }
    return items;
  }

  return {
    request: executeOne,
    paginate,
  };
}

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

function isPaginated<T>(r: unknown): r is PaginatedResponse<T> {
  return (
    typeof r === 'object' &&
    r !== null &&
    !Array.isArray(r) &&
    ('results' in r || 'next' in r || 'count' in r)
  );
}

function extractPageItems<T>(response: unknown): T[] {
  // Megegyezik a `client/resources/base.normalizeListResponse`-szel —
  // a transport-szintű duplikáció a két modul közötti circular dep miatt.
  if (response === null || response === undefined) return [];
  if (Array.isArray(response)) return response as T[];
  if (typeof response === 'object') {
    const r = response as { results?: T[] };
    if (Array.isArray(r.results)) return r.results;
    return [response as T];
  }
  return [];
}

async function fetchPagesInParallel<T>(
  executeOne: <U>(req: RequestOptions) => Promise<U>,
  opts: RequestOptions,
  pageSize: number,
  startPage: number,
  endPage: number,
): Promise<T[]> {
  const pageCount = endPage - startPage + 1;
  const buckets: T[][] = new Array(pageCount);
  let nextPageToFetch = startPage;

  const worker = async () => {
    while (true) {
      const page = nextPageToFetch++;
      if (page > endPage) return;
      const response = await executeOne<PaginatedResponse<T> | T[]>({
        ...opts,
        query: { ...(opts.query ?? {}), page, page_size: pageSize },
      });
      buckets[page - startPage] = extractPageItems<T>(response);
    }
  };

  const workerCount = Math.min(PAGINATION_CONCURRENCY, pageCount);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return buckets.flat();
}

/**
 * Retry middleware a transient hibákra (429 / 5xx). A `Retry-After` fejlécet
 * tiszteletben tartja. A nem-transient hibákat azonnal továbbdobja.
 */
async function runWithRetry<T>(
  req: RequestOptions,
  exec: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await exec();
    } catch (error) {
      lastError = error;
      const transient = error instanceof QuickApiError && error.isTransient;
      if (!transient || attempt === maxRetries) break;

      const retryAfter = readRetryAfter(error);
      const delayMs =
        retryAfter !== undefined
          ? Math.max(0, retryAfter * 1000)
          : Math.min(RETRY_BASE_MS * 2 ** attempt, MAX_BACKOFF_MS);
      await sleep(delayMs);
    }
  }
  // A break-eknél az utolsó error mindig QuickApiError-ra van wrapelve
  throw lastError instanceof QuickApiError
    ? lastError
    : new QuickApiError(`Network error during ${req.method} ${req.path}`, {
        statusCode: 0,
        body: undefined,
        endpoint: `${req.method} ${req.path}`,
        cause: lastError,
      });
}

function readRetryAfter(err: unknown): number | undefined {
  if (!(err instanceof QuickApiError)) return undefined;
  const body = err.body as { headers?: Record<string, string> } | undefined;
  const header = body?.headers?.['retry-after'];
  if (typeof header === 'string') {
    const n = Number.parseInt(header, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendQuery(url: URL, query: Record<string, unknown> | undefined): void {
  if (!query) return;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined && v !== null) url.searchParams.append(key, String(v));
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }
}

function shortMessage(parsed: unknown): string | undefined {
  if (typeof parsed === 'string' && parsed.length > 0 && parsed.length < 200) return parsed;
  if (typeof parsed === 'object' && parsed !== null) {
    const o = parsed as Record<string, unknown>;
    if (typeof o._error === 'string') return o._error;
    if (typeof o.detail === 'string') return o.detail;
    if (typeof o.message === 'string') return o.message;
  }
  return undefined;
}
