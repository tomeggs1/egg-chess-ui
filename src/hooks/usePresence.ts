import { useQuery } from '@tanstack/react-query'
import { getOnlineFriends } from '../api/presence'

export const presenceKeys = {
  all: ['presence'] as const,
  onlineFriends: () => [...presenceKeys.all, 'online-friends'] as const,
}

// The set of online friend usernames. Seeded by the REST snapshot and kept
// current by live presence pushes (and reconciled on reconnect); the interval
// is just a slow fallback for when the socket is down.
export function useOnlineFriends() {
  return useQuery({
    queryKey: presenceKeys.onlineFriends(),
    queryFn: getOnlineFriends,
    refetchInterval: 120_000,
    select: (usernames) => new Set(usernames),
  })
}
