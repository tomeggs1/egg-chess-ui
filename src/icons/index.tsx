import type { SvgIconComponent } from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { ICON_ART, type IconArt } from "./paths.generated";
import { GradientIcon } from "./GradientIcon";

// --- Material fallbacks ------------------------------------------------------
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import BoltRounded from "@mui/icons-material/BoltRounded";
import CasinoRounded from "@mui/icons-material/CasinoRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import EditSquare from "@mui/icons-material/EditSquare";
import EmailRounded from "@mui/icons-material/EmailRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import ExploreRounded from "@mui/icons-material/ExploreRounded";
import ExtensionRounded from "@mui/icons-material/ExtensionRounded";
import FlagRounded from "@mui/icons-material/FlagRounded";
import GridOnRounded from "@mui/icons-material/GridOnRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import HandshakeRounded from "@mui/icons-material/HandshakeRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import History from "@mui/icons-material/History";
import HourglassEmptyRounded from "@mui/icons-material/HourglassEmptyRounded";
import LeaderboardRounded from "@mui/icons-material/LeaderboardRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import Logout from "@mui/icons-material/Logout";
import Notifications from "@mui/icons-material/Notifications";
import PersonAddRounded from "@mui/icons-material/PersonAddRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import PersonSearchRounded from "@mui/icons-material/PersonSearchRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import RemoveCircleOutlineRounded from "@mui/icons-material/RemoveCircleOutlineRounded";
import RepeatRounded from "@mui/icons-material/RepeatRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import SchoolRounded from "@mui/icons-material/SchoolRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import Settings from "@mui/icons-material/Settings";
import SmartToyRounded from "@mui/icons-material/SmartToyRounded";
import SportsEsportsRounded from "@mui/icons-material/SportsEsportsRounded";
import SportsScoreRounded from "@mui/icons-material/SportsScoreRounded";
import SwapVertRounded from "@mui/icons-material/SwapVertRounded";
import TimerOffRounded from "@mui/icons-material/TimerOffRounded";
import TimerRounded from "@mui/icons-material/TimerRounded";
import TodayRounded from "@mui/icons-material/TodayRounded";
import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import VolumeOffRounded from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";

/**
 * Every icon slot in the app, named by ROLE rather than by picture.
 *
 * The comment on each line is the suggested game-icons.net slug — download it,
 * prepare it (see src/icons/svg/README.md), save it as `<role>.svg`, and run
 * `npm run icons`. The role automatically switches from the Material fallback
 * to your art; no call site changes.
 *
 * Purely directional affordances — chevrons, first/last page, back, expand —
 * are deliberately NOT here. They are UI furniture rather than iconography,
 * game-icons has no clean chevron family, and a decorative arrow at 20px in a
 * move list hurts scannability. Those call sites keep importing Material directly.
 *
 * GROUPED TEXT-FIELD ADORNMENTS STAY MATERIAL — decided, not pending.
 * The person / email / lock glyphs inside username, email and password inputs
 * (LoginDialog, SignUpDialog, ProfilePage) keep their Material imports. They are
 * form furniture at 20px inside an input, and — the actual reason — they appear
 * in GROUPS, so converting one leaves a mismatched set in the same form. A role
 * can therefore be live in the app and still be Material inside a field: `lock`
 * renders custom art on the NoAuthPage emblem but Material in the password
 * fields, and that is intentional.
 *
 * A SOLITARY adornment is the exception, because there are no siblings to
 * mismatch: `search` is the only adornment in the friend-search fields, so it
 * takes custom art. The rule is about consistency within a form, not about
 * adornments as such.
 *
 * `reveal` / `conceal` (the show-password toggle) stay Material too. They are
 * buttons rather than passive decoration, but they live inside the same fields,
 * so converting them would reintroduce the mismatch the rule above avoids.
 */
