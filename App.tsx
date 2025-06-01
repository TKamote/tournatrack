import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, FlatList, SafeAreaView } from "react-native";
import React, { useState } from "react";
import HomeScreen, { TournamentType } from "./src/screens/HomeScreen";
import TournamentScreen from "./src/screens/TournamentScreen";

// Helper function to get player count from type
const getPlayerCountFromType = (type: TournamentType): number | null => {
  if (type === "Single Knockout 8") return 8;
  if (type === "Single Knockout 16") return 16;
  if (type === "Single Knockout 32") return 32;
  if (type === "Single Knockout 64") return 64;
  if (type === "Double Elimination 8") return 8;
  if (type === "Double Elimination 16") return 16; // For future
  if (type === "Double Elimination 32") return 32; // For future
  return null;
};

// Helper to check if it's a launchable tournament type (either SE or DE with players)
const isLaunchableTournamentType = (type: TournamentType): boolean => {
  return (
    getPlayerCountFromType(type) !== null &&
    (type.startsWith("Single Knockout") ||
      type.startsWith("Double Elimination"))
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"home" | "tournament">(
    "home"
  );
  const [selectedTournamentType, setSelectedTournamentType] =
    useState<TournamentType | null>(null);
  const [numPlayersForTournament, setNumPlayersForTournament] = useState<
    number | null
  >(null);

  const handleSelectTournament = (type: TournamentType) => {
    console.log("handleSelectTournament called with:", type);
    const playerCount = getPlayerCountFromType(type);

    if (playerCount !== null && isLaunchableTournamentType(type)) {
      setSelectedTournamentType(type);
      setNumPlayersForTournament(playerCount);
      setCurrentScreen("tournament");
      console.log(
        `Setting currentScreen to 'tournament' for ${type} with ${playerCount} players`
      );
    } else {
      // Handle types that are not yet launchable (e.g., DE 16/32 if disabled, or other future types)
      alert(`${type} is coming soon or is an invalid configuration!`);
      // Optionally reset if you don't want to keep it selected
      // setSelectedTournamentType(null);
      // setNumPlayersForTournament(null);
    }
  };

  const handleGoBack = () => {
    console.log("handleGoBack called");
    setCurrentScreen("home");
    setSelectedTournamentType(null);
    setNumPlayersForTournament(null);
  };

  console.log(
    "App.tsx rendering, currentScreen:",
    currentScreen,
    "selectedTournamentType:",
    selectedTournamentType,
    "numPlayers:",
    numPlayersForTournament
  );

  // Determine if we should render TournamentScreen
  const shouldRenderTournamentScreen =
    currentScreen === "tournament" &&
    selectedTournamentType !== null &&
    numPlayersForTournament !== null &&
    isLaunchableTournamentType(selectedTournamentType);

  if (shouldRenderTournamentScreen) {
    console.log(
      "Rendering TournamentScreen with type:",
      selectedTournamentType,
      "and players:",
      numPlayersForTournament
    );
    return (
      <TournamentScreen
        tournamentType={selectedTournamentType as TournamentType} // selectedTournamentType is confirmed not null here
        numPlayers={numPlayersForTournament as number} // numPlayersForTournament is confirmed not null here
        onGoBack={handleGoBack}
      />
    );
  } else {
    // If conditions for TournamentScreen are not met, render HomeScreen.
    // This also handles resetting to home if state somehow becomes inconsistent.
    if (currentScreen === "tournament") {
      console.warn(
        "State indicated tournament screen, but conditions not met. Reverting to home."
      );
      setCurrentScreen("home"); // Reset to prevent invalid state loop
      setSelectedTournamentType(null);
      setNumPlayersForTournament(null);
    }
    console.log("Rendering HomeScreen");
    return <HomeScreen onSelectTournament={handleSelectTournament} />;
  }
}

const styles = StyleSheet.create({
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
    alignSelf: "center", // Add this to center the 90% width container
  },
  matchText: {
    fontSize: 16,
  },
});
