import { api } from './client'
import type { PlayerSummary } from './friends'

export type ColorPreference = 'WHITE' | 'BLACK' | 'RANDOM'
export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED' | 'EXPIRED'

// Mirrors ChallengeResponse on the service.
export interface ChallengeResponse {
  id: number
  status: ChallengeStatus
  challenger: PlayerSummary
  challengee: PlayerSummary
  gameDefinitionId: string
  initialSeconds: number | null
  incrementSeconds: number
  colorPreference: ColorPreference
  rated: boolean
  gameId: number | null
  expiresAt: string
  createdAt: string
}

// Mirrors CreateChallengeRequest on the service.
export interface CreateChallengeRequest {
  username: string
  gameDefinitionId: string
  // Omit for an unlimited clock.
  initialSeconds?: number
  incrementSeconds: number
  colorPreference: ColorPreference
  rated: boolean
}

// POST /api/challenges — issue a challenge to a friend.
export function createChallenge(request: CreateChallengeRequest): Promise<ChallengeResponse> {
  return api.post<ChallengeResponse>('/api/challenges', request)
}

// POST /api/challenges/{id}/accept — accept a pending challenge (challengee).
export function acceptChallenge(id: number): Promise<ChallengeResponse> {
  return api.post<ChallengeResponse>(`/api/challenges/${id}/accept`)
}

// POST /api/challenges/{id}/decline — decline a pending challenge (challengee).
export function declineChallenge(id: number): Promise<ChallengeResponse> {
  return api.post<ChallengeResponse>(`/api/challenges/${id}/decline`)
}

// POST /api/challenges/{id}/cancel — cancel a pending challenge (challenger).
export function cancelChallenge(id: number): Promise<ChallengeResponse> {
  return api.post<ChallengeResponse>(`/api/challenges/${id}/cancel`)
}

// GET /api/challenges/incoming — pending challenges received.
export function getIncomingChallenges(): Promise<ChallengeResponse[]> {
  return api.get<ChallengeResponse[]>('/api/challenges/incoming')
}

// GET /api/challenges/outgoing — pending challenges sent.
export function getOutgoingChallenges(): Promise<ChallengeResponse[]> {
  return api.get<ChallengeResponse[]>('/api/challenges/outgoing')
}
