import { QueryClient } from '@tanstack/react-query';

/**
 * Single shared TanStack Query client. Sensible defaults for a data app:
 * a short stale window, one retry, and no refetch storms on window focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
