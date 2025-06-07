export type BracketType = "winners" | "losers" | "grandFinals";

// Keep your existing type for type checking
export type TournamentType =
  | "Single Elimination"
  | "Double Elimination"
  | "Round Robin"
  | "Swiss System"
  | "Single Knockout";

// Add this enum for use in the HomeScreen
export enum TournamentEnum {
  SingleKnockout4 = "Single Knockout-4",
  SingleKnockout8 = "Single Knockout-8",
  SingleKnockout16 = "Single Knockout-16",
  DoubleElimination6 = "Double Elimination-6",
  DoubleElimination8 = "Double Elimination-8",
}

// Keep your existing constant
export const TOURNAMENT_TYPES = {
  SINGLE_ELIMINATION: "Single Elimination",
  DOUBLE_ELIMINATION: "Double Elimination",
  ROUND_ROBIN: "Round Robin",
  SWISS_SYSTEM: "Swiss System",
  SINGLE_KNOCKOUT: "Single Knockout",
} as const;
