// Avatar catalog. The frontend owns this list (the backend stores the chosen
// `key` as an opaque, slug-shaped token). Each preset is a circular medallion
// image under assets/images/avatars; the `key` is the image's file stem and is
// what gets persisted as `avatar_key`.

import { ACCENTS } from "../constants";

export interface AvatarPreset {
  /** Persisted key; the image file stem (e.g. "knight-blue"). */
  key: string;
  /** Human-readable name for the picker. */
  label: string;
  /** Resolved image URL. */
  src: string;
}

// Eagerly import every avatar image; Vite resolves each to its URL string.
const images = import.meta.glob("../assets/images/avatars/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// Map file stem -> resolved URL, so presets can be declared by key alone.
const srcByKey: Record<string, string> = {};
for (const [path, url] of Object.entries(images)) {
  const stem =
    path
      .split("/")
      .pop()
      ?.replace(/\.png$/, "") ?? "";
  srcByKey[stem] = url;
}

// Declared key -> label. Keys must match a file stem in the avatars folder;
// any without a matching image are dropped from AVATAR_PRESETS below.
const AVATAR_LABELS: Record<string, string> = {
  "knight-blue": "Knight",
  "king-blue": "King",
  "queen-blue": "Queen",
  "rook-purple": "Rook",
  "lion-purple": "Lion",
  "griffin-blue": "Griffin",
  "dogs-purple": "Dogs",
  "emblem-purple": "Emblem",
  "anchor-blue": "Anchor",
  "compass-purple": "Compass",
  "globe-blue": "Globe",
  "lighthouse-blue": "Lighthouse",
  "keyhole-blue": "Keyhole",
  "wheel-purple": "Wheel",
  "book-purple": "Book",
  "torch-blue": "Torch",
  "treasure-purple": "Treasure",
  "triangle-eye-blue": "All-Seeing Eye",
  "justice-purple": "Justice",
  "sword-purple": "Sword",
  "mace-blue": "Mace",
  "hammer-purple": "Hammer",
  "fist-blue": "Fist",
  "fist2-blue": "Fist II",
  "fist3-blue": "Fist III",
  "guns-blue": "Guns",
};

export const AVATAR_PRESETS: AvatarPreset[] = Object.entries(AVATAR_LABELS)
  .filter(([key]) => srcByKey[key])
  .map(([key, label]) => ({ key, label, src: srcByKey[key] }));

export const AVATAR_PRESETS_BY_KEY: Record<string, AvatarPreset> = Object.fromEntries(
  AVATAR_PRESETS.map((preset) => [preset.key, preset]),
);

// Deterministic accent color for the initials fallback (players with no chosen
// avatar), so a given name always gets the same color.
export function fallbackColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}
