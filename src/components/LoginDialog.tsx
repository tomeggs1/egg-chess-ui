import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
// The nav crest, not the older HPChessLogo — so the sidebar and the sign-in
// dialogs show the same mark. Trimmed WebP; see scripts/trim-image.py.
import AppLogo from "../assets/images/hp-chess-nav-logo.webp";
import { GameDialog } from "./GameDialog";
import { Button } from "./Button";
import { login } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  ACCENT_PRIMARY,
  APP_NAME,
  STORAGE_PREFIX,
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
const REMEMBERED_USERNAME_KEY = STORAGE_PREFIX + ":rememberedUsername";

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
          ? (error.detail ?? `Login failed (${error.status}).`)
          : "Could not reach the service.";
      setMessage(detail);
    }
  }

  return (
    <GameDialog
      open={open}
      onClose={handleClose}
      closeDisabled={submitting}
      emblem={AppLogo}
      title="Welcome back"
      subtitle={`Sign in to continue to ${APP_NAME}`}
    >
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
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.rememberMe}
                  onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  sx={{ color: TEXT_MUTED, "&.Mui-checked": { color: ACCENT_PRIMARY } }}
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
    </GameDialog>
  );
}
