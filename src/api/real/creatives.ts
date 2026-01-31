import { realApiFetch, parseJsonResponse } from './client';
import { createApiTransformer } from './transformer';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { Creative, CreativeFormData, ApiCreative, ApiCreativeRequest } from '../../types';

const CREATIVES_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.creatives}`;

// Create transformer for creative data
const creativeTransformer = createApiTransformer<ApiCreative, Creative>(
  // Transform API response to internal type
  (apiCreative) => ({
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
  }),
  // Transform internal type to API request (not used directly, see transformToApi below)
  (creative) => ({
    id: creative.id,
    campaignId: creative.campaignId,
    name: creative.name,
    dataUrl: creative.dataUrl,
    minHeight: creative.minHeight,
    maxHeight: creative.maxHeight,
    minWidth: creative.minWidth,
    maxWidth: creative.maxWidth,
    previewWidth: creative.previewWidth,
    previewHeight: creative.previewHeight,
    isBlocked: creative.blocked,
    hash: creative.hash,
  })
);

// Transform form data to API request
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
    const apiCreatives = await parseJsonResponse<ApiCreative[]>(response);
    return creativeTransformer.fromApiList(apiCreatives || []);
  },

  getById: async (id: string): Promise<Creative> => {
    const response = await realApiFetch(`${CREATIVES_BASE_URL}/${id}`, {
      method: 'GET',
    });
    const apiCreative = await parseJsonResponse<ApiCreative>(response);
    if (!apiCreative) throw new Error('Empty response for creative');
    return creativeTransformer.fromApi(apiCreative);
  },

  create: async (data: CreativeFormData): Promise<Creative> => {
    const requestData = transformToApi(data);
    const response = await realApiFetch(`${CREATIVES_BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    const apiCreative = await parseJsonResponse<ApiCreative>(response);
    if (!apiCreative) throw new Error('Empty response from creative creation');
    return creativeTransformer.fromApi(apiCreative);
  },

  update: async (id: string, data: CreativeFormData): Promise<Creative> => {
    const requestData = transformToApi({ ...data, id });
    const response = await realApiFetch(`${CREATIVES_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
    const apiCreative = await parseJsonResponse<ApiCreative>(response);
    if (!apiCreative) throw new Error('Empty response from creative update');
    return creativeTransformer.fromApi(apiCreative);
  },

  block: async (id: string, blocked: boolean): Promise<Creative> => {
    const response = await realApiFetch(`${CREATIVES_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: blocked }),
    });
    const apiCreative = await parseJsonResponse<ApiCreative>(response);
    if (!apiCreative) throw new Error('Empty response from creative block');
    return creativeTransformer.fromApi(apiCreative);
  },
};
