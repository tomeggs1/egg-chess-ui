import { Box, Stack, Typography } from "@mui/material";
import { useBoardTheme } from "../board/BoardThemeContext";
import { boardTileSrc } from "../data/boardAssets";
import { CLASSIC_SQUARE, type BoardTheme } from "../data/boardThemes";
import { ACCENT_BLUE, SURFACE_700, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

interface BoardThemePickerProps {
  disabled?: boolean;
  label?: string;
}

// A 2×2 checker preview of the theme's tiles (or the classic colors).
function ThemeSwatch({ theme }: { theme: BoardTheme }) {
  // top-left & bottom-right = light, top-right & bottom-left = dark
  const cells: Array<"white" | "black"> = ["white", "black", "black", "white"];
  return (
    <Box
      sx={{
        width: 60,
        height: 60,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {cells.map((shade, i) => {
        const tile = boardTileSrc(theme, shade, 1);
        return (
          <Box
            key={i}
            sx={{
              backgroundColor: shade === "white" ? CLASSIC_SQUARE.light : CLASSIC_SQUARE.dark,
              backgroundImage: tile ? `url(${tile})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        );
      })}
    </Box>
  );
}

/**
 * A row of selectable board themes, each shown as a small tile preview.
 * Selecting one persists immediately via the board-theme context.
 */
export function BoardThemePicker({ disabled, label = "" }: BoardThemePickerProps) {
  const { theme: current, themes, setThemeId } = useBoardTheme();

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
                width: 92,
                p: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
              <ThemeSwatch theme={theme} />
              <Typography
                variant="caption"
                sx={{ textAlign: "center", mt: 0.75, color: selected ? TEXT_PRIMARY : TEXT_SECONDARY }}
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
