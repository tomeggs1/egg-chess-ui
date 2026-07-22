import { Box, Stack, Typography } from "@mui/material";
import { usePieceTheme } from "../pieces/PieceThemeContext";
import { pieceSrc } from "../data/pieceAssets";
import { ACCENT_BLUE, SURFACE_700, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

interface PieceThemePickerProps {
  disabled?: boolean;
  label?: string;
}

/**
 * A row of selectable piece sets, each shown as a small preview (a white and a
 * black piece). Selecting one persists immediately via the theme context — it
 * is not tied to any "save" action.
 */
export function PieceThemePicker({ disabled, label = "" }: PieceThemePickerProps) {
  const { theme: current, themes, setThemeId } = usePieceTheme();

  return (
    <Stack direction="column" sx={{ gap: 1 }}>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
        {label}
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.25 }}>
        {themes.map((theme) => {
          const selected = theme.id === current.id;
          return (
            <Box
              key={theme.id}
              role="radio"
              aria-checked={selected}
              aria-label={theme.name}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                if (!disabled) setThemeId(theme.id);
              }}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setThemeId(theme.id);
                }
              }}
              sx={{
                width: 128,
                p: 1,
                borderRadius: "12px",
                backgroundColor: SURFACE_700,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.6 : 1,
                border: `2px solid ${selected ? ACCENT_BLUE : "transparent"}`,
                boxShadow: selected ? "0 0 0 3px rgba(77, 141, 255, 0.25)" : "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                "&:hover": { borderColor: selected ? ACCENT_BLUE : disabled ? "transparent" : SURFACE_BORDER },
                "&:focus-visible": { outline: "none", borderColor: ACCENT_BLUE },
              }}
            >
              <Stack direction="row" sx={{ justifyContent: "center", alignItems: "flex-end", gap: 0.5, height: 56 }}>
                <img src={pieceSrc(theme, "white", "king")} alt="" style={{ height: "100%", width: "auto" }} />
                <img src={pieceSrc(theme, "black", "queen")} alt="" style={{ height: "100%", width: "auto" }} />
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "center",
                  mt: 0.75,
                  color: selected ? TEXT_PRIMARY : TEXT_SECONDARY,
                }}
              >
                {theme.name}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
