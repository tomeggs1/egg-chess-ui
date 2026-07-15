// Thin wrapper around fetch for talking to the egg-chess-service.
//
// In development, requests to "/api/*" are proxied to the service
// (see vite.config.ts). In production, set VITE_API_BASE_URL to point
// at the deployed service.

import { getAuthToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // The human-readable message from the service's error body, when one was
    // provided. Distinct from `message` (which always has a fallback) so
    // callers can tell "the service explained why" from a generic failure.
    public readonly detail?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Pulls a human-readable message out of the service's error response. Spring's
// default error body looks like { status, error, message, errors: [...] };
// validation failures put per-field detail in `errors`. Returns undefined when
// nothing useful is present so the caller can fall back to a generic message.
function extractErrorDetail(body: string): string | undefined {
  if (!body) return undefined
  try {
    const parsed = JSON.parse(body) as {
      message?: string
      errors?: Array<{ defaultMessage?: string }>
    }
    const fieldErrors = parsed.errors
      ?.map((e) => e.defaultMessage)
      .filter((m): m is string => Boolean(m))
    if (fieldErrors && fieldErrors.length > 0) {
      return fieldErrors.join(' ')
    }
    if (parsed.message) return parsed.message
  } catch {
    // Body wasn't JSON; ignore and let the caller use its fallback.
  }
  return undefined
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // Attach the session token so authenticated endpoints (e.g. /api/players/me)
      // see the logged-in player.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const detail = extractErrorDetail(await response.text().catch(() => ''))
    throw new ApiError(response.status, detail ?? `Request to ${path} failed`, detail)
  }

  // Some endpoints (e.g. health) may return no body.
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