export const FALLBACK = {
  // Sections & navigation
  play: SportsEsportsRounded, //            crossed-swords
  "play-human": PersonRounded, //             duel
  "play-bot": SmartToyRounded, //             robot-antennas
  "find-opponent": PersonSearchRounded, //    spyglass
  puzzles: ExtensionRounded, //             puzzle
  daily: TodayRounded, //                   calendar
  random: CasinoRounded, //                 dice-six-faces-three
  learn: SchoolRounded, //                  open-book
  explore: ExploreRounded, //               compass
  podium: LeaderboardRounded, //          podium-winner
  stats: LeaderboardRounded, //             podium
  history: History, //                      book-pile
  friends: GroupRounded, //                 meeple-group
  "add-friend": PersonAddRounded, //          player-next
  profile: PersonRounded, //                visored-helm
  settings: Settings, //                    cog
  "board-settings": GridOnRounded, //         empty-chessboard
  logout: Logout, //                        exit-door
  help: HelpOutlineRounded, //              help

  // Controls
  notifications: Notifications, //          ringing-bell
  messages: EmailRounded, //                envelope
  compose: EditSquare, //                   quill-ink
  send: SendRounded, //                     paper-plane
  search: SearchRounded, //                 magnifying-glass
  close: CloseRounded, //                   cancel
  lock: LockRounded, //                     padlock
  reveal: VisibilityRounded, //             eye
  conceal: VisibilityOffRounded, //         semi-closed-eye
  "sound-on": VolumeUpRounded, //             sound-on
  "sound-off": VolumeOffRounded, //           sound-off
  "flip-board": SwapVertRounded, //           horizontal-flip
  restart: RestartAltRounded, //            cycle
  resume: PlayArrowRounded, //              play-button
  trophy: EmojiEventsRounded, //            laurel-crown
  variants: AutoAwesomeRounded, //          sparkles

  // Game outcomes (END_REASON_META)
  checkmate: SportsScoreRounded, //         sword-wound
  resignation: FlagRounded, //              flying-flag
  timeout: TimerOffRounded, //              hourglass
  agreement: HandshakeRounded, //           shaking-hands
  stalemate: BlockRounded, //               barrier
  "insufficient-material": RemoveCircleOutlineRounded, // scales
  repetition: RepeatRounded, //             clockwise-rotation

  // Time controls (TIMER_CATEGORY_ICON)
  "time-lightning": BoltRounded, //           lightning-arc
  "time-quick": TimerRounded, //              stopwatch
  "time-long": HourglassEmptyRounded, //      sands-of-time
} as const satisfies Record<string, SvgIconComponent>;

export type IconRole = keyof typeof FALLBACK;

const ART = ICON_ART as Record<string, IconArt | undefined>;

/**
 * Roles that deliberately share one piece of art, so the same glyph can serve
 * two slots from a single file rather than a duplicated SVG.
 *
 * A role with its own `<role>.svg` always wins — adding the file later silently
 * overrides the share, with no code change.
 */
const SHARED_ART: Partial<Record<IconRole, IconRole>> = {
  // The dice read as "random" in both senses: a random puzzle and a random
  // opponent — which is why the role is generic rather than puzzle-specific.
  "find-opponent": "random",
  // Long time controls run over days, so the calendar fits better than an
  // hourglass. Art lives in daily.svg.
  "time-long": "daily",
};

/**
 * Optical size corrections, measured rather than guessed — run
 * `npm run icons:measure` to regenerate the numbers after adding icons.
 *
 * The intuition that Material art (24 viewBox) is intrinsically smaller than
 * game-icons art (512) is WRONG: measured fill is 0.917 vs 0.921, effectively
 * identical. So this is deliberately per-role, not per-source.
 *
 * What actually makes a glyph read small is a wide, short silhouette. `friends`
 * is three heads in a row — 0.92 of the box wide but only 0.58 tall. `fontSize`
 * gives it a square box, so it occupies far less of it than a square glyph like
 * `play` (0.92 x 0.92) and looks undersized beside it.
 *
 * Values target an optical size (√(w·h)) of ~0.90, then take the LOWER of two
 * ceilings: 0.98 of the box (so nothing clips) and the set's median height.
 *
 * That second ceiling matters. Icons sit centred in a fixed square box and the
 * eye tracks a row, so height drives perceived size far more than width — a
 * tall, narrow glyph already looks full-sized. Without it the area target
 * over-corrected every tall glyph: play-human, play-bot, logout and time-quick
 * were all being scaled past their neighbours' height rather than up to it.
 * They now take no correction at all.
 */
