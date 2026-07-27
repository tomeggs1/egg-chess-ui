import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { playSound, type SoundType } from "./sounds";

const STORAGE_KEY = "soundEnabled";

interface SoundContextValue {
  /** Whether board sounds are enabled. */
  enabled: boolean;
  setEnabled: (on: boolean) => void;
  /** Play a board sound; a no-op while sounds are disabled. */
  play: (sound: SoundType) => void;
}

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

function resolveInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored != null) return stored === "true";
  } catch {
    // localStorage unavailable — fall through to default.
  }
  return true; // sounds on by default
}

/**
 * Provides board-sound settings app-wide. Persists to localStorage today; swap
 * the storage calls here to sync to the user profile later without touching
 * consumers. Mirrors BoardThemeContext.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState<boolean>(resolveInitial);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      localStorage.setItem(STORAGE_KEY, String(on));
    } catch {
      // Ignore persistence failures; the in-memory choice still applies.
    }
    // Give immediate feedback when turning sound on.
    if (on) playSound("move");
  }, []);

  const play = useCallback(
    (sound: SoundType) => {
      if (enabled) playSound(sound);
    },
    [enabled],
  );

  const value = useMemo<SoundContextValue>(() => ({ enabled, setEnabled, play }), [enabled, setEnabled, play]);

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundContextValue {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return ctx;
}
