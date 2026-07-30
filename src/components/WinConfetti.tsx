import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import confetti from "canvas-confetti";
import { ACCENT_AMBER, ACCENT_PRIMARY, ACCENT_GREEN, ACCENT_DECOR } from "../constants";

// Brand accents (plus white) so the celebration matches the app's palette.
const COLORS = [ACCENT_PRIMARY, ACCENT_DECOR, ACCENT_GREEN, ACCENT_AMBER, "#ffffff"];

/**
 * A one-shot confetti burst, fired when `celebrate` turns true (a live win).
 * Renders a canvas that fills its relatively-positioned parent (so the burst is
 * contained to the board), is non-interactive, and is skipped entirely when the
 * user prefers reduced motion. Caller only flips `celebrate` on the live
 * active→over transition, so opening an already-won game doesn't re-celebrate.
 */
export function WinConfetti({ celebrate }: { celebrate: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!celebrate) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Scope confetti to our own canvas (not a full-screen one on the body).
    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    const base = { colors: COLORS, startVelocity: 42, ticks: 200, disableForReducedMotion: true };
    // A party-popper up from the bottom center, plus two angled side bursts.
    void fire({ ...base, particleCount: 90, spread: 75, origin: { x: 0.5, y: 1 } });
    void fire({ ...base, particleCount: 50, spread: 100, angle: 60, origin: { x: 0, y: 1 } });
    void fire({ ...base, particleCount: 50, spread: 100, angle: 120, origin: { x: 1, y: 1 } });

    return () => {
      void fire.reset();
    };
  }, [celebrate]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-hidden
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}
    />
  );
}
