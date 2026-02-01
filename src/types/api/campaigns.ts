/**
 * API types for campaigns
 * These represent the API response/request formats
 */

import type { DictionaryName, CampaignTarget } from '../index';

export interface ApiCampaign {
  id: string;
  advertiserId: string;
  name: DictionaryName;
  description?: string;
  startDate: number;
  endDate: number;
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: 'CPM' | 'CPC' | 'CPV' | 'CPA';
  spendStrategy: 'even' | 'asap' | 'frontload';
  frequencyCapStrategy: 'soft' | 'strict';
  frequencyCap: {
    per_user: {
      impressions: { count: number; window_sec: number };
      clicks: { count: number; window_sec: number };
    };
    per_session: {
      impressions: { count: number; window_sec: number };
      clicks: { count: number; window_sec: number };
    };
  };
  priority: number;
  weight: number;
  overdeliveryRatio: number;
  locationsMode: 'allowed' | 'denied';
  locations: string[];
  restaurantTypesMode: 'allowed' | 'denied';
  restaurantTypes: string[];
  menuTypesMode: 'allowed' | 'denied';
  menuTypes: string[];
  slots: string[];
  targets: CampaignTarget[];
  isBlocked: boolean;
  hash?: string;
}
