import type { PaginatedList, Partner, PartnerListParams } from '../types';
import { BaseResource } from './base';

export class PartnersResource extends BaseResource {
  async list(params: PartnerListParams = {}): Promise<PaginatedList<Partner>> {
    return await this.transport.request<PaginatedList<Partner>>({
      method: 'GET',
      path: '/1/partners/',
      query: params as Record<string, unknown>,
    });
  }

  async paginate(params: PartnerListParams = {}): Promise<Partner[]> {
    return await this.transport.paginate<Partner>(
      { method: 'GET', path: '/1/partners/', query: params as Record<string, unknown> },
      params.page_size,
    );
  }

  async *iterate(params: PartnerListParams = {}): AsyncIterableIterator<Partner> {
    for (const item of await this.paginate(params)) yield item;
  }
}
