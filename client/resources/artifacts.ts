import type { ArtifactUrl } from '../types';
import { BaseResource } from './base';

export class ArtifactsResource extends BaseResource {
  /** Számlaképek lekérése kiadás-azonosítók alapján. */
  async forExpenses(ids: readonly number[]): Promise<ArtifactUrl[]> {
    if (ids.length === 0) return [];
    const response = await this.transport.request<ArtifactUrl | ArtifactUrl[]>({
      method: 'POST',
      path: '/1/artifacts/expense/',
      body: { ids },
    });
    return Array.isArray(response) ? response : response ? [response] : [];
  }

  /** Számlaképek lekérése bevétel-azonosítók alapján. */
  async forIncomes(ids: readonly number[]): Promise<ArtifactUrl[]> {
    if (ids.length === 0) return [];
    const response = await this.transport.request<ArtifactUrl | ArtifactUrl[]>({
      method: 'POST',
      path: '/1/artifacts/income/',
      body: { ids },
    });
    return Array.isArray(response) ? response : response ? [response] : [];
  }
}
