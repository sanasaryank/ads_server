/**
 * API types for restaurants
 * These represent the API response/request formats
 */

import type { DictionaryName } from '../index';

export interface RestaurantCampaign {
  id: string;
  advertiserId: string;
  slot: {
    id: string;
    schedules: string[];
    placements: string[];
  };
  name: DictionaryName;
  startDate: number;
  endDate: number;
  isBlocked: boolean;
}
