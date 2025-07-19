import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MatchFormat } from "./match.types";
import { Tournament } from "./tournament.types";

export type RootStackParamList = {
  MainTabs: undefined;
  Manager: undefined;
  Supporter: undefined;
  Home: undefined;
  PlayerInput: {
    tournamentType: string;
    matchFormat?: MatchFormat;
    numPlayers?: number;
  };
  PlayerInput4: undefined;
  PlayerInput8: undefined;
  PlayerInput16: undefined;
  PlayerInputSingle4: undefined;
  PlayerInputSingle8: undefined;
  PlayerInputSingle16: undefined;
  DoubleElim8: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  DoubleElim4: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  DoubleElim16: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  SingleElim4: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  SingleElim8: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  SingleElim16: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  Auth: undefined;
  TournamentsDashboard: undefined;
  TournamentDetails: {
    tournament: Tournament;
  };
  ManagerProfile: {
    managerId: string;
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
export type PlayerInput4ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput4"
>;
export type PlayerInput8ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput8"
>;
export type PlayerInput16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput16"
>;
export type PlayerInputSingle4ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInputSingle4"
>;
export type PlayerInputSingle8ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInputSingle8"
>;
export type PlayerInputSingle16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInputSingle16"
>;
export type DoubleElim8ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DoubleElim8"
>;
export type DoubleElim4ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DoubleElim4"
>;
export type DoubleElim16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DoubleElim16"
>;
export type SingleElim4ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingleElim4"
>;
export type SingleElim8ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingleElim8"
>;
export type SingleElim16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingleElim16"
>;
