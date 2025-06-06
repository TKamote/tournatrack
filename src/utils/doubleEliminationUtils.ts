import { Match, Player, MatchFormat } from "../types";

export const createDoubleEliminationInitialMatches = (
  players: Player[],
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  let matchIdCounter = 0;

  // Create winners bracket first round matches
  for (let i = 0; i < players.length; i += 2) {
    matchIdCounter++;
    const player1 = players[i];
    const player2 = i + 1 < players.length ? players[i + 1] : null;

    matches.push({
      id: `match-wb1-${matchIdCounter}`,
      round: 1,
      matchNumber: Math.floor(i / 2) + 1,
      player1,
      player2,
      winner: player2 === null ? player1 : null,
      bracket: "winners",
      format,
      games: [],
    });
  }

  return matches;
};

export const generateDEWinnersBracketNextRound = (
  previousRoundMatches: Match[],
  currentRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousRoundMatches
    .filter((m) => m.winner && m.bracket === "winners")
    .map((m) => m.winner!);

  const newMatches: Match[] = [];
  let matchIdCounter = previousRoundMatches.length;

  for (let i = 0; i < winners.length; i += 2) {
    matchIdCounter++;
    newMatches.push({
      id: `match-wb${currentRound}-${matchIdCounter}`,
      round: currentRound,
      matchNumber: Math.floor(i / 2) + 1,
      player1: winners[i],
      player2: i + 1 < winners.length ? winners[i + 1] : null,
      winner: i + 1 >= winners.length ? winners[i] : null,
      bracket: "winners",
      format,
      games: [],
    });
  }

  return newMatches;
};

export const generateDELosersBracketRound1Matches = (
  wbRound1Losers: Player[],
  existingMatchCount: number,
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  let matchIdCounter = existingMatchCount;

  for (let i = 0; i < wbRound1Losers.length; i += 2) {
    matchIdCounter++;
    matches.push({
      id: `match-lb1-${matchIdCounter}`,
      round: 1,
      matchNumber: Math.floor(i / 2) + 1,
      player1: wbRound1Losers[i],
      player2: i + 1 < wbRound1Losers.length ? wbRound1Losers[i + 1] : null,
      winner: i + 1 >= wbRound1Losers.length ? wbRound1Losers[i] : null,
      bracket: "losers",
      format,
      games: [],
    });
  }

  return matches;
};

export const generateDELosersBracketNextRoundMatches = (
  previousLosersMatches: Match[],
  newLosersFromWinners: Player[],
  currentRound: number,
  format: MatchFormat
): Match[] => {
  const losersWinners = previousLosersMatches
    .filter((m) => m.winner)
    .map((m) => m.winner!);

  const allPlayers = [...losersWinners, ...newLosersFromWinners];
  const matches: Match[] = [];
  let matchIdCounter = previousLosersMatches.length;

  for (let i = 0; i < allPlayers.length; i += 2) {
    matchIdCounter++;
    matches.push({
      id: `match-lb${currentRound}-${matchIdCounter}`,
      round: currentRound,
      matchNumber: Math.floor(i / 2) + 1,
      player1: allPlayers[i],
      player2: i + 1 < allPlayers.length ? allPlayers[i + 1] : null,
      winner: i + 1 >= allPlayers.length ? allPlayers[i] : null,
      bracket: "losers",
      format,
      games: [],
    });
  }

  return matches;
};

export const isGrandFinals = (match: Match): boolean => {
  return match.bracket === "grandFinals";
};

export const needsResetMatch = (
  gfMatch: Match,
  lbPlayer: Player | null
): boolean => {
  return gfMatch.winner?.id === lbPlayer?.id;
};
