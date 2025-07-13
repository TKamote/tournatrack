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

type PlayerInput16ScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput16"
>;

const PlayerInput16Screen: React.FC<PlayerInput16ScreenProps> = ({
  navigation,
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>(Array(16).fill(""));
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

  const handleStartTournament = () => {
    const validNames = playerNames.filter((name) => name.trim() !== "");
    if (validNames.length !== 16) {
      Alert.alert("Invalid Input", "Please enter exactly 16 player names.", [
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
            titleColor={COLORS.singleElimText}
            subtitleColor={COLORS.singleElimSubtitleText}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Removed instruction text for more space */}

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
              <Text style={styles.startButtonText}>
                Create and start the tournament
              </Text>
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
    backgroundColor: COLORS.singleElimBackground,
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
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.singleElimText,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.singleElimSectionBackground,
    borderWidth: 1,
    borderColor: COLORS.singleElimPrimary,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: COLORS.singleElimText,
  },
  formatSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.singleElimText,
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
    backgroundColor: COLORS.singleElimSectionBackground,
    borderWidth: 1,
    borderColor: COLORS.singleElimPrimary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    minWidth: 80,
  },
  formatButtonSelected: {
    backgroundColor: COLORS.singleElimPrimary,
    borderColor: COLORS.singleElimPrimary,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.singleElimText,
    textAlign: "center",
  },
  formatButtonTextSelected: {
    color: COLORS.textWhite,
  },
  startButton: {
    backgroundColor: COLORS.singleElimPrimary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  startButtonText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default PlayerInput16Screen;
