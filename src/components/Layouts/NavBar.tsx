import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Stack from "@mui/material/Stack";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
// Expanded rail gets the full crest; collapsed keeps the small square mark,
// which stays legible at 40px where the crest's wordmark would not.
import AppLogo from "../../assets/images/hp-chess-nav-logo.webp";
import AppMark from "../../assets/images/HPSmallLogo.png";
import { SmallIcon, type SmallIconName } from "../SmallIcon";
import { ACCENT_PRIMARY, ACCENT_DECOR, ACCENT_COOL, ACCENT_GREEN, CTA_SECONDARY, APP_NAME } from "../../constants";
import { NAV, PLAQUE, RADIUS } from "../../theme/tokens";
import { Icons, type IconComponent } from "../../icons";
import { Button } from "../Button";
import SignUpDialog from "../SignUpDialog";
import LoginDialog from "../LoginDialog";
import FriendsDialog from "../FriendsDialog";
import BoardSettingsDialog from "../BoardSettingsDialog";
import { NotificationsBell, type NotificationTarget } from "../NotificationsBell";
import { MessagesButton } from "../MessagesButton";
import { useAuth } from "../../auth/AuthContext";
import { PlayerBadge } from "../PlayerBadge";
import { PlayerAvatar } from "../PlayerAvatar";
import { Menu } from "../Menu";
import { IconButton, Tooltip } from "@mui/material";
import StartGameDialog from "../StartGameDialog";
import { OpponentType } from "../../data/types";

// Sidebar widths for the two states; collapsing swaps to a slim icon rail.
const NAV_WIDTH_EXPANDED = 200;
const NAV_WIDTH_COLLAPSED = 56;
/**
 * The crest is sized by HEIGHT, not width.
 *
 * It is portrait (0.83) where the old wordmark was landscape (1.06), so at
 * `width: 100%` it rendered 239px tall against the old 186px — shoving the
 * whole menu down and running past the rail's 16px padding. Fixing the height
 * keeps the vertical rhythm and lets the crest sit inside the padding.
 */
const NAV_LOGO_HEIGHT = 200;
// Persisted collapse preference. Only applies while signed in — signed-out
// users always see the full-width bar.
const NAV_COLLAPSED_KEY = "navCollapsed";

type MenuItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  icon: IconComponent;
  iconColor?: string;
  /**
   * Painted crest that replaces `icon` for this row. `icon` stays required, so
   * anywhere that renders a MenuItem without honouring `image` — the flyout
   * Menu, for one — still has a glyph to fall back on.
   */
  image?: SmallIconName;
  subItems?: MenuItem[];
  /**
   * Extra routes that light this item, beyond `to` and its subItems' paths.
   * For sections whose pages do not live under their own prefix — a game is
   * part of Play Chess but its URL is /game/:id.
   */
  activePaths?: string[];
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
  const { pathname } = useLocation();
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [boardSettingsOpen, setBoardSettingsOpen] = useState(false);
  const [friendsTab, setFriendsTab] = useState<NotificationTarget>("friends");
  const [startGameOpen, setStartGameOpen] = useState(false);
  const [opponentType, setOpponentType] = useState<OpponentType>(OpponentType.HUMAN);
  // The nav item whose submenu is currently open, plus the element it anchors to.
  const [submenu, setSubmenu] = useState<Submenu | null>(null);
  // Collapsed (icon-rail) preference, persisted. Gated on auth so signed-out
  // users always get the full-width bar regardless of the stored value.
  const [collapsedPref, setCollapsedPref] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  // In-game override. Games auto-collapse the rail to give the board room, but
  // the user can still expand it — that choice is transient and deliberately
  // does NOT write to collapsedPref, so their global preference survives the
  // game. null = no override, follow the preference.
  const [gameOverride, setGameOverride] = useState<boolean | null>(null);
  const inGame = pathname.startsWith("/game/");

  const collapsed = isAuthenticated && (gameOverride ?? (inGame || collapsedPref));

  const toggleCollapsed = () => {
    if (inGame) {
      // Just for this game; leave the saved preference alone.
      setGameOverride(!collapsed);
      return;
    }
    setCollapsedPref((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NAV_COLLAPSED_KEY, String(next));
      } catch {
        // Ignore persistence failures; the in-memory choice still applies.
      }
      return next;
    });
  };

  // Tooltips only earn their keep on the collapsed icon rail — in the expanded
  // bar the labels are visible and hover tips over the horizontal icon row are
  // just noise. Wrap a single element; a no-op when expanded.
  const railTip = (label: string, node: React.ReactElement) =>
    collapsed ? (
      <Tooltip title={label} placement="right">
        {node}
      </Tooltip>
    ) : (
      node
    );

  // Close any open dialogs/menus on navigation — e.g. when an accepted challenge
  // sends both players into the game, a lingering Friends/Start Game dialog would
  // otherwise stay on top of the board. Also drops any in-game rail override, so
  // entering another game re-collapses.
  useEffect(() => {
    setSignUpOpen(false);
    setLoginOpen(false);
    setFriendsOpen(false);
    setBoardSettingsOpen(false);
    setStartGameOpen(false);
    setSubmenu(null);
    setGameOverride(null);
  }, [pathname]);

  // Send the user to the public homepage, THEN clear the session.
  //
  // The order matters. DashboardPage and GameHistoryPage guard themselves with
  // `if (!isAuthenticated) return <Navigate to="/noauth" replace />`. Clearing
  // auth first re-renders the page we are still on, its guard fires, and it
  // replaces the history entry with /noauth — beating the navigate below.
  // Navigating first means the route is already the (unguarded) homepage when
  // the auth state clears, so no guard ever runs. React batches both updates
  // into one render, so there is no flash of the signed-out protected page.
  function handleLogout() {
    navigate("/");
    logout();
  }

  /**
   * Is the current route inside this item's section?
   *
   * Top-level items with subItems are not NavLinks — they open a flyout — so
   * they get no `isActive` and would only ever highlight while their flyout is
   * open. This walks the item's own path plus every subItem path, so "Play
   * Chess" stays lit on /play/stats and /play/history.
   *
   * Prefix matching is on the segment boundary, not the raw string: without the
   * trailing slash, /play would also claim a hypothetical /playground.
   */
  const sectionActive = (item: MenuItem): boolean => {
    const paths = [
      item.to,
      ...(item.subItems ?? []).map((s) => s.to),
      ...(item.activePaths ?? []),
    ].filter((p): p is string => p != null && p !== "/");
    return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  };

  const menuItems: MenuItem[] = [
    {
      label: "Play Chess",
      to: "/play",
      icon: Icons.play,
      iconColor: ACCENT_PRIMARY,
      image: "play",
      // A game is part of this section even though /game/:id sits outside /play.
      activePaths: ["/game"],
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
          icon: Icons["play-human"],
          iconColor: ACCENT_PRIMARY,
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
          icon: Icons["play-bot"],
          iconColor: ACCENT_PRIMARY,
        },
        { label: "Stats", to: "/play/stats", icon: Icons.stats, iconColor: ACCENT_PRIMARY },
        { label: "Game History", to: "/play/history", icon: Icons.history, iconColor: ACCENT_PRIMARY },
      ],
    },
    {
      label: "Chess Puzzles",
      to: "/puzzles",
      icon: Icons.puzzles,
      iconColor: ACCENT_COOL,
      image: "puzzle",
      subItems: [
        { label: "Daily Puzzle", to: "/puzzles/daily", icon: Icons.daily, iconColor: ACCENT_COOL },
        { label: "Random Puzzles", to: "/puzzles/random", icon: Icons.random, iconColor: ACCENT_COOL },
      ],
    },
    {
      label: "Learn Chess",
      to: "/learn",
      icon: Icons.learn,
      iconColor: ACCENT_DECOR,
      image: "learn",
      subItems: [
        { label: "Board Explorer", to: "/learn/board-explorer", icon: Icons.explore, iconColor: ACCENT_DECOR },
      ],
    },
    {
      label: "Rankings",
      to: "/rankings",
      icon: Icons.podium,
      iconColor: ACCENT_GREEN,
      image: "rankings",
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    { label: "Profile", to: "/settings/profile", icon: Icons.profile, iconColor: ACCENT_PRIMARY },
    {
      label: "Board Settings",
      onClick: () => setBoardSettingsOpen(true),
      icon: Icons["board-settings"],
      iconColor: ACCENT_PRIMARY,
    },
    { label: "Help & Support", to: "/help", icon: Icons.help, iconColor: ACCENT_PRIMARY },
    { label: "Log out", onClick: handleLogout, icon: Icons.logout, iconColor: ACCENT_PRIMARY },
  ];

  return (
    <Stack
      direction="column"
      sx={{
        backgroundColor: NAV.background,
        width: `${collapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED}px`,
        height: "100vh",
        color: NAV.textActive,
        padding: collapsed ? "8px 0px" : "8px 0px",
        justifyContent: "space-between",
        // Pin the sidebar so it stays in view while the main content scrolls.
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        flexShrink: 0,
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.2s ease, padding 0.2s ease",
      }}
    >
      <Stack direction="column" sx={{ gap: "24px" }}>
        {isAuthenticated && (
          <Stack direction="row" sx={{ justifyContent: collapsed ? "center" : "flex-end", marginBottom: "-20px" }}>
            {railTip(
              "Expand",
              <IconButton
                onClick={toggleCollapsed}
                size="small"
                aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                sx={{ color: NAV.text, "&:hover": { color: NAV.textActive } }}
              >
                {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
              </IconButton>,
            )}
          </Stack>
        )}
        <Stack direction="column" sx={{ alignItems: "center" }}>
          {railTip(
            APP_NAME,
            <NavLink to={isAuthenticated ? "/dashboard" : "/"} style={{ textDecoration: "none" }}>
              <img
                src={collapsed ? AppMark : AppLogo}
                alt={APP_NAME}
                style={
                  collapsed
                    ? { width: "40px", display: "block" }
                    : { height: `${NAV_LOGO_HEIGHT}px`, width: "auto", maxWidth: "100%", display: "block" }
                }
              />
            </NavLink>,
          )}
        </Stack>
        <Stack direction="column" component="nav" sx={{ gap: "4px" }}>
          {menuItems.map((item) => {
            const { label, to, icon: Icon, iconColor, image, subItems } = item;
            const hasSubItems = subItems != null && subItems.length > 0;

            // Shared row style; collapsed centers the icon and hides the label.
            //
            // The active row is a plaque: a CSS moss plate plus a three-sliced
            // gilt cap. The cap is dropped when collapsed — with no label there
            // is nothing for it to terminate, and at 40px of content it would
            // land on the icon.
            const rowSx = (active: boolean) => ({
              position: "relative",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : "12px",
              padding: "10px 12px",
              borderRadius: `${RADIUS.md}px`,
              cursor: "pointer",
              color: active ? NAV.textActive : NAV.text,
              fontWeight: active ? 600 : 500,
              transition: "background-color 0.15s ease, color 0.15s ease",
              ...(active
                ? {
                    overflow: "hidden",
                    background: `linear-gradient(180deg, ${PLAQUE.lift} 0%, ${PLAQUE.fill} 22%, ${PLAQUE.fill} 78%, ${PLAQUE.lift} 100%)`,
                    boxShadow: [
                      `inset 0 1px 0 rgb(${PLAQUE.rim} / ${PLAQUE.rimAlpha})`,
                      `inset 0 -1px 0 rgb(${PLAQUE.rim} / ${PLAQUE.rimAlpha * 0.8})`,
                      "0 1px 3px rgba(0, 0, 0, 0.55)",
                    ].join(", "),
                    ...(collapsed
                      ? {}
                      : {
                          paddingRight: `${PLAQUE.cap.width + 6}px`,
                          "&::after": {
                            content: '""',
                            position: "absolute",
                            top: 0,
                            bottom: -1,
                            right: 0,
                            width: `${PLAQUE.cap.width}px`,
                            borderStyle: "solid",
                            borderWidth: `${PLAQUE.cap.rimWidth}px 0`,
                            borderImage: `url(${PLAQUE.cap.art}) ${PLAQUE.cap.slice} fill`,
                          },
                        }),
                  }
                : { "&:hover": { backgroundColor: NAV.hover, color: NAV.textActive } }),
            });
            // Raster art wins over the glyph when a row supplies it. Shared so
            // the two render branches below cannot drift apart.
            const glyph = image ? (
              <SmallIcon name={image} />
            ) : (
              <Icon fontSize="medium" htmlColor={iconColor} />
            );
            // When collapsed, a tooltip stands in for the hidden label.
            const withTip = (node: React.ReactElement) =>
              collapsed ? (
                <Tooltip key={label} title={label} placement="right">
                  {node}
                </Tooltip>
              ) : (
                node
              );

            // Items with subItems open a flyout Menu; the rest navigate directly.
            if (hasSubItems) {
              const isOpen = submenu?.items === subItems;
              return withTip(
                <Stack
                  key={label}
                  direction="row"
                  onClick={(e) => setSubmenu({ anchor: e.currentTarget, items: subItems })}
                  sx={rowSx(isOpen || sectionActive(item))}
                >
                  {glyph}
                  {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                  {!collapsed && <ChevronRightRoundedIcon fontSize="small" />}
                </Stack>,
              );
            }

            return (
              <NavLink
                key={label}
                to={to ?? "/"}
                style={{ textDecoration: "none" }}
                children={({ isActive }) =>
                  withTip(
                    <Stack direction="row" sx={rowSx(isActive)}>
                      {glyph}
                      {!collapsed && <span>{label}</span>}
                    </Stack>,
                  )
                }
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
          <Stack
            direction="row"
            sx={{
              padding: "10px 12px",
              borderRadius: `${RADIUS.md}px`,
              backgroundColor: NAV.hover,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            {collapsed ? (
              <PlayerAvatar username={player?.username ?? ""} avatarKey={player?.avatarKey} size={32} />
            ) : (
              <PlayerBadge
                username={player?.username ?? ""}
                avatarKey={player?.avatarKey}
                rating={player?.rating}
                size={32}
              />
            )}
          </Stack>
          <Stack
            direction={collapsed ? "column" : "row"}
            sx={{
              justifyContent: collapsed ? "center" : "space-between",
              alignItems: "center",
              gap: "5px",
              marginTop: "-5px",
              marginLeft: collapsed ? "0px" : "10px",
              marginRight: collapsed ? "0px" : "10px",
            }}
          >
            {railTip(
              "Friends",
              <IconButton
                onClick={() => {
                  setFriendsTab("friends");
                  setFriendsOpen(true);
                }}
                aria-label="Friends"
              >
                <SmallIcon name="friends" />
              </IconButton>,
            )}
            <MessagesButton tooltip={collapsed ? "Messages" : undefined} />
            <NotificationsBell
              tooltip={collapsed ? "Notifications" : undefined}
              onNavigate={(target) => {
                setFriendsTab(target);
                setFriendsOpen(true);
              }}
            />
            {railTip(
              "Settings",
              <IconButton
                aria-label="Settings"
                onClick={(e) =>
                  setSubmenu({
                    anchor: e.currentTarget,
                    items: settingsMenuItems,
                    anchorOrigin: { vertical: "top", horizontal: "center" },
                    transformOrigin: { vertical: "bottom", horizontal: "center" },
                  })
                }
              >
                <SmallIcon name="settings" />
              </IconButton>,
            )}
          </Stack>
        </Stack>
      ) : (
        <Stack direction="column" sx={{ gap: "10px", marginLeft: "10px", marginRight: "10px" }}>
          <Button id="login-button" type="primary" label="Log In" onClick={() => setLoginOpen(true)} />
          <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
          <Button
            id="signup-button"
            type="primary"
            style={{ backgroundColor: CTA_SECONDARY }}
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
                  borderRadius: `${RADIUS.md}px`,
                  color: isActive ? NAV.textActive : NAV.text,
                  backgroundColor: isActive ? NAV.active : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  "&:hover": {
                    backgroundColor: NAV.hover,
                    color: NAV.textActive,
                  },
                }}
              >
                <Icons.help fontSize="small" htmlColor={ACCENT_PRIMARY} />
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
