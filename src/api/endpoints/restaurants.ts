import { realRestaurantsApi } from '../real';
import type { RestaurantListItem } from '../../types';

export const restaurantsApi = {
  list: (): Promise<RestaurantListItem[]> => {
    return realRestaurantsApi.list();
  },

  block: (id: string, isBlocked: boolean): Promise<RestaurantListItem> => {
    return realRestaurantsApi.block(id, isBlocked);
  },

  getRestaurantCampaigns: (restaurantId: string) => {
    return realRestaurantsApi.getRestaurantCampaigns(restaurantId);
  },

  updateRestaurantCampaigns: (restaurantId: string, campaigns: { id: string; slots: { id: string; schedules: string[]; placements: string[] }[] }[]) => {
    return realRestaurantsApi.updateRestaurantCampaigns(restaurantId, campaigns);
  },
};
