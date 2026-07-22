import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AVAILABLE_THEMES } from "../data/pieceAssets";
import { DEFAULT_THEME_ID, type PieceTheme } from "../data/pieceThemes";

const STORAGE_KEY = "pieceThemeId";

interface PieceThemeContextValue {
  /** The active theme (always one of `themes`). */
  theme: PieceTheme;
  /** Themes offered to the user (only complete sets). */
  themes: PieceTheme[];
  /** Select a theme by id; persists the choice. */
  setThemeId: (id: string) => void;
}

const PieceThemeContext = createContext<PieceThemeContextValue | undefined>(undefined);

function resolveInitialId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE_THEMES.some((t) => t.id === stored)) return stored;
  } catch {
    // localStorage unavailable (SSR/private mode) — fall through to default.
  }
  return DEFAULT_THEME_ID;
}

/**
 * Provides the selected piece theme app-wide. The choice is persisted to
 * localStorage today; swap the storage calls here to sync it to the user
 * profile later without touching consumers.
 */
export function PieceThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(resolveInitialId);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore persistence failures; the in-memory choice still applies.
    }
  }, []);

  const theme = useMemo(
    () => AVAILABLE_THEMES.find((t) => t.id === themeId) ?? AVAILABLE_THEMES[0],
    [themeId],
  );

  const value = useMemo<PieceThemeContextValue>(
    () => ({ theme, themes: AVAILABLE_THEMES, setThemeId }),
    [theme, setThemeId],
  );

  return <PieceThemeContext.Provider value={value}>{children}</PieceThemeContext.Provider>;
}

export function usePieceTheme(): PieceThemeContextValue {
  const ctx = useContext(PieceThemeContext);
  if (!ctx) {
    throw new Error("usePieceTheme must be used within a PieceThemeProvider");
  }
  return ctx;
}
