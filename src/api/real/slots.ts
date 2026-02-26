/**
 * Slots API (Ad Slots / Placements)
 * Manages advertising slot configurations
 */

import { realApiFetch, parseJsonResponse } from './client';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { Slot, SlotFormData } from '../../types';

const SLOTS_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.slots}`;

export const realSlotsApi = {
  /**
   * Get all slots
   */
  list: async (): Promise<Slot[]> => {
    const response = await realApiFetch(`${SLOTS_BASE_URL}`, {
      method: 'GET',
    });
    return parseJsonResponse<Slot[]>(response).then(data => data || []);
  },

  /**
   * Get single slot by ID
   */
  getById: async (id: string): Promise<SlotFormData> => {
    const response = await realApiFetch(`${SLOTS_BASE_URL}/${id}`, {
      method: 'GET',
    });
    const data = await parseJsonResponse<SlotFormData>(response);
    if (!data) throw new Error('Empty response for slot');
    return data;
  },

  /**
   * Create new slot
   */
  create: async (data: Omit<SlotFormData, 'id' | 'hash'>): Promise<Slot> => {
    const response = await realApiFetch(`${SLOTS_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await parseJsonResponse<Slot>(response);
    if (!result) throw new Error('Empty response from slot creation');
    return result;
  },

  /**
   * Update existing slot
   */
  update: async (id: string, data: SlotFormData): Promise<Slot> => {
    const response = await realApiFetch(`${SLOTS_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await parseJsonResponse<Slot>(response);
    if (!result) throw new Error('Empty response from slot update');
    return result;
  },

  /**
   * Block or unblock a slot
   */
  block: async (id: string, isBlocked: boolean): Promise<Slot> => {
    const response = await realApiFetch(`${SLOTS_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked }),
    });
    const result = await parseJsonResponse<Slot>(response);
    if (!result) throw new Error('Empty response from slot block');
    return result;
  },
};
