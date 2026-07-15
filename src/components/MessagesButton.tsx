import { useState } from "react";
import { Badge, IconButton } from "@mui/material";
import MessagesIcon from "@mui/icons-material/Email";
import { useTotalUnreadMessages } from "../hooks/useMessages";
import MessagesDialog from "./MessagesDialog";
import { ACCENT_BLUE } from "../constants";

/**
 * The nav-bar Messages entry: a badge showing total unread messages, opening
 * the messages dialog. Rendered only when authenticated so its polling query
 * doesn't run for signed-out users.
 */
export function MessagesButton() {
  const [open, setOpen] = useState(false);
  const unread = useTotalUnreadMessages();

  return (
    <>
      <IconButton onClick={() => setOpen(true)} aria-label="Messages">
        <Badge badgeContent={unread.data ?? 0} max={99} color="error">
          <MessagesIcon sx={{ color: ACCENT_BLUE }} />
        </Badge>
      </IconButton>
      <MessagesDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
