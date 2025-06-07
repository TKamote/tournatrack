import { TournamentState, TournamentAction } from "./TournamentTypes";

export const tournamentReducer = (
  state: TournamentState,
  action: TournamentAction
): TournamentState => {
  switch (action.type) {
    case "INITIALIZE_TOURNAMENT":
      return {
        ...state,
        ...action.payload,
        isInitialized: true,
        winnersChampion: null,
        losersChampion: null,
        grandChampion: null,
      };

    case "UPDATE_MATCHES":
      return {
        ...state,
        matches: action.payload,
      };

    case "ADVANCE_ROUND":
      const newRound = state.currentRound + 1;
      return {
        ...state,
        currentRound: newRound,
        currentWinnersRound: state.tournamentType.startsWith("Double")
          ? state.currentWinnersRound + 1
          : newRound,
        currentLosersRound: state.tournamentType.startsWith("Double")
          ? state.currentLosersRound + 1
          : 0,
      };

    case "SET_WINNER":
      const updatedMatches = state.matches.map((match) =>
        match.id === action.payload.matchId
          ? { ...match, winner: action.payload.winner }
          : match
      );
      return {
        ...state,
        matches: updatedMatches,
      };

    case "SET_CHAMPIONS":
      return {
        ...state,
        winnersChampion: action.payload.winners ?? state.winnersChampion,
        losersChampion: action.payload.losers ?? state.losersChampion,
        grandChampion: action.payload.grand ?? state.grandChampion,
      };

    default:
      return state;
  }
};
