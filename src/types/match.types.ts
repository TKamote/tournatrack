import { Player } from "./player.types";
import { BracketType } from "./bracket.types";

export interface MatchFormat {
  type: "raceTo";
  gamesNeededToWin: number;
  label: string;
}

export interface Game {
  id: string;
  winner: Player | null;
  score1: number;
  score2: number;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  bracket: BracketType;
  isGrandFinalsReset: boolean;
  format: MatchFormat;
  games: Game[];
}
