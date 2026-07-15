import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Checkbox,
  Dialog,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ChessPlusPlusLogo from "../assets/images/ChessPlusPlusLogoTrans.png";
import { Button } from "./Button";
import { login } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  ACCENT_BLUE,
  ACCENT_PURPLE,
  APP_NAME,
  MAIN_BLUE_LIGHT,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const DIALOG_FORM_ID = "login-form";
const emptyForm = {
  username: "",
  password: "",
  rememberMe: false,
};

// Persisted across sessions when "Remember me" is checked, so the login dialog
// can pre-fill the username on the next visit.
const REMEMBERED_USERNAME_KEY = APP_NAME + ":rememberedUsername";

function loadRememberedUsername(): string {
  try {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? "";
  } catch {
    // Storage can be unavailable (e.g. private mode); fall back to no memory.
    return "";
  }
}

function saveRememberedUsername(username: string) {
  try {
    localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
  } catch {
    // Ignore storage failures — remembering is a convenience, not critical.
  }
}

function clearRememberedUsername() {
  try {
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  } catch {
    // Ignore storage failures.
  }
}

// Shared styling for the dark, glassy text fields.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE, borderWidth: "1.5px" },
    "&.Mui-focused": { boxShadow: `0 0 0 4px rgba(77, 141, 255, 0.12)` },
  },
  "& .MuiInputLabel-root": { color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT_BLUE },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitTextFillColor: TEXT_PRIMARY,
    WebkitBoxShadow: `0 0 0 100px ${SURFACE_800} inset`,
    caretColor: TEXT_PRIMARY,
  },
};

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { onLoginSuccess } = useAuth();
  const navigate = useNavigate();

  // When the dialog opens, pre-fill the remembered username (and check the box)
  // so a returning user only has to type their password.
  useEffect(() => {
    if (!open) return;
    const remembered = loadRememberedUsername();
    setForm({ username: remembered, password: "", rememberMe: Boolean(remembered) });
    setMessage("");
    setShowPassword(false);
  }, [open]);

  function handleClose() {
    if (submitting) return;
    setMessage("");
    setForm(emptyForm);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setMessage("");

    // Persist (or forget) the username based on the checkbox before attempting
    // to authenticate, so the preference sticks even across failed logins.
    if (form.rememberMe) {
      saveRememberedUsername(form.username);
    } else {
      clearRememberedUsername();
    }

    setSubmitting(true);
    try {
      const result = await login({ username: form.username, password: form.password });
      onLoginSuccess(result);
      setSubmitting(false);
      handleClose();
      navigate("/dashboard");
    } catch (error) {
      setSubmitting(false);
      const detail =
        error instanceof ApiError
          ? error.detail ?? `Login failed (${error.status}).`
          : "Could not reach the service.";
      setMessage(detail);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
        sx={{
          height: "3px",
          background: `linear-gradient(90deg, ${MAIN_BLUE_LIGHT}, ${ACCENT_PURPLE})`,
        }}
      />

      <IconButton
        aria-label="Close"
        onClick={handleClose}
        disabled={submitting}
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

      {/* Header with a faint chessboard pattern and a king emblem. */}
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
        <Stack direction="column" sx={{ position: "relative", alignItems: "center", gap: 1.25 }}>
          <Box
            component="img"
            src={ChessPlusPlusLogo}
            alt={APP_NAME}
            sx={{ width: 100, height: "auto", display: "block" }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
            Sign in to continue to {APP_NAME}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <form id={DIALOG_FORM_ID} onSubmit={handleSubmit}>
          <Stack direction="column" sx={{ gap: "16px", mt: 1 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              autoComplete="username"
              slotProps={{
                htmlInput: { maxLength: 50 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
                    </InputAdornment>
                  ),
                },
              }}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              autoComplete="current-password"
              slotProps={{
                htmlInput: { maxLength: 100 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        sx={{ color: TEXT_MUTED, "&:hover": { color: TEXT_PRIMARY } }}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              required
              fullWidth
              sx={fieldSx}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.rememberMe}
                  onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  sx={{ color: TEXT_MUTED, "&.Mui-checked": { color: ACCENT_BLUE } }}
                />
              }
              label="Remember me"
              sx={{ mt: "-6px", "& .MuiFormControlLabel-label": { color: TEXT_SECONDARY, fontSize: "0.9rem" } }}
            />

            {message && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  color: TEXT_PRIMARY,
                  borderColor: "rgba(239, 68, 68, 0.5)",
                  "& .MuiAlert-icon": { color: "#ef4444" },
                }}
              >
                {message}
              </Alert>
            )}

            <Button
              id="login-submit"
              type="primary"
              isSubmit
              form={DIALOG_FORM_ID}
              isDisabled={submitting}
              label={submitting ? "Signing in…" : "Log In"}
              style={{ width: "100%", padding: "10px 16px", marginTop: "4px" }}
            />
          </Stack>
        </form>
      </Box>
    </Dialog>
  );
}
