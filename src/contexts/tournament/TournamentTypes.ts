import { Match, Player } from "../../types";

export interface TournamentState {
  matches: Match[];
  players: Player[];
  currentRound: number;
  currentWinnersRound: number;
  currentLosersRound: number;
  tournamentType: string;
  isInitialized: boolean;
  winnersChampion: Player | null;
  losersChampion: Player | null;
  grandChampion: Player | null;
}

export type ChampionPayload = {
  winners?: Player;
  losers?: Player;
  grand?: Player;
};

export type TournamentAction =
  | { type: "INITIALIZE_TOURNAMENT"; payload: Partial<TournamentState> }
  | { type: "UPDATE_MATCHES"; payload: Match[] }
  | { type: "ADVANCE_ROUND" }
  | { type: "SET_WINNER"; payload: { matchId: string; winner: Player } }
  | { type: "SET_CHAMPIONS"; payload: ChampionPayload };
