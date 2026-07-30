import FriendsSmall from "../assets/images/small-icons/friends-small.webp";
import LearnSmall from "../assets/images/small-icons/learn-small.webp";
import MessagesSmall from "../assets/images/small-icons/messages-small.webp";
import NotificationsSmall from "../assets/images/small-icons/notifications-small.webp";
import PlaySmall from "../assets/images/small-icons/play-small.webp";
import PuzzleSmall from "../assets/images/small-icons/puzzle-small.webp";
import RankingsSmall from "../assets/images/small-icons/rankings-small.webp";
import SettingsSmall from "../assets/images/small-icons/settings-small.webp";

/**
 * Painted crests for the nav bar, deliberately OUTSIDE the icon framework in
 * `src/icons`.
 *
 * That framework exists to make monochrome glyphs tintable and to give them a
 * shared gradient treatment. These are finished raster art with their own
 * lighting and gold, so none of that applies — no `iconColor`, no gradient, no
 * role registry. They are cut from screenshots by
 * `scripts/cutout-small-icons.py`; regenerate with that, not by hand.
 *
 * Every source is squared and centred to a common canvas, so one size renders
 * them all consistently without per-icon nudging.
 */
const ART = {
  friends: FriendsSmall,
  learn: LearnSmall,
  messages: MessagesSmall,
  notifications: NotificationsSmall,
  play: PlaySmall,
  puzzle: PuzzleSmall,
  rankings: RankingsSmall,
  settings: SettingsSmall,
} as const;

export type SmallIconName = keyof typeof ART;

/** Matches MUI's `fontSize="medium"` box, so these line up with glyph rows. */
export const SMALL_ICON_SIZE = 24;

export function SmallIcon({ name, size = SMALL_ICON_SIZE }: { name: SmallIconName; size?: number }) {
  return (
    <img
      src={ART[name]}
      alt=""
      width={size}
      height={size}
      style={{ display: "block", flex: "0 0 auto" }}
    />
  );
}
