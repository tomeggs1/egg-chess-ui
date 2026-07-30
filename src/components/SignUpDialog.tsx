import { useState, type FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Button as MuiButton,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
// The nav crest, not the older HPChessLogo — so the sidebar and the sign-in
// dialogs show the same mark. Trimmed WebP; see scripts/trim-image.py.
import AppLogo from "../assets/images/hp-chess-nav-logo.webp";
import { register } from "../api/auth";
import { ApiError } from "../api/client";
import { Button } from "./Button";
import { GameDialog } from "./GameDialog";
import { AvatarPicker } from "./AvatarPicker";
import { COUNTRIES } from "../data/countries";
import {
  APP_NAME,
  CTA_SECONDARY,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";

type Status = "idle" | "submitting" | "success" | "error";

interface SignUpDialogProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm = {
  username: "",
  password: "",
  email: "",
  firstName: "",
  lastName: "",
  country: "",
};

const DIALOG_FORM_ID = "signup-form";

export default function SignUpDialog({ open, onClose }: SignUpDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const busy = status === "submitting" || status === "success";

  const update = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function handleClose() {
    if (status === "submitting") return;
    setForm(emptyForm);
    setAvatarKey(null);
    setStatus("idle");
    setMessage("");
    setShowPassword(false);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      // Send only the fields the user filled in; omit empty optionals so the
      // service's @Email/@Size checks don't fire on blank strings.
      await register({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        country: form.country || undefined,
        avatarKey: avatarKey ?? undefined,
      });
      setStatus("success");
      setMessage("Account created. You can now log in.");
    } catch (error) {
      setStatus("error");
      let detail: string;
      if (error instanceof ApiError) {
        // Prefer the message the service returned; fall back to status-based text.
        detail = error.detail ?? `Sign up failed (${error.status}).`;
      } else {
        detail = "Could not reach the service.";
      }
      setMessage(detail);
    }
  }

  return (
    <GameDialog
      open={open}
      onClose={handleClose}
      closeDisabled={busy}
      emblem={AppLogo}
      title="Create your account"
      subtitle={`Join ${APP_NAME} and start playing`}
    >
        <form id={DIALOG_FORM_ID} onSubmit={handleSubmit}>
          <Stack direction="column" sx={{ gap: "16px", mt: 1 }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              slotProps={{
                htmlInput: { minLength: 4, maxLength: 50 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
                    </InputAdornment>
                  ),
                },
              }}
              required
              disabled={busy}
              fullWidth
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
              helperText="At least 8 characters."
              slotProps={{
                htmlInput: { minLength: 8, maxLength: 100 },
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
                        disabled={busy}
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
              disabled={busy}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
              slotProps={{
                htmlInput: { maxLength: 254 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon fontSize="small" sx={{ color: TEXT_MUTED }} />
                    </InputAdornment>
                  ),
                },
              }}
              required
              disabled={busy}
              fullWidth
            />
            <Stack direction="row" sx={{ gap: "12px" }}>
              <TextField
                label="First name"
                value={form.firstName}
                onChange={update("firstName")}
                autoComplete="given-name"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                required
                disabled={busy}
                fullWidth
              />
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={update("lastName")}
                autoComplete="family-name"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                required
                disabled={busy}
                fullWidth
              />
            </Stack>
            <Autocomplete
              options={COUNTRIES}
              value={form.country || null}
              onChange={(_event, value) => setForm((prev) => ({ ...prev, country: value ?? "" }))}
              disabled={busy}
              fullWidth
              sx={{
                "& .MuiAutocomplete-clearIndicator": { color: TEXT_MUTED },
                "& .MuiAutocomplete-popupIndicator": { color: TEXT_MUTED },
              }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: SURFACE_800,
                    color: TEXT_PRIMARY,
                    border: `1px solid ${SURFACE_BORDER}`,
                  },
                },
                listbox: {
                  sx: {
                    "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                    "& .MuiAutocomplete-option[aria-selected='true']": {
                      backgroundColor: "rgba(201, 162, 39, 0.20)",
                    },
                    "& .MuiAutocomplete-option.Mui-focused": {
                      backgroundColor: "rgba(201, 162, 39, 0.15)",
                    },
                  },
                },
              }}
              renderInput={(params) => (
                <TextField {...params} label="Country" autoComplete="country-name" required />
              )}
            />

            <AvatarPicker username={form.username} value={avatarKey} onChange={setAvatarKey} disabled={busy} />

            {message && (
              <Alert
                severity={status === "success" ? "success" : "error"}
                variant="outlined"
                sx={{
                  color: TEXT_PRIMARY,
                  borderColor: status === "success" ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
                  "& .MuiAlert-icon": { color: status === "success" ? "#22c55e" : "#ef4444" },
                }}
              >
                {message}
              </Alert>
            )}

            <Stack direction="row" sx={{ gap: "10px", justifyContent: "flex-end", mt: 0.5 }}>
              <MuiButton
                onClick={handleClose}
                disabled={status === "submitting"}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: TEXT_SECONDARY,
                  "&:hover": { color: TEXT_PRIMARY, backgroundColor: "rgba(255, 235, 190, 0.05)" },
                }}
              >
                {status === "success" ? "Close" : "Cancel"}
              </MuiButton>
              {status !== "success" && (
                <Button
                  id="signup-submit"
                  type="primary"
                  isSubmit
                  form={DIALOG_FORM_ID}
                  isDisabled={status === "submitting"}
                  label={status === "submitting" ? "Creating…" : "Sign Up"}
                  style={{ backgroundColor: CTA_SECONDARY, padding: "10px 24px" }}
                />
              )}
            </Stack>
          </Stack>
        </form>
    </GameDialog>
  );
}
