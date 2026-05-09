import type { PulseSnapshot } from '../types';
import { BaseResource } from './base';

export class PulseResource extends BaseResource {
  async get(): Promise<PulseSnapshot> {
    return await this.transport.request<PulseSnapshot>({ method: 'GET', path: '/1/pulse/' });
  }
}
