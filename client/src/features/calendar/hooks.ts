import { useQuery } from '@tanstack/react-query';
import { calendarApi } from './api';

export function useCalendarMonth(month: string) {
  return useQuery({
    queryKey: ['calendar', month],
    queryFn: () => calendarApi.getMonth(month),
  });
}
