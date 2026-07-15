import { api } from './client'

export interface LoginRequest {
  username: string
  password: string
}

// Mirrors LoginResponse on the service: a JWT plus the authenticated player.
export interface LoginResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  player: PlayerResponse
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
  // Optional preset avatar key (see data/avatars.ts); must be one the service
  // knows. Omitted means no avatar chosen at signup.
  avatarKey?: string
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
  // Chosen preset avatar key, or null/absent for the default (initials).
  avatarKey?: string | null
  createdAt: string
}

export function register(player: RegisterRequest): Promise<PlayerResponse> {
  return api.post<PlayerResponse>('/api/players', player)
}

// Returns the currently authenticated player. Requires a valid token to be
// attached by the API client; the service responds 401 otherwise.
export function getCurrentPlayer(): Promise<PlayerResponse> {
  return api.get<PlayerResponse>('/api/players/me')
}

// Mirrors UpdatePlayerRequest on the service. All fields optional (partial
// update); `currentPassword` is required by the service only when `password`
// is provided.
export interface UpdatePlayerRequest {
  email?: string
  firstName?: string
  lastName?: string
  country?: string
  password?: string
  currentPassword?: string
}

// Updates the authenticated player's own profile.
export function updateCurrentPlayer(update: UpdatePlayerRequest): Promise<PlayerResponse> {
  return api.patch<PlayerResponse>('/api/players/me', update)
}

// Sets (or clears) the authenticated player's avatar. Pass a preset key, or
// null to reset to the default. Returns the updated player.
export function setAvatar(avatarKey: string | null): Promise<PlayerResponse> {
  return api.put<PlayerResponse>('/api/players/me/avatar', { avatarKey })
}
