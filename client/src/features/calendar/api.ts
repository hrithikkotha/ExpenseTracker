import { api } from '@/lib/axios';
import type { CalendarDayData } from './types';

export const calendarApi = {
  getMonth: async (month: string): Promise<CalendarDayData[]> => {
    const { data } = await api.get<{ success: boolean; data: CalendarDayData[] }>(
      '/analytics/calendar',
      { params: { month } }
    );
    return data.data;
  },
};
