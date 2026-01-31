import { realApiFetch } from './client';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { Creative, CreativeFormData, ApiCreative, ApiCreativeRequest } from '../../types';

const CREATIVES_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.creatives}`;

// Transform API response to internal type
const transformFromApi = (apiCreative: ApiCreative): Creative => {
  return {
    id: apiCreative.id,
    campaignId: apiCreative.campaignId,
    name: apiCreative.name,
    dataUrl: apiCreative.dataUrl,
    minHeight: apiCreative.minHeight,
    maxHeight: apiCreative.maxHeight,
    minWidth: apiCreative.minWidth,
    maxWidth: apiCreative.maxWidth,
    previewWidth: apiCreative.previewWidth,
    previewHeight: apiCreative.previewHeight,
    blocked: apiCreative.isBlocked,
    hash: apiCreative.hash,
  };
};

// Transform internal type to API request
const transformToApi = (formData: CreativeFormData): ApiCreativeRequest => {
  return {
    id: formData.id,
    campaignId: formData.campaignId,
    name: formData.name,
    dataUrl: formData.dataUrl,
    minHeight: formData.minHeight,
    maxHeight: formData.maxHeight,
    minWidth: formData.minWidth,
    maxWidth: formData.maxWidth,
    previewWidth: formData.previewWidth,
    previewHeight: formData.previewHeight,
    isBlocked: formData.blocked,
    hash: formData.hash,
  };
};

export const realCreativesApi = {
  list: async (): Promise<Creative[]> => {
    const response = await realApiFetch(`${CREATIVES_BASE_URL}`, {
      method: 'GET',
    });
    const apiCreatives = await response.json() as ApiCreative[];
    return apiCreatives.map(transformFromApi);
  },

  getById: async (id: string): Promise<Creative> => {
    const response = await realApiFetch(`${CREATIVES_BASE_URL}/${id}`, {
      method: 'GET',
    });
    const apiCreative = await response.json() as ApiCreative;
    return transformFromApi(apiCreative);
  },

  create: async (data: CreativeFormData): Promise<Creative> => {
    const requestData = transformToApi(data);
    const response = await realApiFetch(`${CREATIVES_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    const apiCreative = await response.json() as ApiCreative;
    return transformFromApi(apiCreative);
  },

  update: async (id: string, data: CreativeFormData): Promise<Creative> => {
    const requestData = transformToApi({ ...data, id });
    const response = await realApiFetch(`${CREATIVES_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
    const apiCreative = await response.json() as ApiCreative;
    return transformFromApi(apiCreative);
  },

  block: async (id: string, blocked: boolean): Promise<Creative> => {
    const response = await realApiFetch(`${CREATIVES_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: blocked }),
    });
    const apiCreative = await response.json() as ApiCreative;
    return transformFromApi(apiCreative);
  },
};
