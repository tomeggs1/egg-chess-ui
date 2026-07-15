// Persistent storage for the JWT returned by /api/login. Kept framework-free
// (no React) so the API client can read the token without importing UI code.
import { APP_NAME } from "../constants";

const AUTH_TOKEN_KEY = APP_NAME + ":authToken";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    // Storage can be unavailable (e.g. private mode); treat as no session.
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage failures — the session token just won't persist.
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage failures.
  }
}
