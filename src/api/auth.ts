import { api } from './client'

export interface LoginRequest {
  username: string
  password: string
}

// Shape is intentionally loose for the skeleton — refine once the
// service response contract is finalized.
export interface LoginResponse {
  token?: string
  [key: string]: unknown
}

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/login', credentials)
}

// Mirrors RegisterPlayerRequest on the service. username and password are
// required; the rest are optional. email, when present, must be valid.
export interface RegisterRequest {
  username: string
  password: string
  email?: string
  firstName?: string
  lastName?: string
  country?: string
}

// Mirrors PlayerResponse on the service (password hash deliberately excluded).
export interface PlayerResponse {
  id: number
  username: string
  rating: number
  email?: string
  firstName?: string
  lastName?: string
  country?: string
  createdAt: string
}

export function register(player: RegisterRequest): Promise<PlayerResponse> {
  return api.post<PlayerResponse>('/api/players', player)
}
