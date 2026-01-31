import { realSchedulesApi } from '../real';
import type { Schedule, ScheduleFormData } from '../../types';

export const schedulesApi = {
  list: (): Promise<Schedule[]> => {
    return realSchedulesApi.list();
  },

  getById: (id: string): Promise<Schedule> => {
    return realSchedulesApi.getById(id);
  },

  create: (data: ScheduleFormData): Promise<Schedule> => {
    return realSchedulesApi.create(data);
  },

  update: (id: string, data: ScheduleFormData, hash?: string): Promise<Schedule> => {
    return realSchedulesApi.update(id, data, hash);
  },

  delete: (id: string): Promise<void> => {
    return realSchedulesApi.delete(id);
  },

  block: (id: string, isBlocked: boolean): Promise<Schedule> => {
    return realSchedulesApi.block(id, isBlocked);
  },
};
