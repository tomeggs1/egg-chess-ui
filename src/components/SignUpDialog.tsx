import { useState, type FormEvent } from "react";
import { APP_NAME } from "../constants";
import { Alert, Autocomplete, Dialog, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { register } from "../api/auth";
import { ApiError } from "../api/client";
import { Button } from "./Button";
import { MAIN_PURPLE } from "../constants";
import { COUNTRIES } from "../data/countries";

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
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const update = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function handleClose() {
    if (status === "submitting") return;
    setForm(emptyForm);
    setStatus("idle");
    setMessage("");
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
      });
      setStatus("success");
      setMessage("Account created. You can now <b>log in.</b>");
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
      sx={{ "& .MuiDialog-paper": { backgroundColor: "#ffffff", borderRadius: "8px" } }}
    >
      <DialogTitle>Create your {APP_NAME} account</DialogTitle>
      <DialogContent>
        <form id={DIALOG_FORM_ID} onSubmit={handleSubmit}>
          <Stack direction="column" sx={{ gap: "16px", marginTop: "8px" }}>
            <TextField
              label="Username"
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              slotProps={{ htmlInput: { minLength: 4, maxLength: 50 } }}
              required
              disabled={status === "submitting" || status === "success"}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
              helperText="At least 8 characters."
              slotProps={{ htmlInput: { minLength: 8, maxLength: 100 } }}
              required
              disabled={status === "submitting" || status === "success"}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
              slotProps={{ htmlInput: { maxLength: 254 } }}
              required
              disabled={status === "submitting" || status === "success"}
              fullWidth
            />
            <Stack direction="row" sx={{ gap: "12px" }}>
              <TextField
                label="First name"
                value={form.firstName}
                onChange={update("firstName")}
                autoComplete="given-name"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                fullWidth
                required
                disabled={status === "submitting" || status === "success"}
              />
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={update("lastName")}
                autoComplete="family-name"
                slotProps={{ htmlInput: { maxLength: 100 } }}
                fullWidth
                required
                disabled={status === "submitting" || status === "success"}
              />
            </Stack>
            <Autocomplete
              options={COUNTRIES}
              value={form.country || null}
              onChange={(_event, value) => setForm((prev) => ({ ...prev, country: value ?? "" }))}
              fullWidth
              disabled={status === "submitting" || status === "success"}
              renderInput={(params) => <TextField {...params} label="Country" autoComplete="country-name" required />}
            />

            {message && <Alert severity={status === "success" ? "success" : "error"}>{message}</Alert>}

            <Stack direction="row" sx={{ gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
              <Button
                id="signup-cancel"
                type="secondary"
                label={status === "success" ? "Close" : "Cancel"}
                onClick={handleClose}
              />
              <Button
                id="signup-submit"
                type="primary"
                style={{ backgroundColor: MAIN_PURPLE, display: status === "success" ? "none" : "inline-flex" }}
                isSubmit
                form={DIALOG_FORM_ID}
                isDisabled={status === "submitting"}
                label={status === "submitting" ? "Creating…" : "Sign Up"}
              />
            </Stack>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
