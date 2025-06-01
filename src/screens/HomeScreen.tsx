import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";

// Updated TournamentType
export type TournamentType =
  | "Single Knockout 8"
  | "Single Knockout 16"
  | "Single Knockout 32"
  | "Single Knockout 64"
  | "Double Elimination 8" // Added
  | "Double Elimination 16" // Placeholder for future
  | "Double Elimination 32"; // Placeholder for future

interface HomeScreenProps {
  onSelectTournament: (type: TournamentType) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectTournament }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Select Tournament Type</Text>

        <Text style={styles.sectionTitle}>Single Elimination</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Single Knockout (8 Players)"
            onPress={() => onSelectTournament("Single Knockout 8")}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Single Knockout (16 Players)"
            onPress={() => onSelectTournament("Single Knockout 16")}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Single Knockout (32 Players)"
            onPress={() => onSelectTournament("Single Knockout 32")}
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Single Knockout (64 Players)"
            onPress={() => onSelectTournament("Single Knockout 64")}
          />
        </View>

        <Text style={styles.sectionTitle}>Double Elimination</Text>
        <View style={styles.buttonContainer}>
          <Button
            title="Double Elimination (8 Players)"
            onPress={() => onSelectTournament("Double Elimination 8")}
          />
        </View>
        {/* Placeholders for other DE sizes */}
        <View style={styles.buttonContainer}>
          <Button
            title="Double Elimination (16 Players) - Soon"
            onPress={() => onSelectTournament("Double Elimination 16")}
            disabled
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Double Elimination (32 Players) - Soon"
            onPress={() => onSelectTournament("Double Elimination 32")}
            disabled
          />
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20, // Adjusted margin
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600", // Semi-bold
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  buttonContainer: {
    width: "80%",
    marginVertical: 8, // Adjusted margin
  },
});

export default HomeScreen;
