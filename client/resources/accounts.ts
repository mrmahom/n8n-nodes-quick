import type { PaginatedList, PaidThrough, PaidThroughListParams } from '../types';
import { BaseResource } from './base';

/** Bankszámlák / pénztárak (paid-throughs). */
export class AccountsResource extends BaseResource {
  async list(params: PaidThroughListParams = {}): Promise<PaginatedList<PaidThrough>> {
    return await this.transport.request<PaginatedList<PaidThrough>>({
      method: 'GET',
      path: '/1/accounts/',
      query: params as Record<string, unknown>,
    });
  }

  async paginate(params: PaidThroughListParams = {}): Promise<PaidThrough[]> {
    return await this.transport.paginate<PaidThrough>(
      { method: 'GET', path: '/1/accounts/', query: params as Record<string, unknown> },
      params.page_size,
    );
  }

  async *iterate(params: PaidThroughListParams = {}): AsyncIterableIterator<PaidThrough> {
    for (const item of await this.paginate(params)) yield item;
  }
}
