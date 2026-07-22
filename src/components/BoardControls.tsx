import { useState } from "react";
import { Box, Collapse, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Button } from "./Button";
import {
  ACCENT_BLUE,
  SURFACE_600,
  SURFACE_800,
  SURFACE_BLACK,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

interface BoardControlsProps {
  /** Games to offer in the selector (id/name/icon). */
  games: Array<{ id: string; name: string; icon: string }>;
  gameId: string;
  onGameChange: (gameId: string) => void;
  onFlip: () => void;
  onReset: () => void;
  showCoordinates: boolean;
  onToggleCoordinates: (value: boolean) => void;
}

// Dark, glassy field styling to match the app's other selectors.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT_BLUE },
  "& .MuiSelect-icon": { color: TEXT_MUTED },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", gap: "10px" },
};

/**
 * The Board Explorer's control panel — a fully controlled presentational
 * component. It owns no state; the page passes current values and change
 * handlers.
 */
export function BoardControls({
  games,
  gameId,
  onGameChange,
  onFlip,
  onReset,
  showCoordinates,
  onToggleCoordinates,
}: BoardControlsProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: { xs: "100%", md: 220 },
        p: 2.5,
        borderRadius: "16px",
        backgroundColor: SURFACE_BLACK,
        border: `1px solid ${SURFACE_BORDER}`,
        minWidth: "350px",
      }}
    >
      <Stack
        direction="row"
        role="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          mb: expanded ? 2 : 0,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY }}>
          Settings
        </Typography>
        <ExpandMoreRoundedIcon
          sx={{
            color: TEXT_SECONDARY,
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </Stack>
      <Collapse in={expanded}>
        <Stack direction="column" sx={{ gap: 2 }}>
        <TextField
          select
          label="Game"
          value={gameId}
          onChange={(e) => onGameChange(e.target.value)}
          size="small"
          fullWidth
          sx={fieldSx}
          slotProps={{
            select: {
              MenuProps: {
                slotProps: {
                  paper: {
                    sx: {
                      bgcolor: SURFACE_800,
                      color: TEXT_PRIMARY,
                      border: `1px solid ${SURFACE_BORDER}`,
                      "& .MuiMenuItem-root.Mui-selected": { backgroundColor: "rgba(77, 141, 255, 0.20)" },
                      "& .MuiMenuItem-root.Mui-focusVisible, & .MuiMenuItem-root:hover": {
                        backgroundColor: "rgba(77, 141, 255, 0.15)",
                      },
                    },
                  },
                },
              },
            },
          }}
        >
          {games.map((g) => (
            <MenuItem key={g.id} value={g.id} sx={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Box component="img" src={g.icon} alt="" sx={{ width: 20, height: 20, borderRadius: "4px" }} />
              {g.name}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
          <Button
            id="flip-board"
            type="primary"
            label="Flip board"
            onClick={onFlip}
            startIcon={<SwapVertRoundedIcon fontSize="small" />}
          />
          <Button
            id="reset-board"
            type="secondary"
            label="Reset Game"
            onClick={onReset}
            startIcon={<RestartAltRoundedIcon fontSize="small" />}
            style={{ backgroundColor: SURFACE_600 }}
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={showCoordinates}
              onChange={(e) => onToggleCoordinates(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT_BLUE },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: ACCENT_BLUE },
              }}
            />
          }
          label="Show Coordinates"
          sx={{ color: TEXT_SECONDARY, m: 0 }}
        />
        </Stack>
      </Collapse>
    </Box>
  );
}
