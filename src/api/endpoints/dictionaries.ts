import { realDictionariesApi } from '../real';
import type { DictionaryKey, DictionaryItem, LocationsResponse } from '../../types';

export const dictionariesApi = {
  list: (dictKey: DictionaryKey): Promise<DictionaryItem[]> => {
    return realDictionariesApi.list(dictKey);
  },

  getLocations: (): Promise<LocationsResponse> => {
    return realDictionariesApi.getLocations();
  },
};
