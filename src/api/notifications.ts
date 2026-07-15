import { api } from './client'
import type { PlayerSummary } from './friends'

// Mirrors NotificationType on the service.
export type NotificationType = 'FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED'

// Mirrors NotificationResponse on the service. `actor` is who triggered it
// (null for system notifications); `referenceId` points at the related row
// (e.g. a friendship id).
export interface NotificationResponse {
  id: number
  type: NotificationType
  actor: PlayerSummary | null
  referenceId: number | null
  read: boolean
  createdAt: string
}

// GET /api/notifications — newest first.
export function getNotifications(): Promise<NotificationResponse[]> {
  return api.get<NotificationResponse[]>('/api/notifications')
}

// GET /api/notifications/unread-count — the bell badge count.
export function getUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/api/notifications/unread-count')
}

// POST /api/notifications/read — mark all read.
export function markNotificationsRead(): Promise<void> {
  return api.post<void>('/api/notifications/read')
}
