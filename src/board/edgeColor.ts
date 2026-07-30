// Continuous color scale for a move's net edge (win% − loss%), used by both the
// Suggested Moves diverging bars and the on-board arrows so they stay in sync.
//
//   most negative edge → warm     (worst for the side to move)
//   ~0 (even)          → neutral
//   most positive edge → moss     (best for the side to move)
//
// Anchors come from EDGE_SCALE in theme/tokens.ts — see there for why the
// midpoint is neutral rather than the yellow this used to interpolate through,
// and why the poles are lightness/chroma-matched rather than the raw
// COLOR_ERROR / COLOR_SUCCESS tokens.

import { EDGE_SCALE } from "../theme/tokens";

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

const BAD = toRgb(EDGE_SCALE.bad);
const MID = toRgb(EDGE_SCALE.mid);
const GOOD = toRgb(EDGE_SCALE.good);

/**
 * Map a net edge to an `rgb(...)` color on the bad→neutral→good scale. `max` is
 * the edge magnitude (in percentage points) at which the color saturates; edges
 * beyond ±max clamp to the poles.
 */
export function edgeColor(edge: number, max = 25): string {
  const t = Math.max(0, Math.min(1, (edge + max) / (2 * max))); // 0 = worst, 0.5 = even, 1 = best
  const [from, to, local] = t <= 0.5 ? [BAD, MID, t / 0.5] : [MID, GOOD, (t - 0.5) / 0.5];
  const mix = (i: number) => Math.round(from[i] + (to[i] - from[i]) * local);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}
