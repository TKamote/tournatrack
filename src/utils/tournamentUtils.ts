import { Match, Player, BracketType, MatchFormat } from "../types";

// Update the createMatch function to ensure format is always passed and used
export const createMatch = (
  id: string,
  round: number,
  matchNumber: number,
  player1: Player | null,
  player2: Player | null,
  bracket: BracketType,
  isGrandFinalsReset: boolean,
  format: MatchFormat // Make this required, not optional
): Match => {
  return {
    id,
    round,
    matchNumber,
    player1,
    player2,
    winner: player2 === null ? player1 : null,
    bracket,
    isGrandFinalsReset,
    format, // Use the passed format
    games: [],
  };
};

// Update grand finals match creation in double elimination logic
export const createGrandFinalsMatch = (
  wbChampion: Player,
  lbChampion: Player,
  round: number,
  format: MatchFormat, // Pass the original format
  isReset: boolean = false
): Match => {
  return createMatch(
    `match-gf-${isReset ? "reset-" : ""}1`,
    round,
    1,
    wbChampion,
    lbChampion,
    "grandFinals",
    isReset,
    format // Use the same format as other matches
  );
};

export const generatePlayers = (playerNames: string[]): Player[] => {
  return playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    losses: 0,
    seed: index + 1, // Add seed property
  }));
};

export const createSEInitialMatches = (
  players: Player[],
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  let matchIdCounter = 0;

  for (let i = 0; i < players.length; i += 2) {
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-se1-${matchIdCounter}`,
        1,
        Math.floor(i / 2) + 1,
        players[i],
        i + 1 < players.length ? players[i + 1] : null,
        "winners",
        false,
        format
      )
    );
  }

  return matches;
};

export const generateSENextRoundMatches = (
  previousMatches: Match[],
  nextRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousMatches.filter((m) => m.winner).map((m) => m.winner!);

  return createMatchesFromPlayers(winners, nextRound, "winners", format);
};

const createMatchesFromPlayers = (
  players: Player[],
  round: number,
  bracket: BracketType,
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];

  for (let i = 0; i < players.length; i += 2) {
    matches.push(
      createMatch(
        `match-${bracket}${round}-${Math.floor(i / 2) + 1}`,
        round,
        Math.floor(i / 2) + 1,
        players[i],
        i + 1 < players.length ? players[i + 1] : null,
        bracket,
        false,
        format
      )
    );
  }

  return matches;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Export other functions that were previously in doubleEliminationUtils.ts
export {
  createDoubleEliminationInitialMatches,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches,
} from "./doubleEliminationUtils";
