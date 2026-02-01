/**
 * API types for schedules
 * These represent the API response/request formats
 */

import type { DictionaryName } from '../index';

export interface ApiDaySchedule {
  day: string;
  enabled: boolean;
  start: number;
  end: number;
}

export interface ApiSchedule {
  id: string;
  name: DictionaryName;
  color: string;
  isBlocked: boolean;
  weekSchedule: ApiDaySchedule[];
  hash?: string;
}
