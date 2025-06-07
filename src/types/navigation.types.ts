import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TournamentType, MatchFormat } from "./";

export type RootStackParamList = {
  Home: undefined;
  PlayerInput: {
    tournamentType: TournamentType;
    numPlayers: number;
  };
  Tournament: {
    tournamentType: TournamentType;
    numPlayers: number;
    playerNames: string[];
    matchFormat: MatchFormat;
  };
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Home"
>;
export type PlayerInputScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput"
>;
export type TournamentScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Tournament"
>;
