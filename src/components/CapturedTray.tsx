import { Box, Stack, Typography } from "@mui/material";
import { uiPieceSrc } from "../data/pieceAssets";
import type { CapturedPiece } from "../board/history";
import type { PieceType } from "../data/pieceThemes";
import { ACCENT_GREEN, SURFACE_BLACK, SURFACE_BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

const VALUE: Record<PieceType, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
const ORDER: Record<PieceType, number> = { queen: 0, rook: 1, bishop: 2, knight: 3, pawn: 4, king: 5 };

interface CapturedTrayProps {
  /** Black pieces White has captured. */
  byWhite: CapturedPiece[];
  /** White pieces Black has captured. */
  byBlack: CapturedPiece[];
}

const material = (pieces: CapturedPiece[]) => pieces.reduce((sum, p) => sum + VALUE[p.type], 0);

function Row({ label, pieces, lead }: { label: string; pieces: CapturedPiece[]; lead: number }) {
  const sorted = [...pieces].sort((a, b) => ORDER[a.type] - ORDER[b.type]);
  // Group consecutive same-type pieces so they can be stacked tightly.
  const groups: CapturedPiece[][] = [];
  for (const p of sorted) {
    const last = groups[groups.length - 1];
    if (last && last[0].type === p.type) last.push(p);
    else groups.push([p]);
  }
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5, minHeight: 24 }}>
      <Typography variant="caption" sx={{ color: TEXT_SECONDARY, width: 40, flexShrink: 0 }}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", rowGap: 0.25, columnGap: 0.75, flex: 1, alignItems: "center" }}>
        {groups.length === 0 ? (
          <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
            —
          </Typography>
        ) : (
          groups.map((group, gi) => (
            <Box key={gi} sx={{ display: "flex", alignItems: "center" }}>
              {group.map((p, i) => (
                <Box
                  key={i}
                  component="img"
                  src={uiPieceSrc(p.color, p.type)}
                  alt={`${p.color} ${p.type}`}
                  sx={{ height: 18, width: "auto", ml: i === 0 ? 0 : "-13px" }}
                />
              ))}
            </Box>
          ))
        )}
      </Stack>
      {lead > 0 && (
        <Typography variant="caption" sx={{ color: ACCENT_GREEN, fontWeight: 700, flexShrink: 0 }}>
          +{lead}
        </Typography>
      )}
    </Stack>
  );
}

/** Shows each side's captured pieces and the material lead. */
export function CapturedTray({ byWhite, byBlack }: CapturedTrayProps) {
  // Nothing captured yet — don't show the panel at all.
  if (byWhite.length === 0 && byBlack.length === 0) return null;

  const advantage = material(byWhite) - material(byBlack);
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "16px",
        backgroundColor: SURFACE_BLACK,
        border: `1px solid ${SURFACE_BORDER}`,
        minWidth: "350px",
        width: { xs: "100%", md: 220 },
      }}
    >
      <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mb: 1 }}>
        Captured
      </Typography>
      <Stack direction="column" sx={{ gap: 1 }}>
        <Row label="White" pieces={byWhite} lead={advantage} />
        <Row label="Black" pieces={byBlack} lead={-advantage} />
      </Stack>
    </Box>
  );
}
