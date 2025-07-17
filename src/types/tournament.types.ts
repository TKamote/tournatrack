import { Player } from "./player.types";
import { Match, MatchFormat } from "./match.types";
import { TournamentType, BracketType } from "./bracket.types";

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  manager: string;
  managerId: string;
  players: Player[];
  matches: Match[];
  format: MatchFormat;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
}

export type TournamentStatus =
  | "draft"
  | "registration"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface TournamentSummary {
  id: string;
  name: string;
  type: TournamentType;
  manager: string;
  playerCount: number;
  maxPlayers: number;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  currentRound: number;
  totalRounds: number;
}

export interface TournamentResults {
  champion: Player;
  runnerUp: Player;
  finalScore: string;
  completedAt: Date;
}

export interface TournamentStats {
  totalMatches: number;
  completedMatches: number;
  remainingMatches: number;
  averageMatchDuration?: number;
  totalPlayers: number;
  eliminatedPlayers: number;
  activePlayers: number;
}

// Utility types for tournament creation
export interface CreateTournamentRequest {
  name: string;
  type: TournamentType;
  maxPlayers: number;
  format: MatchFormat;
  isPublic: boolean;
  description?: string;
  location?: string;
  startDate?: Date;
}

export interface UpdateTournamentRequest {
  name?: string;
  status?: TournamentStatus;
  isPublic?: boolean;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
}
