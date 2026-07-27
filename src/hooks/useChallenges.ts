import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptChallenge,
  cancelChallenge,
  createChallenge,
  declineChallenge,
  getIncomingChallenges,
  getOutgoingChallenges,
  type ChallengeResponse,
  type CreateChallengeRequest,
} from '../api/challenges'

export const challengeKeys = {
  all: ['challenges'] as const,
  incoming: () => [...challengeKeys.all, 'incoming'] as const,
  outgoing: () => [...challengeKeys.all, 'outgoing'] as const,
}

// Pending challenges are delivered live over WebSocket (and reconciled on
// reconnect); the interval is a fallback. It must stay below the server's
// challenge TTL (45s) so a challenge missed by a live push is still picked up
// while it's pending, rather than lapsing unseen between polls.
const CHALLENGE_POLL_MS = 30_000

export function useIncomingChallenges() {
  return useQuery({
    queryKey: challengeKeys.incoming(),
    queryFn: getIncomingChallenges,
    refetchInterval: CHALLENGE_POLL_MS,
  })
}

export function useOutgoingChallenges() {
  return useQuery({
    queryKey: challengeKeys.outgoing(),
    queryFn: getOutgoingChallenges,
    refetchInterval: CHALLENGE_POLL_MS,
  })
}

function useInvalidateChallenges() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: challengeKeys.all })
}

export function useCreateChallenge() {
  const invalidate = useInvalidateChallenges()
  return useMutation<ChallengeResponse, Error, CreateChallengeRequest>({
    mutationFn: createChallenge,
    onSuccess: invalidate,
  })
}

export function useAcceptChallenge() {
  const invalidate = useInvalidateChallenges()
  return useMutation<ChallengeResponse, Error, number>({
    mutationFn: acceptChallenge,
    onSuccess: invalidate,
  })
}

export function useDeclineChallenge() {
  const invalidate = useInvalidateChallenges()
  return useMutation<ChallengeResponse, Error, number>({
    mutationFn: declineChallenge,
    onSuccess: invalidate,
  })
}

export function useCancelChallenge() {
  const invalidate = useInvalidateChallenges()
  return useMutation<ChallengeResponse, Error, number>({
    mutationFn: cancelChallenge,
    onSuccess: invalidate,
  })
}