export const ICON_SCALE: Partial<Record<IconRole, number>> = {
  "add-friend": 1.43, //    0.58 x 0.58 — Material draws a small plus
  agreement: 1.05, //        0.93 x 0.75
  "board-settings": 1.12, // 0.88 x 0.66 — wide and short
  "flip-board": 1.14, //    0.52 x 0.73 — narrow arrows, small in both axes
  friends: 1.07, //          0.92 x 0.58 — wide and short; box cap binds
  history: 1.04, //          0.70 x 0.80
  learn: 1.07, //            0.91 x 0.64 — wide and short; box cap binds
  messages: 1.09, //         0.90 x 0.66 — envelope
  notifications: 1.03, //    0.63 x 0.81
  podium: 1.05, //           0.94 x 0.72
  resignation: 1.18, //      0.63 x 0.71 — small in both axes
  // A swapping pair in BoardSettingsDialog. Identical fillH (0.625) means the
  // same scale lands them at identical height, so the row does not jump when
  // sound is toggled.
  // 0.42 x 0.52 — Material draws its play triangle very small. Renders at 16px
  // in GameHistoryRow, so it needs every bit of this.
  resume: 1.62,
  "sound-off": 1.33, //      0.72 x 0.63
  "sound-on": 1.33, //       0.67 x 0.63
  stats: 1.11, //            0.83 x 0.75
  // 1.11 by measurement, held at 1.15 because the 20-degree rotation in
  // ICON_ROTATE grows its bounding box and it can afford the extra.
  "time-lightning": 1.15, // 0.42 x 0.75
};

/**
 * Deliberate rotations, in degrees, applied about the viewBox centre.
 *
 * Unlike ICON_SCALE these aren't measured — they're a design choice. Keeping
 * them here rather than baked into the SVG means they stay adjustable without
 * re-extracting the art.
 *
 * Note rotation EATS SCALE HEADROOM. A rotated glyph's bounding box grows to
 * w·|cos| + h·|sin| by w·|sin| + h·|cos|, so the cap that stops it clipping
 * tightens. The bolt measures 0.42 x 0.75 and could take 1.31 upright, but at
 * 20 degrees its box becomes 0.65 x 0.85 and the safe maximum drops to 1.16 —
 * which is why its ICON_SCALE is 1.15, not the number the measurement suggests.
 */
export const ICON_ROTATE: Partial<Record<IconRole, number>> = {
  "time-lightning": 20, // a struck bolt reads better on a slant than bolt upright
};

function artFor(name: IconRole): IconArt | undefined {
  const own = ART[name];
  if (own) return own;
  const shared = SHARED_ART[name];
  return shared ? ART[shared] : undefined;
}

/**
 * Renders the icon for a role: your art if it exists, the Material fallback
 * otherwise. Takes the usual SvgIcon props, so `fontSize`, `sx` and `color`
 * work exactly as they do today.
 */
export function Icon({ name, ...props }: { name: IconRole } & SvgIconProps) {
  const art = artFor(name);
  if (art) return <GradientIcon
        art={art}
        opticalScale={ICON_SCALE[name]}
        rotateDeg={ICON_ROTATE[name]}
        {...props}
      />;
  const Fallback = FALLBACK[name];
  return <Fallback {...props} />;
}

/**
 * What the icon registries around the app need: something renderable with
 * SvgIcon props. Deliberately wider than MUI's `SvgIconComponent`, so a role
 * backed by our own art satisfies the same slot a Material icon does.
 */
export type IconComponent = React.ComponentType<SvgIconProps>;

/**
 * One bound component per role, e.g. `Icons.learn`, for the places that store an
 * icon *component* rather than rendering one — NavBar's menu items,
 * END_REASON_META, TIMER_CATEGORY_ICON.
 *
 * Built once at module scope on purpose. Binding inline during render would
 * create a fresh component identity every pass and remount the SVG each time.
 */
export const Icons = {} as Record<IconRole, IconComponent>;
for (const role of Object.keys(FALLBACK) as IconRole[]) {
  // `name` last, not first: SvgIconProps carries an optional `name` (SVG
  // elements have one), so spreading props afterwards would let a caller
  // silently override which role renders.
  const bound: IconComponent = (props: SvgIconProps) => <Icon {...props} name={role} />;
  (bound as { displayName?: string }).displayName = `Icon(${role})`;
  Icons[role] = bound;
}

/** Roles still on the Material fallback — handy while working through the set. */
export function pendingRoles(): IconRole[] {
  return (Object.keys(FALLBACK) as IconRole[]).filter((r) => !artFor(r));
}

export { GradientIcon };
