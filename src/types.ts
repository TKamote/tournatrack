// filepath: src/types.ts
export interface Player {
  id: string;
  name: string;
  losses: number;
}

export type BracketType = "winners" | "losers" | "grandFinals";

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  bracket: BracketType;
  isGrandFinalsReset?: boolean;
}

// Define TournamentType enum here
export enum TournamentType {
  SingleKnockout4 = "Single Knockout 4",
  SingleKnockout8 = "Single Knockout 8",
  SingleKnockout16 = "Single Knockout 16",
  SingleKnockout32 = "Single Knockout 32",
  // SingleKnockout64 = "Single Knockout 64",

  DoubleElimination8 = "Double Elimination 8", // Base for 6,7,8 players
  // DoubleElimination10 = "Double Elimination 10", // Removed
  DoubleElimination12 = "Double Elimination 12",
  DoubleElimination16 = "Double Elimination 16",
}

// If you still have RootStackParamList defined for any reason,
// it should now correctly find TournamentType.
// If you've completely removed React Navigation, you might not need RootStackParamList.
// For now, I'll assume it might still be there or you might reintroduce it later.
export type RootStackParamList = {
  Home: undefined;
  PlayerInput: {
    tournamentType: TournamentType; // This will now work
    numPlayers: number;
  };
  Tournament: {
    tournamentType: TournamentType; // This will now work
    numPlayers: number;
    playerNames: string[];
  };
};
