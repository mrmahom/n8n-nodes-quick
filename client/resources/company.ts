import type { CompanyInfo, CompanyInfoUpdate } from '../types';
import { BaseResource } from './base';

export class CompanyResource extends BaseResource {
  async getInfo(): Promise<CompanyInfo> {
    return await this.transport.request<CompanyInfo>({
      method: 'GET',
      path: '/2/company-info/',
    });
  }

  async updateInfo(id: number | string, body: CompanyInfoUpdate): Promise<CompanyInfo> {
    return await this.transport.request<CompanyInfo>({
      method: 'PATCH',
      path: `/2/company-info/update/${id}/`,
      body,
    });
  }
}
