import { NavLink, useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import ChessPlusPlusLogo from "../../assets/images/ChessPlusPlusLogoTrans.png";
import { ACCENT_BLUE, ACCENT_PURPLE, ACCENT_AMBER, ACCENT_GREEN, MAIN_PURPLE } from "../../constants";
import { Button } from "../Button";

type MenuItem = {
  label: string;
  to: string;
  icon: SvgIconComponent;
  iconColor?: string;
};

const menuItems: MenuItem[] = [
  { label: "Play Chess", to: "/play", icon: SportsEsportsRoundedIcon, iconColor: ACCENT_BLUE },
  { label: "Chess Puzzles", to: "/puzzles", icon: ExtensionRoundedIcon, iconColor: ACCENT_AMBER },
  { label: "Learn Chess", to: "/learn", icon: SchoolRoundedIcon, iconColor: ACCENT_PURPLE },
  { label: "Rankings", to: "/rankings", icon: LeaderboardRoundedIcon, iconColor: ACCENT_GREEN },
];

export default function NavBar() {
  const loggedIn = false;
  const navigate = useNavigate();

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
      }}
    >
      <Stack direction="column" sx={{ gap: "24px" }}>
        <Stack direction="column" sx={{ alignItems: "center" }}>
          <NavLink to="/" style={{ textDecoration: "none" }}>
            <img src={ChessPlusPlusLogo} alt="Chess++" style={{ width: "100%", marginTop: "0px" }} />
          </NavLink>
        </Stack>
        <Stack direction="column" component="nav" sx={{ gap: "4px" }}>
          {menuItems.map(({ label, to, icon: Icon, iconColor }) => (
            <NavLink
              key={to}
              to={to}
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
                  <Icon fontSize="small" htmlColor={iconColor} />
                  <span>{label}</span>
                </Stack>
              )}
            />
          ))}
        </Stack>
      </Stack>
      {loggedIn ? (
        <>Logged In!</>
      ) : (
        <Stack direction="column" sx={{ gap: "10px" }}>
          <Button id="login-button" type="primary" label="Log In" onClick={() => navigate("/login")} />
          <Button
            id="signup-button"
            type="primary"
            style={{ backgroundColor: MAIN_PURPLE }}
            label="Sign Up"
            onClick={() => navigate("/signup")}
          />
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
    </Stack>
  );
}
