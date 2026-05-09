import type { MonthlyListParams, TaxCreate, TaxMonth, TaxUpdate } from '../types';
import { BaseResource } from './base';

export class TaxesResource extends BaseResource {
  async list(params: MonthlyListParams = {}): Promise<TaxMonth[]> {
    return await this.transport.request<TaxMonth[]>({
      method: 'GET',
      path: '/1/monthly-taxes/',
      query: params as Record<string, unknown>,
    });
  }

  async create(taxes: readonly TaxCreate[]): Promise<TaxMonth[]> {
    return await this.transport.request<TaxMonth[]>({
      method: 'POST',
      path: '/1/taxes/create/',
      body: { taxes },
    });
  }

  async update(taxes: readonly TaxUpdate[]): Promise<TaxMonth[]> {
    return await this.transport.request<TaxMonth[]>({
      method: 'POST',
      path: '/1/taxes/update/',
      body: { taxes },
    });
  }

  async delete(ids: readonly number[]): Promise<{ success: true; deleted: number[] }> {
    if (ids.length > 0) {
      await this.transport.request({
        method: 'POST',
        path: '/1/taxes/delete/',
        body: { ids },
      });
    }
    return { success: true, deleted: [...ids] };
  }
}
