import { Box } from "@mui/material";
import { countryCode } from "../data/countries";

interface CountryFlagProps {
  /** Stored country display name (e.g. "Brazil"); null/unknown renders nothing. */
  country?: string | null;
  /** Rendered width in px; height follows the flag's ~4:3 ratio. */
  width?: number;
}

/**
 * A small country flag resolved from the stored country name. Uses flagcdn's
 * SVG-backed PNGs (with a 2x source for retina) rather than emoji flags, which
 * don't render on Windows browsers. Renders nothing when the country is absent
 * or can't be mapped to an ISO code, so callers can drop it in unconditionally.
 */
export function CountryFlag({ country, width = 22 }: CountryFlagProps) {
  const code = countryCode(country);
  if (!code) return null;
  return (
    <Box
      component="img"
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={country ?? ""}
      title={country ?? undefined}
      loading="lazy"
      sx={{
        width,
        height: "auto",
        display: "block",
        borderRadius: "2px",
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.25)",
      }}
    />
  );
}
