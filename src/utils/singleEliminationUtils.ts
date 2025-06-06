import { Match, Player, MatchFormat } from "../types";

export const createSEInitialMatches = (
  players: Player[],
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  let matchIdCounter = 0;

  // Calculate number of byes needed
  const totalSlots = Math.pow(2, Math.ceil(Math.log2(players.length)));
  const numByes = totalSlots - players.length;

  // Create first round matches
  for (let i = 0; i < players.length; i += 2) {
    matchIdCounter++;
    const player1 = players[i];
    const player2 = i + 1 < players.length ? players[i + 1] : null;

    matches.push({
      id: `match-${matchIdCounter}`,
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

export const generateSENextRoundMatches = (
  previousRoundMatches: Match[],
  currentRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousRoundMatches
    .filter((m) => m.winner)
    .map((m) => m.winner!);

  const newMatches: Match[] = [];
  let matchIdCounter = previousRoundMatches.length;

  for (let i = 0; i < winners.length; i += 2) {
    matchIdCounter++;
    newMatches.push({
      id: `match-${matchIdCounter}`,
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

export const isMatchComplete = (match: Match): boolean => {
  if (!match.games) return false;
  const { gamesNeededToWin } = match.format;

  const p1Wins = match.games.filter(
    (g) => g.winner?.id === match.player1?.id
  ).length;
  const p2Wins = match.games.filter(
    (g) => g.winner?.id === match.player2?.id
  ).length;

  return p1Wins >= gamesNeededToWin || p2Wins >= gamesNeededToWin;
};

export const isFinalMatch = (match: Match, allMatches: Match[]): boolean => {
  const maxRound = Math.max(...allMatches.map((m) => m.round));
  return match.round === maxRound;
};
