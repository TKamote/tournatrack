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
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.SingleKnockout32, 32)
            }
          >
            <Text style={styles.buttonText}>32 Players</Text>
          </TouchableOpacity>
          {/* If you have SingleKnockout64
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.SingleKnockout64, 64)
            }
          >
            <Text style={styles.buttonText}>64 Players</Text>
          </TouchableOpacity>
          */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Double Elimination</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.DoubleElimination8, 6)
            }
          >
            <Text style={styles.buttonText}>6 Players</Text>
          </TouchableOpacity>
          {/* Removed 7 Players Button
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.DoubleElimination8, 7)
            }
          >
            <Text style={styles.buttonText}>7 Players</Text>
          </TouchableOpacity>
          */}
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.DoubleElimination8, 8)
            }
          >
            <Text style={styles.buttonText}>8 Players</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.DoubleElimination12, 12)
            }
          >
            <Text style={styles.buttonText}>12 Players</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              handleTournamentSelect(TournamentType.DoubleElimination16, 16)
            }
          >
            <Text style={styles.buttonText}>16 Players</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#555",
  },
  section: {
    width: "90%",
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#007bff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HomeScreen;
