import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MatchFormat } from "./match.types";

export type RootStackParamList = {
  Home: undefined;
  PlayerInput: {
    tournamentType: string;
    matchFormat?: MatchFormat;
    numPlayers?: number;
  };
  PlayerInput6: undefined; // ← ADD THIS
  DoubleElim8: {
    playerNames: string[];
    matchFormat: MatchFormat;
  };
  DoubleElim6: {
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
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Home"
>;
export type PlayerInputScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput"
>;
export type PlayerInput6ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput6"
>;
export type DoubleElim8ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DoubleElim8"
>;
export type DoubleElim6ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DoubleElim6"
>;
export type SingleElim8ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingleElim8"
>;
export type SingleElim16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SingleElim16"
>;
