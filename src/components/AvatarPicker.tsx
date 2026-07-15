import { Box, Stack, Typography } from "@mui/material";
import { AVATAR_PRESETS } from "../data/avatars";
import { PlayerAvatar } from "./PlayerAvatar";
import { ACCENT_BLUE, SURFACE_BORDER, TEXT_SECONDARY } from "../constants";

interface AvatarPickerProps {
  /** Username used to render the "Default" (initials) preview. */
  username: string;
  /** Selected preset key, or null for the default. */
  value: string | null;
  onChange: (key: string | null) => void;
  disabled?: boolean;
  label?: string;
}

// The default (no preset) option, plus every preset.
const OPTIONS: Array<{ key: string | null; label: string }> = [
  { key: null, label: "Default" },
  ...AVATAR_PRESETS.map((preset) => ({ key: preset.key, label: preset.label })),
];

/**
 * A grid of selectable avatars. Selecting one calls onChange with the preset
 * key (or null for the default). Purely controlled — the parent owns the value.
 */
export function AvatarPicker({ username, value, onChange, disabled, label = "Avatar" }: AvatarPickerProps) {
  return (
    <Stack direction="column" sx={{ gap: 1 }}>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        sx={{
          flexWrap: "wrap",
          gap: 1.25,
          // Keep the (long) list from dominating the dialog; scroll instead.
          maxHeight: 132,
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        {OPTIONS.map((option) => {
          const selected = option.key === value;
          return (
            <Box
              key={option.key ?? "default"}
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              tabIndex={disabled ? -1 : 0}
              onClick={() => {
                if (!disabled) onChange(option.key);
              }}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(option.key);
                }
              }}
              sx={{
                p: "3px",
                borderRadius: "50%",
                lineHeight: 0,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.6 : 1,
                border: `2px solid ${selected ? ACCENT_BLUE : "transparent"}`,
                boxShadow: selected ? "0 0 0 3px rgba(77, 141, 255, 0.25)" : "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                "&:hover": { borderColor: selected ? ACCENT_BLUE : disabled ? "transparent" : SURFACE_BORDER },
                "&:focus-visible": { outline: "none", borderColor: ACCENT_BLUE },
              }}
            >
              <PlayerAvatar username={username} avatarKey={option.key} size={44} title={option.label} />
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
