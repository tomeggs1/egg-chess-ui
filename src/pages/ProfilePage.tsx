import { useEffect, useState, type FormEvent } from "react";
import { Alert, Autocomplete, Box, Divider, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { setAvatar, updateCurrentPlayer, type UpdatePlayerRequest } from "../api/auth";
import { ApiError } from "../api/client";
import { Button } from "../components/Button";
import { AvatarPicker } from "../components/AvatarPicker";
import { COUNTRIES } from "../data/countries";
import { ACCENT_BLUE, SURFACE_800, SURFACE_BORDER, TEXT_MUTED, TEXT_PRIMARY } from "../constants";

const FORM_ID = "profile-form";

type Status = "idle" | "saving" | "success" | "error";

const emptyForm = {
  email: "",
  firstName: "",
  lastName: "",
  country: "",
  password: "",
  currentPassword: "",
};

// Dark, glassy field styling to match the login/sign-up dialogs.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT_BLUE },
  // Keep the floating label legible on the dark card when the field is disabled
  // (MUI would otherwise use its near-black default disabled color).
  "& .MuiInputLabel-root.Mui-disabled": { color: TEXT_MUTED },
  "& .MuiFormHelperText-root": { color: TEXT_MUTED },
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: TEXT_MUTED },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitTextFillColor: TEXT_PRIMARY,
    WebkitBoxShadow: `0 0 0 100px ${SURFACE_800} inset`,
    caretColor: TEXT_PRIMARY,
  },
};

export default function ProfilePage() {
  const { player, loading, isAuthenticated, setPlayer } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  // Populate the form from the loaded player (and after each successful save).
  useEffect(() => {
    if (!player) return;
    setForm((prev) => ({
      ...prev,
      email: player.email ?? "",
      firstName: player.firstName ?? "",
      lastName: player.lastName ?? "",
      country: player.country ?? "",
    }));
    setAvatarKey(player.avatarKey ?? null);
  }, [player]);

  const update = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const changingPassword = form.password.length > 0;
    const payload: UpdatePlayerRequest = {
      email: form.email || undefined,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      country: form.country || undefined,
      ...(changingPassword ? { password: form.password, currentPassword: form.currentPassword } : {}),
    };

    try {
      let updated = await updateCurrentPlayer(payload);
      // Avatar has its own endpoint; only call it when the choice changed.
      if ((avatarKey ?? null) !== (player?.avatarKey ?? null)) {
        updated = await setAvatar(avatarKey);
      }
      setPlayer(updated);
      setStatus("success");
      setMessage("Profile updated.");
      // Never keep entered passwords around after a save.
      setForm((prev) => ({ ...prev, password: "", currentPassword: "" }));
    } catch (error) {
      setStatus("error");
      const detail =
        error instanceof ApiError
          ? (error.detail ?? `Update failed (${error.status}).`)
          : "Could not reach the service.";
      setMessage(detail);
    }
  }

  if (loading) {
    return (
      <section>
        <h1>Profile</h1>
        <p>Loading…</p>
      </section>
    );
  }

  if (!isAuthenticated || !player) {
    return (
      <section>
        <h1>Profile</h1>
        <p>Please log in to view and edit your profile.</p>
      </section>
    );
  }

  const saving = status === "saving";

  return (
    <section>
      <h1>Profile</h1>
      <p>Update your account details.</p>

      <Box
        sx={{
          maxWidth: 520,
          mt: 2,
          p: 3,
          borderRadius: "16px",
          backgroundColor: SURFACE_800,
          border: `1px solid ${SURFACE_BORDER}`,
        }}
      >
        <form id={FORM_ID} onSubmit={handleSubmit}>
          <Stack direction="column" sx={{ gap: "16px" }}>
            <TextField label="Username" value={player.username} disabled fullWidth sx={fieldSx} />
            <AvatarPicker
              username={player.username}
              value={avatarKey}
              onChange={setAvatarKey}
              disabled={saving}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
              slotProps={{ htmlInput: { maxLength: 254 } }}
              disabled={saving}
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
                disabled={saving}
                fullWidth
                sx={fieldSx}
              />
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={update("lastName")}
                autoComplete="family-name"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                disabled={saving}
                fullWidth
                sx={fieldSx}
              />
            </Stack>
            <Autocomplete
              options={COUNTRIES}
              value={form.country || null}
              onChange={(_event, value) => setForm((prev) => ({ ...prev, country: value ?? "" }))}
              disabled={saving}
              fullWidth
              sx={{
                "& .MuiAutocomplete-clearIndicator": { color: TEXT_MUTED },
                "& .MuiAutocomplete-popupIndicator": { color: TEXT_MUTED },
              }}
              slotProps={{
                paper: { sx: { bgcolor: SURFACE_800, color: TEXT_PRIMARY, border: `1px solid ${SURFACE_BORDER}` } },
                listbox: {
                  sx: {
                    "& .MuiAutocomplete-option.Mui-focused": { backgroundColor: "rgba(77, 141, 255, 0.15)" },
                    "& .MuiAutocomplete-option[aria-selected='true']": { backgroundColor: "rgba(77, 141, 255, 0.20)" },
                  },
                },
              }}
              renderInput={(params) => <TextField {...params} label="Country" sx={fieldSx} />}
            />

            <Divider sx={{ borderColor: SURFACE_BORDER, mt: 1 }} />
            <Typography variant="subtitle2" sx={{ color: TEXT_PRIMARY }}>
              Change password
            </Typography>
            <TextField
              label="New password"
              type="password"
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
              helperText="Leave blank to keep your current password. At least 8 characters."
              slotProps={{ htmlInput: { minLength: 8, maxLength: 100 } }}
              disabled={saving}
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="Current password"
              type="password"
              value={form.currentPassword}
              onChange={update("currentPassword")}
              autoComplete="current-password"
              helperText="Required to change your password."
              // Only required when the user is actually setting a new password.
              required={form.password.length > 0}
              disabled={saving}
              fullWidth
              sx={fieldSx}
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

            <Box>
              <Button
                id="profile-save"
                type="primary"
                isSubmit
                form={FORM_ID}
                isDisabled={saving}
                label={saving ? "Saving…" : "Save changes"}
                style={{ padding: "10px 24px" }}
              />
            </Box>
          </Stack>
        </form>
      </Box>
    </section>
  );
}
