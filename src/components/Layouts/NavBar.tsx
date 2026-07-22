import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Stack from "@mui/material/Stack";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CasinoRoundedIcon from "@mui/icons-material/CasinoRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import FriendsIcon from "@mui/icons-material/Group";
import LogoutIcon from "@mui/icons-material/Logout";
import type { SvgIconComponent } from "@mui/icons-material";
import AppLogo from "../../assets/images/HPChessLogo.png";
import { ACCENT_BLUE, ACCENT_PURPLE, ACCENT_AMBER, ACCENT_GREEN, MAIN_PURPLE, APP_NAME } from "../../constants";
import { Button } from "../Button";
import SignUpDialog from "../SignUpDialog";
import LoginDialog from "../LoginDialog";
import FriendsDialog from "../FriendsDialog";
import BoardSettingsDialog from "../BoardSettingsDialog";
import { NotificationsBell, type NotificationTarget } from "../NotificationsBell";
import { MessagesButton } from "../MessagesButton";
import { useAuth } from "../../auth/AuthContext";
import { PlayerBadge } from "../PlayerBadge";
import { Menu } from "../Menu";
import { IconButton } from "@mui/material";
import StartGameDialog from "../StartGameDialog";
import { OpponentType } from "../../data/types";

type MenuItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  icon: SvgIconComponent;
  iconColor?: string;
  subItems?: MenuItem[];
};

type Origin = { vertical: "top" | "bottom" | "center"; horizontal: "left" | "right" | "center" };

// The currently open flyout: which items to show, the element to anchor to, and
// optional origins (nav flyouts use the Menu defaults; settings overrides them).
type Submenu = {
  anchor: HTMLElement;
  items: MenuItem[];
  anchorOrigin?: Origin;
  transformOrigin?: Origin;
};

