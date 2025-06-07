import { Match, Player, MatchFormat, BracketType } from "../../types";

// Utility functions
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Tournament creation utils
export const createMatch = (
  id: string,
  round: number,
  matchNumber: number,
  player1: Player | null,
  player2: Player | null,
  bracket: "winners" | "losers" | "grandFinals",
  isGrandFinalsReset: boolean,
  format: MatchFormat
): Match => ({
  id,
  round,
  matchNumber,
  player1,
  player2,
  winner: null,
  bracket,
  isGrandFinalsReset,
  format,
  games: [],
});

// Match advancement utils (from matchAdvancementUtils.ts)

// Double elimination utils (from doubleEliminationUtils.ts)
export const generateDEWinnersBracketNextRound = (
  previousMatches: Match[],
  nextRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousMatches.filter((m) => m.winner).map((m) => m.winner!);

  const matches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    matches.push(
      createMatch(
        `match-wb${nextRound}-${Math.floor(i / 2) + 1}`,
        nextRound,
        Math.floor(i / 2) + 1,
        winners[i],
        i + 1 < winners.length ? winners[i + 1] : null,
        "winners",
        false,
        format
      )
    );
  }
  return matches;
};

export const generateDELosersBracketRound1Matches = (
  losers: Player[],
  existingMatchCount: number,
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  for (let i = 0; i < losers.length; i += 2) {
    matches.push(
      createMatch(
        `match-lb1-${Math.floor(i / 2) + 1}`,
        1,
        existingMatchCount + Math.floor(i / 2) + 1,
        losers[i],
        i + 1 < losers.length ? losers[i + 1] : null,
        "losers",
        false,
        format
      )
    );
  }
  return matches;
};

export const generateDELosersBracketNextRoundMatches = (
  previousMatches: Match[],
  newLosers: Player[],
  nextRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousMatches.filter((m) => m.winner).map((m) => m.winner!);

  const allPlayers = [...winners, ...newLosers];
  const matches: Match[] = [];

  for (let i = 0; i < allPlayers.length; i += 2) {
    matches.push(
      createMatch(
        `match-lb${nextRound}-${Math.floor(i / 2) + 1}`,
        nextRound,
        Math.floor(i / 2) + 1,
        allPlayers[i],
        i + 1 < allPlayers.length ? allPlayers[i + 1] : null,
        "losers",
        false,
        format
      )
    );
  }
  return matches;
};

export const generatePlayers = (playerNames: string[]): Player[] => {
  return playerNames.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    seed: index + 1,
    losses: 0,
  }));
};

export const generateSENextRoundMatches = (
  previousMatches: Match[],
  nextRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousMatches.filter((m) => m.winner).map((m) => m.winner!);
  const matches: Match[] = [];

  for (let i = 0; i < winners.length; i += 2) {
    matches.push(
      createMatch(
        `match-se${nextRound}-${Math.floor(i / 2) + 1}`,
        nextRound,
        Math.floor(i / 2) + 1,
        winners[i],
        i + 1 < winners.length ? winners[i + 1] : null,
        "winners",
        false,
        format
      )
    );
  }
  return matches;
};

// Add the findNextMatch function export
export const findNextMatch = (
  matches: Match[],
  currentRound: number,
  bracket: BracketType
): Match | undefined => {
  return matches.find(
    (match) =>
      match.round === currentRound && match.bracket === bracket && !match.winner
  );
};
