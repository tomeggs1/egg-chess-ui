import { Link } from "react-router-dom";
import { Stack, Typography } from "@mui/material";
import { ACCENT_PRIMARY, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

export default function NotFoundPage() {
  return (
    <Stack direction="column" sx={{ gap: 1, alignItems: "flex-start" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
        404
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
        That page doesn’t exist.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <Link to="/" style={{ color: ACCENT_PRIMARY }}>
          Back home
        </Link>
      </Typography>
    </Stack>
  );
}
