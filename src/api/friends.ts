import { api } from './client'

// Mirrors FriendshipStatus on the service.
export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

// Mirrors FriendshipResponse.PlayerSummary — the public-safe subset of a player
// (deliberately excludes email and real name).
export interface PlayerSummary {
  id: number
  username: string
  rating: number
  country?: string
  // Chosen preset avatar key, or null/absent for the default (initials).
  avatarKey?: string | null
  // When the player was last connected (ISO), or null if never.
  lastSeenAt?: string | null
}

// Mirrors FriendshipResponse on the service. `respondedAt` is null while the
// request is still PENDING.
export interface FriendshipResponse {
  id: number
  status: FriendshipStatus
  requester: PlayerSummary
  addressee: PlayerSummary
  createdAt: string
  respondedAt: string | null
}

export type RequestDirection = 'incoming' | 'outgoing'

// The viewer's relationship to a search hit; mirrors the service enum.
export type FriendRelationship = 'NONE' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING'

// Mirrors PlayerSearchResult on the service: a public-safe player plus the
// viewer's relationship, so the UI can show Add / Requested / Accept / Friends.
export interface PlayerSearchResult {
  id: number
  username: string
  rating: number
  country?: string
  avatarKey?: string | null
  relationship: FriendRelationship
  // The friendship row id when one exists (pending/accepted); null otherwise.
  friendshipId: number | null
}

// GET /api/friendships/search?q= — find players to befriend by username.
export function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  return api.get<PlayerSearchResult[]>(`/api/friendships/search?q=${encodeURIComponent(query)}`)
}

// GET /api/friendships — the authenticated player's accepted friends.
export function getFriends(): Promise<FriendshipResponse[]> {
  return api.get<FriendshipResponse[]>('/api/friendships')
}

// GET /api/friendships/requests?direction= — pending requests, either received
// (incoming) or sent (outgoing).
export function getFriendRequests(direction: RequestDirection): Promise<FriendshipResponse[]> {
  return api.get<FriendshipResponse[]>(`/api/friendships/requests?direction=${direction}`)
}

// POST /api/friendships — send a request to the named player. The requester is
// taken from the token, not the body.
export function sendFriendRequest(username: string): Promise<FriendshipResponse> {
  return api.post<FriendshipResponse>('/api/friendships', { username })
}

// POST /api/friendships/{id}/accept — accept a request addressed to you.
export function acceptFriendRequest(id: number): Promise<FriendshipResponse> {
  return api.post<FriendshipResponse>(`/api/friendships/${id}/accept`)
}

// POST /api/friendships/{id}/decline — decline a request addressed to you.
export function declineFriendRequest(id: number): Promise<FriendshipResponse> {
  return api.post<FriendshipResponse>(`/api/friendships/${id}/decline`)
}

// DELETE /api/friendships/{id} — unfriend, cancel a sent request, or clear a
// received one. Returns no body.
export function removeFriendship(id: number): Promise<void> {
  return api.delete<void>(`/api/friendships/${id}`)
}
