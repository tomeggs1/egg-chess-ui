import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/client'

// Shared query client for the app. Defaults are tuned for the egg-chess
// service's REST endpoints: treat data as fresh for 30s (cuts redundant
// refetches on navigation), and never retry 4xx responses — an
// unauthorized/forbidden/not-found/conflict won't fix itself by retrying.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
