import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "../auth/session";
import { resolveWsUrl } from "../api/ws";
import { gameKeys } from "./useGame";
import type { GameState } from "../api/games";

/**
 * Subscribes to a game's broadcast topic ({@code /topic/game/{id}}) for the
 * lifetime of the page and reflects each pushed state into the query cache, so
 * both players see moves in real time. Reconciles via a refetch on (re)connect,
 * since the broker doesn't replay missed messages.
 */
export function useGameChannel(gameId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;
    const token = getAuthToken();
    if (!token) return;

    const client = new Client({
      brokerURL: resolveWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        queryClient.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
        client.subscribe(`/topic/game/${gameId}`, (message) => {
          try {
            queryClient.setQueryData<GameState>(gameKeys.detail(gameId), JSON.parse(message.body));
          } catch {
            // Ignore malformed payloads; the reconnect refetch is the safety net.
          }
        });
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [gameId, queryClient]);
}
