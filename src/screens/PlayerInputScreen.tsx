import React, { useState, useEffect } from "react";
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
import { TournamentType } from "../types";

interface PlayerInputScreenProps {
  tournamentType: TournamentType;
  numPlayers: number;
  onStartTournament: (
    type: TournamentType,
    numPlayers: number,
    names: string[]
  ) => void;
  onGoBack?: () => void;
}

const PlayerInputScreen: React.FC<PlayerInputScreenProps> = ({
  tournamentType,
  numPlayers,
  onStartTournament,
  onGoBack,
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  useEffect(() => {
    setPlayerNames(Array(numPlayers).fill(""));
  }, [numPlayers]);

  const handleNameChange = (text: string, index: number) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = text;
    setPlayerNames(newPlayerNames);
  };

  const validateAndProceed = () => {
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
    onStartTournament(
      tournamentType,
      numPlayers,
      playerNames.map((name) => name.trim())
    );
  };

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

          {playerNames.map((name, index) => (
            <View key={index} style={styles.inputContainer}>
              <Text style={styles.label}>Player {index + 1}:</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter name for Player ${index + 1}`}
                value={name}
                onChangeText={(text) => handleNameChange(text, index)}
                autoCapitalize="words"
                returnKeyType={
                  index === playerNames.length - 1 ? "done" : "next"
                } // Helpful for keyboard navigation
                onSubmitEditing={() => {
                  // Optionally, focus next input or submit form
                  // This requires managing refs to TextInputs
                }}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.proceedButton}
            onPress={validateAndProceed}
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
    padding: 20,
    justifyContent: "center", // Helps to center content if it's less than screen height
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
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
});

export default PlayerInputScreen;
