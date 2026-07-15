import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriendship,
  searchPlayers,
  sendFriendRequest,
  type FriendshipResponse,
} from '../api/friends'

// Centralized query keys so hooks and invalidations can't drift apart. All
// friendship data lives under the 'friendships' root, which lets a mutation
// invalidate everything at once when it's simplest to.
export const friendKeys = {
  all: ['friendships'] as const,
  friends: () => [...friendKeys.all, 'friends'] as const,
  requests: (direction: 'incoming' | 'outgoing') =>
    [...friendKeys.all, 'requests', direction] as const,
  search: (query: string) => [...friendKeys.all, 'search', query] as const,
}

// Player-directory search for people to befriend. Only runs for queries of at
// least 2 chars (matching the service's minimum), so short input costs nothing.
export function usePlayerSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: friendKeys.search(trimmed),
    queryFn: () => searchPlayers(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
  })
}

// The authenticated player's accepted friends.
export function useFriends() {
  return useQuery({
    queryKey: friendKeys.friends(),
    queryFn: getFriends,
  })
}

// Requests the player has received. A friend-request notification is pushed
// over WebSocket (and queries reconcile on reconnect), so this interval is a
// slow fallback for when the socket is down.
export function useIncomingRequests() {
  return useQuery({
    queryKey: friendKeys.requests('incoming'),
    queryFn: () => getFriendRequests('incoming'),
    refetchInterval: 120_000,
  })
}

// Requests the player has sent that are still pending.
export function useOutgoingRequests() {
  return useQuery({
    queryKey: friendKeys.requests('outgoing'),
    queryFn: () => getFriendRequests('outgoing'),
  })
}

// Any friendship mutation can affect the friends list and both request lists
// (e.g. accepting moves a row from incoming -> friends), so we invalidate the
// whole 'friendships' subtree and let the active queries refetch.
function useInvalidateFriendships() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: friendKeys.all })
}

// Send a friend request by username.
export function useSendFriendRequest() {
  const invalidate = useInvalidateFriendships()
  return useMutation<FriendshipResponse, Error, string>({
    mutationFn: (username) => sendFriendRequest(username),
    onSuccess: invalidate,
  })
}

// Accept a pending incoming request.
export function useAcceptRequest() {
  const invalidate = useInvalidateFriendships()
  return useMutation<FriendshipResponse, Error, number>({
    mutationFn: (id) => acceptFriendRequest(id),
    onSuccess: invalidate,
  })
}

// Decline a pending incoming request.
export function useDeclineRequest() {
  const invalidate = useInvalidateFriendships()
  return useMutation<FriendshipResponse, Error, number>({
    mutationFn: (id) => declineFriendRequest(id),
    onSuccess: invalidate,
  })
}

// Remove a friendship: unfriend, cancel a sent request, or clear a received one.
export function useRemoveFriendship() {
  const invalidate = useInvalidateFriendships()
  return useMutation<void, Error, number>({
    mutationFn: (id) => removeFriendship(id),
    onSuccess: invalidate,
  })
}
