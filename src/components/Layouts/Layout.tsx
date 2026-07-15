import { Outlet } from "react-router-dom";
import styles from "./Layout.module.css";
import Stack from "@mui/material/Stack";
import NavBar from "./NavBar";
import { useRealtime } from "../../hooks/useRealtime";
import { useAuth } from "../../auth/AuthContext";
import { ChallengeManager } from "../ChallengeManager";

export default function Layout() {
  // One WebSocket for live notifications + presence + challenges while signed in.
  useRealtime();
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.shell}>
      <Stack direction="row">
        <NavBar />

        <main className={styles.main}>
          <Outlet />
        </main>
      </Stack>
      {/* Interactive game-challenge prompts, wherever the user is. */}
      {isAuthenticated && <ChallengeManager />}
    </div>
  );
}
