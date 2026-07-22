// Continuous color scale for a move's net edge (win% − loss%), used by both the
// Suggested Moves diverging bars and the on-board arrows so they stay in sync.
//
//   most negative edge → red      (worst for the side to move)
//   ~0 (even)          → yellow
//   most positive edge → green    (best for the side to move)
//
// Anchors match the app palette (COLOR_ERROR / COLOR_SUCCESS) with a yellow mid.

const RED: [number, number, number] = [239, 68, 68]; // #ef4444
const YELLOW: [number, number, number] = [250, 204, 21]; // #facc15
const GREEN: [number, number, number] = [34, 197, 94]; // #22c55e

/**
 * Map a net edge to an `rgb(...)` color on the red→yellow→green scale. `max` is
 * the edge magnitude (in percentage points) at which the color saturates; edges
 * beyond ±max clamp to pure red/green.
 */
export function edgeColor(edge: number, max = 25): string {
  const t = Math.max(0, Math.min(1, (edge + max) / (2 * max))); // 0 = worst, 0.5 = even, 1 = best
  const [from, to, local] = t <= 0.5 ? [RED, YELLOW, t / 0.5] : [YELLOW, GREEN, (t - 0.5) / 0.5];
  const mix = (i: number) => Math.round(from[i] + (to[i] - from[i]) * local);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}
