import { api } from './client'
import type { PlayerSummary } from './friends'

// Mirrors ConversationResponse on the service.
export interface ConversationResponse {
  id: number
  otherParticipant: PlayerSummary | null
  lastMessageBody: string | null
  lastMessageAt: string | null
  unreadCount: number
}

// Mirrors MessageResponse on the service.
export interface MessageResponse {
  id: number
  conversationId: number
  senderId: number
  body: string
  createdAt: string
}

// GET /api/conversations — the player's conversations, most recent first.
export function getConversations(): Promise<ConversationResponse[]> {
  return api.get<ConversationResponse[]>('/api/conversations')
}

// GET /api/conversations/{id}/messages — oldest-to-newest.
export function getMessages(conversationId: number): Promise<MessageResponse[]> {
  return api.get<MessageResponse[]>(`/api/conversations/${conversationId}/messages`)
}

// POST /api/conversations — start (or reuse) a 1:1 conversation with a friend.
export function startConversation(username: string): Promise<ConversationResponse> {
  return api.post<ConversationResponse>('/api/conversations', { username })
}

// POST /api/conversations/{id}/messages — send a message.
export function sendMessage(conversationId: number, body: string): Promise<MessageResponse> {
  return api.post<MessageResponse>(`/api/conversations/${conversationId}/messages`, { body })
}

// POST /api/conversations/{id}/read — mark read up to now.
export function markConversationRead(conversationId: number): Promise<void> {
  return api.post<void>(`/api/conversations/${conversationId}/read`)
}
