import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentPlayer, type LoginResponse, type PlayerResponse } from "../api/auth";
import { clearAuthToken, getAuthToken, setAuthToken } from "./session";

interface AuthContextValue {
  /** The authenticated player, or null when signed out. */
  player: PlayerResponse | null;
  isAuthenticated: boolean;
  /** True while the initial session-restore request is in flight. */
  loading: boolean;
  /** Record a successful /api/login result (persist token + set player). */
  onLoginSuccess: (result: LoginResponse) => void;
  /** Replace the cached player (e.g. after a profile update). */
  setPlayer: (player: PlayerResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // On first load, restore the session from a stored token by fetching the
  // current player. A failure means the token is missing/expired — clear it.
  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCurrentPlayer()
      .then((p) => {
        if (!cancelled) setPlayer(p);
      })
      .catch(() => {
        clearAuthToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onLoginSuccess(result: LoginResponse) {
    // Drop any cached queries before establishing the new identity, so a fresh
    // login never shows data left over from a previous session.
    queryClient.clear();
    setAuthToken(result.token);
    setPlayer(result.player);
  }

  function logout() {
    clearAuthToken();
    setPlayer(null);
    // Purge all cached server data (notifications, friends, requests, ratings,
    // …) so the next user can't see the previous user's cached responses.
    queryClient.clear();
  }

  return (
    <AuthContext.Provider
      value={{ player, isAuthenticated: player !== null, loading, onLoginSuccess, setPlayer, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
