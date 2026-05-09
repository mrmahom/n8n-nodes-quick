import type { VatCategory, VatCategoryCreate, VatCategoryUpdate } from '../types';
import { BaseResource, normalizeListResponse } from './base';

export class VatCategoriesResource extends BaseResource {
  async list(): Promise<VatCategory[]> {
    const response = await this.transport.request({
      method: 'GET',
      path: '/2/accounting/vat-categories/',
    });
    return normalizeListResponse<VatCategory>(response);
  }

  async create(vat_categories: readonly VatCategoryCreate[]): Promise<unknown> {
    return await this.transport.request({
      method: 'POST',
      path: '/2/accounting/vat-categories/create/',
      body: { vat_categories },
    });
  }

  async update(id: number | string, body: VatCategoryUpdate): Promise<VatCategory> {
    return await this.transport.request<VatCategory>({
      method: 'POST',
      path: `/2/accounting/vat-categories/update/${id}/`,
      body,
    });
  }

  async delete(ids: readonly number[]): Promise<{ success: true; deleted: number[] }> {
    if (ids.length > 0) {
      await this.transport.request({
        method: 'POST',
        path: '/2/accounting/vat-categories/delete/',
        body: { ids },
      });
    }
    return { success: true, deleted: [...ids] };
  }
}
