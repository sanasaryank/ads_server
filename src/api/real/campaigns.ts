/**
 * Campaigns API
 * Manages campaign entities
 */

import { realApiFetch } from './client';
import { createApiTransformer } from './transformer';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { Campaign, CampaignFormData, ApiCampaign } from '../../types';

const CAMPAIGNS_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.campaigns}`;

// Create transformer for campaign data
const campaignTransformer = createApiTransformer<ApiCampaign, Campaign & { hash?: string }>(
  // Transform API response to internal format
  (apiCampaign) => ({
  id: apiCampaign.id,
  advertiserId: apiCampaign.advertiserId,
  name: apiCampaign.name,
  description: apiCampaign.description,
  startDate: apiCampaign.startDate,
  endDate: apiCampaign.endDate,
  budget: apiCampaign.budget,
  budgetDaily: apiCampaign.budgetDaily,
  price: apiCampaign.price,
  pricingModel: apiCampaign.pricingModel,
  spendStrategy: apiCampaign.spendStrategy,
  frequencyCapStrategy: apiCampaign.frequencyCapStrategy,
  frequencyCap: apiCampaign.frequencyCap,
  priority: apiCampaign.priority,
  weight: apiCampaign.weight,
  overdeliveryRatio: apiCampaign.overdeliveryRatio,
  locationsMode: apiCampaign.locationsMode,
    locations: apiCampaign.locations,
    restaurantTypesMode: apiCampaign.restaurantTypesMode,
    restaurantTypes: apiCampaign.restaurantTypes,
    menuTypesMode: apiCampaign.menuTypesMode,
    menuTypes: apiCampaign.menuTypes,
    slots: apiCampaign.slots,
  // Clean up invalid schedule IDs with robust validation
  targets: (apiCampaign.targets || []).map(target => ({
    ...target,
    slots: (target.slots || []).map(slot => ({
      ...slot,
      schedules: (slot.schedules || []).filter(id => {
        const trimmed = String(id).trim();
        return trimmed && 
               trimmed !== 'NaN' && 
               trimmed !== 'undefined' && 
               trimmed !== 'null' &&
               /^[a-zA-Z0-9_-]+$/.test(trimmed); // Validate ID format
      }),
      placements: slot.placements || []
    }))
  })),
  blocked: apiCampaign.isBlocked,
  createdAt: apiCampaign.createdAt || 0,
  updatedAt: apiCampaign.updatedAt || 0,
  hash: apiCampaign.hash,
}),
  // Transform internal format to API request (not used directly, see transformToApi below)
  (campaign) => ({
    id: String(campaign.id),
    advertiserId: campaign.advertiserId,
    name: campaign.name,
    description: campaign.description,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    budget: campaign.budget,
    budgetDaily: campaign.budgetDaily,
    price: campaign.price,
    pricingModel: campaign.pricingModel,
    spendStrategy: campaign.spendStrategy,
    frequencyCapStrategy: campaign.frequencyCapStrategy,
    frequencyCap: campaign.frequencyCap,
    priority: campaign.priority,
    weight: campaign.weight,
    overdeliveryRatio: campaign.overdeliveryRatio,
    locationsMode: campaign.locationsMode,
    locations: campaign.locations,
    restaurantTypesMode: campaign.restaurantTypesMode,
    restaurantTypes: campaign.restaurantTypes,
    menuTypesMode: campaign.menuTypesMode,
    menuTypes: campaign.menuTypes,
    slots: campaign.slots,
    targets: campaign.targets,
    isBlocked: campaign.blocked,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    hash: campaign.hash,
  })
);

// Transform form data to API request
const transformToApi = (data: CampaignFormData) => ({
  advertiserId: data.advertiserId,
  name: data.name,
  description: data.description,
  startDate: data.startDate,
  endDate: data.endDate,
  budget: data.budget,
  budgetDaily: data.budgetDaily,
  price: data.price,
  pricingModel: data.pricingModel,
  spendStrategy: data.spendStrategy,
  frequencyCapStrategy: data.frequencyCapStrategy,
  frequencyCap: data.frequencyCap,
  priority: data.priority,
  weight: data.weight,
  overdeliveryRatio: data.overdeliveryRatio,
  locationsMode: data.locationsMode,
  locations: data.locations.map(String),
  restaurantTypesMode: data.restaurantTypesMode,
  restaurantTypes: data.restaurantTypes.map(String),
  menuTypesMode: data.menuTypesMode,
  menuTypes: data.menuTypes.map(String),
  slots: data.slots.map(String),
  targets: data.targets,
  isBlocked: data.blocked,
});

export const realCampaignsApi = {
  /**
   * Get all campaigns
   */
  list: async (): Promise<Campaign[]> => {
    const response = await realApiFetch(`${CAMPAIGNS_BASE_URL}`, {
      method: 'GET',
    });
    const apiCampaigns = await response.json() as ApiCampaign[];
    return campaignTransformer.fromApiList(apiCampaigns);
  },

  /**
   * Get single campaign by ID (with hash for editing)
   */
  getById: async (id: string | number): Promise<Campaign & { hash?: string }> => {
    const response = await realApiFetch(`${CAMPAIGNS_BASE_URL}/${id}`, {
      method: 'GET',
    });
    const apiCampaign = await response.json() as ApiCampaign;
    return campaignTransformer.fromApi(apiCampaign);
  },

  /**
   * Create new campaign
   */
  create: async (data: CampaignFormData): Promise<Campaign> => {
    const payload = transformToApi(data);
    const response = await realApiFetch(`${CAMPAIGNS_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const apiCampaign = await response.json() as ApiCampaign;
    return campaignTransformer.fromApi(apiCampaign);
  },

  /**
   * Update existing campaign
   */
  update: async (id: string | number, data: CampaignFormData & { hash: string }): Promise<Campaign> => {
    const payload = {
      id: String(id),
      ...transformToApi(data),
      hash: data.hash,
    };
    const response = await realApiFetch(`${CAMPAIGNS_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const apiCampaign = await response.json() as ApiCampaign;
    return campaignTransformer.fromApi(apiCampaign);
  },

  /**
   * Block/unblock campaign
   */
  block: async (id: string | number, blocked: boolean): Promise<void> => {
    await realApiFetch(`${CAMPAIGNS_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: blocked }),
    });
  },
};
