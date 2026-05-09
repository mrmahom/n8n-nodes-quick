import type {
  AttachDetachParams,
  DocumentDetail,
  DocumentFile,
  DocumentInput,
  DocumentListParams,
  DocumentSummary,
  DocumentUpdate,
} from '../types';
import { BaseResource, chunked, normalizeListResponse } from './base';

export class DocumentsResource extends BaseResource {
  /** Dokumentumok listája. Az endpoint nem-paginált — a teljes találatlistát adja. */
  async list(params: DocumentListParams = {}): Promise<DocumentSummary[]> {
    const response = await this.transport.request({
      method: 'GET',
      path: '/1/documents/',
      query: params as Record<string, unknown>,
    });
    return normalizeListResponse<DocumentSummary>(response);
  }

  /** Letölthető URL-ek a megadott szűrésnek megfelelő dokumentumokhoz. */
  async listFiles(params: DocumentListParams = {}): Promise<DocumentFile[]> {
    const response = await this.transport.request({
      method: 'GET',
      path: '/1/documents/files/',
      query: params as Record<string, unknown>,
    });
    return normalizeListResponse<DocumentFile>(response);
  }

  async get(id: number | string): Promise<DocumentDetail> {
    return await this.transport.request<DocumentDetail>({
      method: 'GET',
      path: `/2/documents/${id}/`,
    });
  }

  async update(id: number | string, body: DocumentUpdate): Promise<DocumentDetail> {
    return await this.transport.request<DocumentDetail>({
      method: 'POST',
      path: `/2/documents/update/${id}/`,
      body,
    });
  }

  /** Egyszeri dokumentum-feltöltés. */
  async create(
    document: DocumentInput,
    source = 'public_api',
  ): Promise<{ processed: Array<{ success: boolean; id?: number; reason?: string }> }> {
    return await this.transport.request({
      method: 'POST',
      path: '/2/documents/create/',
      body: { documents: [document], source },
    });
  }

  /** Több dokumentum egyszerre. A spec `maxItems: 5` limit miatt 5-ös batch. */
  async createMany(
    documents: readonly DocumentInput[],
    source = 'public_api',
  ): Promise<{ processed: Array<{ success: boolean; id?: number; reason?: string }> }> {
    if (documents.length === 0) return { processed: [] };
    const out: Array<{ success: boolean; id?: number; reason?: string }> = [];
    for (const batch of chunked(documents, 5)) {
      const r = await this.transport.request<{
        processed: Array<{ success: boolean; id?: number; reason?: string }>;
      }>({
        method: 'POST',
        path: '/2/documents/create/',
        body: { documents: batch, source },
      });
      out.push(...r.processed);
    }
    return { processed: out };
  }

  async delete(ids: readonly number[]): Promise<{ success: true; deleted: number[] }> {
    if (ids.length > 0) {
      await this.transport.request({
        method: 'POST',
        path: '/2/documents/delete/',
        body: { ids },
      });
    }
    return { success: true, deleted: [...ids] };
  }

  /** Megnézi, létezik-e már ilyen nevű és méretű dokumentum. */
  async search(params: { name: string; size: number; company_ids: number[] }): Promise<unknown> {
    return await this.transport.request({
      method: 'POST',
      path: '/2/documents/search/',
      body: params,
    });
  }

  async attach(params: AttachDetachParams): Promise<{ success: true }> {
    await this.transport.request({
      method: 'POST',
      path: '/1/documents/attach/',
      body: params,
    });
    return { success: true };
  }

  async detach(params: AttachDetachParams): Promise<{ success: true }> {
    await this.transport.request({
      method: 'POST',
      path: '/1/documents/detach/',
      body: params,
    });
    return { success: true };
  }
}
