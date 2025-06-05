import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { TournamentType } from "../types"; // Import from types.ts

interface HomeScreenProps {
  onNavigateToPlayerInput: (type: TournamentType, numPlayers: number) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToPlayerInput }) => {
  const handleTournamentSelect = (type: TournamentType, players: number) => {
    onNavigateToPlayerInput(type, players);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>TournaTrack</Text>
        <Text style={styles.subtitle}>Select Tournament Type & Players</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Single Elimination</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.SingleKnockout4, 4)
            }
          >
            <Text style={styles.buttonText}>4 Players</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.SingleKnockout8, 8)
            }
          >
            <Text style={styles.buttonText}>8 Players</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.SingleKnockout16, 16)
            }
          >
            <Text style={styles.buttonText}>16 Players</Text>
          </TouchableOpacity>
          {/* Removed 32 Players button for Single Elimination */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Double Elimination</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              // Assuming TournamentType.DoubleElimination8 is a general type for DE
              // and the number of players (6) correctly configures it.
              // If you have specific types like TournamentType.DoubleElimination6, use that.
              handleTournamentSelect(TournamentType.DoubleElimination8, 6)
            }
          >
            <Text style={styles.buttonText}>6 Players</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.DoubleElimination8, 8)
            }
          >
            <Text style={styles.buttonText}>8 Players</Text>
          </TouchableOpacity>
          {/* Removed 12 Players button for Double Elimination */}
          {/* Removed 16 Players button for Double Elimination */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2c3e50",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 30, // Kept the smaller font size as per previous request
    fontWeight: "bold",
    marginBottom: 15,
    color: "#ecf0f1",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: "#bdc3c7",
    textAlign: "center",
  },
  section: {
    width: "95%",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "#34495e",
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#1abc9c",
    borderBottomWidth: 2,
    borderBottomColor: "#2c3e50",
    paddingBottom: 8,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1abc9c",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomeScreen;
