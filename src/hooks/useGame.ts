import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptDraw,
  claimTimeout,
  declineDraw,
  getGame,
  offerDraw,
  resignGame,
  submitMove,
  type GameState,
  type SubmitMove,
} from "../api/games";

export const gameKeys = {
  all: ["game"] as const,
  detail: (id: string) => [...gameKeys.all, id] as const,
};

/** Live game state; kept fresh by the STOMP subscription (see useGameChannel). */
export function useGame(id: string) {
  return useQuery({
    queryKey: gameKeys.detail(id),
    queryFn: () => getGame(id),
    enabled: !!id,
  });
}

export function useSubmitMove(id: string) {
  const queryClient = useQueryClient();
  return useMutation<GameState, Error, SubmitMove>({
    mutationFn: (move) => submitMove(id, move),
    onSuccess: (state) => queryClient.setQueryData(gameKeys.detail(id), state),
    // A rejected move (illegal / not your turn / stale) means our view drifted —
    // resync from the server.
    onError: () => queryClient.invalidateQueries({ queryKey: gameKeys.detail(id) }),
  });
}

export function useResign(id: string) {
  const queryClient = useQueryClient();
  return useMutation<GameState, Error, void>({
    mutationFn: () => resignGame(id),
    onSuccess: (state) => queryClient.setQueryData(gameKeys.detail(id), state),
  });
}

export function useClaimTimeout(id: string) {
  const queryClient = useQueryClient();
  return useMutation<GameState, Error, void>({
    mutationFn: () => claimTimeout(id),
    onSuccess: (state) => queryClient.setQueryData(gameKeys.detail(id), state),
  });
}

/** Draw offer / response mutations (offer, accept, decline share this shape). */
function useDrawMutation(id: string, action: (id: string) => Promise<GameState>) {
  const queryClient = useQueryClient();
  return useMutation<GameState, Error, void>({
    mutationFn: () => action(id),
    onSuccess: (state) => queryClient.setQueryData(gameKeys.detail(id), state),
  });
}

export const useOfferDraw = (id: string) => useDrawMutation(id, offerDraw);
export const useAcceptDraw = (id: string) => useDrawMutation(id, acceptDraw);
export const useDeclineDraw = (id: string) => useDrawMutation(id, declineDraw);
