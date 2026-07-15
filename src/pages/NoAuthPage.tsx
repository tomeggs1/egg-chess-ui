import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Button } from "../components/Button";
import {
  MAIN_BLUE_LIGHT,
  MAIN_PURPLE,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

export default function NoAuthPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: { xs: 4, md: 8 } }}>
      <Box
        sx={{
          maxWidth: 440,
          width: "100%",
          p: 4,
          textAlign: "center",
          borderRadius: "18px",
          backgroundColor: SURFACE_800,
          border: `1px solid ${SURFACE_BORDER}`,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: `linear-gradient(135deg, ${MAIN_BLUE_LIGHT}, ${MAIN_PURPLE})`,
            boxShadow: "0 10px 24px rgba(96, 2, 197, 0.45)",
          }}
        >
          <LockOutlinedIcon fontSize="large" />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY, mb: 1 }}>
          Sign in required
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY, mb: 3, lineHeight: 1.6 }}>
          You need to be logged in to play a game or view your stats and game history. Use the{" "}
          <Box component="span" sx={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
            Log In
          </Box>{" "}
          button in the sidebar to sign in, or head back home.
        </Typography>

        <Stack direction="row" sx={{ gap: "10px", justifyContent: "center" }}>
          <Button
            id="noauth-home"
            type="primary"
            label="Back to Home"
            onClick={() => navigate("/")}
            style={{ backgroundColor: MAIN_PURPLE, padding: "10px 20px" }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
