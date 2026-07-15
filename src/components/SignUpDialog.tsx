import { useState, type FormEvent } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button as MuiButton,
  Dialog,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ChessPlusPlusLogo from "../assets/images/ChessPlusPlusLogoTrans.png";
import { register } from "../api/auth";
import { ApiError } from "../api/client";
import { Button } from "./Button";
import { AvatarPicker } from "./AvatarPicker";
import { COUNTRIES } from "../data/countries";
import {
  ACCENT_BLUE,
  ACCENT_PURPLE,
  APP_NAME,
  MAIN_BLUE_LIGHT,
  MAIN_PURPLE,
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
  "& .MuiFormHelperText-root": { color: TEXT_MUTED },
  // Keep disabled fields legible on the dark surface (used while submitting).
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-disabled": { color: TEXT_MUTED },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitTextFillColor: TEXT_PRIMARY,
    WebkitBoxShadow: `0 0 0 100px ${SURFACE_800} inset`,
    caretColor: TEXT_PRIMARY,
  },
};

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
        disabled={status === "submitting"}
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

      {/* Header with a faint chessboard pattern and the Chess++ logo. */}
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
            Create your account
          </Typography>
          <Typography variant="body2" sx={{ color: TEXT_SECONDARY, textAlign: "center" }}>
            Join {APP_NAME} and start playing
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
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
              sx={fieldSx}
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
              sx={fieldSx}
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
              sx={fieldSx}
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
                sx={fieldSx}
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
                sx={fieldSx}
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
                      backgroundColor: "rgba(77, 141, 255, 0.20)",
                    },
                    "& .MuiAutocomplete-option.Mui-focused": {
                      backgroundColor: "rgba(77, 141, 255, 0.15)",
                    },
                  },
                },
              }}
              renderInput={(params) => (
                <TextField {...params} label="Country" autoComplete="country-name" required sx={fieldSx} />
              )}
            />

            <AvatarPicker
              username={form.username}
              value={avatarKey}
              onChange={setAvatarKey}
              disabled={busy}
            />

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
                  "&:hover": { color: TEXT_PRIMARY, backgroundColor: "rgba(255, 255, 255, 0.05)" },
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
                  style={{ backgroundColor: MAIN_PURPLE, padding: "10px 24px" }}
                />
              )}
            </Stack>
          </Stack>
        </form>
      </Box>
    </Dialog>
  );
}
