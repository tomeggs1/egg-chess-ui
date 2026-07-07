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
