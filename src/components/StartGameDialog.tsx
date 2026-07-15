import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { SvgIconComponent } from "@mui/icons-material";
import { OpponentType, TimerCategory, TimerOptions } from "../data/types";
import {
  Alert,
  Box,
  Button as MuiButton,
  Dialog,
  IconButton,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Autocomplete,
  Switch,
  MenuItem,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RandomIcon from "@mui/icons-material/PersonSearchRounded";
import FriendIcon from "@mui/icons-material/HandshakeRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import { Button } from "./Button";
import {
  ACCENT_BLUE,
  ACCENT_PURPLE,
  MAIN_BLUE,
  MAIN_BLUE_DARK,
  MAIN_BLUE_LIGHT,
  MAIN_PURPLE,
  SURFACE_800,
  SURFACE_BORDER,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants";
import { GameDefinitions } from "../data/gameDefinitions";
import { PlayerAvatar } from "./PlayerAvatar";
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
  opponentSubType: "random",
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

// Flattened in category order (Lightning → Quick → Classical) so the
// Autocomplete's groupBy renders contiguous category sections. Names are unique
// across categories, so a name is a safe key for the selected value.
const TIMER_OPTIONS = Object.values(TimerOptions).flat();
// The Autocomplete operates on preset ids (its value is an id string); this
// resolves an id back to its config for the label/group/icon. Ids stay in
// category order so groupBy renders contiguous sections.
const TIMER_OPTION_IDS = TIMER_OPTIONS.map((t) => t.id);
const TIMER_BY_ID = Object.fromEntries(TIMER_OPTIONS.map((t) => [t.id, t]));

const TIMER_CATEGORY_ICON: Record<TimerCategory, SvgIconComponent> = {
  [TimerCategory.LIGHTNING]: BoltRoundedIcon,
  [TimerCategory.QUICK]: TimerRoundedIcon,
  [TimerCategory.CLASSICAL]: HourglassEmptyRoundedIcon,
};

// Shared styling for the dark, glassy text fields.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: TEXT_PRIMARY,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    "& fieldset": { borderColor: SURFACE_BORDER },
    "&:hover fieldset": { borderColor: ACCENT_BLUE },
    "&.Mui-focused fieldset": { borderColor: ACCENT_BLUE, borderWidth: "1.5px" },
    "&.Mui-focused": { boxShadow: `0 0 0 4px rgba(77, 141, 255, 0.12)` },
  },
  "& .MuiInputLabel-root": { color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT_BLUE },
  "& .MuiFormHelperText-root": { color: TEXT_MUTED },
  // Keep disabled fields legible on the dark surface (used while submitting).
  "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-disabled": { color: TEXT_MUTED },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitTextFillColor: TEXT_PRIMARY,
    WebkitBoxShadow: `0 0 0 100px ${SURFACE_800} inset`,
    caretColor: TEXT_PRIMARY,
  },
};

