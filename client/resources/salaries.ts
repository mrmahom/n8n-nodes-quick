import type { MonthlyListParams, SalaryCreate, SalaryMonth, SalaryUpdate } from '../types';
import { BaseResource } from './base';

export class SalariesResource extends BaseResource {
  async list(params: MonthlyListParams = {}): Promise<SalaryMonth[]> {
    return await this.transport.request<SalaryMonth[]>({
      method: 'GET',
      path: '/1/monthly-salaries/',
      query: params as Record<string, unknown>,
    });
  }

  async create(salaries: readonly SalaryCreate[]): Promise<SalaryMonth[]> {
    return await this.transport.request<SalaryMonth[]>({
      method: 'POST',
      path: '/1/salaries/create/',
      body: { salaries },
    });
  }

  async update(salaries: readonly SalaryUpdate[]): Promise<SalaryMonth[]> {
    return await this.transport.request<SalaryMonth[]>({
      method: 'POST',
      path: '/1/salaries/update/',
      body: { salaries },
    });
  }

  async delete(ids: readonly number[]): Promise<{ success: true; deleted: number[] }> {
    if (ids.length > 0) {
      await this.transport.request({
        method: 'POST',
        path: '/1/salaries/delete/',
        body: { ids },
      });
    }
    return { success: true, deleted: [...ids] };
  }
}
