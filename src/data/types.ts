export enum TimerCategory {
  LIGHTNING = "Lightning",
  QUICK = "Quick",
  CLASSICAL = "Classical",
}

export enum PlayerColor {
  WHITE = "white",
  BLACK = "black",
}

export enum OpponentType {
  HUMAN = "human",
  BOT = "bot",
}

export enum MoveType {
  LEAP = "Leap",
  SLIDE = "Slide",
}

export enum MoveMode {
  MOVE = "Move",
  CAPTURE = "Capture",
  MOVE_OR_CAPTURE = "MoveOrCapture",
}

export interface MoveDirection {
  dx: number; // Change in x-coordinate (file)
  dy: number; // Change in y-coordinate (rank)
}

export interface MoveDefinition {
  type: MoveType;
  mode: MoveMode;
  directions: MoveDirection[];
  range: number; // For Leap moves, this is always 1. For Slide moves, this is the maximum distance the piece can move in that direction.
  initial_only?: boolean; // If true, the piece can only move this way from its initial position (e.g., pawn's first move).
}

export interface PieceDefinition {
  name: string;
  moves: MoveDefinition[];
}

export interface TimerConfig {
  id: string; // stable catalog key (used for selection and as a preset reference)
  category: TimerCategory;
  name: string;
  initial_time: number | null; // in seconds; null = unlimited (no clock)
  increment: number; // in seconds
}

export const TimerOptions: Record<TimerCategory, TimerConfig[]> = {
  [TimerCategory.LIGHTNING]: [
    { id: "1+0", name: "1 min", category: TimerCategory.LIGHTNING, initial_time: 60, increment: 0 },
    { id: "3+0", name: "3 min", category: TimerCategory.LIGHTNING, initial_time: 180, increment: 0 },
    { id: "5+0", name: "5 min", category: TimerCategory.LIGHTNING, initial_time: 300, increment: 0 },
  ],
  [TimerCategory.QUICK]: [
    { id: "10+0", name: "10 min", category: TimerCategory.QUICK, initial_time: 600, increment: 0 },
    { id: "15+10", name: "15 + 10 min", category: TimerCategory.QUICK, initial_time: 900, increment: 10 },
    { id: "30+0", name: "30 min", category: TimerCategory.QUICK, initial_time: 1800, increment: 0 },
    { id: "60+0", name: "60 min", category: TimerCategory.QUICK, initial_time: 3600, increment: 0 },
  ],
  [TimerCategory.CLASSICAL]: [
    { id: "1d", name: "1 day", category: TimerCategory.CLASSICAL, initial_time: 86400, increment: 0 },
    { id: "2d", name: "2 days", category: TimerCategory.CLASSICAL, initial_time: 172800, increment: 10 },
    { id: "7d", name: "7 days", category: TimerCategory.CLASSICAL, initial_time: 604800, increment: 0 },
    { id: "unlimited", name: "Unlimited", category: TimerCategory.CLASSICAL, initial_time: null, increment: 0 },
  ],
};
export interface GameDefinition {
  id: string;
  name: string;
  icon: string;
  player_colors: PlayerColor[];
  pieces: PieceDefinition[];
  starting_positions: string;
}

export interface GamePlayer {
  opponent_type: OpponentType;
  player_id: string;
  color: PlayerColor;
}

export interface Game {
  id: string;
  game_definition_id: string;
  players: GamePlayer[];
  winners: GamePlayer[];
  initial_time: number | null; // in seconds; null = unlimited (no clock)
  increment: number; // in seconds
  time_category: TimerCategory;
  timer_preset_id: string | null;
  start_time: string; // ISO 8601 format
  end_time: string | null; // ISO 8601 format
}
