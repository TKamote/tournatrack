import { tournamentReducer } from "../TournamentReducer";
import { TournamentState, TournamentAction } from "../TournamentTypes";
import { Match, Player } from "../../../types";

describe("TournamentReducer", () => {
  const initialState: TournamentState = {
    matches: [],
    players: [],
    currentRound: 1,
    currentWinnersRound: 1,
    currentLosersRound: 1,
    tournamentType: "",
    isInitialized: false,
    winnersChampion: null,
    losersChampion: null,
    grandChampion: null,
  };

  it("should handle INITIALIZE_TOURNAMENT", () => {
    const action: TournamentAction = {
      type: "INITIALIZE_TOURNAMENT",
      payload: {
        tournamentType: "Double Elimination",
        players: [{ id: "1", name: "Player 1" }],
      },
    };

    const newState = tournamentReducer(initialState, action);
    expect(newState.isInitialized).toBe(true);
    expect(newState.tournamentType).toBe("Double Elimination");
    expect(newState.players).toHaveLength(1);
  });

  it("should handle SET_WINNER", () => {
    const winner: Player = { id: "1", name: "Player 1" };
    const match: Match = {
      id: "match-1",
      round: 1,
      matchNumber: 1,
      player1: winner,
      player2: { id: "2", name: "Player 2" },
      winner: null,
      bracket: "winners",
      format: "best-of-3",
    };

    const stateWithMatch: TournamentState = {
      ...initialState,
      matches: [match],
    };

    const action: TournamentAction = {
      type: "SET_WINNER",
      payload: { matchId: "match-1", winner },
    };

    const newState = tournamentReducer(stateWithMatch, action);
    expect(newState.matches[0].winner).toEqual(winner);
  });

  it("should handle ADVANCE_ROUND in double elimination", () => {
    const stateInDoubleElim: TournamentState = {
      ...initialState,
      tournamentType: "Double Elimination",
      currentRound: 1,
      currentWinnersRound: 1,
      currentLosersRound: 1,
    };

    const action: TournamentAction = { type: "ADVANCE_ROUND" };

    const newState = tournamentReducer(stateInDoubleElim, action);
    expect(newState.currentRound).toBe(2);
    expect(newState.currentWinnersRound).toBe(2);
    expect(newState.currentLosersRound).toBe(2);
  });
});
