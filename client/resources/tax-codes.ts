import type { TaxCode } from '../types';
import { BaseResource, normalizeListResponse } from './base';

export class TaxCodesResource extends BaseResource {
  async list(): Promise<TaxCode[]> {
    const response = await this.transport.request({
      method: 'GET',
      path: '/1/tax-codes/',
    });
    return normalizeListResponse<TaxCode>(response);
  }
}
