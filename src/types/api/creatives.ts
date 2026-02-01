/**
 * API types for creatives
 * These represent the API response/request formats
 */

import type { DictionaryName } from '../index';

export interface ApiCreative {
  id: string;
  campaignId: string;
  name: DictionaryName;
  dataUrl: string;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  isBlocked: boolean;
  hash?: string;
}

export interface ApiCreativeRequest {
  id?: string;
  campaignId: string;
  name: DictionaryName;
  dataUrl: string;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  isBlocked: boolean;
  hash?: string;
}
