import { useEffect, useState, type FormEvent } from "react";
import { Alert, Autocomplete, Box, Divider, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { setAvatar, updateCurrentPlayer, type UpdatePlayerRequest } from "../api/auth";
import { ApiError } from "../api/client";
import { Button } from "../components/Button";
import { AvatarPicker } from "../components/AvatarPicker";
import { COUNTRIES } from "../data/countries";
import ProfileEmblem from "../assets/images/profile-large.webp";
import { COLOR_ERROR, COLOR_SUCCESS, SURFACE_800, SURFACE_BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

const FORM_ID = "profile-form";

/**
 * Page header: emblem, title, subtitle.
 *
 * Shared by the loading, signed-out and loaded states so the page does not
 * reflow as auth resolves — all three previously rendered their own raw <h1>.
 */
function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 2, mb: 3 }}>
      <Box
        component="img"
        src={ProfileEmblem}
        alt=""
        aria-hidden
        sx={{ width: 72, height: 72, flexShrink: 0, objectFit: "contain", display: "block" }}
      />
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
          Profile
        </Typography>
        <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

type Status = "idle" | "saving" | "success" | "error";

const emptyForm = {
  email: "",
  firstName: "",
  lastName: "",
  country: "",
  password: "",
  currentPassword: "",
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
        <PageHeader subtitle="Loading…" />
      </section>
    );
  }

  if (!isAuthenticated || !player) {
    return (
      <section>
        <PageHeader subtitle="Please log in to view and edit your profile." />
      </section>
    );
  }

  const saving = status === "saving";

  return (
    <section>
      <PageHeader subtitle="Update your account details." />

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
            <TextField label="Username" value={player.username} disabled fullWidth />
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
              />
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={update("lastName")}
                autoComplete="family-name"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                disabled={saving}
                fullWidth
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
                listbox: {
                  sx: {
                    "& .MuiAutocomplete-option.Mui-focused": { backgroundColor: "rgba(201, 162, 39, 0.15)" },
                    "& .MuiAutocomplete-option[aria-selected='true']": { backgroundColor: "rgba(201, 162, 39, 0.20)" },
                  },
                },
              }}
              renderInput={(params) => <TextField {...params} label="Country" />}
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
            />

            {message && (
              <Alert
                severity={status === "success" ? "success" : "error"}
                variant="outlined"
                sx={{
                  color: TEXT_PRIMARY,
                  // Was hardcoded #22c55e / #ef4444 — the latter is the
                  // pre-medieval error red, which now sits on HP's hue.
                  borderColor: status === "success" ? COLOR_SUCCESS : COLOR_ERROR,
                  "& .MuiAlert-icon": { color: status === "success" ? COLOR_SUCCESS : COLOR_ERROR },
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
