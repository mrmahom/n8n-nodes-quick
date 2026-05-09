import type { Transport } from '../transport';

/**
 * Resource osztályok közös őse — csak a {@link Transport}-ot tartja referenciában.
 * Minden konkrét resource (pl. {@link import('./expenses').ExpensesResource})
 * ezt extendeli.
 */
export abstract class BaseResource {
  protected readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }
}

/**
 * Egy tömböt N-es darabokra vág. A bulk akcióknál (pl. approve 1000 ID-vel)
 * használjuk az API-onkénti batch limit miatt.
 */
export function chunked<T>(arr: readonly T[], size: number): T[][] {
  if (size <= 0) throw new Error(`chunked: size must be positive, got ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Több bulk válasz aggregálása `{success_ids, failed_ids, errors}` séma alapján.
 */
export function aggregateBulkResponses<
  T extends { success_ids?: number[]; failed_ids?: number[]; errors?: unknown[] },
>(responses: readonly T[]): { success_ids: number[]; failed_ids: number[]; errors: unknown[] } {
  const success_ids: number[] = [];
  const failed_ids: number[] = [];
  const errors: unknown[] = [];
  for (const r of responses) {
    if (Array.isArray(r.success_ids)) success_ids.push(...r.success_ids);
    if (Array.isArray(r.failed_ids)) failed_ids.push(...r.failed_ids);
    if (Array.isArray(r.errors)) errors.push(...r.errors);
  }
  return { success_ids, failed_ids, errors };
}

/** A QUiCK bulk akciókra javasolt batch méret. */
export const BULK_BATCH_SIZE = 100;

/**
 * A QUiCK API listázó válaszainak normalizálása. A backend hol egyszerű tömböt
 * ad vissza, hol `{results: [...]}` paginált sémát, hol egyetlen objektumot
 * (egyelemű listára). Mindhárom alakzatot tömbbé alakítjuk.
 */
export function normalizeListResponse<T>(response: unknown): T[] {
  if (response === null || response === undefined) return [];
  if (Array.isArray(response)) return response as T[];
  if (typeof response === 'object') {
    const r = response as { results?: T[] };
    if (Array.isArray(r.results)) return r.results;
    return [response as T];
  }
  return [];
}
