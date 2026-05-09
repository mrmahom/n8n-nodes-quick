import type { Payment, PaymentListParams } from '../types';
import { BaseResource } from './base';

export class PaymentsResource extends BaseResource {
  async list(params: PaymentListParams = {}): Promise<Payment[]> {
    return await this.transport.request<Payment[]>({
      method: 'GET',
      path: '/1/payments/',
      query: params as Record<string, unknown>,
    });
  }
}
