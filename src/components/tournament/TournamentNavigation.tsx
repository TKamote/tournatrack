import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

type TournamentView = "brackets" | "history" | "stats";

interface TournamentNavigationProps {
  currentView: TournamentView;
  onViewChange: (view: TournamentView) => void;
}

export const TournamentNavigation: React.FC<TournamentNavigationProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, currentView === "brackets" && styles.activeTab]}
        onPress={() => onViewChange("brackets")}
      >
        <Text style={styles.tabText}>Brackets</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, currentView === "history" && styles.activeTab]}
        onPress={() => onViewChange("history")}
      >
        <Text style={styles.tabText}>History</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, currentView === "stats" && styles.activeTab]}
        onPress={() => onViewChange("stats")}
      >
        <Text style={styles.tabText}>Stats</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textDark,
    fontWeight: "600",
  },
});
