import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation.types";
import { COLORS } from "../../constants/colors";
import { MatchFormat } from "../../types";
import ScreenHeader from "../../components/ScreenHeader";
import { FONT_SIZES, FONT_WEIGHTS } from "../../constants/typography";

type PlayerInput16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput16"
>;

const PlayerInput16Screen: React.FC<PlayerInput16ScreenProps> = ({
  navigation,
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>(Array(16).fill(""));
  const [bulkInput, setBulkInput] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>({
    type: "raceTo",
    gamesNeededToWin: 3,
    label: "Race to 3",
  });

  const formatOptions: Array<{ label: string; value: MatchFormat }> = [
    {
      label: "Race to 3",
      value: { type: "raceTo", gamesNeededToWin: 3, label: "Race to 3" },
    },
    {
      label: "Race to 5",
      value: { type: "raceTo", gamesNeededToWin: 5, label: "Race to 5" },
    },
    {
      label: "Race to 7",
      value: { type: "raceTo", gamesNeededToWin: 7, label: "Race to 7" },
    },
    {
      label: "Race to 9",
      value: { type: "raceTo", gamesNeededToWin: 9, label: "Race to 9" },
    },
  ];

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
  };

  const handleBulkFill = () => {
    if (!bulkInput.trim()) {
      Alert.alert("Empty Input", "Please enter player names separated by commas.");
      return;
    }

    const parsedNames = bulkInput
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (parsedNames.length === 0) {
      Alert.alert("Invalid Input", "No valid player names found. Please separate names with commas.");
      return;
    }

    const normalizedParsed = parsedNames.map((n) => n.toLowerCase());
    const uniqueNames: string[] = [];
    const seenNames = new Set<string>();
    const duplicates: string[] = [];

    parsedNames.forEach((name, index) => {
      const normalized = normalizedParsed[index];
      if (!seenNames.has(normalized)) {
        seenNames.add(normalized);
        uniqueNames.push(name);
      } else {
        duplicates.push(name);
      }
    });

    const newPlayerNames = [...playerNames];
    const slotsToFill = Math.min(uniqueNames.length, playerNames.length);

    for (let i = 0; i < slotsToFill; i++) {
      newPlayerNames[i] = uniqueNames[i];
    }

    setPlayerNames(newPlayerNames);

    if (duplicates.length > 0) {
      Alert.alert(
        "Duplicate Names Removed",
        `The following duplicate names were ignored: ${duplicates.join(", ")}`
      );
    }

    if (uniqueNames.length > playerNames.length) {
      Alert.alert(
        "Too Many Players",
        `Only the first ${playerNames.length} players were added. Please remove extra names.`
      );
    } else if (uniqueNames.length < playerNames.length) {
      Alert.alert(
        "Players Added",
        "The new name may override existing player"
      );
    }

    setBulkInput("");
  };

  const handleStartTournament = () => {
    const validNames = playerNames.filter((name) => name.trim() !== "");
    if (validNames.length !== 16) {
      Alert.alert("Invalid Input", "Please enter exactly 16 player names.", [
        { text: "OK" },
      ]);
      return;
    }
    // Duplicate name check (case-insensitive, trimmed)
    const normalizedNames = validNames.map((n) => n.trim().toLowerCase());
    const nameSet = new Set(normalizedNames);
    if (nameSet.size !== normalizedNames.length) {
      Alert.alert("Duplicate Names", "Each player must have a unique name.", [
        { text: "OK" },
      ]);
      return;
    }
    navigation.navigate("DoubleElim16", {
      playerNames: validNames,
      matchFormat: selectedFormat,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.container}>
          <ScreenHeader
            title="Enter 16 Players to Begin"
            subtitle={undefined}
            titleColor={COLORS.glassmorphism.text}
            subtitleColor={COLORS.glassmorphism.textSecondary}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Bulk Add Section */}
            <View style={styles.bulkSection}>
              <Text style={styles.bulkTitle}>Bulk Add Players</Text>
              <Text style={styles.bulkHint}>
                Input players separated by commas
              </Text>
              <TextInput
                style={styles.bulkInput}
                value={bulkInput}
                onChangeText={setBulkInput}
                placeholder="Player1, Player2, Player3, ... (up to 16 players)"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[
                  styles.bulkButton,
                  !bulkInput.trim() && styles.bulkButtonDisabled,
                ]}
                onPress={handleBulkFill}
                disabled={!bulkInput.trim()}
              >
                <Text style={styles.bulkButtonText}>Fill Players</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playerGrid}>
              {playerNames.map((name, index) => (
                <View key={index} style={styles.inputContainer}>
                  <Text style={styles.label}>P{index + 1}:</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={(text) => handlePlayerNameChange(index, text)}
                    placeholder={`Player ${index + 1}`}
                    placeholderTextColor={COLORS.textLight}
                    returnKeyType="next"
                  />
                </View>
              ))}
            </View>

            {/* Race Format Section */}
            <View style={styles.formatSection}>
              <Text style={styles.formatTitle}>Race Format</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.formatScrollView}
              >
                <View style={styles.formatContainer}>
                  {formatOptions.map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.formatButton,
                        selectedFormat.gamesNeededToWin ===
                          option.value.gamesNeededToWin &&
                          styles.formatButtonSelected,
                      ]}
                      onPress={() => setSelectedFormat(option.value)}
                    >
                      <Text
                        style={[
                          styles.formatButtonText,
                          selectedFormat.gamesNeededToWin ===
                            option.value.gamesNeededToWin &&
                            styles.formatButtonTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartTournament}
            >
              <Text style={styles.startButtonText}>Start Tournament</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.homeScreenBackground,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingBottom: 100, // Extra padding for keyboard
  },
  instruction: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.singleElimText,
    marginBottom: 24,
    textAlign: "center",
  },
  bulkSection: {
    backgroundColor: COLORS.glassmorphism.background,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    borderRadius: 0,
    padding: 12,
    marginBottom: 20,
  },
  bulkTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.glassmorphism.text,
    marginBottom: 6,
  },
  bulkHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  bulkInput: {
    backgroundColor: COLORS.singleElimBackground,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    borderRadius: 0,
    padding: 10,
    fontSize: FONT_SIZES.sm,
    color: COLORS.glassmorphism.text,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  bulkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 0,
    alignItems: "center",
  },
  bulkButtonDisabled: {
    backgroundColor: COLORS.glassmorphism.textSecondary,
    opacity: 0.6,
  },
  bulkButtonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  inputContainer: {
    width: "48%",
    marginBottom: 16,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.glassmorphism.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.glassmorphism.background,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    borderRadius: 0,
    padding: 7,
    fontSize: FONT_SIZES.sm,
    color: COLORS.glassmorphism.text,
  },
  formatSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.glassmorphism.text,
    marginBottom: 12,
    textAlign: "center",
  },
  formatScrollView: {
    marginBottom: 8,
  },
  formatContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  formatButton: {
    backgroundColor: COLORS.glassmorphism.background,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginHorizontal: 4,
    minWidth: 80,
  },
  formatButtonSelected: {
    backgroundColor: "#fff",
    borderColor: COLORS.glassmorphism.borderMedium,
  },
  formatButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.glassmorphism.text,
    textAlign: "center",
  },
  formatButtonTextSelected: {
    color: COLORS.textDark,
  },
  startButton: {
    backgroundColor: COLORS.glassmorphism.background,
    paddingVertical: 15,
    borderRadius: 0,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  startButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    color: COLORS.glassmorphism.text,
    textAlign: "center",
  },
});

export default PlayerInput16Screen;
