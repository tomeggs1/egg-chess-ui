import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
  startConversation,
  type MessageResponse,
} from '../api/messages'

export const messageKeys = {
  all: ['conversations'] as const,
  list: () => [...messageKeys.all, 'list'] as const,
  thread: (id: number) => [...messageKeys.all, 'thread', id] as const,
}

// The player's conversation list. Polled so previews and unread counts stay
// current.
export function useConversations() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: getConversations,
    refetchInterval: 30_000,
  })
}

// Total unread across conversations, for the Messages icon badge. Shares the
// conversations query (same key) and just derives the sum.
export function useTotalUnreadMessages() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: getConversations,
    refetchInterval: 30_000,
    select: (conversations) => conversations.reduce((sum, c) => sum + c.unreadCount, 0),
  })
}

// Messages in one thread. Polls faster while open so a live back-and-forth
// feels responsive without a real-time channel yet.
export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: messageKeys.thread(conversationId ?? 0),
    queryFn: () => getMessages(conversationId as number),
    enabled: conversationId != null,
    refetchInterval: 5_000,
  })
}

// Send a message, with an optimistic append so it shows instantly.
export function useSendMessage(conversationId: number, myId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => sendMessage(conversationId, body),
    onMutate: async (body: string) => {
      const key = messageKeys.thread(conversationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<MessageResponse[]>(key)
      const optimistic: MessageResponse = {
        id: -Date.now(), // temporary negative id, replaced on refetch
        conversationId,
        senderId: myId,
        body,
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<MessageResponse[]>(key, (old = []) => [...old, optimistic])
      return { previous }
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messageKeys.thread(conversationId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.thread(conversationId) })
      queryClient.invalidateQueries({ queryKey: messageKeys.list() })
    },
  })
}

// Start (or reuse) a conversation with a friend.
export function useStartConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => startConversation(username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.list() }),
  })
}

// Mark a conversation read (clears its unread count).
export function useMarkConversationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conversationId: number) => markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.list() }),
  })
}
