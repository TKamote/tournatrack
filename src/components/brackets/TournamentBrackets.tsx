import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { WinnersBracket } from "./WinnersBracket";
import { LosersBracket } from "./LosersBracket";
import { TournamentProgress } from "../tournament/TournamentProgress";
import { TournamentNavigation } from "../tournament/TournamentNavigation";
import { MatchHistory } from "../tournament/MatchHistory";
import { TournamentStats } from "../tournament/TournamentStats";
import { GrandFinals } from "../tournament/GrandFinals";
import { COLORS } from "../../constants/colors";

export const TournamentBrackets: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "brackets" | "history" | "stats"
  >("brackets");
  const { tournamentType } = useTournamentState();
  const isDoubleElimination = tournamentType.startsWith("Double");

  const renderContent = () => {
    switch (currentView) {
      case "brackets":
        return (
          <>
            <TournamentProgress />
            <View style={styles.bracketSection}>
              <WinnersBracket />
            </View>
            {isDoubleElimination && (
              <View style={styles.bracketSection}>
                <LosersBracket />
              </View>
            )}
            <GrandFinals />
          </>
        );
      case "history":
        return <MatchHistory />;
      case "stats":
        return <TournamentStats />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TournamentNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
  },
  bracketSection: {
    marginVertical: 8,
  },
});
