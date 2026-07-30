import type { ReactNode } from "react";
import { Stack } from "@mui/material";
import { GameDialog } from "./GameDialog";
import { Button } from "./Button";
import { SURFACE_600 } from "../constants";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Background color for the confirm button (e.g. a red for destructive actions). */
  confirmColor?: string;
  /** Emblem shown above the title, as with the other crested dialogs. */
  emblem?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A styled yes/no confirmation modal — an in-app replacement for window.confirm.
 *
 * Uses GameDialog's crested header, so a confirmation looks like the rest of the
 * app's dialogs rather than a plainer variant. It keeps two things of its own:
 * no corner close button, because the two buttons are the answer and a third
 * way out only muddles which one is "no"; and a `confirmColor` for destructive
 * actions.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor,
  emblem,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <GameDialog
      open={open}
      onClose={onCancel}
      showClose={false}
      emblem={emblem}
      title={title}
      subtitle={message}
    >
      <Stack direction="row" sx={{ gap: 1.5, mt: 1, width: "100%" }}>
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
    </GameDialog>
  );
}
