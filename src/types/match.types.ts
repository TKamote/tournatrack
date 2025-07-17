import { Player } from "./player.types";
import { BracketType } from "./bracket.types";

export interface MatchFormat {
  type: "raceTo";
  gamesNeededToWin: number;
  label: string;
}

export interface Game {
  id: string;
  winner: Player | null;
  score1: number;
  score2: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  bracket: BracketType;
  isGrandFinalsReset: boolean;
  format: MatchFormat;
  games: Game[];
  isByeMatch?: boolean;
  // Additional fields for better match management
  status: MatchStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in minutes
  location?: string;
  notes?: string;
  isLive: boolean;
  lastUpdated: Date;
  createdBy: string;
}

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed";

export interface MatchResult {
  matchId: string;
  winner: Player;
  loser: Player;
  finalScore: string;
  games: Game[];
  duration: number;
  completedAt: Date;
}

export interface CreateMatchRequest {
  round: number;
  matchNumber: number;
  player1Id: string;
  player2Id: string;
  bracket: BracketType;
  format: MatchFormat;
  location?: string;
  scheduledTime?: Date;
}

export interface UpdateMatchRequest {
  winnerId?: string;
  games?: Game[];
  status?: MatchStatus;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  notes?: string;
  isLive?: boolean;
}
