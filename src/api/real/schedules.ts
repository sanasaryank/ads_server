/**
 * Schedules API
 * Manages schedule entities
 */

import { realApiFetch } from './client';
import { createApiTransformer } from './transformer';
import { env } from '../../config/env';
import { API_ENDPOINTS } from '../../config/api';
import type { Schedule, ScheduleFormData, DaySchedule, ApiSchedule, ApiDaySchedule } from '../../types';

const SCHEDULES_BASE_URL = `${env.apiBaseUrl}${API_ENDPOINTS.schedules}`;

// Create transformer for day schedule data
const dayScheduleTransformer = createApiTransformer<ApiDaySchedule, DaySchedule>(
  // Transform API day schedule to internal format
  (apiDay) => ({
    day: apiDay.day as DaySchedule['day'],
    enabled: apiDay.enabled,
    startTime: apiDay.start,
    endTime: apiDay.end,
  }),
  // Transform internal day schedule to API format
  (day) => ({
    day: day.day,
    enabled: day.enabled,
    start: day.startTime,
    end: day.endTime,
  })
);

// Create transformer for schedule data
const scheduleTransformer = createApiTransformer<ApiSchedule, Schedule & { hash?: string }>(
  // Transform API response to internal format
  (apiSchedule) => ({
    id: apiSchedule.id,
    name: apiSchedule.name,
    color: apiSchedule.color,
    blocked: apiSchedule.isBlocked,
    weekSchedule: dayScheduleTransformer.fromApiList(apiSchedule.weekSchedule),
    createdAt: apiSchedule.createdAt || 0,
    updatedAt: apiSchedule.updatedAt || 0,
    hash: apiSchedule.hash,
  }),
  // Transform internal format to API request (not used directly, see transformToApi below)
  (schedule) => ({
    id: schedule.id,
    name: schedule.name,
    color: schedule.color,
    isBlocked: schedule.blocked,
    weekSchedule: dayScheduleTransformer.toApiList(schedule.weekSchedule),
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    hash: schedule.hash,
  })
);

// Transform form data to API request
const transformToApi = (data: ScheduleFormData) => ({
  name: data.name,
  color: data.color,
  isBlocked: data.blocked,
  weekSchedule: dayScheduleTransformer.toApiList(data.weekSchedule),
});

export const realSchedulesApi = {
  /**
   * Get all schedules
   */
  list: async (): Promise<Schedule[]> => {
    const response = await realApiFetch(SCHEDULES_BASE_URL, {
      method: 'GET',
    });
    
    const apiSchedules = await response.json() as ApiSchedule[];
    return scheduleTransformer.fromApiList(apiSchedules);
  },

  /**
   * Get a single schedule by ID
   */
  getById: async (id: string): Promise<Schedule> => {
    const response = await realApiFetch(`${SCHEDULES_BASE_URL}/${id}`, {
      method: 'GET',
    });
    
    const apiSchedule = await response.json() as ApiSchedule;
    return scheduleTransformer.fromApi(apiSchedule);
  },

  /**
   * Create a new schedule
   */
  create: async (data: ScheduleFormData): Promise<Schedule> => {
    const response = await realApiFetch(SCHEDULES_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(transformToApi(data)),
    });
    
    const apiSchedule = await response.json() as ApiSchedule;
    return scheduleTransformer.fromApi(apiSchedule);
  },

  /**
   * Update an existing schedule
   */
  update: async (id: string, data: ScheduleFormData, hash?: string): Promise<Schedule> => {
    const body: any = transformToApi(data);
    if (hash) {
      body.hash = hash;
    }
    
    const response = await realApiFetch(`${SCHEDULES_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    
    const apiSchedule = await response.json() as ApiSchedule;
    return scheduleTransformer.fromApi(apiSchedule);
  },

  /**
   * Delete a schedule
   */
  delete: async (id: string): Promise<void> => {
    await realApiFetch(`${SCHEDULES_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Block or unblock a schedule
   */
  block: async (id: string, isBlocked: boolean): Promise<Schedule> => {
    const response = await realApiFetch(`${SCHEDULES_BASE_URL}/${id}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked }),
    });
    
    const apiSchedule = await response.json() as ApiSchedule;
    return scheduleTransformer.fromApi(apiSchedule);
  },
};
