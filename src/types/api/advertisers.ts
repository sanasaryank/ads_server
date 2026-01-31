/**
 * API types for advertisers
 * These represent the API response/request formats
 */

import type { DictionaryName } from '../index';

export interface ApiAdvertiser {
  id: string;
  name: DictionaryName;
  TIN: string;
  isBlocked: boolean;
  description?: string;
  hash?: string;
  createdAt?: number;
  updatedAt?: number;
}
