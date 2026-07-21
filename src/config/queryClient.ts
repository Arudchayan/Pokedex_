import { QueryClient } from '@tanstack/react-query';
import { env } from './env';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      // env.maxRetries is total attempts semantics for operators; React Query retry is failure retries.
      retry: Math.max(0, env.maxRetries - 1),
    },
  },
});
