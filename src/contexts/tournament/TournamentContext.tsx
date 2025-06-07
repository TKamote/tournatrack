import React, { createContext, useContext, useReducer } from "react";
import { TournamentState, TournamentAction } from "./TournamentTypes";
import { tournamentReducer } from "./TournamentReducer";

interface TournamentContextType {
  state: TournamentState;
  dispatch: React.Dispatch<TournamentAction>;
}

const initialState: TournamentState = {
  matches: [],
  players: [],
  currentRound: 1,
  currentWinnersRound: 1,
  currentLosersRound: 1,
  tournamentType: "",
  isInitialized: false,
};

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);

  return (
    <TournamentContext.Provider value={{ state, dispatch }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
};
