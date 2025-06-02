import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, FlatList, SafeAreaView } from "react-native";
import React, { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen"; // Corrected import
import { TournamentType } from "./src/types"; // Corrected import
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
  const [currentScreen, setCurrentScreen] = useState<
    "home" | "playerInput" | "tournament" // Add "playerInput"
  >("home");
  const [selectedTournamentType, setSelectedTournamentType] =
    useState<TournamentType | null>(null);
  const [numPlayersForTournament, setNumPlayersForTournament] = useState<
    number | null
  >(null);
  const [playerNamesList, setPlayerNamesList] = useState<string[]>([]); // State for player names

  // Called from HomeScreen
  const handleNavigateToPlayerInput = (
    type: TournamentType,
    numPlayers: number
  ) => {
    console.log(
      "App: Navigating to Player Input for:",
      type,
      "with",
      numPlayers,
      "players"
    );
    if (isLaunchableTournamentType(type) && numPlayers > 0) {
      setSelectedTournamentType(type);
      setNumPlayersForTournament(numPlayers);
      setCurrentScreen("playerInput");
    } else {
      alert(
        `${type} with ${numPlayers} players is not a valid configuration or is coming soon!`
      );
    }
  };

  // Called from PlayerInputScreen
  const handleStartTournament = (
    type: TournamentType,
    numPlayers: number,
    names: string[]
  ) => {
    console.log("App: Starting tournament with names:", names);
    setSelectedTournamentType(type); // Should already be set, but good to ensure
    setNumPlayersForTournament(numPlayers); // Should already be set
    setPlayerNamesList(names);
    setCurrentScreen("tournament");
  };

  const handleGoBack = () => {
    console.log("App: handleGoBack called, returning to home");
    setCurrentScreen("home");
    setSelectedTournamentType(null);
    setNumPlayersForTournament(null);
    setPlayerNamesList([]); // Clear player names
  };

  console.log(
    "App.tsx rendering, currentScreen:",
    currentScreen,
    "selectedTournamentType:",
    selectedTournamentType,
    "numPlayers:",
    numPlayersForTournament
  );

  if (
    currentScreen === "playerInput" &&
    selectedTournamentType &&
    numPlayersForTournament
  ) {
    console.log("Rendering PlayerInputScreen");
    return (
      <PlayerInputScreen
        tournamentType={selectedTournamentType}
        numPlayers={numPlayersForTournament}
        onStartTournament={handleStartTournament}
        onGoBack={handleGoBack} // Optional: if PlayerInputScreen needs a back button to Home
      />
    );
  } else if (
    currentScreen === "tournament" &&
    selectedTournamentType &&
    numPlayersForTournament &&
    playerNamesList.length > 0 && // Ensure player names are set
    isLaunchableTournamentType(selectedTournamentType)
  ) {
    console.log(
      "Rendering TournamentScreen with type:",
      selectedTournamentType,
      "players:",
      numPlayersForTournament,
      "names:",
      playerNamesList
    );
    return (
      <TournamentScreen
        tournamentType={selectedTournamentType}
        numPlayers={numPlayersForTournament}
        playerNames={playerNamesList} // Pass the names
        onGoBack={handleGoBack}
      />
    );
  } else {
    // Default to HomeScreen
    // This also handles resetting to home if state somehow becomes inconsistent.
    if (currentScreen !== "home") {
      console.warn(
        "State indicated",
        currentScreen,
        "screen, but conditions not met. Reverting to home."
      );
      // setCurrentScreen("home"); // Already defaults here
      // setSelectedTournamentType(null); // These are reset in handleGoBack
      // setNumPlayersForTournament(null);
      // setPlayerNamesList([]);
    }
    console.log("Rendering HomeScreen");
    return <HomeScreen onNavigateToPlayerInput={handleNavigateToPlayerInput} />;
  }
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
