import type { FileInput } from '../types';
import { BaseResource } from './base';

export class AuditXmlResource extends BaseResource {
  /** NAV audit XML feltöltése. */
  async upload(file: FileInput): Promise<{ success: true; filename: string }> {
    await this.transport.request({
      method: 'POST',
      path: '/2/audit-xml/',
      body: { audit_xmls: [file] },
    });
    return { success: true, filename: file.filename };
  }
}