export default function StartGameDialog({ open, onClose, opponentType, presetFriend }: StartGameDialogProps) {
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      sx={{
        "& .MuiDialog-paper": {
          position: "relative",
          overflow: "hidden",
          backgroundColor: SURFACE_800,
          backgroundImage: `radial-gradient(circle at 15% -10%, rgba(77, 141, 255, 0.22), transparent 45%), radial-gradient(circle at 110% 0%, rgba(168, 85, 247, 0.22), transparent 42%)`,
          border: `1px solid rgba(255, 255, 255, 0.12)`,
          borderRadius: "18px",
          color: TEXT_PRIMARY,
          boxShadow: `0 0 0 1px rgba(77, 141, 255, 0.30), 0 0 50px rgba(96, 2, 197, 0.35), 0 40px 90px rgba(0, 0, 0, 0.80)`,
        },
      }}
    >
      {/* Top accent hairline (blue → purple). */}
      <Box
        aria-hidden
        sx={{
          height: "3px",
          background: `linear-gradient(90deg, ${MAIN_BLUE_LIGHT}, ${ACCENT_PURPLE})`,
        }}
      />

      <IconButton
        aria-label="Close"
        onClick={handleClose}
        disabled={false}
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          color: TEXT_MUTED,
          "&:hover": { color: TEXT_PRIMARY },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      {/* Header with a faint chessboard pattern and the Chess++ logo. */}
      <Box sx={{ position: "relative", overflow: "hidden", px: 3, pt: 3.5, pb: 2 }}>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `linear-gradient(45deg, ${TEXT_PRIMARY} 25%, transparent 25%, transparent 75%, ${TEXT_PRIMARY} 75%), linear-gradient(45deg, ${TEXT_PRIMARY} 25%, transparent 25%, transparent 75%, ${TEXT_PRIMARY} 75%)`,
            backgroundSize: "34px 34px",
            backgroundPosition: "0 0, 17px 17px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <Stack direction="column" sx={{ position: "relative", alignItems: "center", gap: 1.25 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
            Start a New Game
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
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
                  options={GameDefinitions}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  value={GameDefinitions.find((game) => game.id === form.gameType) ?? null}
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
                        border: `1px solid ${SURFACE_BORDER}`,
                      },
                    },
                    listbox: {
                      sx: {
                        "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                        "& .MuiAutocomplete-option[aria-selected='true']": {
                          backgroundColor: "rgba(77, 141, 255, 0.20)",
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: "rgba(77, 141, 255, 0.15)",
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
                          sx={{ width: 24, height: 24, borderRadius: "4px" }}
                        />
                        <Typography variant="body2" sx={{ color: TEXT_PRIMARY, marginLeft: "8px" }}>
                          {option.name}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => {
                    const selected = GameDefinitions.find((game) => game.id === form.gameType);
                    return (
                      <TextField
                        {...params}
                        autoComplete="game-type"
                        required
                        sx={fieldSx}
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
                                    sx={{ width: 22, height: 22, borderRadius: "4px", ml: "6px", mr: "8px" }}
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
                        border: `1px solid ${SURFACE_BORDER}`,
                      },
                    },
                    listbox: {
                      sx: {
                        "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                        "& .MuiAutocomplete-option[aria-selected='true']": {
                          backgroundColor: "rgba(77, 141, 255, 0.20)",
                        },
                        "& .MuiAutocomplete-option.Mui-focused": {
                          backgroundColor: "rgba(77, 141, 255, 0.15)",
                        },
                        // Category header styling on the dark paper.
                        "& .MuiAutocomplete-groupLabel": {
                          backgroundColor: MAIN_BLUE_DARK,
                          color: ACCENT_BLUE,
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
                          {Icon && <Icon fontSize="small" sx={{ color: ACCENT_BLUE }} />}
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
                        sx={fieldSx}
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps.input,
                            startAdornment: (
                              <>
                                {Icon && <Icon fontSize="small" sx={{ color: ACCENT_BLUE, ml: "6px", mr: "8px" }} />}
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
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "10px",
                          textTransform: "none",
                          paddingX: "20px",
                          height: "40px",
                          backgroundImage:
                            "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(0, 0, 0, 0.14) 100%)",
                          //transition: "background-image 0.15s ease, box-shadow 0.15s ease",
                          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.05)" },
                          "&.Mui-selected": {
                            color: TEXT_PRIMARY,
                            backgroundColor: MAIN_BLUE,
                            "&:hover": { backgroundColor: MAIN_BLUE_LIGHT },
                          },
                        },
                        "& .MuiToggleButtonGroup-grouped": {
                          // Remove inner borders for elements between the first and last
                          "&:not(:first-of-type):not(:last-of-type)": {
                            borderRadius: 0,
                          },
                          // Keep only the left corners rounded for the first item
                          "&:first-of-type": {
                            borderTopLeftRadius: "8px",
                            borderBottomLeftRadius: "8px",
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                          // Keep only the right corners rounded for the last item
                          "&:last-of-type": {
                            borderTopRightRadius: "8px",
                            borderBottomRightRadius: "8px",
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
                        getOptionDisabled={(option) =>
                          onlineFriends != null && !onlineFriends.has(option.username)
                        }
                        value={friends.find((f) => f.username === form.friendId) ?? null}
                        onChange={(_event, value) =>
                          setForm((prev) => ({ ...prev, friendId: value?.username ?? "" }))
                        }
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
                              border: `1px solid ${SURFACE_BORDER}`,
                            },
                          },
                          listbox: {
                            sx: {
                              "& .MuiAutocomplete-option": { fontSize: "0.9rem" },
                              "& .MuiAutocomplete-option[aria-selected='true']": {
                                backgroundColor: "rgba(77, 141, 255, 0.20)",
                              },
                              "& .MuiAutocomplete-option.Mui-focused": {
                                backgroundColor: "rgba(77, 141, 255, 0.15)",
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
                              sx={fieldSx}
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
                            ...fieldSx,
                            "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], height: "40px" },
                            "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 0 },
                            "& .MuiSelect-icon": { color: TEXT_MUTED },
                          }}
                          slotProps={{
                            select: {
                              MenuProps: {
                                slotProps: {
                                  paper: {
                                    sx: {
                                      bgcolor: SURFACE_800,
                                      color: TEXT_PRIMARY,
                                      border: `1px solid ${SURFACE_BORDER}`,
                                      "& .MuiMenuItem-root": { fontSize: "0.9rem" },
                                      "& .MuiMenuItem-root.Mui-selected": {
                                        backgroundColor: "rgba(77, 141, 255, 0.20)",
                                      },
                                      "& .MuiMenuItem-root.Mui-focusVisible, & .MuiMenuItem-root:hover": {
                                        backgroundColor: "rgba(77, 141, 255, 0.15)",
                                      },
                                    },
                                  },
                                },
                              },
                            },
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
                            ...fieldSx,
                            "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], height: "40px" },
                            "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 0 },
                            "& .MuiSelect-icon": { color: TEXT_MUTED },
                          }}
                          slotProps={{
                            select: {
                              MenuProps: {
                                slotProps: {
                                  paper: {
                                    sx: {
                                      bgcolor: SURFACE_800,
                                      color: TEXT_PRIMARY,
                                      border: `1px solid ${SURFACE_BORDER}`,
                                      "& .MuiMenuItem-root": { fontSize: "0.9rem" },
                                      "& .MuiMenuItem-root.Mui-selected": {
                                        backgroundColor: "rgba(77, 141, 255, 0.20)",
                                      },
                                      "& .MuiMenuItem-root.Mui-focusVisible, & .MuiMenuItem-root:hover": {
                                        backgroundColor: "rgba(77, 141, 255, 0.15)",
                                      },
                                    },
                                  },
                                },
                              },
                            },
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
                    sx={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#ffffff",
                      borderRadius: "4px",
                      marginRight: "5px",
                      color: "#000000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      cursor: "pointer",
                      border: form.playAs === "white" ? `3px solid ${ACCENT_BLUE}` : "none",
                    }}
                    onClick={() => {
                      setForm({ ...form, playAs: "white" });
                    }}
                  >
                    ♜
                  </Box>

                  <Box
                    sx={{
                      width: "40px",
                      height: "40px",
                      // Half white (left), half black (right) — the "random color" indicator.
                      backgroundImage: "linear-gradient(90deg, #ffffff 0 50%, #000000 50% 100%)",
                      borderRadius: "4px",
                      marginRight: "5px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: form.playAs === "random" ? `3px solid ${ACCENT_BLUE}` : "1px solid " + TEXT_MUTED,
                    }}
                    onClick={() => {
                      setForm({ ...form, playAs: "random" });
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        color: "#ffffff",
                        backgroundColor: "#000000",
                        //mixBlendMode: "difference",
                        fontSize: "20px",
                        fontWeight: 700,
                        lineHeight: 1,
                        width: "20px",
                        paddingX: "6px",
                        borderRadius: "4px",
                        border: "1px solid " + TEXT_MUTED,
                      }}
                    >
                      ?
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: "#000000",
                      borderRadius: "4px",
                      marginRight: "5px",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      cursor: "pointer",
                      border: form.playAs === "black" ? `3px solid ${ACCENT_BLUE}` : "1px solid " + TEXT_MUTED,
                    }}
                    onClick={() => {
                      setForm({ ...form, playAs: "black" });
                    }}
                  >
                    ♜
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
                  borderColor: "rgba(239, 68, 68, 0.5)",
                  "& .MuiAlert-icon": { color: "#ef4444" },
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
                  "&:hover": { color: TEXT_PRIMARY, backgroundColor: "rgba(255, 255, 255, 0.05)" },
                }}
              >
                {"Cancel"}
              </MuiButton>
              <Button
                id="start-game-submit"
                type="primary"
                isSubmit
                form={DIALOG_FORM_ID}
                isDisabled={isFormComplete() === false || submitting}
                label={submitting ? "Sending…" : form.opponentSubType === "friend" ? "Send Challenge" : "Start Game"}
                style={{ backgroundColor: MAIN_PURPLE, padding: "10px 24px" }}
              />
            </Stack>
          </Stack>
        </form>
      </Box>
    </Dialog>
  );
}
