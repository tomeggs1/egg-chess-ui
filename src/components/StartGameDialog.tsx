import { useEffect, useMemo, useState, type FormEvent } from "react";
import { OpponentType, TimerCategory, TimerOptions } from "../data/types";
import {
  Alert,
  Box,
  Button as MuiButton,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Autocomplete,
  Switch,
  MenuItem,
} from "@mui/material";
import FriendIcon from "@mui/icons-material/HandshakeRounded";
import { Button } from "./Button";
import {
  ACCENT_PRIMARY,
  BORDER_WIDTH,
  COLOR_ERROR,
  COLOR_WARNING,
  CTA_PRIMARY,
  CTA_PRIMARY_DARK,
  ACCENT_BRIGHT,
  CTA_SECONDARY,
  FONT,
  PIECE_EBONY,
  PIECE_IVORY,
  RADIUS,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import PlayEmblem from "../assets/images/play-large.webp";
import { Icons, type IconComponent } from "../icons";
import { uiPieceSrc } from "../data/pieceAssets";
import { useGameCatalog } from "../data/GameCatalogContext";
import { PlayerAvatar } from "./PlayerAvatar";
import { GameDialog } from "./GameDialog";
import { useAuth } from "../auth/AuthContext";
import { useFriends } from "../hooks/useFriends";
import { useOnlineFriends } from "../hooks/usePresence";
import { useCreateChallenge } from "../hooks/useChallenges";
import { ApiError } from "../api/client";
import type { PlayerSummary } from "../api/friends";
import type { ColorPreference } from "../api/challenges";

interface StartGameDialogProps {
  opponentType: OpponentType;
  open: boolean;
  onClose: () => void;
  // When set, the dialog challenges this specific friend: the opponent is fixed
  // to them and the friend selector is locked.
  presetFriend?: PlayerSummary | null;
}

const emptyForm = {
  gameType: "standard",
  timer: "10+0",
  opponentSubType: "friend",
  friendId: "",
  rated: true,
  matchRatingFrom: -100 as number | null,
  matchRatingTo: 100,
  playAs: "random" as "white" | "black" | "random",
};

const matchRatingFromOptions: Record<string, number | null> = {
  Any: null,
  "-400": -400,
  "-200": -200,
  "-150": -150,
  "-100": -100,
  "-50": -50,
  "-25": -25,
};
const matchRatingToOptions: Record<string, number | null> = {
  Any: null,
  "+25": 25,
  "+50": 50,
  "+100": 100,
  "+150": 150,
  "+200": 200,
  "+400": 400,
};

// Reverse lookup: the numeric form value → its display label.
const matchRatingFromLabel = (value: number | null) =>
  Object.keys(matchRatingFromOptions).find((label) => matchRatingFromOptions[label] === value) ?? "";
const matchRatingToLabel = (value: number | null) =>
  Object.keys(matchRatingToOptions).find((label) => matchRatingToOptions[label] === value) ?? "";

const DIALOG_FORM_ID = "start-game-form";

// Hyphenated roles can't be written as a JSX tag (no bracket access in tag
// names), so bind it once. Shares art with the `random` role — see icons/index.tsx.
const RandomIcon = Icons["find-opponent"];

// --- "Play as" swatches ------------------------------------------------------
// The three squares differ only in fill, so the rest is shared. Note PIECE_EBONY
// is darker than the panel behind it (1.10:1), so every square carries a border
// whether selected or not — the dark one would otherwise have no visible edge.
const playAsSquareSx = {
  width: "40px",
  height: "40px",
  borderRadius: `${RADIUS.sm}px`,
  marginRight: "5px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
} as const;

const playAsPieceSx = { width: 26, height: 26, objectFit: "contain", display: "block" } as const;

/**
 * Gilt edge when chosen, bronze otherwise — the same width either way. The
 * previous 3px-selected / 1px-idle pair changed the swatch's inner area on
 * selection, which nudged the piece image.
 */
const selectedRing = (selected: boolean) => ({
  border: `${BORDER_WIDTH}px solid ${selected ? ACCENT_PRIMARY : SURFACE_BORDER}`,
});

// Flattened in category order (Lightning → Quick → Classical) so the
// Autocomplete's groupBy renders contiguous category sections. Names are unique
// across categories, so a name is a safe key for the selected value.
const TIMER_OPTIONS = Object.values(TimerOptions).flat();
// The Autocomplete operates on preset ids (its value is an id string); this
// resolves an id back to its config for the label/group/icon. Ids stay in
// category order so groupBy renders contiguous sections.
const TIMER_OPTION_IDS = TIMER_OPTIONS.map((t) => t.id);
const TIMER_BY_ID = Object.fromEntries(TIMER_OPTIONS.map((t) => [t.id, t]));

export const TIMER_CATEGORY_ICON: Record<TimerCategory, IconComponent> = {
  [TimerCategory.LIGHTNING]: Icons["time-lightning"],
  [TimerCategory.QUICK]: Icons["time-quick"],
  [TimerCategory.LONG]: Icons["time-long"],
};

export default function StartGameDialog({ open, onClose, opponentType, presetFriend }: StartGameDialogProps) {
  const { definitions: games } = useGameCatalog();
  const [form, setForm] = useState(emptyForm);
  const { player } = useAuth();
  const { data: friendships } = useFriends();
  const { data: onlineFriends } = useOnlineFriends();
  const createChallenge = useCreateChallenge();

  // The current player's friends, resolved from each accepted friendship.
  const friends: PlayerSummary[] = useMemo(() => {
    if (!friendships || !player) return [];
    return friendships.map((f) => (f.requester.id === player.id ? f.addressee : f.requester));
  }, [friendships, player]);

  // Initialize on open. A preset friend locks the opponent to that friend.
  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm,
      opponentSubType: presetFriend ? "friend" : emptyForm.opponentSubType,
      friendId: presetFriend ? presetFriend.username : "",
    });
    createChallenge.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetFriend]);

  const isFormComplete = () => {
    if (form.gameType === "" || form.timer === "") return false;
    if (form.opponentSubType === "friend" && form.friendId === "") return false;
    return true;
  };

  function handleClose() {
    setForm(emptyForm);
    createChallenge.reset();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // Only the "challenge a friend" path is wired up; random matchmaking and
    // bot play aren't implemented yet.
    if (opponentType !== OpponentType.HUMAN || form.opponentSubType !== "friend" || !form.friendId) {
      return;
    }
    const timer = TIMER_BY_ID[form.timer];
    const colorPreference: ColorPreference =
      form.playAs === "white" ? "WHITE" : form.playAs === "black" ? "BLACK" : "RANDOM";
    createChallenge.mutate(
      {
        username: form.friendId,
        gameDefinitionId: form.gameType,
        initialSeconds: timer?.initial_time ?? undefined,
        incrementSeconds: timer?.increment ?? 0,
        colorPreference,
        rated: form.rated,
      },
      { onSuccess: handleClose },
    );
  }

  const challengeError =
    createChallenge.error instanceof ApiError
      ? createChallenge.error.detail
      : createChallenge.isError
        ? "Could not send the challenge."
        : null;
  const submitting = createChallenge.isPending;
  // Random matchmaking isn't implemented yet — surface a message and block submit.
  const randomUnavailable = opponentType === OpponentType.HUMAN && form.opponentSubType === "random";

  return (
    <GameDialog
      open={open}
      onClose={handleClose}
      emblem={PlayEmblem}
      title="Start a New Game"
    >
        <form id={DIALOG_FORM_ID} onSubmit={handleSubmit}>
          <Stack direction="column" sx={{ gap: "16px", mt: 1 }}>
            <Stack direction="row" sx={{ gap: "4px", alignItems: "flex-start" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  width: "90px",
                  marginRight: "8px",
                  marginTop: "15px",
                  whitespace: "nowrap",
                }}
              >
                Game Type:
              </Typography>
              <Box sx={{ minWidth: "250px" }}>
                <Autocomplete
                  options={games}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={games.find((game) => game.id === form.gameType) ?? null}
                  onChange={(_event, value) => setForm((prev) => ({ ...prev, gameType: value?.id ?? "" }))}
                  fullWidth
                  sx={{
                    "& .MuiAutocomplete-clearIndicator": { color: TEXT_MUTED },
                    "& .MuiAutocomplete-popupIndicator": { color: TEXT_MUTED },
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        bgcolor: SURFACE_800,
                        color: TEXT_PRIMARY,
                        border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
                      },
                    },
                    listbox: {
                      sx: {
                        "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                        "& .MuiAutocomplete-option[aria-selected='true']": {
                          backgroundColor: "rgba(201, 162, 39, 0.20)",
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: "rgba(201, 162, 39, 0.15)",
                        },
                      },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props as typeof props & { key?: React.Key };
                    return (
                      <Box
                        component="li"
                        key={key}
                        {...optionProps}
                        sx={{ display: "flex", alignItems: "center", gap: "15px" }}
                      >
                        <Box
                          component="img"
                          src={option.icon}
                          alt=""
                          sx={{ width: 24, height: 24, borderRadius: `${RADIUS.sm}px` }}
                        />
                        <Typography variant="body2" sx={{ color: TEXT_PRIMARY, marginLeft: "8px" }}>
                          {option.name}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => {
                    const selected = games.find((game) => game.id === form.gameType);
                    return (
                      <TextField
                        {...params}
                        autoComplete="game-type"
                        required
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps.input,
                            startAdornment: (
                              <>
                                {selected && (
                                  <Box
                                    component="img"
                                    src={selected.icon}
                                    alt=""
                                    sx={{ width: 22, height: 22, borderRadius: `${RADIUS.sm}px`, ml: "6px", mr: "8px" }}
                                  />
                                )}
                                {params.slotProps.input.startAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Box>
            </Stack>
            <Stack direction="row" sx={{ gap: "4px", alignItems: "flex-start" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  width: "90px",
                  marginRight: "8px",
                  marginTop: "15px",
                  whiteSpace: "nowrap",
                }}
              >
                Timer:
              </Typography>
              <Box sx={{ minWidth: "250px" }}>
                <Autocomplete
                  options={TIMER_OPTION_IDS}
                  groupBy={(id) => TIMER_BY_ID[id].category}
                  // Options and value are preset ids; label (input text) resolves to
                  // the name, and the category is shown via the icon in renderInput.
                  getOptionLabel={(id) => TIMER_BY_ID[id]?.name ?? id}
                  value={form.timer || null}
                  onChange={(_event, value) => setForm((prev) => ({ ...prev, timer: value ?? "" }))}
                  fullWidth
                  sx={{
                    "& .MuiAutocomplete-clearIndicator": { color: TEXT_MUTED },
                    "& .MuiAutocomplete-popupIndicator": { color: TEXT_MUTED },
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        bgcolor: SURFACE_800,
                        color: TEXT_PRIMARY,
                        border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
                      },
                    },
                    listbox: {
                      sx: {
                        "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                        "& .MuiAutocomplete-option[aria-selected='true']": {
                          backgroundColor: "rgba(201, 162, 39, 0.20)",
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: "rgba(201, 162, 39, 0.15)",
                        },
                        // Category header styling on the dark paper.
                        "& .MuiAutocomplete-groupLabel": {
                          backgroundColor: CTA_PRIMARY_DARK,
                          color: ACCENT_PRIMARY,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        },
                        // Indent options under their category for a hierarchical look.
                        "& .MuiAutocomplete-groupUl .MuiAutocomplete-option": {
                          paddingLeft: "24px",
                        },
                      },
                    },
                  }}
                  renderGroup={(params) => {
                    const Icon = TIMER_CATEGORY_ICON[params.group as TimerCategory];
                    return (
                      <li key={params.key}>
                        <Box
                          className="MuiAutocomplete-groupLabel"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            px: "16px",
                            py: "8px",
                            position: "sticky",
                            top: "-8px",
                          }}
                        >
                          {Icon && <Icon fontSize="small" sx={{ color: ACCENT_PRIMARY }} />}
                          {params.group}
                        </Box>
                        <ul className="MuiAutocomplete-groupUl" style={{ padding: 0, margin: 0 }}>
                          {params.children}
                        </ul>
                      </li>
                    );
                  }}
                  renderOption={(props, id) => {
                    const { key, ...optionProps } = props as typeof props & { key?: React.Key };
                    return (
                      <Box component="li" key={key} {...optionProps}>
                        {TIMER_BY_ID[id]?.name ?? id}
                      </Box>
                    );
                  }}
                  renderInput={(params) => {
                    const selected = form.timer ? TIMER_BY_ID[form.timer] : undefined;
                    const Icon = selected ? TIMER_CATEGORY_ICON[selected.category] : null;
                    return (
                      <TextField
                        {...params}
                        autoComplete="timer"
                        required
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps.input,
                            startAdornment: (
                              <>
                                {Icon && <Icon fontSize="small" sx={{ color: ACCENT_PRIMARY, ml: "6px", mr: "8px" }} />}
                                {params.slotProps.input.startAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Box>
            </Stack>
            <Stack direction="row" sx={{ gap: "4px", alignItems: "flex-start" }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: TEXT_PRIMARY, width: "90px", marginRight: "8px", marginTop: "10px" }}
              >
                Opponent:
              </Typography>
              <Box>
                {opponentType === OpponentType.HUMAN ? (
                  <Stack direction="column" sx={{ gap: "4px" }}>
                    <ToggleButtonGroup
                      value={form.opponentSubType}
                      exclusive
                      disabled={presetFriend != null}
                      onChange={(_event, newValue) => {
                        if (newValue !== null) {
                          setForm({ ...form, opponentSubType: newValue });
                        }
                      }}
                      sx={{
                        "& .MuiToggleButton-root": {
                          color: TEXT_PRIMARY,
                          backgroundColor: "rgba(255, 235, 190, 0.10)",
                          borderRadius: `${RADIUS.md}px`,
                          textTransform: "none",
                          paddingX: "20px",
                          height: "40px",
                          backgroundImage:
                            "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(0, 0, 0, 0.14) 100%)",
                          //transition: "background-image 0.15s ease, box-shadow 0.15s ease",
                          "&:hover": { backgroundColor: "rgba(255, 235, 190, 0.05)" },
                          "&.Mui-selected": {
                            color: TEXT_PRIMARY,
                            backgroundColor: CTA_PRIMARY,
                            "&:hover": { backgroundColor: ACCENT_BRIGHT },
                          },
                        },
                        "& .MuiToggleButtonGroup-grouped": {
                          // Remove inner borders for elements between the first and last
                          "&:not(:first-of-type):not(:last-of-type)": {
                            borderRadius: 0,
                          },
                          // Keep only the left corners rounded for the first item
                          "&:first-of-type": {
                            borderTopLeftRadius: `${RADIUS.md}px`,
                            borderBottomLeftRadius: `${RADIUS.md}px`,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                          // Keep only the right corners rounded for the last item
                          "&:last-of-type": {
                            borderTopRightRadius: `${RADIUS.md}px`,
                            borderBottomRightRadius: `${RADIUS.md}px`,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                          },
                        },
                      }}
                    >
                      <ToggleButton value="random">
                        <RandomIcon sx={{ marginRight: "8px" }} /> Random
                      </ToggleButton>
                      <ToggleButton value="friend">
                        <FriendIcon sx={{ marginRight: "8px" }} /> Friend
                      </ToggleButton>
                    </ToggleButtonGroup>
                    {form.opponentSubType === "friend" && (
                      <Autocomplete
                        options={friends}
                        getOptionLabel={(option) => option.username}
                        isOptionEqualToValue={(option, value) => option.username === value.username}
                        // Offline friends can't be challenged (the service rejects it), so
                        // they're shown but not selectable. Only gate once presence loads.
                        getOptionDisabled={(option) => onlineFriends != null && !onlineFriends.has(option.username)}
                        value={friends.find((f) => f.username === form.friendId) ?? null}
                        onChange={(_event, value) => setForm((prev) => ({ ...prev, friendId: value?.username ?? "" }))}
                        disabled={presetFriend != null}
                        fullWidth
                        sx={{
                          marginTop: "10px",
                          "& .MuiAutocomplete-clearIndicator": { color: TEXT_MUTED },
                          "& .MuiAutocomplete-popupIndicator": { color: TEXT_MUTED },
                        }}
                        slotProps={{
                          paper: {
                            sx: {
                              bgcolor: SURFACE_800,
                              color: TEXT_PRIMARY,
                              border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
                            },
                          },
                          listbox: {
                            sx: {
                              "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                              "& .MuiAutocomplete-option[aria-selected='true']": {
                                backgroundColor: "rgba(201, 162, 39, 0.20)",
                              },
                              "& .MuiAutocomplete-option.Mui-focused": {
                                backgroundColor: "rgba(201, 162, 39, 0.15)",
                              },
                            },
                          },
                        }}
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props as typeof props & { key?: React.Key };
                          const online = onlineFriends ? onlineFriends.has(option.username) : undefined;
                          const offline = online === false;
                          return (
                            <Box
                              component="li"
                              key={key}
                              {...optionProps}
                              sx={{ display: "flex", alignItems: "center", gap: "10px", opacity: offline ? 0.5 : 1 }}
                            >
                              <PlayerAvatar
                                username={option.username}
                                avatarKey={option.avatarKey}
                                size={24}
                                online={online}
                              />
                              <Typography variant="body2" sx={{ color: TEXT_PRIMARY }}>
                                {option.username}
                              </Typography>
                              {offline && (
                                <Typography variant="caption" sx={{ color: TEXT_MUTED, ml: "auto" }}>
                                  offline
                                </Typography>
                              )}
                            </Box>
                          );
                        }}
                        renderInput={(params) => {
                          const selected = friends.find((f) => f.username === form.friendId);
                          return (
                            <TextField
                              {...params}
                              label="Friend"
                              autoComplete="friend-name"
                              required
                              slotProps={{
                                ...params.slotProps,
                                input: {
                                  ...params.slotProps.input,
                                  startAdornment: (
                                    <>
                                      {selected && (
                                        <Box sx={{ display: "flex", ml: "6px", mr: "4px" }}>
                                          <PlayerAvatar
                                            username={selected.username}
                                            avatarKey={selected.avatarKey}
                                            size={22}
                                          />
                                        </Box>
                                      )}
                                      {params.slotProps.input.startAdornment}
                                    </>
                                  ),
                                },
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    {form.opponentSubType === "random" && (
                      <Stack direction="row" sx={{ gap: "4px", marginTop: "0px", alignItems: "center" }}>
                        <TextField
                          select
                          label="Rating From"
                          // Display the label, but store the mapped numeric value in the form.
                          value={matchRatingFromLabel(form.matchRatingFrom)}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              matchRatingFrom: matchRatingFromOptions[event.target.value],
                            }))
                          }
                          fullWidth
                          sx={{
                            marginTop: "10px",
                            "& .MuiOutlinedInput-root": { height: "40px" },
                            "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 0 },
                          }}
                          slotProps={{
                            select: {},
                          }}
                        >
                          {Object.keys(matchRatingFromOptions).map((label) => (
                            <MenuItem key={label} value={label}>
                              {label}
                            </MenuItem>
                          ))}
                        </TextField>
                        to
                        <TextField
                          select
                          label="Rating To"
                          // Display the label, but store the mapped numeric value in the form.
                          value={matchRatingToLabel(form.matchRatingTo)}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              matchRatingTo: matchRatingToOptions[event.target.value] ?? 100,
                            }))
                          }
                          fullWidth
                          sx={{
                            marginTop: "10px",
                            "& .MuiOutlinedInput-root": { height: "40px" },
                            "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 0 },
                          }}
                          slotProps={{
                            select: {},
                          }}
                        >
                          {Object.keys(matchRatingToOptions).map((label) => (
                            <MenuItem key={label} value={label}>
                              {label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    )}
                    {randomUnavailable && (
                      <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{
                          marginTop: "10px",
                          color: TEXT_PRIMARY,
                          borderColor: COLOR_WARNING,
                          "& .MuiAlert-icon": { color: COLOR_WARNING },
                        }}
                      >
                        Random matchmaking not yet available
                      </Alert>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: TEXT_PRIMARY }}>
                    Bot
                  </Typography>
                )}
              </Box>
            </Stack>
            <Stack direction="row" sx={{ gap: "4px", alignItems: "flex-start", marginTop: "-10px" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: TEXT_PRIMARY,
                  width: "90px",
                  marginRight: "8px",
                  marginTop: "10px",
                  whiteSpace: "nowrap",
                }}
              >
                Rated:
              </Typography>
              <Box sx={{ minWidth: "250px" }}>
                <Switch
                  sx={{
                    "& .MuiSwitch-switchBase": {
                      "&:not(.Mui-checked)": {
                        "& + .MuiSwitch-track": {
                          backgroundColor: TEXT_SECONDARY,
                        },
                      },
                    },
                  }}
                  color="primary"
                  checked={form.rated}
                  onChange={() => setForm((prev) => ({ ...prev, rated: !prev.rated }))}
                />
              </Box>
            </Stack>
            {!form.rated && (
              <Stack direction="row" sx={{ gap: "4px", alignItems: "flex-start", marginTop: "-10px" }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: TEXT_PRIMARY,
                    width: "90px",
                    marginRight: "8px",
                    marginTop: "10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Play As:
                </Typography>
                <Stack direction="row" sx={{ minWidth: "250px", gap: "20px" }}>
                  <Box
                    sx={{ ...playAsSquareSx, backgroundColor: PIECE_IVORY }}
                    style={selectedRing(form.playAs === "white")}
                    onClick={() => {
                      setForm({ ...form, playAs: "white" });
                    }}
                  >
                    <Box component="img" src={uiPieceSrc("white", "rook")} alt="White" sx={playAsPieceSx} />
                  </Box>

                  <Box
                    sx={{
                      ...playAsSquareSx,
                      // Ivory left, ebony right — the "random color" indicator.
                      backgroundImage: `linear-gradient(90deg, ${PIECE_IVORY} 0 50%, ${PIECE_EBONY} 50% 100%)`,
                    }}
                    style={selectedRing(form.playAs === "random")}
                    onClick={() => {
                      setForm({ ...form, playAs: "random" });
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontFamily: FONT.display,
                        color: PIECE_IVORY,
                        backgroundColor: PIECE_EBONY,
                        fontSize: "16px",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        paddingX: "7px",
                        borderRadius: `${RADIUS.sm}px`,
                        border: `${BORDER_WIDTH}px solid ${SURFACE_BORDER}`,
                      }}
                    >
                      ?
                    </Box>
                  </Box>
                  <Box
                    sx={{ ...playAsSquareSx, backgroundColor: PIECE_EBONY }}
                    style={selectedRing(form.playAs === "black")}
                    onClick={() => {
                      setForm({ ...form, playAs: "black" });
                    }}
                  >
                    <Box component="img" src={uiPieceSrc("black", "rook")} alt="Black" sx={playAsPieceSx} />
                  </Box>
                </Stack>
              </Stack>
            )}
            {challengeError && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{
                  color: TEXT_PRIMARY,
                  // Was a hardcoded #ef4444 — the pre-medieval error red, which
                  // now sits on hue 0 and collides with HP.
                  borderColor: COLOR_ERROR,
                  "& .MuiAlert-icon": { color: COLOR_ERROR },
                }}
              >
                {challengeError}
              </Alert>
            )}
            <Stack direction="row" sx={{ gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <MuiButton
                onClick={handleClose}
                disabled={submitting}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: TEXT_SECONDARY,
                  "&:hover": { color: TEXT_PRIMARY, backgroundColor: "rgba(255, 235, 190, 0.05)" },
                }}
              >
                {"Cancel"}
              </MuiButton>
              <Button
                id="start-game-submit"
                type="primary"
                isSubmit
                form={DIALOG_FORM_ID}
                isDisabled={isFormComplete() === false || submitting || randomUnavailable}
                label={submitting ? "Sending…" : form.opponentSubType === "friend" ? "Send Challenge" : "Start Game"}
                style={{ backgroundColor: CTA_SECONDARY, padding: "10px 24px" }}
              />
            </Stack>
          </Stack>
        </form>
    </GameDialog>
  );
}
