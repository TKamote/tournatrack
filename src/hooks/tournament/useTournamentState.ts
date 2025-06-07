import { useTournament } from "../../contexts/tournament/TournamentContext";
import { Match } from "../../types";

export const useTournamentState = () => {
  const { state } = useTournament();

  const getCurrentRoundMatches = (bracket?: "winners" | "losers"): Match[] => {
    if (!bracket) {
      return state.matches.filter((m) => m.round === state.currentRound);
    }
    return state.matches.filter(
      (m) =>
        m.round ===
          (bracket === "winners"
            ? state.currentWinnersRound
            : state.currentLosersRound) && m.bracket === bracket
    );
  };

  const getPlayerMatchHistory = (playerId: string): Match[] => {
    return state.matches.filter(
      (m) => m.player1?.id === playerId || m.player2?.id === playerId
    );
  };

  const isRoundComplete = (
    round: number,
    bracket?: "winners" | "losers"
  ): boolean => {
    const roundMatches = bracket
      ? state.matches.filter((m) => m.round === round && m.bracket === bracket)
      : state.matches.filter((m) => m.round === round);

    return roundMatches.length > 0 && roundMatches.every((m) => m.winner);
  };

  return {
    matches: state.matches,
    players: state.players,
    currentRound: state.currentRound,
    currentWinnersRound: state.currentWinnersRound,
    currentLosersRound: state.currentLosersRound,
    tournamentType: state.tournamentType,
    isInitialized: state.isInitialized,
    getCurrentRoundMatches,
    getPlayerMatchHistory,
    isRoundComplete,
  };
};
