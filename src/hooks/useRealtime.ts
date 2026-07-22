import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { getAuthToken } from "../auth/session";
import { notificationKeys } from "./useNotifications";
import { friendKeys } from "./useFriends";
import { presenceKeys } from "./usePresence";
import { messageKeys } from "./useMessages";
import { challengeKeys } from "./useChallenges";
import { resolveWsUrl } from "../api/ws";

/**
 * One STOMP-over-WebSocket connection for the whole app, opened while
 * authenticated. Subscribes to the current user's notification and presence
 * queues and reflects pushes into the query cache. Torn down on logout.
 */
export function useRealtime() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getAuthToken();
    if (!token) return;

    const client = new Client({
      brokerURL: resolveWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        // The broker doesn't replay messages missed while disconnected, so on
        // every (re)connect reconcile the server-backed queries. This is what
        // lets the polling intervals be relaxed to a slow safety net.
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        queryClient.invalidateQueries({ queryKey: friendKeys.all });
        queryClient.invalidateQueries({ queryKey: presenceKeys.all });
        queryClient.invalidateQueries({ queryKey: messageKeys.all });
        queryClient.invalidateQueries({ queryKey: challengeKeys.all });

        client.subscribe("/user/queue/notifications", (message) => {
          // Refresh the bell (list + unread count).
          queryClient.invalidateQueries({ queryKey: notificationKeys.all });
          // A friend-related notification also changed the friendship lists.
          try {
            const notification = JSON.parse(message.body) as { type?: string };
            if (
              notification.type === "FRIEND_REQUEST" ||
              notification.type === "FRIEND_REQUEST_ACCEPTED"
            ) {
              queryClient.invalidateQueries({ queryKey: friendKeys.all });
            }
          } catch {
            // Non-JSON payload — the notification refresh above still ran.
          }
        });

        client.subscribe("/user/queue/presence", (message) => {
          try {
            const update = JSON.parse(message.body) as { username: string; online: boolean };
            queryClient.setQueryData<string[]>(presenceKeys.onlineFriends(), (old = []) => {
              const online = new Set(old);
              if (update.online) online.add(update.username);
              else online.delete(update.username);
              return Array.from(online);
            });
            // A friend who just went offline has a new last-seen time; refresh
            // the friends list so the hover text reflects it.
            if (!update.online) {
              queryClient.invalidateQueries({ queryKey: friendKeys.all });
            }
          } catch {
            // Ignore malformed presence payloads.
          }
        });

        client.subscribe("/user/queue/challenges", (message) => {
          // Any challenge transition (received / accepted / declined / canceled /
          // expired) changes the pending lists.
          queryClient.invalidateQueries({ queryKey: challengeKeys.all });
          try {
            const challenge = JSON.parse(message.body) as { status?: string; gameId?: number | null };
            // On accept, both players are taken into the game.
            if (challenge.status === "ACCEPTED" && challenge.gameId != null) {
              navigate(`/game/${challenge.gameId}`);
            }
          } catch {
            // Non-JSON payload — the invalidate above still ran.
          }
        });
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [isAuthenticated, queryClient, navigate]);
}
