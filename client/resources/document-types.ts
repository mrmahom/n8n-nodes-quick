import type { DocumentType } from '../types';
import { BaseResource, normalizeListResponse } from './base';

export class DocumentTypesResource extends BaseResource {
  async list(): Promise<DocumentType[]> {
    const response = await this.transport.request({
      method: 'GET',
      path: '/2/document-types/',
    });
    return normalizeListResponse<DocumentType>(response);
  }
}
