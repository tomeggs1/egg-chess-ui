import { useEffect, useState, type FormEvent } from "react";
import { APP_NAME } from "../constants";
import { Alert, Checkbox, Dialog, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

import { Button } from "./Button";
import { MAIN_PURPLE } from "../constants";

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

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  // When the dialog opens, pre-fill the remembered username (and check the box)
  // so a returning user only has to type their password.
  useEffect(() => {
    if (!open) return;
    const remembered = loadRememberedUsername();
    setForm({ username: remembered, password: "", rememberMe: Boolean(remembered) });
    setMessage("");
  }, [open]);

  function handleClose() {
    setMessage("");
    setForm(emptyForm);
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    // Persist (or forget) the username based on the checkbox before attempting
    // to authenticate, so the preference sticks even across failed logins.
    if (form.rememberMe) {
      saveRememberedUsername(form.username);
    } else {
      clearRememberedUsername();
    }

    try {
    } catch (error) {}
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      sx={{ "& .MuiDialog-paper": { backgroundColor: "#ffffff", borderRadius: "8px" } }}
    >
      <DialogTitle>Log in to {APP_NAME}</DialogTitle>
      <DialogContent>
        <form id={DIALOG_FORM_ID} onSubmit={handleSubmit}>
          <Stack direction="column" sx={{ gap: "16px", marginTop: "8px" }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              autoComplete="username"
              slotProps={{ htmlInput: { maxLength: 50 } }}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              autoComplete="password"
              slotProps={{ htmlInput: { maxLength: 100 } }}
              required
              fullWidth
            />
            <Stack direction="row" sx={{ gap: "5px", justifyContent: "flex-start", marginTop: "-10px" }}>
              <Checkbox
                checked={form.rememberMe}
                onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                sx={{ alignSelf: "center" }}
              />
              <Typography variant="body2" sx={{ alignSelf: "center" }}>
                Remember me
              </Typography>
            </Stack>

            {message && <Alert severity="error">{message}</Alert>}

            <Stack direction="row" sx={{ gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
              <Button id="login-cancel" type="secondary" label="Cancel" onClick={handleClose} />
              <Button
                id="login-submit"
                type="primary"
                style={{ backgroundColor: MAIN_PURPLE }}
                isSubmit
                form={DIALOG_FORM_ID}
                isDisabled={false}
                label="Log In"
              />
            </Stack>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
