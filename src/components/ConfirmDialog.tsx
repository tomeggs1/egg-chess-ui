import type { ReactNode } from "react";
import { Box, Dialog, Stack, Typography } from "@mui/material";
import { Button } from "./Button";
import { MAIN_BLUE_LIGHT, SURFACE_600, SURFACE_800, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Background color for the confirm button (e.g. a red for destructive actions). */
  confirmColor?: string;
  /** Optional icon shown above the title. */
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A small, styled yes/no confirmation modal — an in-app replacement for
 * window.confirm. Matches the app's dialog styling (see GameOverDialog).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      sx={{
        "& .MuiDialog-paper": {
          overflow: "hidden",
          backgroundColor: SURFACE_800,
          border: `1px solid rgba(255, 255, 255, 0.12)`,
          borderRadius: "18px",
          color: TEXT_PRIMARY,
          boxShadow: `0 40px 90px rgba(0, 0, 0, 0.80)`,
        },
      }}
    >
      <Box aria-hidden sx={{ height: "3px", background: MAIN_BLUE_LIGHT }} />

      <Stack direction="column" sx={{ alignItems: "center", gap: 1.5, px: 3, pt: icon ? 4 : 3.5, pb: 3 }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_PRIMARY, textAlign: "center" }}>
          {title}
        </Typography>
        {message && (
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
            {message}
          </Typography>
        )}

        <Stack direction="row" sx={{ gap: 1.5, mt: 1.5, width: "100%" }}>
          <Button
            id="confirm-dialog-cancel"
            type="secondary"
            label={cancelLabel}
            onClick={onCancel}
            style={{ flex: 1, backgroundColor: SURFACE_600 }}
          />
          <Button
            id="confirm-dialog-confirm"
            type="primary"
            label={confirmLabel}
            onClick={onConfirm}
            style={{ flex: 1, ...(confirmColor ? { backgroundColor: confirmColor } : {}) }}
          />
        </Stack>
      </Stack>
    </Dialog>
  );
}
