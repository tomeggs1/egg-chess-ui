import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import { useMemo } from "react";
import { usePieceTheme } from "../pieces/PieceThemeContext";
import { pieceSrc } from "../data/pieceAssets";
import { pieceHeightRatio, type PieceColor } from "../data/pieceThemes";
import { parsePlacement, STANDARD_START, type PlacedPiece } from "./fen";
import { useBoardTheme } from "./BoardThemeContext";
import { BoardDecals } from "./BoardDecals";
import { BoardSeams } from "./BoardSeams";
import { boardTileSrc, boardVariantCount, boardDecals } from "../data/boardAssets";
import { tileVariant, tileRotation } from "../data/boardThemes";
import type { MoveTarget } from "./moves";
import { ACCENT_PURPLE, COLOR_ERROR_TRANSPARENT, MAIN_BLUE } from "../constants";

/** An arrow drawn from one square to another (e.g. a suggested move). */
export interface BoardArrow {
  from: { file: number; rank: number };
  to: { file: number; rank: number };
  /** Stroke/fill color (edge color: green favors mover, red against). */
  color: string;
  /** 1-based rank, shown as a badge at the arrowhead. */
  rank: number;
}

interface BoardProps {
  /** FEN placement field (or full FEN). Defaults to the standard start. */
  position?: string;
  /** Which side is at the bottom. */
  orientation?: PieceColor;
  /** Show file/rank labels along the edges. */
  showCoordinates?: boolean;
  /** Max size of a single square in px (board caps at 8×). Squares shrink below this on narrow screens. */
  maxSquareSize?: number;
  /** The currently selected square (highlighted), or null. */
  selectedSquare?: { file: number; rank: number } | null;
  /** The king square to flag as in check, or null. */
  checkSquare?: { file: number; rank: number } | null;
  /** A move to preview (from/to squares outlined), or null. Used for suggestions. */
  hintMove?: { from: { file: number; rank: number }; to: { file: number; rank: number } } | null;
  /** Suggestion arrows to draw over the board (top explorer moves). */
  arrows?: BoardArrow[];
  /** Squares to mark as available moves/captures for the selection. */
  moveTargets?: MoveTarget[];
  /** Called with the clicked square. Presence makes squares interactive. */
  onSquareClick?: (file: number, rank: number) => void;
  /** Pieces with stable ids — enables smooth square-to-square animation. Falls
   *  back to parsing `position` (no animation) when omitted. */
  pieces?: PlacedPiece[];
}

// Pulsing red glow at the base of a king in check.
const checkPulse = keyframes`
  0%, 100% { opacity: 0.35; transform: translateX(-50%) scale(0.85); }
  50% { opacity: 0.9; transform: translateX(-50%) scale(1.1); }
`;

const LIGHT_SQUARE = "#ebecd0";
const DARK_SQUARE = "#779556";
// Soft diagonal sheen per square: a hair lighter at the top-left, darker at the
// bottom-right, so the board reads as a subtly lit surface rather than flat fills.
const LIGHT_SQUARE_BG = "linear-gradient(135deg, #f3f4e2 0%, #e6e7ca 55%, #dcddbc 100%)";
const DARK_SQUARE_BG = "linear-gradient(135deg, #85a267 0%, #6f8f50 55%, #637f46 100%)";
// Faint procedural grain (SVG turbulence, no asset file) for a bit of material.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const FILE_LETTERS = "abcdefgh";
// King fills this share of a square's height; other pieces scale down from it.
const KING_HEIGHT_PCT = 94;
// Neutral carved-stone frame: a raised gray surround that reads as a physical
// board edge without a color that fights any theme (grass/sand, slate, green).
const FRAME_PAD = 16; // px of stone border around the playfield
// Diagonal bevel: lit gray at the top-left → darker gray at the bottom-right.
const STONE_FRAME_BG = "linear-gradient(150deg, #767a80 0%, #565a60 52%, #43464b 100%)";
const FRAME_SHADOW = [
  "inset 0 2px 1px rgba(255,255,255,0.18)", // top inner bevel highlight
  "inset 0 -5px 9px rgba(0,0,0,0.5)", // bottom inner shadow (raised look)
  "0 0 0 1px rgba(0,0,0,0.55)", // crisp outer edge so it reads on a dark page
  "0 16px 34px rgba(0,0,0,0.5)", // grounding drop shadow
].join(", ");
const GRID_RING = [
  "0 0 0 3px #3b3e43", // dark stone trim ring
  "0 0 0 4px rgba(0,0,0,0.5)", // thin dark line just outside the trim
  "inset 0 0 0 2px rgba(0,0,0,0.28)", // inner edge for the squares
].join(", ");

