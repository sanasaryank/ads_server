/**
 * Audit API
 * Manages audit log events
 */

import { realApiFetch, parseJsonResponse } from './client';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { AuditEvent, AuditEntityType } from '../../types';

const AUDIT_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.audit}`;

export const realAuditApi = {
  /**
   * Get audit events with optional filters
   */
  getEvents: async (params?: {
    entityType?: AuditEntityType;
    entityId?: number | string;
  }): Promise<AuditEvent[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.entityType) {
      queryParams.append('entityType', params.entityType);
    }
    
    if (params?.entityId) {
      queryParams.append('entityId', String(params.entityId));
    }
    
    const url = queryParams.toString() 
      ? `${AUDIT_BASE_URL}?${queryParams.toString()}`
      : AUDIT_BASE_URL;
    
    const response = await realApiFetch(url, {
      method: 'GET',
    });

    return parseJsonResponse<AuditEvent[]>(response).then(data => data || []);
  },
};
