import { useState } from "react";
import { Badge, IconButton, Tooltip } from "@mui/material";
import { SmallIcon } from "./SmallIcon";
import { useTotalUnreadMessages } from "../hooks/useMessages";
import MessagesDialog from "./MessagesDialog";

/**
 * The nav-bar Messages entry: a badge showing total unread messages, opening
 * the messages dialog. Rendered only when authenticated so its polling query
 * doesn't run for signed-out users.
 *
 * A `tooltip` is wrapped around the button here (not by the caller) because this
 * component renders a fragment — a Tooltip placed around <MessagesButton/> has
 * no single element to attach to and would silently do nothing.
 */
export function MessagesButton({ tooltip }: { tooltip?: string }) {
  const [open, setOpen] = useState(false);
  const unread = useTotalUnreadMessages();

  const button = (
    <IconButton onClick={() => setOpen(true)} aria-label="Messages">
      <Badge badgeContent={unread.data ?? 0} max={99} color="error">
        <SmallIcon name="messages" />
      </Badge>
    </IconButton>
  );

  return (
    <>
      {tooltip ? (
        <Tooltip title={tooltip} placement="right">
          {button}
        </Tooltip>
      ) : (
        button
      )}
      <MessagesDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
