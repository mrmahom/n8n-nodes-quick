import type {
  Expense,
  ExpenseDetail,
  ExpenseListParams,
  ExpenseUpdate,
  FileInput,
  PaginatedList,
  BulkResult,
  QuarantineAcceptResult,
  ArtifactSearchParams,
} from '../types';
import { BaseResource, BULK_BATCH_SIZE, aggregateBulkResponses, chunked } from './base';

export class ExpensesResource extends BaseResource {
  /**
   * Egy oldal kiadás listázása. Ha az összes találatot akarod, használd
   * a {@link list} `page_size` paraméterét, vagy a {@link paginate} metódust.
   */
  async list(params: ExpenseListParams = {}): Promise<PaginatedList<Expense>> {
    return await this.transport.request<PaginatedList<Expense>>({
      method: 'GET',
      path: '/2/expenses/',
      query: params as Record<string, unknown>,
    });
  }

  /** Az összes kiadást egy tömbbe gyűjti — count-alapú párhuzamos pagináció. */
  async paginate(params: ExpenseListParams = {}): Promise<Expense[]> {
    return await this.transport.paginate<Expense>(
      { method: 'GET', path: '/2/expenses/', query: params as Record<string, unknown> },
      params.page_size,
    );
  }

  /** Async iterátor — minden kiadáson végighalad, oldalszintű előbetöltéssel. */
  async *iterate(params: ExpenseListParams = {}): AsyncIterableIterator<Expense> {
    for (const item of await this.paginate(params)) yield item;
  }

  async get(id: number | string): Promise<ExpenseDetail> {
    return await this.transport.request<ExpenseDetail>({
      method: 'GET',
      path: `/2/expenses/${id}/`,
    });
  }

  async update(id: number | string, body: ExpenseUpdate): Promise<ExpenseDetail> {
    return await this.transport.request<ExpenseDetail>({
      method: 'PATCH',
      path: `/2/expenses/${id}/update/`,
      body,
    });
  }

  /** Új kiadás (számlakép) feltöltése. */
  async create(file: FileInput, source = 'public_api'): Promise<{ processed: number[] }> {
    return await this.transport.request<{ processed: number[] }>({
      method: 'POST',
      path: '/2/expenses/create/',
      body: { expenses: [file], source },
    });
  }

  /** Több számlakép egyszerre. A spec `maxItems: 5` limit miatt 5-ös batchekre vágódik. */
  async createMany(
    files: readonly FileInput[],
    source = 'public_api',
  ): Promise<{ processed: number[] }> {
    if (files.length === 0) return { processed: [] };
    const responses: Array<{ processed: number[] }> = [];
    for (const batch of chunked(files, 5)) {
      responses.push(
        await this.transport.request<{ processed: number[] }>({
          method: 'POST',
          path: '/2/expenses/create/',
          body: { expenses: batch, source },
        }),
      );
    }
    const processed: number[] = [];
    for (const r of responses) processed.push(...r.processed);
    return { processed };
  }

  /** Számlakép keresés név + méret + cégID alapján — duplikáció ellenőrzéshez. */
  async searchArtifact(params: ArtifactSearchParams): Promise<unknown> {
    return await this.transport.request({
      method: 'POST',
      path: '/2/expenses/artifact-search/',
      body: params,
    });
  }

  approve(ids: readonly number[]): Promise<BulkResult> {
    return this.bulkAction(ids, '/1/expenses/approve/');
  }

  unapprove(ids: readonly number[]): Promise<BulkResult> {
    return this.bulkAction(ids, '/1/expenses/unapprove/');
  }

  check(ids: readonly number[]): Promise<BulkResult> {
    return this.bulkAction(ids, '/1/expenses/check/');
  }

  uncheck(ids: readonly number[]): Promise<BulkResult> {
    return this.bulkAction(ids, '/1/expenses/uncheck/');
  }

  export(ids: readonly number[]): Promise<BulkResult> {
    return this.bulkAction(ids, '/1/expenses/export/');
  }

  async quarantineAccept(ids: readonly number[]): Promise<QuarantineAcceptResult> {
    if (ids.length === 0) return { success_ids: [], success_count: 0, failure_count: 0 };
    if (ids.length <= BULK_BATCH_SIZE) {
      return await this.transport.request<QuarantineAcceptResult>({
        method: 'POST',
        path: '/1/expenses/quarantine-accept/',
        body: { ids },
      });
    }
    const responses: QuarantineAcceptResult[] = [];
    for (const batch of chunked(ids, BULK_BATCH_SIZE)) {
      responses.push(
        await this.transport.request<QuarantineAcceptResult>({
          method: 'POST',
          path: '/1/expenses/quarantine-accept/',
          body: { ids: batch },
        }),
      );
    }
    return {
      success_ids: responses.flatMap((r) => r.success_ids ?? []),
      success_count: responses.reduce((sum, r) => sum + (r.success_count ?? 0), 0),
      failure_count: responses.reduce((sum, r) => sum + (r.failure_count ?? 0), 0),
    };
  }

  private async bulkAction(ids: readonly number[], path: string): Promise<BulkResult> {
    if (ids.length === 0) return { success_ids: [], failed_ids: [], errors: [] };
    if (ids.length <= BULK_BATCH_SIZE) {
      return await this.transport.request<BulkResult>({
        method: 'POST',
        path,
        body: { ids },
      });
    }
    const responses: BulkResult[] = [];
    for (const batch of chunked(ids, BULK_BATCH_SIZE)) {
      responses.push(
        await this.transport.request<BulkResult>({ method: 'POST', path, body: { ids: batch } }),
      );
    }
    return aggregateBulkResponses(responses) as BulkResult;
  }
}
