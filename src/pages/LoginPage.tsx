import { useState, type FormEvent } from "react";
import { login } from "../api/auth";
import { ApiError } from "../api/client";
import styles from "./LoginPage.module.css";
import { Typography } from "@mui/material";
import { CTA_PRIMARY, TEXT_PRIMARY } from "../constants";

type Status = "idle" | "submitting" | "success" | "error";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      await login({ username, password });
      setStatus("success");
      setMessage("Logged in.");
    } catch (error) {
      setStatus("error");
      const detail = error instanceof ApiError ? `Login failed (${error.status}).` : "Could not reach the service.";
      setMessage(detail);
    }
  }

  return (
    <section className={styles.wrapper}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY, mb: 1 }}>
        Login
      </Typography>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" disabled={status === "submitting"} style={{ backgroundColor: CTA_PRIMARY }}>
          {status === "submitting" ? "Signing in…" : "Log in"}
        </button>
      </form>
      {message && <p className={status === "error" ? styles.error : styles.success}>{message}</p>}
    </section>
  );
}
