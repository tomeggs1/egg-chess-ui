import { useEffect, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { GameDialog } from "./GameDialog";
import { FriendsList } from "./FriendsList";
import { FriendRequests } from "./FriendRequests";
import { ACCENT_PRIMARY, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";
import FriendsIcon from "../assets/images/friends-large.webp";

// Which tab is showing. Kept as an enum-ish union for readability.
type FriendsTab = "friends" | "requests";

interface FriendsDialogProps {
  open: boolean;
  onClose: () => void;
  // Tab to show when the dialog opens (e.g. deep-linked from a notification).
  initialTab?: FriendsTab;
}

export default function FriendsDialog({ open, onClose, initialTab = "friends" }: FriendsDialogProps) {
  const [tab, setTab] = useState<FriendsTab>(initialTab);

  // Jump to the requested tab each time the dialog opens.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <GameDialog
      open={open}
      onClose={onClose}
      emblem={FriendsIcon}
      title="Friends"
      subtitle="Manage your friends and requests"
      // The tabs run full-bleed to the paper edge, so each panel carries its
      // own padding instead of the shell adding it.
      bodyPadding={false}
    >
      <Tabs
        value={tab}
        onChange={(_event, value: FriendsTab) => setTab(value)}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          "& .MuiTab-root": { color: TEXT_SECONDARY, textTransform: "none", fontWeight: 600 },
          "& .MuiTab-root.Mui-selected": { color: TEXT_PRIMARY },
          "& .MuiTabs-indicator": { backgroundColor: ACCENT_PRIMARY },
        }}
      >
        <Tab value="friends" label="Friends" id="friends-tab-friends" aria-controls="friends-panel-friends" />
        <Tab value="requests" label="Requests" id="friends-tab-requests" aria-controls="friends-panel-requests" />
      </Tabs>

      {/* Friends tab: the current user's friend list. */}
      <Box
        role="tabpanel"
        hidden={tab !== "friends"}
        id="friends-panel-friends"
        aria-labelledby="friends-tab-friends"
        sx={{ px: 3, py: 2, minHeight: 220 }}
      >
        {tab === "friends" && <FriendsList />}
      </Box>
      {/* Requests tab: search for players to add, plus pending requests. */}
      <Box
        role="tabpanel"
        hidden={tab !== "requests"}
        id="friends-panel-requests"
        aria-labelledby="friends-tab-requests"
        sx={{ px: 3, py: 2, minHeight: 220 }}
      >
        {tab === "requests" && <FriendRequests />}
      </Box>
    </GameDialog>
  );
}