/**
 * A read-only, presentational chess board. Given a position and orientation it
 * renders an 8×8 grid and the pieces (using the active piece theme). It knows
 * nothing about turns, move legality, or where the position came from —
 * interaction and rules layer on top of this later.
 */
export function Board({
  position = STANDARD_START,
  orientation = "white",
  showCoordinates = true,
  maxSquareSize = 80,
  selectedSquare = null,
  checkSquare = null,
  hintMove = null,
  arrows = [],
  moveTargets,
  onSquareClick,
  pieces,
}: BoardProps) {
  const { theme } = usePieceTheme();
  const { theme: boardTheme } = useBoardTheme();
  const boardVariants = boardVariantCount(boardTheme);
  const decals = boardDecals(boardTheme);

  const targetKind = useMemo(() => {
    const map = new Map<string, MoveTarget["kind"]>();
    for (const t of moveTargets ?? []) map.set(`${t.file},${t.rank}`, t.kind);
    return map;
  }, [moveTargets]);

  const occupant = useMemo(() => {
    const map = new Map<string, ReturnType<typeof parsePlacement>[number]>();
    for (const piece of parsePlacement(position)) map.set(`${piece.file},${piece.rank}`, piece);
    return map;
  }, [position]);

  // Prefer the id-carrying pieces (animated); fall back to the parsed position.
  const pieceList: PlacedPiece[] = pieces ?? Array.from(occupant.values());

  // Top→bottom rows and left→right columns depend on orientation.
  const ranks = orientation === "white" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const bottomRank = ranks[7];
  const firstFile = files[0];

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: maxSquareSize * 8 + FRAME_PAD * 2,
        p: `${FRAME_PAD}px`,
        borderRadius: "16px",
        background: STONE_FRAME_BG,
        boxShadow: FRAME_SHADOW,
        userSelect: "none",
        // Faint wood grain on the frame (reuses the square-grain SVG).
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: "16px",
          backgroundImage: NOISE,
          backgroundSize: "160px 160px",
          opacity: 0.1,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow: GRID_RING,
        }}
      >
        {/* Layer 1 — tiles + coordinate labels */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
          }}
        >
          {ranks.map((rank) =>
            files.map((file) => {
              // a1 (file 0, rank 0) is a dark square.
              const isLight = (file + rank) % 2 === 1;
              // Image board theme: a randomized tile variant; otherwise CSS gradient.
              const tile = boardTileSrc(
                boardTheme,
                isLight ? "white" : "black",
                tileVariant(file, rank, boardVariants),
              );
              const rotation = tile ? tileRotation(file, rank) : 0;
              const isSelected = selectedSquare?.file === file && selectedSquare?.rank === rank;
              const isCheck = checkSquare?.file === file && checkSquare?.rank === rank;
              const isHint =
                (hintMove?.from.file === file && hintMove?.from.rank === rank) ||
                (hintMove?.to.file === file && hintMove?.to.rank === rank);
              const kind = targetKind.get(`${file},${rank}`);
              return (
                <Box
                  key={`${file},${rank}`}
                  onClick={onSquareClick ? () => onSquareClick(file, rank) : undefined}
                  sx={{
                    position: "relative",
                    cursor: onSquareClick ? "pointer" : "default",
                    // Solid color is always the fallback (also the Classic look base).
                    backgroundColor: isLight ? LIGHT_SQUARE : DARK_SQUARE,
                    // Classic gradient only; image tiles render as a rotated child layer below.
                    backgroundImage: tile ? undefined : isLight ? LIGHT_SQUARE_BG : DARK_SQUARE_BG,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                    minWidth: 0,
                    minHeight: 0,
                    // Lift the selected cell so its oversized highlight isn't clipped by neighbors.
                    zIndex: isSelected ? 2 : undefined,
                    // Faint grain overlay for the CSS Classic theme only.
                    ...(tile
                      ? {}
                      : {
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            inset: 0,
                            backgroundImage: NOISE,
                            backgroundSize: "120px 120px",
                            opacity: isLight ? 0.05 : 0.08,
                            mixBlendMode: "overlay",
                            pointerEvents: "none",
                          },
                        }),
                  }}
                >
                  {tile && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${tile})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        // Square tile in a square cell → 90/270° still fills it exactly.
                        transform: `rotate(${rotation}deg)`,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {showCoordinates && file === firstFile && (
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        top: 2,
                        left: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        lineHeight: 1,
                        // Light text with a dark outline — legible over any tile/theme.
                        color: "#f4f4ef",
                        textShadow:
                          "-1px -1px 0 rgba(0,0,0,0.75), 1px -1px 0 rgba(0,0,0,0.75), -1px 1px 0 rgba(0,0,0,0.75), 1px 1px 0 rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6)",
                        zIndex: 2,
                      }}
                    >
                      {rank + 1}
                    </Box>
                  )}
                  {showCoordinates && rank === bottomRank && (
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        bottom: 2,
                        right: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        lineHeight: 1,
                        // Light text with a dark outline — legible over any tile/theme.
                        color: "#f4f4ef",
                        textShadow:
                          "-1px -1px 0 rgba(0,0,0,0.75), 1px -1px 0 rgba(0,0,0,0.75), -1px 1px 0 rgba(0,0,0,0.75), 1px 1px 0 rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6)",
                        zIndex: 2,
                      }}
                    >
                      {FILE_LETTERS[file]}
                    </Box>
                  )}
                  {isCheck && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(239,68,68,0.32)",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />
                  )}
                  {isCheck && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        left: "50%",
                        bottom: "4%",
                        width: "80%",
                        height: "42%",
                        transform: "translateX(-50%)",
                        borderRadius: "50%",
                        background:
                          "radial-gradient(ellipse at center, rgba(239,68,68,0.9) 0%, rgba(239,68,68,0.45) 40%, rgba(239,68,68,0) 72%)",
                        filter: "blur(1px)",
                        pointerEvents: "none",
                        zIndex: 1,
                        animation: `${checkPulse} 1.3s ease-in-out infinite`,
                      }}
                    />
                  )}
                  {isSelected && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        // Extend past the cell so the highlight covers the tile edge/seam.
                        inset: "-3px",
                        backgroundColor: "rgba(77,141,255,0.30)",
                        boxShadow: `inset 0 0 0 3px ${MAIN_BLUE}`,
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />
                  )}
                  {isHint && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(168,85,247,0.22)",
                        boxShadow: `inset 0 0 0 3px ${ACCENT_PURPLE}`,
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />
                  )}
                  {kind === "move" && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "26%",
                        height: "26%",
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        // Dual-tone: pale core reads on dark tiles, dark ring/shadow on light tiles.
                        backgroundColor: "#143d9589",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.5)",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />
                  )}
                  {kind === "capture" && (
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        inset: "7%",
                        pointerEvents: "none",
                        zIndex: 1,
                        // Dark outline so the red reticle reads on any tile.
                        filter: "drop-shadow(0 0 1.5px rgba(0,0,0,0.85))",
                      }}
                    >
                      {[
                        {
                          top: 0,
                          left: 0,
                          borderTop: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderLeft: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderTopLeftRadius: "3px",
                        },
                        {
                          top: 0,
                          right: 0,
                          borderTop: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderRight: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderTopRightRadius: "3px",
                        },
                        {
                          bottom: 0,
                          left: 0,
                          borderBottom: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderLeft: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderBottomLeftRadius: "3px",
                        },
                        {
                          bottom: 0,
                          right: 0,
                          borderBottom: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderRight: `3px solid ${COLOR_ERROR_TRANSPARENT}`,
                          borderBottomRightRadius: "3px",
                        },
                      ].map((corner, i) => (
                        <Box key={i} sx={{ position: "absolute", width: "30%", height: "30%", ...corner }} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            }),
          )}
        </Box>

        {/* Layer 2 — organic seams (dark crease) then decals, above tiles/below pieces */}
        {boardTheme.seams && <BoardSeams />}
        {decals.length > 0 && <BoardDecals decals={decals} />}

        {/* Layer 3 — pieces (above the selection highlight, which can lift a cell to z-index 2).
            Each piece is an absolutely-positioned slot keyed by its stable id, so moving a piece
            just changes its left/top and CSS transitions it across the board. */}
        <Box sx={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
          {pieceList.map((piece) => {
            // Board coords → screen slot (depends on orientation).
            const screenCol = orientation === "white" ? piece.file : 7 - piece.file;
            const screenRow = orientation === "white" ? 7 - piece.rank : piece.rank;
            return (
              <Box
                key={piece.id ?? `${piece.file},${piece.rank}`}
                sx={{
                  position: "absolute",
                  left: `${screenCol * 12.5}%`,
                  top: `${screenRow * 12.5}%`,
                  width: "12.5%",
                  height: "12.5%",
                  transition: "left 0.4s ease, top 0.4s ease",
                }}
              >
                <Box
                  component="img"
                  src={pieceSrc(theme, piece.color, piece.type)}
                  alt={`${piece.color} ${piece.type}`}
                  draggable={false}
                  sx={{
                    position: "absolute",
                    bottom: "10%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: `${(pieceHeightRatio(theme, piece.type) * KING_HEIGHT_PCT).toFixed(1)}%`,
                    width: "auto",
                    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.55))",
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Suggestion arrows — below the pieces (zIndex 2) so pieces sit on top.
            viewBox is 0..8 in board squares; centers sit at (col+0.5, row+0.5). */}
        {arrows.length > 0 && (
          <Box
            component="svg"
            viewBox="0 0 8 8"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
            sx={{ position: "absolute", inset: 0, zIndex: 2, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            {(() => {
              const matches = (a: BoardArrow) =>
                hintMove != null &&
                a.from.file === hintMove.from.file &&
                a.from.rank === hintMove.from.rank &&
                a.to.file === hintMove.to.file &&
                a.to.rank === hintMove.to.rank;
              const anyHover = arrows.some(matches);
              return arrows.map((a) => {
                const fCol = orientation === "white" ? a.from.file : 7 - a.from.file;
                const fRow = orientation === "white" ? 7 - a.from.rank : a.from.rank;
                const tCol = orientation === "white" ? a.to.file : 7 - a.to.file;
                const tRow = orientation === "white" ? 7 - a.to.rank : a.to.rank;
                const x1 = fCol + 0.5;
                const y1 = fRow + 0.5;
                const x2 = tCol + 0.5;
                const y2 = tRow + 0.5;
                const len = Math.hypot(x2 - x1, y2 - y1) || 1;
                const ux = (x2 - x1) / len;
                const uy = (y2 - y1) / len;
                const nx = -uy;
                const ny = ux;
                const headLen = 0.48;
                const headHalf = 0.28;
                const sx0 = x1; // origin square center
                const sy0 = y1;
                const tipX = x2; // destination square center
                const tipY = y2;
                const baseX = tipX - ux * headLen;
                const baseY = tipY - uy * headLen;
                // Rank badge sits at the arrow's midpoint (clear of both pieces).
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const isHover = matches(a);
                const opacity = anyHover ? (isHover ? 1 : 0.28) : 0.7;
                return (
                  <g key={`${a.from.file},${a.from.rank}-${a.to.file},${a.to.rank}`} opacity={opacity}>
                    <line
                      x1={sx0}
                      y1={sy0}
                      x2={baseX}
                      y2={baseY}
                      stroke={a.color}
                      strokeWidth={isHover ? 0.3 : 0.25}
                      strokeLinecap="round"
                    />
                    <polygon
                      points={`${tipX},${tipY} ${baseX + nx * headHalf},${baseY + ny * headHalf} ${baseX - nx * headHalf},${baseY - ny * headHalf}`}
                      fill={a.color}
                    />
                    <circle cx={midX} cy={midY} r={0.26} fill={a.color} stroke="rgba(0,0,0,0.4)" strokeWidth={0.03} />
                    <text
                      x={midX}
                      y={midY}
                      fill="#fff"
                      fontSize={0.32}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {a.rank}
                    </text>
                  </g>
                );
              });
            })()}
          </Box>
        )}
      </Box>
    </Box>
  );
}
