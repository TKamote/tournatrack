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
            onPress={
              () => handleTournamentSelect(TournamentType.DoubleElimination8, 6) // Note: Type implies 8, but players is 6. Ensure this is intended.
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
    backgroundColor: "#2c3e50", // Darker background for a more "serious" feel
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30, // Increased vertical padding
    paddingHorizontal: 15, // Increased horizontal padding
  },
  title: {
    fontSize: 30, // Reduced font size by 2px
    fontWeight: "bold",
    marginBottom: 15,
    color: "#ecf0f1", // Light color for dark background
  },
  subtitle: {
    fontSize: 18, // Slightly larger subtitle
    marginBottom: 40, // Increased margin
    color: "#bdc3c7", // Lighter grey
    textAlign: "center",
  },
  section: {
    width: "95%", // Slightly wider sections
    marginBottom: 30,
    padding: 20, // Increased padding within sections
    backgroundColor: "#34495e", // Darker section background
    borderRadius: 10, // More rounded corners
    elevation: 3, // Slightly more elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 20, // Larger section title
    fontWeight: "600",
    marginBottom: 20, // Increased margin
    color: "#1abc9c", // Teal accent color for section titles
    borderBottomWidth: 2, // Thicker border
    borderBottomColor: "#2c3e50", // Border color matching overall background
    paddingBottom: 8, // Increased padding
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1abc9c", // Teal buttons
    paddingVertical: 15, // Taller buttons
    paddingHorizontal: 20,
    borderRadius: 8, // More rounded buttons
    marginBottom: 12, // Slightly more space between buttons
    alignItems: "center",
    elevation: 2,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16, // Larger button text
    fontWeight: "bold", // Bolder button text
  },
});

export default HomeScreen;
