import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, getUnreadCount, markNotificationsRead } from '../api/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

// The authenticated player's notification feed.
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
  })
}

// Unread count for the bell badge. Notifications are pushed over WebSocket (and
// reconciled on reconnect), so this interval is just a slow fallback for when
// the socket is down.
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 120_000,
    select: (data) => data.count,
  })
}

// Mark all notifications read; refreshes both the list and the badge count.
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
