import { useTournament } from "../../contexts/tournament/TournamentContext";
import { Match, Player, MatchFormat } from "../../types";
import {
  createMatch,
  findNextMatch,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketNextRoundMatches,
} from "../../utils/tournament/tournamentUtils";

export const useMatchActions = () => {
  const { dispatch } = useTournament();

  const initializeTournament = (
    players: Player[],
    tournamentType: string,
    matches: Match[]
  ) => {
    dispatch({
      type: "INITIALIZE_TOURNAMENT",
      payload: {
        players,
        tournamentType,
        matches,
        currentRound: 1,
        currentWinnersRound: 1,
        currentLosersRound: 1,
      },
    });
  };

  const updateMatches = (matches: Match[]) => {
    dispatch({
      type: "UPDATE_MATCHES",
      payload: matches,
    });
  };

  const advanceRound = () => {
    dispatch({ type: "ADVANCE_ROUND" });
  };

  const setMatchWinner = (matchId: string, winner: Player) => {
    dispatch({
      type: "SET_WINNER",
      payload: { matchId, winner },
    });
  };

  const handleMatchWinner = (match: Match, winner: Player) => {
    // ...implementation
  };

  const advanceToNextRound = (currentMatches: Match[], format: MatchFormat) => {
    // ...implementation
  };

  return {
    initializeTournament,
    updateMatches,
    advanceRound,
    setMatchWinner,
    handleMatchWinner,
    advanceToNextRound,
  };
};