export default function NavBar() {
  const navigate = useNavigate();
  const { isAuthenticated, player, logout } = useAuth();
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [boardSettingsOpen, setBoardSettingsOpen] = useState(false);
  const [friendsTab, setFriendsTab] = useState<NotificationTarget>("friends");
  const [startGameOpen, setStartGameOpen] = useState(false);
  const [opponentType, setOpponentType] = useState<OpponentType>(OpponentType.HUMAN);
  // The nav item whose submenu is currently open, plus the element it anchors to.
  const [submenu, setSubmenu] = useState<Submenu | null>(null);

  // Close any open dialogs/menus on navigation — e.g. when an accepted challenge
  // sends both players into the game, a lingering Friends/Start Game dialog would
  // otherwise stay on top of the board.
  const { pathname } = useLocation();
  useEffect(() => {
    setSignUpOpen(false);
    setLoginOpen(false);
    setFriendsOpen(false);
    setBoardSettingsOpen(false);
    setStartGameOpen(false);
    setSubmenu(null);
  }, [pathname]);

  // Clear the session, then send the user back to the public homepage.
  function handleLogout() {
    logout();
    navigate("/");
  }

  const menuItems: MenuItem[] = [
    {
      label: "Play Chess",
      to: "/play",
      icon: SportsEsportsRoundedIcon,
      iconColor: ACCENT_BLUE,
      subItems: [
        {
          label: "Play another user",
          onClick: () => {
            if (!isAuthenticated) {
              navigate("/noauth", { state: { message: "You must be logged in to play against another user." } });
              return;
            }
            setOpponentType(OpponentType.HUMAN);
            setStartGameOpen(true);
          },
          icon: PersonRoundedIcon,
          iconColor: ACCENT_BLUE,
        },
        {
          label: "Play bot",
          onClick: () => {
            if (!isAuthenticated) {
              navigate("/noauth", { state: { message: "You must be logged in to play against a bot" } });
              return;
            }
            setOpponentType(OpponentType.BOT);
            setStartGameOpen(true);
          },
          icon: SmartToyRoundedIcon,
          iconColor: ACCENT_BLUE,
        },
        { label: "Stats", to: "/play/stats", icon: LeaderboardRoundedIcon, iconColor: ACCENT_BLUE },
        { label: "Game History", to: "/play/history", icon: HistoryIcon, iconColor: ACCENT_BLUE },
      ],
    },
    {
      label: "Chess Puzzles",
      to: "/puzzles",
      icon: ExtensionRoundedIcon,
      iconColor: ACCENT_AMBER,
      subItems: [
        { label: "Daily Puzzle", to: "/puzzles/daily", icon: TodayRoundedIcon, iconColor: ACCENT_AMBER },
        { label: "Random Puzzles", to: "/puzzles/random", icon: CasinoRoundedIcon, iconColor: ACCENT_AMBER },
      ],
    },
    {
      label: "Learn Chess",
      to: "/learn",
      icon: SchoolRoundedIcon,
      iconColor: ACCENT_PURPLE,
      subItems: [
        { label: "Board Explorer", to: "/learn/board-explorer", icon: ExploreRoundedIcon, iconColor: ACCENT_PURPLE },
      ],
    },
    { label: "Rankings", to: "/rankings", icon: LeaderboardRoundedIcon, iconColor: ACCENT_GREEN },
  ];

  const settingsMenuItems: MenuItem[] = [
    { label: "Profile", to: "/settings/profile", icon: PersonRoundedIcon, iconColor: ACCENT_BLUE },
    {
      label: "Board Settings",
      onClick: () => setBoardSettingsOpen(true),
      icon: GridOnRoundedIcon,
      iconColor: ACCENT_BLUE,
    },
    { label: "Help & Support", to: "/help", icon: HelpOutlineRoundedIcon, iconColor: ACCENT_BLUE },
    { label: "Log out", onClick: handleLogout, icon: LogoutIcon, iconColor: ACCENT_BLUE },
  ];

  return (
    <Stack
      direction="column"
      sx={{
        backgroundColor: "#222222",
        width: "220px",
        height: "100vh",
        color: "#ffffff",
        padding: "16px",
        justifyContent: "space-between",
        // Pin the sidebar so it stays in view while the main content scrolls.
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <Stack direction="column" sx={{ gap: "24px" }}>
        <Stack direction="column" sx={{ alignItems: "center" }}>
          <NavLink to={isAuthenticated ? "/dashboard" : "/"} style={{ textDecoration: "none" }}>
            <img src={AppLogo} alt={APP_NAME} style={{ width: "100%", marginTop: "0px" }} />
          </NavLink>
        </Stack>
        <Stack direction="column" component="nav" sx={{ gap: "4px" }}>
          {menuItems.map((item) => {
            const { label, to, icon: Icon, iconColor, subItems } = item;
            const hasSubItems = subItems != null && subItems.length > 0;

            // Items with subItems open a flyout Menu; the rest navigate directly.
            if (hasSubItems) {
              const isOpen = submenu?.items === subItems;
              return (
                <Stack
                  key={label}
                  direction="row"
                  onClick={(e) => setSubmenu({ anchor: e.currentTarget, items: subItems })}
                  sx={{
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    color: isOpen ? "#ffffff" : "#b5b5b5",
                    backgroundColor: isOpen ? "#3a3a3a" : "transparent",
                    fontWeight: isOpen ? 600 : 500,
                    transition: "background-color 0.15s ease, color 0.15s ease",
                    "&:hover": { backgroundColor: "#303030", color: "#ffffff" },
                  }}
                >
                  <Icon fontSize="small" htmlColor={iconColor} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <ChevronRightRoundedIcon fontSize="small" />
                </Stack>
              );
            }

            return (
              <NavLink
                key={label}
                to={to ?? "/"}
                style={{ textDecoration: "none" }}
                children={({ isActive }) => (
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      color: isActive ? "#ffffff" : "#b5b5b5",
                      backgroundColor: isActive ? "#3a3a3a" : "transparent",
                      fontWeight: isActive ? 600 : 500,
                      transition: "background-color 0.15s ease, color 0.15s ease",
                      "&:hover": { backgroundColor: "#303030", color: "#ffffff" },
                    }}
                  >
                    <Icon fontSize="small" htmlColor={iconColor} />
                    <span>{label}</span>
                  </Stack>
                )}
              />
            );
          })}
          <Menu
            open={submenu != null}
            anchorEl={submenu?.anchor ?? null}
            items={submenu?.items ?? []}
            onClose={() => setSubmenu(null)}
            anchorOrigin={submenu?.anchorOrigin}
            transformOrigin={submenu?.transformOrigin}
          />
        </Stack>
      </Stack>
      {isAuthenticated ? (
        <Stack direction="column" sx={{ gap: "10px" }}>
          <Stack direction="row" sx={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#303030" }}>
            <PlayerBadge
              username={player?.username ?? ""}
              avatarKey={player?.avatarKey}
              rating={player?.rating}
              size={32}
            />
          </Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: "10px", marginTop: "-5px" }}>
            <IconButton
              onClick={() => {
                setFriendsTab("friends");
                setFriendsOpen(true);
              }}
              aria-label="Friends"
            >
              <FriendsIcon sx={{ color: ACCENT_BLUE }} />
            </IconButton>
            <MessagesButton />
            <NotificationsBell
              onNavigate={(target) => {
                setFriendsTab(target);
                setFriendsOpen(true);
              }}
            />
            <IconButton
              onClick={(e) =>
                setSubmenu({
                  anchor: e.currentTarget,
                  items: settingsMenuItems,
                  anchorOrigin: { vertical: "top", horizontal: "center" },
                  transformOrigin: { vertical: "bottom", horizontal: "center" },
                })
              }
            >
              <SettingsIcon sx={{ color: ACCENT_BLUE }} />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        <Stack direction="column" sx={{ gap: "10px" }}>
          <Button id="login-button" type="primary" label="Log In" onClick={() => setLoginOpen(true)} />
          <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
          <Button
            id="signup-button"
            type="primary"
            style={{ backgroundColor: MAIN_PURPLE }}
            label="Sign Up"
            onClick={() => setSignUpOpen(true)}
          />
          <SignUpDialog open={signUpOpen} onClose={() => setSignUpOpen(false)} />
          <NavLink
            to={"/help"}
            style={{ textDecoration: "none" }}
            children={({ isActive }) => (
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  color: isActive ? "#ffffff" : "#b5b5b5",
                  backgroundColor: isActive ? "#3a3a3a" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  "&:hover": {
                    backgroundColor: "#303030",
                    color: "#ffffff",
                  },
                }}
              >
                <HelpOutlineRoundedIcon fontSize="small" htmlColor={ACCENT_BLUE} />
                <span>Help & Support</span>
              </Stack>
            )}
          />
        </Stack>
      )}
      <StartGameDialog open={startGameOpen} onClose={() => setStartGameOpen(false)} opponentType={opponentType} />
      <FriendsDialog open={friendsOpen} onClose={() => setFriendsOpen(false)} initialTab={friendsTab} />
      <BoardSettingsDialog open={boardSettingsOpen} onClose={() => setBoardSettingsOpen(false)} />
    </Stack>
  );
}
