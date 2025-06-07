import { Match, Player, BracketType } from "../../types";

export const findNextMatch = (
  matches: Match[],
  currentRound: number,
  bracket: BracketType // Using the imported BracketType
): Match | undefined => {
  return matches.find(
    (match) =>
      match.round === currentRound && match.bracket === bracket && !match.winner
  );
};
