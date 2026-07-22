import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { GameDefinition } from "./types";
import { fetchGameDefinitions, fetchPieceDefinitions } from "../api/definitions";
import { buildCatalog } from "./catalog";

interface GameCatalogValue {
  /** Playable game definitions, mapped from the server catalog. */
  definitions: GameDefinition[];
  loading: boolean;
  error: boolean;
}

const GameCatalogContext = createContext<GameCatalogValue>({ definitions: [], loading: true, error: false });

/**
 * Loads the built-in piece + game definition catalog from the API once and
 * exposes it (mapped to the frontend GameDefinition shape) to the whole app.
 */
export function GameCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameCatalogValue>({ definitions: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPieceDefinitions(), fetchGameDefinitions()])
      .then(([pieces, games]) => {
        if (cancelled) return;
        setState({ definitions: buildCatalog(pieces, games), loading: false, error: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ definitions: [], loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <GameCatalogContext.Provider value={state}>{children}</GameCatalogContext.Provider>;
}

/** The loaded game catalog (definitions, loading, error). */
export function useGameCatalog(): GameCatalogValue {
  return useContext(GameCatalogContext);
}
