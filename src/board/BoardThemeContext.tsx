import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AVAILABLE_BOARD_THEMES } from "../data/boardAssets";
import { DEFAULT_BOARD_THEME_ID, type BoardTheme } from "../data/boardThemes";

const STORAGE_KEY = "boardThemeId";

interface BoardThemeContextValue {
  theme: BoardTheme;
  themes: BoardTheme[];
  setThemeId: (id: string) => void;
}

const BoardThemeContext = createContext<BoardThemeContextValue | undefined>(undefined);

function resolveInitialId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && AVAILABLE_BOARD_THEMES.some((t) => t.id === stored)) return stored;
  } catch {
    // localStorage unavailable — fall through to default.
  }
  return DEFAULT_BOARD_THEME_ID;
}

/**
 * Provides the selected board (square) theme app-wide. Persists to localStorage
 * today; swap the storage calls here to sync to the user profile later without
 * touching consumers. Mirrors PieceThemeContext.
 */
export function BoardThemeProvider({ children }: { children: ReactNode }) {
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
    () => AVAILABLE_BOARD_THEMES.find((t) => t.id === themeId) ?? AVAILABLE_BOARD_THEMES[0],
    [themeId],
  );

  const value = useMemo<BoardThemeContextValue>(
    () => ({ theme, themes: AVAILABLE_BOARD_THEMES, setThemeId }),
    [theme, setThemeId],
  );

  return <BoardThemeContext.Provider value={value}>{children}</BoardThemeContext.Provider>;
}

export function useBoardTheme(): BoardThemeContextValue {
  const ctx = useContext(BoardThemeContext);
  if (!ctx) {
    throw new Error("useBoardTheme must be used within a BoardThemeProvider");
  }
  return ctx;
}
