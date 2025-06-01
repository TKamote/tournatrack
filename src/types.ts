// filepath: src/types.ts
export interface Player {
  id: string;
  name: string;
  losses: number; // New: to track losses
}

export type BracketType = "winners" | "losers" | "grandFinals";

export interface Match {
  id: string;
  round: number; // Round number within its specific bracket
  matchNumber: number; // Overall match number or unique identifier within its round/bracket
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  bracket: BracketType; // New: to identify the bracket
  isGrandFinalsReset?: boolean; // New: for the second Grand Finals match
  // Optional: for Losers' Bracket, you might need to know which Winners' Bracket round feeds into it
  // feedsFromWinnersRound?: number;
}

export interface Tournament {
  id: string;
  name: string;
  players: Player[];
  matches: Match[];
}
