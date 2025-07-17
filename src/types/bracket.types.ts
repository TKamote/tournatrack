export type BracketType = "winners" | "losers" | "grandFinals" | "main";

export type TournamentType =
  | "Single Elimination"
  | "Double Elimination"
  | "Round Robin"
  | "Swiss System"
  | "Single Knockout";

export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin"
  | "swiss_system"
  | "single_knockout";

export enum TournamentEnum {
  SingleKnockout4 = "Single Knockout-4",
  SingleKnockout8 = "Single Knockout-8",
  SingleKnockout16 = "Single Knockout-16",
  DoubleElimination4 = "Double Elimination-4",
  DoubleElimination6 = "Double Elimination-6",
  DoubleElimination8 = "Double Elimination-8",
  DoubleElimination16 = "Double Elimination-16",
}

export const TOURNAMENT_TYPES = {
  SINGLE_ELIMINATION: "Single Elimination",
  DOUBLE_ELIMINATION: "Double Elimination",
  ROUND_ROBIN: "Round Robin",
  SWISS_SYSTEM: "Swiss System",
  SINGLE_KNOCKOUT: "Single Knockout",
} as const;

export const SUPPORTED_PLAYER_COUNTS = [4, 6, 8, 16] as const;

export type SupportedPlayerCount = (typeof SUPPORTED_PLAYER_COUNTS)[number];

export interface TournamentConfiguration {
  type: TournamentType;
  format: TournamentFormat;
  maxPlayers: SupportedPlayerCount;
  minPlayers: number;
  totalRounds: number;
  hasLosersBracket: boolean;
  hasGrandFinals: boolean;
  requiresGrandFinalsReset: boolean;
}

export const TOURNAMENT_CONFIGURATIONS: Record<
  string,
  TournamentConfiguration
> = {
  single_elimination_4: {
    type: "Single Elimination",
    format: "single_elimination",
    maxPlayers: 4,
    minPlayers: 4,
    totalRounds: 2,
    hasLosersBracket: false,
    hasGrandFinals: false,
    requiresGrandFinalsReset: false,
  },
  single_elimination_8: {
    type: "Single Elimination",
    format: "single_elimination",
    maxPlayers: 8,
    minPlayers: 4,
    totalRounds: 3,
    hasLosersBracket: false,
    hasGrandFinals: false,
    requiresGrandFinalsReset: false,
  },
  single_elimination_16: {
    type: "Single Elimination",
    format: "single_elimination",
    maxPlayers: 16,
    minPlayers: 8,
    totalRounds: 4,
    hasLosersBracket: false,
    hasGrandFinals: false,
    requiresGrandFinalsReset: false,
  },
  double_elimination_4: {
    type: "Double Elimination",
    format: "double_elimination",
    maxPlayers: 4,
    minPlayers: 4,
    totalRounds: 3,
    hasLosersBracket: true,
    hasGrandFinals: true,
    requiresGrandFinalsReset: true,
  },
  double_elimination_8: {
    type: "Double Elimination",
    format: "double_elimination",
    maxPlayers: 8,
    minPlayers: 4,
    totalRounds: 4,
    hasLosersBracket: true,
    hasGrandFinals: true,
    requiresGrandFinalsReset: true,
  },
  double_elimination_16: {
    type: "Double Elimination",
    format: "double_elimination",
    maxPlayers: 16,
    minPlayers: 8,
    totalRounds: 5,
    hasLosersBracket: true,
    hasGrandFinals: true,
    requiresGrandFinalsReset: true,
  },
};
