import type { Income, IncomeListParams, PaginatedList } from '../types';
import { BaseResource } from './base';

export class IncomesResource extends BaseResource {
  async list(params: IncomeListParams = {}): Promise<PaginatedList<Income>> {
    return await this.transport.request<PaginatedList<Income>>({
      method: 'GET',
      path: '/1/incomes/',
      query: params as Record<string, unknown>,
    });
  }

  async paginate(params: IncomeListParams = {}): Promise<Income[]> {
    return await this.transport.paginate<Income>(
      { method: 'GET', path: '/1/incomes/', query: params as Record<string, unknown> },
      params.page_size,
    );
  }

  async *iterate(params: IncomeListParams = {}): AsyncIterableIterator<Income> {
    for (const item of await this.paginate(params)) yield item;
  }

  async get(id: number | string): Promise<Income> {
    return await this.transport.request<Income>({ method: 'GET', path: `/1/incomes/${id}/` });
  }
}
