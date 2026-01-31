/**
 * Placements API (Selections and Groups)
 * Manages placement items for campaign targeting
 */

import { realApiFetch, parseJsonResponse } from './client';
import { env } from '../../config/env';
import type { Placement } from '../../types';

const PLACEMENTS_BASE_URL = `${env.apiBaseUrl}`;

export const realPlacementsApi = {
  /**
   * Get placements for a restaurant by type
   * @param type - 'selections' or 'groups'
   * @param restaurantId - Restaurant ID
   */
  getPlacements: async (type: 'selections' | 'groups', restaurantId: string): Promise<Placement[]> => {
    const response = await realApiFetch(`${PLACEMENTS_BASE_URL}/${type}/${restaurantId}`, {
      method: 'GET',
    });
    return parseJsonResponse<Placement[]>(response).then(data => data || []);
  },
};
