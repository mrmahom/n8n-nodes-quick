import type { LedgerNumber, LedgerNumberCreate, LedgerNumberUpdate } from '../types';
import { BaseResource, normalizeListResponse } from './base';

export class LedgerNumbersResource extends BaseResource {
  async list(): Promise<LedgerNumber[]> {
    const response = await this.transport.request({
      method: 'GET',
      path: '/2/accounting/ledger-numbers/',
    });
    return normalizeListResponse<LedgerNumber>(response);
  }

  async create(ledger_numbers: readonly LedgerNumberCreate[]): Promise<unknown> {
    return await this.transport.request({
      method: 'POST',
      path: '/2/accounting/ledger-numbers/create/',
      body: { ledger_numbers },
    });
  }

  async update(id: number | string, body: LedgerNumberUpdate): Promise<LedgerNumber> {
    return await this.transport.request<LedgerNumber>({
      method: 'POST',
      path: `/2/accounting/ledger-numbers/update/${id}/`,
      body,
    });
  }

  async delete(ids: readonly number[]): Promise<{ success: true; deleted: number[] }> {
    if (ids.length > 0) {
      await this.transport.request({
        method: 'POST',
        path: '/2/accounting/ledger-numbers/delete/',
        body: { ids },
      });
    }
    return { success: true, deleted: [...ids] };
  }
}
