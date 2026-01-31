import { realAuditApi } from '../real';
import type { AuditEvent, AuditEntityType } from '../../types';

export const auditApi = {
  getEvents: (params?: {
    entityType?: AuditEntityType;
    entityId?: number | string;
  }): Promise<AuditEvent[]> => {
    return realAuditApi.getEvents(params);
  },
};
