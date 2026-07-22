import { Box, Stack, Typography } from "@mui/material";
import { usePieceTheme } from "../pieces/PieceThemeContext";
import { pieceSrc } from "../data/pieceAssets";
import type { PieceColor, PieceType } from "../data/pieceThemes";
import { SURFACE_800, SURFACE_BORDER, TEXT_PRIMARY } from "../constants";

interface PromotionPickerProps {
  color: PieceColor;
  options: PieceType[];
  onSelect: (type: PieceType) => void;
  onCancel: () => void;
}

/**
 * Overlay shown while a pawn promotion is pending. Click a piece to promote;
 * click the backdrop to cancel. Renders inside the (relatively-positioned)
 * board wrapper. Uses the active board piece theme for the options.
 */
export function PromotionPicker({ color, options, onSelect, onCancel }: PromotionPickerProps) {
  const { theme } = usePieceTheme();
  return (
    <Box
      onClick={onCancel}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.55)",
        borderRadius: "16px",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          p: 2,
          borderRadius: "14px",
          backgroundColor: SURFACE_800,
          border: `1px solid ${SURFACE_BORDER}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY, mb: 1, textAlign: "center" }}>
          Promote to
        </Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          {options.map((type) => (
            <Box
              key={type}
              role="button"
              aria-label={type}
              onClick={() => onSelect(type)}
              sx={{
                p: 1,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background-color 0.12s",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <Box component="img" src={pieceSrc(theme, color, type)} alt={type} sx={{ height: 56, width: "auto", display: "block" }} />
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
