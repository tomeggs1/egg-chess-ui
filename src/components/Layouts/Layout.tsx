import { Outlet } from "react-router-dom";
import styles from "./Layout.module.css";
import Stack from "@mui/material/Stack";
import NavBar from "./NavBar";

export default function Layout() {
  return (
    <div className={styles.shell}>
      <Stack direction="row">
        <NavBar />

        <main className={styles.main}>
          <Outlet />
        </main>
      </Stack>
    </div>
  );
}
