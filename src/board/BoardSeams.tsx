// Procedural dark, jagged seam overlay drawn between the tiles, so the grass↔sand
// boundaries read as an organic sunken crease instead of straight lines. Pure SVG
// (no assets), deterministic (no flicker). Sits above the tiles, below the pieces.
//
// ── DIALS ─────────────────────────────────────────────────────────────────────
// Units are on an 800×800 viewBox (100 units = one square).
const SEGMENTS = 300; // points per seam line — more = finer, tighter waves
const ROUGHNESS = 1; // sideways wobble amplitude — bigger = more jagged/wavy
const BAND_WIDTH = 2; // thickness of the soft dark band (the "crease")
const CORE_RATIO = 0.8; // crisp core line width as a fraction of BAND_WIDTH
const SHADOW_BLUR = 2; // softness of the band's shadow
const OPACITY_BAND = 0.2; // soft band opacity
const OPACITY_CORE = 0.5; // crisp core opacity
const SEAM_COLOR = "#241c12"; // brownish near-black crease color
// ──────────────────────────────────────────────────────────────────────────────

const SIZE = 800;
const STEP = SIZE / SEGMENTS;

// Deterministic signed wobble for a point on a seam line.
function wobble(lineId: number, k: number): number {
  const s = Math.sin(lineId * 127.1 + k * 311.7) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 2 * ROUGHNESS;
}

// Smooth a point list into a path via Catmull-Rom → cubic béziers.
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Build the 7 vertical + 7 horizontal internal-seam paths (endpoints pinned). */
function seamPaths(): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const x0 = i * 100;
    const pts = Array.from({ length: SEGMENTS + 1 }, (_, k) => ({
      x: x0 + (k === 0 || k === SEGMENTS ? 0 : wobble(i, k)),
      y: k * STEP,
    }));
    paths.push(smoothPath(pts));
  }
  for (let j = 1; j <= 7; j++) {
    const y0 = j * 100;
    const pts = Array.from({ length: SEGMENTS + 1 }, (_, k) => ({
      x: k * STEP,
      y: y0 + (k === 0 || k === SEGMENTS ? 0 : wobble(100 + j, k)),
    }));
    paths.push(smoothPath(pts));
  }
  return paths;
}

/** Dark jagged crease along every internal tile seam. */
export function BoardSeams() {
  const paths = seamPaths();
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <defs>
        <filter id="seam-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={SHADOW_BLUR} />
        </filter>
      </defs>
      <g stroke={SEAM_COLOR} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* soft shadow band */}
        <g filter="url(#seam-blur)" opacity={OPACITY_BAND} strokeWidth={BAND_WIDTH}>
          {paths.map((d, i) => (
            <path key={`b${i}`} d={d} />
          ))}
        </g>
        {/* crisp core line */}
        <g opacity={OPACITY_CORE} strokeWidth={BAND_WIDTH * CORE_RATIO}>
          {paths.map((d, i) => (
            <path key={`c${i}`} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
