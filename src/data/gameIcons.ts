import standardChessIcon from "../assets/images/standardChessIcon.png";
import norooksChessIcon from "../assets/images/norook.webp";
import hordeChessIcon from "../assets/images/Horde.png";

/**
 * Built-in game icons, keyed by stable preset name. A game definition stores the
 * key as `preset:<key>` in `icon_ref`; this registry owns the actual (build-
 * hashed) asset import, so the stored reference never goes stale across builds.
 */
const PRESET_ICONS: Record<string, string> = {
  standard: standardChessIcon,
  "no-rooks": norooksChessIcon,
  horde: hordeChessIcon,
};

const PRESET_PREFIX = "preset:";

/**
 * Resolve a game definition's `icon_ref` to a displayable image URL. Schemes:
 *  - `preset:<key>` → a built-in icon from the registry
 *  - `http(s)://…`  → used as-is (e.g. a hosted image)
 *  - `upload:<id>`  → reserved for user-uploaded images once that pipeline exists
 *
 * Returns undefined when unset or unresolvable, so the caller can show a fallback.
 */
export function resolveGameIcon(iconRef: string | null | undefined): string | undefined {
  if (!iconRef) return undefined;
  if (iconRef.startsWith(PRESET_PREFIX)) return PRESET_ICONS[iconRef.slice(PRESET_PREFIX.length)];
  if (iconRef.startsWith("http://") || iconRef.startsWith("https://")) return iconRef;
  return undefined;
}

export { PRESET_ICONS };
