import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import { COLORS } from "../constants/colors";
import { MatchFormat } from "../types";
import ScreenHeader from "../components/common/ScreenHeader";
import { PlayerInput6ScreenProps } from "../types/navigation.types";

const PlayerInput6Screen: React.FC<PlayerInput6ScreenProps> = ({
  navigation,
}) => {
  const [playerNames, setPlayerNames] = useState<string[]>(Array(6).fill(""));
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
  ];

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartTournament = () => {
    const emptyNames = playerNames.some((name) => !name.trim());
    if (emptyNames) {
      Alert.alert("Error", "Please fill in all 6 player names");
      return;
    }

    console.log("Starting DE-6 Tournament:", {
      playerNames: playerNames.length,
      format: selectedFormat.label,
    });

    navigation.navigate("DoubleElim6", {
      playerNames,
      matchFormat: selectedFormat,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title="Double Elimination (6)"
          subtitle="Enter 6 Player Names"
        />

        <ScrollView style={styles.scrollView}>
          {/* Format Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Match Format</Text>
            <View style={styles.formatGrid}>
              {formatOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.formatButton,
                    selectedFormat.label === option.label &&
                      styles.formatButtonSelected,
                  ]}
                  onPress={() => setSelectedFormat(option.value)}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      selectedFormat.label === option.label &&
                        styles.formatButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Player Names */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Player Names</Text>
            {playerNames.map((name, index) => (
              <View key={index} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Player {index + 1}:</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(text) => handlePlayerNameChange(index, text)}
                  placeholder={`Enter Player ${index + 1} name`}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTournament}
        >
          <Text style={styles.startButtonText}>Start DE-6 Tournament</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formatButton: {
    backgroundColor: COLORS.backgroundWhite,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    minWidth: 100,
  },
  formatButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
    textAlign: "center",
  },
  formatButtonTextSelected: {
    color: COLORS.textWhite,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundWhite,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textDark,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  startButtonText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default PlayerInput6Screen;
