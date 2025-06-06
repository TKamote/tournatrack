import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform, // Import Platform
} from "react-native";
import { TournamentType, MatchFormat } from "../types";
import { COLORS } from "../constants/colors";
import MatchFormatSelector from "../components/MatchFormatSelector";

const defaultMatchFormats = {
  bo5: { bestOf: 5, gamesNeededToWin: 3 },
  bo7: { bestOf: 7, gamesNeededToWin: 4 },
  bo9: { bestOf: 9, gamesNeededToWin: 5 },
  bo11: { bestOf: 11, gamesNeededToWin: 6 },
} as const;

interface PlayerInputScreenProps {
  tournamentType: TournamentType;
  numPlayers: number;
  onStartTournament: (playerNames: string[], format: MatchFormat) => void;
  onGoBack?: () => void;
}

const PlayerInputScreen: React.FC<PlayerInputScreenProps> = ({
  tournamentType,
  numPlayers,
  onStartTournament,
  onGoBack,
}) => {
  // Initialize playerNames with proper length immediately
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array(numPlayers).fill("")
  );
  const [matchFormat, setMatchFormat] = useState<MatchFormat | null>(null);
  const [isFormatSelected, setIsFormatSelected] = useState(false);

  const handleNameChange = useCallback((text: string, index: number) => {
    setPlayerNames((prev) => {
      const newNames = [...prev];
      newNames[index] = text;
      return newNames;
    });
  }, []);

  const validateAndProceed = () => {
    // Add null/undefined check before validation
    if (!playerNames || playerNames.length === 0) {
      Alert.alert("Error", "No players available");
      return;
    }

    if (playerNames.some((name) => name.trim() === "")) {
      Alert.alert("Validation Error", "All player names must be filled in.");
      return;
    }
    const lowerCaseNames = playerNames.map((name) => name.trim().toLowerCase());
    const uniqueNames = new Set(lowerCaseNames);
    if (uniqueNames.size !== playerNames.length) {
      Alert.alert("Validation Error", "Player names must be unique.");
      return;
    }

    if (!matchFormat) {
      Alert.alert("Error", "Please select a race format");
      return;
    }

    // Add logging to debug
    console.log("Starting tournament with:", {
      playerCount: playerNames.length,
      players: playerNames,
      format: matchFormat,
    });

    onStartTournament(
      playerNames.map((name) => name.trim()),
      matchFormat
    );
  };

  const areAllPlayersEntered = useCallback(() => {
    return (
      playerNames.every((name) => name.trim() !== "") &&
      playerNames.length === numPlayers
    );
  }, [playerNames, numPlayers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Adjust offset if you have a header
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled" // Good for dismissing keyboard when tapping outside inputs
        >
          {onGoBack && (
            <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>&lt; Back to Setup</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Enter Player Names</Text>
          <Text style={styles.subtitle}>
            For: {tournamentType} ({numPlayers} Players)
          </Text>

          <View style={styles.playersGridContainer}>
            {playerNames.map((name, index) => (
              <View key={index} style={styles.playerInputWrapper}>
                <Text style={styles.label}>P{index + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Player ${index + 1}`}
                  value={name}
                  onChangeText={(text) =>
                    handleNameChange(text.slice(0, 12), index)
                  } // Limit to 12 chars
                  autoCapitalize="words"
                  returnKeyType={
                    index === playerNames.length - 1 ? "done" : "next"
                  }
                  maxLength={12} // Add character limit
                />
              </View>
            ))}
          </View>

          <View
            style={[
              styles.formatSelectorContainer,
              !areAllPlayersEntered() && styles.formatSelectorDisabled,
            ]}
          >
            <Text style={styles.sectionTitle}>Select Race Format</Text>
            <MatchFormatSelector
              selectedFormat={matchFormat}
              onFormatChange={(format) => {
                setMatchFormat(format);
                setIsFormatSelected(true);
              }}
              disabled={!areAllPlayersEntered()}
            />
          </View>

          <TouchableOpacity
            style={styles.proceedButton}
            onPress={validateAndProceed}
            disabled={!areAllPlayersEntered() || !isFormatSelected}
          >
            <Text style={styles.proceedButtonText}>Start Tournament</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 10, // Reduced padding
    justifyContent: "flex-start", // Changed to start from top
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  backButtonText: {
    color: "#007bff",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  playersGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 10,
  },
  playerInputWrapper: {
    width: "48%", // Just under 50% to account for spacing
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    marginRight: 5,
    color: "#333",
    width: 25, // Fixed width for label
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    height: 36,
  },
  proceedButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  proceedButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  formatSelectorContainer: {
    marginTop: 20,
    marginBottom: 15,
    width: "100%",
    opacity: 1,
  },
  formatSelectorDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 10,
  },
  startButton: {
    marginTop: 20,
  },
});

export default PlayerInputScreen;
