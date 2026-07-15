import { api } from './client'

// GET /api/presence/friends — usernames of the current player's online friends.
// The initial snapshot; live changes arrive over the WebSocket.
export function getOnlineFriends(): Promise<string[]> {
  return api.get<string[]>('/api/presence/friends')
}
