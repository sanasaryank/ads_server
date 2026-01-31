import type { RestaurantListItem, RestaurantCampaign } from '../../types';
import { realApiFetch } from './client';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';

const RESTAURANTS_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.restaurants}`;

export const realRestaurantsApi = {
  list: async (): Promise<RestaurantListItem[]> => {
    const response = await realApiFetch(RESTAURANTS_BASE_URL, {
      method: 'GET',
    });

    return response.json();
  },

  block: async (id: string, isBlocked: boolean): Promise<RestaurantListItem> => {
    const response = await realApiFetch(`${RESTAURANTS_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked }),
    });

    return response.json();
  },

  getRestaurantCampaigns: async (restaurantId: string): Promise<RestaurantCampaign[]> => {
    const response = await realApiFetch(`${RESTAURANTS_BASE_URL}/campaigns/${restaurantId}`, {
      method: 'GET',
    });

    const data = await response.json();
    // Ensure placements array exists (backwards compatibility)
    return data.map((campaign: any) => ({
      ...campaign,
      slot: {
        ...campaign.slot,
        placements: campaign.slot.placements || []
      }
    }));
  },

  updateRestaurantCampaigns: async (restaurantId: string, campaigns: { id: string; slots: { id: string; schedules: string[]; placements: string[] }[] }[]): Promise<void> => {
    await realApiFetch(`${RESTAURANTS_BASE_URL}/campaigns/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify({ campaigns }),
    });
  },
};
