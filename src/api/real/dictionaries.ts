import type { DictionaryItem, DictionaryKey, LocationsResponse } from '../../types';
import { realApiFetch } from './client';
import { env } from '../../config/env';

const DICTIONARIES_BASE_URL = `${env.apiBaseUrl}/dictionaries`;
const LOCATIONS_BASE_URL = `${env.apiBaseUrl}/locations`;

export const realDictionariesApi = {
  list: async (dictKey: DictionaryKey): Promise<DictionaryItem[]> => {
    const response = await realApiFetch(`${DICTIONARIES_BASE_URL}/${dictKey}`, {
      method: 'GET',
    });

    return response.json();
  },

  getLocations: async (): Promise<LocationsResponse> => {
    const response = await realApiFetch(LOCATIONS_BASE_URL, {
      method: 'GET',
    });

    return response.json();
  },
};
