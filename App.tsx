import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, FlatList, SafeAreaView } from "react-native";
import React, { useState } from "react";
import { TournamentType, MatchFormat } from "./src/types";
import HomeScreen from "./src/screens/HomeScreen";
import PlayerInputScreen from "./src/screens/PlayerInputScreen";
import TournamentScreen from "./src/screens/TournamentScreen";

// Helper to check if it's a launchable tournament type
// This might also be simplified or adjusted based on how HomeScreen passes numPlayers
const isLaunchableTournamentType = (type: TournamentType): boolean => {
  return (
    type.startsWith("Single Knockout") || type.startsWith("Double Elimination")
  );
};

export default function App() {
  // Define all state with proper types
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "playerInput" | "tournament"
  >("home");
  const [selectedTournamentType, setSelectedTournamentType] =
    useState<TournamentType | null>(null);
  const [numPlayersForTournament, setNumPlayersForTournament] = useState<
    number | null
  >(null);
  const [playerNamesList, setPlayerNamesList] = useState<string[]>([]); // State for player names
  const [selectedMatchFormat, setSelectedMatchFormat] =
    useState<MatchFormat | null>(null);

  // Navigation handlers
  const handleStartTournament = (
    playerNames: string[],
    format: MatchFormat
  ) => {
    console.log("Starting tournament with format:", format); // Debug log
    setPlayerNamesList(playerNames);
    setSelectedMatchFormat(format);
    setCurrentScreen("tournament");
  };

  const handleGoBack = () => {
    if (currentScreen === "tournament") {
      setCurrentScreen("playerInput");
    } else if (currentScreen === "playerInput") {
      setCurrentScreen("home");
    }
  };

  console.log(
    "App.tsx rendering, currentScreen:",
    currentScreen,
    "selectedTournamentType:",
    selectedTournamentType,
    "numPlayers:",
    numPlayersForTournament
  );

  // Render the appropriate screen
  return (
    <>
      {currentScreen === "home" && (
        <HomeScreen
          onTournamentSetup={(type: TournamentType, players: number) => {
            setSelectedTournamentType(type);
            setNumPlayersForTournament(players);
            setCurrentScreen("playerInput");
          }}
        />
      )}

      {currentScreen === "playerInput" &&
        selectedTournamentType &&
        numPlayersForTournament && (
          <PlayerInputScreen
            tournamentType={selectedTournamentType}
            numPlayers={numPlayersForTournament}
            onStartTournament={handleStartTournament}
            onGoBack={handleGoBack} // Optional: if PlayerInputScreen needs a back button to Home
          />
        )}

      {currentScreen === "tournament" &&
        selectedTournamentType &&
        numPlayersForTournament && // This ensures numPlayers is not null
        selectedMatchFormat && ( // Add this check for matchFormat
          <TournamentScreen
            tournamentType={selectedTournamentType}
            numPlayers={numPlayersForTournament} // TypeScript now knows this can't be null
            playerNames={playerNamesList}
            matchFormat={selectedMatchFormat}
            onGoBack={handleGoBack}
          />
        )}
    </>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles ...
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  matchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignSelf: "center",
  },
  matchText: {
    fontSize: 16,
  },
});
