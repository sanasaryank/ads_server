import type { DictionaryItem, DictionaryKey, LocationsResponse } from '../../types';
import { realApiFetch, parseJsonResponse } from './client';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';

const DICTIONARIES_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.dictionaries}`;
const LOCATIONS_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.locations}`;

export const realDictionariesApi = {
  list: async (dictKey: DictionaryKey): Promise<DictionaryItem[]> => {
    const response = await realApiFetch(`${DICTIONARIES_BASE_URL}/${dictKey}`, {
      method: 'GET',
    });

    return parseJsonResponse<DictionaryItem[]>(response).then(data => data || []);
  },

  getLocations: async (): Promise<LocationsResponse> => {
    const response = await realApiFetch(LOCATIONS_BASE_URL, {
      method: 'GET',
    });

    const data = await parseJsonResponse<LocationsResponse>(response);
    if (!data) throw new Error('Empty response from locations');
    return data;
  },
};
