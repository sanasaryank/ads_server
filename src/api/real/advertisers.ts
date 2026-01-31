/**
 * Advertisers API
 * Manages advertiser entities
 */

import { realApiFetch } from './client';
import { createApiTransformer } from './transformer';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { Advertiser, AdvertiserFormData, ApiAdvertiser } from '../../types';

const ADVERTISERS_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.advertisers}`;

// Create transformer for advertiser data
const advertiserTransformer = createApiTransformer<ApiAdvertiser, Advertiser & { hash?: string }>(
  // Transform API response to internal format
  (apiAdvertiser) => ({
    id: apiAdvertiser.id,
    name: apiAdvertiser.name,
    tin: apiAdvertiser.TIN,
    blocked: apiAdvertiser.isBlocked,
    description: apiAdvertiser.description,
    createdAt: apiAdvertiser.createdAt || 0,
    updatedAt: apiAdvertiser.updatedAt || 0,
    hash: apiAdvertiser.hash,
  }),
  // Transform internal format to API request (not used directly, see transformToApi below)
  (advertiser) => ({
    id: advertiser.id,
    name: advertiser.name,
    TIN: advertiser.tin,
    isBlocked: advertiser.blocked,
    description: advertiser.description,
    createdAt: advertiser.createdAt,
    updatedAt: advertiser.updatedAt,
    hash: advertiser.hash,
  })
);

// Transform form data to API request
const transformToApi = (data: AdvertiserFormData) => ({
  name: data.name,
  TIN: data.tin,
  isBlocked: data.blocked,
  description: data.description,
});

export const realAdvertisersApi = {
  /**
   * Get all advertisers
   */
  list: async (): Promise<Advertiser[]> => {
    const response = await realApiFetch(`${ADVERTISERS_BASE_URL}`, {
      method: 'GET',
    });
    const apiAdvertisers = await response.json() as ApiAdvertiser[];
    return advertiserTransformer.fromApiList(apiAdvertisers);
  },

  /**
   * Get single advertiser by ID (with hash for editing)
   */
  getById: async (id: string): Promise<Advertiser & { hash?: string }> => {
    const response = await realApiFetch(`${ADVERTISERS_BASE_URL}/${id}`, {
      method: 'GET',
    });
    const apiAdvertiser = await response.json() as ApiAdvertiser;
    return advertiserTransformer.fromApi(apiAdvertiser);
  },

  /**
   * Create new advertiser
   */
  create: async (data: AdvertiserFormData): Promise<Advertiser> => {
    const payload = transformToApi(data);
    const response = await realApiFetch(`${ADVERTISERS_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const apiAdvertiser = await response.json() as ApiAdvertiser;
    return advertiserTransformer.fromApi(apiAdvertiser);
  },

  /**
   * Update existing advertiser
   */
  update: async (id: string, data: AdvertiserFormData & { hash: string }): Promise<Advertiser> => {
    const payload = {
      id,
      ...transformToApi(data),
      hash: data.hash,
    };
    const response = await realApiFetch(`${ADVERTISERS_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const apiAdvertiser = await response.json() as ApiAdvertiser;
    return advertiserTransformer.fromApi(apiAdvertiser);
  },

  /**
   * Block/unblock advertiser
   */
  block: async (id: string, blocked: boolean): Promise<void> => {
    await realApiFetch(`${ADVERTISERS_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: blocked }),
    });
  },
};
