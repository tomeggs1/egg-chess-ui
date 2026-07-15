import { useEffect, useState } from "react";
import { Box, Dialog, IconButton, Stack, Tab, Tabs, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { FriendsList } from "./FriendsList";
import { FriendRequests } from "./FriendRequests";
import {
  ACCENT_BLUE,
  ACCENT_PURPLE,
  MAIN_BLUE_LIGHT,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        "& .MuiDialog-paper": {
          position: "relative",
          overflow: "hidden",
          backgroundColor: SURFACE_800,
          backgroundImage: `radial-gradient(circle at 15% -10%, rgba(77, 141, 255, 0.22), transparent 45%), radial-gradient(circle at 110% 0%, rgba(168, 85, 247, 0.22), transparent 42%)`,
          border: `1px solid rgba(255, 255, 255, 0.12)`,
          borderRadius: "18px",
          color: TEXT_PRIMARY,
          boxShadow: `0 0 0 1px rgba(77, 141, 255, 0.30), 0 0 50px rgba(96, 2, 197, 0.35), 0 40px 90px rgba(0, 0, 0, 0.80)`,
        },
      }}
    >
      {/* Top accent hairline (blue → purple). */}
      <Box
        aria-hidden
        sx={{ height: "3px", background: `linear-gradient(90deg, ${MAIN_BLUE_LIGHT}, ${ACCENT_PURPLE})` }}
      />

      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          color: TEXT_MUTED,
          "&:hover": { color: TEXT_PRIMARY },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      {/* Header with a faint chessboard pattern, matching the login dialog. */}
      <Box sx={{ position: "relative", overflow: "hidden", px: 3, pt: 3.5, pb: 2 }}>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `linear-gradient(45deg, ${TEXT_PRIMARY} 25%, transparent 25%, transparent 75%, ${TEXT_PRIMARY} 75%), linear-gradient(45deg, ${TEXT_PRIMARY} 25%, transparent 25%, transparent 75%, ${TEXT_PRIMARY} 75%)`,
            backgroundSize: "34px 34px",
            backgroundPosition: "0 0, 17px 17px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <Stack direction="column" sx={{ position: "relative", alignItems: "center", gap: 1 }}>
          <GroupRoundedIcon sx={{ fontSize: 40, color: ACCENT_BLUE }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            Friends
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
            Manage your friends and requests
          </Typography>
        </Stack>
      </Box>

      <Tabs
        value={tab}
        onChange={(_event, value: FriendsTab) => setTab(value)}
        variant="fullWidth"
        sx={{
          borderBottom: `1px solid ${SURFACE_BORDER}`,
          "& .MuiTab-root": { color: TEXT_SECONDARY, textTransform: "none", fontWeight: 600 },
          "& .MuiTab-root.Mui-selected": { color: TEXT_PRIMARY },
          "& .MuiTabs-indicator": { backgroundColor: ACCENT_BLUE },
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
    </Dialog>
  );
}
