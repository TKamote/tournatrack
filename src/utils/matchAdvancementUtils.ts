import { Match, Player } from "../types";

export const findNextMatch = (
  currentMatch: Match,
  allMatches: Match[]
): Match | null => {
  if (currentMatch.bracket === "winners") {
    return (
      allMatches.find(
        (m) =>
          m.bracket === "winners" &&
          m.round === currentMatch.round + 1 &&
          (!m.player1 || !m.player2)
      ) || null
    );
  } else if (currentMatch.bracket === "losers") {
    return (
      allMatches.find(
        (m) =>
          m.bracket === "losers" &&
          m.round === currentMatch.round + 1 &&
          (!m.player1 || !m.player2)
      ) || null
    );
  }
  return null;
};

export const allMatchesInRoundComplete = (
  matches: Match[],
  round: number,
  bracket: string
): boolean => {
  const roundMatches = matches.filter(
    (m) => m.round === round && m.bracket === bracket
  );
  return roundMatches.every((m) => m.winner !== null);
};

export const advanceWinner = (match: Match, allMatches: Match[]): Match[] => {
  if (!match.winner) return allMatches;

  const nextMatch = findNextMatch(match, allMatches);
  if (!nextMatch) return allMatches;

  return allMatches.map((m) => {
    if (m.id === nextMatch.id) {
      if (!m.player1) {
        return { ...m, player1: match.winner };
      } else {
        return { ...m, player2: match.winner };
      }
    }
    return m;
  });
};

export const isMatchReadyToStart = (match: Match): boolean => {
  return match.player1 !== null && match.player2 !== null;
};

export const isTournamentComplete = (matches: Match[]): boolean => {
  const grandFinalMatch = matches.find(
    (m) => m.bracket === "grandFinals" && !m.isGrandFinalsReset
  );

  // If there's no grand finals match or no winner, tournament isn't complete
  if (!grandFinalMatch || !grandFinalMatch.winner) return false;

  // Check if reset match is needed (winner came from losers bracket)
  const needsReset = grandFinalMatch.winner.losses > 0;

  // Find reset match if it exists
  const resetMatch = matches.find(
    (m) => m.bracket === "grandFinals" && m.isGrandFinalsReset
  );

  // Tournament is complete if:
  // 1. No reset needed (winners bracket player won) OR
  // 2. Reset match exists and has a winner
  return !needsReset || resetMatch?.winner !== undefined;
};
