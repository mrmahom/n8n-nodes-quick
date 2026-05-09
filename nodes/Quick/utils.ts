import type { IDataObject, IExecuteFunctions, IPollFunctions } from 'n8n-workflow';
import { QuickClient } from '../../client/QuickClient';

/** A `quickApi` credential mezői ahogy a `n8n` betölti. */
interface QuickCredentialFields {
  apiToken: string;
  baseUrl?: string;
  companyId?: string;
}

/**
 * Az n8n credential alapján egy {@link QuickClient}-et hoz létre. A `baseUrl` és
 * a `companyId` a credential-ből kerül át. A `httpRequestWithAuthentication`
 * helper az `Authorization: Token <apiToken>` fejlécet automatikusan beilleszti.
 */
export async function getQuickClient(
  context: IExecuteFunctions | IPollFunctions,
): Promise<QuickClient> {
  const credentials = (await context.getCredentials('quickApi')) as unknown as QuickCredentialFields;
  return QuickClient.fromN8n(context, {
    baseUrl: credentials.baseUrl,
    companyId: credentials.companyId,
  });
}

/**
 * Stringből vesszővel elválasztott egész listát csinál. Üres / whitespace
 * bemenetre üres tömböt ad vissza, a nem szám részeket eldobja.
 */
export function parseIdList(input: string | undefined): number[] {
  if (!input) return [];
  return input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => Number.parseInt(part, 10))
    .filter((n) => !Number.isNaN(n));
}

/**
 * Csak a kitöltött mezőket veszi át a paraméter forrásból a query-be.
 * `false` boolean is átkerül, mert szándékos szűrési érték lehet.
 */
export function addOptionalQueryParams(
  source: IDataObject,
  fields: string[],
  qs: IDataObject = {},
): IDataObject {
  for (const field of fields) {
    const value = source[field];
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    qs[field] = value;
  }
  return qs;
}

/**
 * Eldobja az "üres" mezőket egy fixedCollection / updateFields objektumból:
 * undefined / null / üres string / NaN / üres tömb. A `false` és `0` átkerül.
 */
export function stripEmpty(input: IDataObject): IDataObject {
  const out: IDataObject = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value === '') continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

/**
 * A QUiCK paginált válaszokat egy lista nézetbe alakítja: ha az API a normál
 * `{count, next, results}` sémát adja, akkor a `.results`-et veszi; ha viszont
 * egyszerű array-t ad, akkor azt; ha egyetlen objektumot, akkor azt egy elemű
 * tömbként továbbadja.
 */
export function unwrapListResponse<T>(response: unknown): T[] | T {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const r = response as { results?: T[] };
    if (Array.isArray(r.results)) return r.results;
  }
  return response as T;
}
