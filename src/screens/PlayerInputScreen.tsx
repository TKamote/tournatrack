import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import { COLORS } from "../constants/colors";
import { MatchFormat } from "../types";

type PlayerInputScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "PlayerInput"
>;

const PlayerInputScreen: React.FC<PlayerInputScreenProps> = ({
  navigation,
  route,
}) => {
  const { tournamentType, numPlayers } = route.params;
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(numPlayers).fill("")
  );
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
      label: "Race to 6",
      value: { type: "raceTo", gamesNeededToWin: 6, label: "Race to 6" },
    },
    {
      label: "Race to 7",
      value: { type: "raceTo", gamesNeededToWin: 7, label: "Race to 7" },
    },
    {
      label: "Race to 9",
      value: { type: "raceTo", gamesNeededToWin: 9, label: "Race to 9" },
    },
    {
      label: "Race to 11",
      value: { type: "raceTo", gamesNeededToWin: 11, label: "Race to 11" },
    },
  ];

  const handleStartTournament = () => {
    const emptyNames = playerNames.some((name) => !name.trim());
    if (emptyNames) {
      Alert.alert("Error", "Please fill in all player names");
      return;
    }

    navigation.navigate("Tournament", {
      tournamentType,
      numPlayers,
      playerNames,
      matchFormat: selectedFormat,
    });
  };

  const renderPlayerInputs = () => {
    const rows = [];
    // Skip 4-player tournament from 2-column layout
    const isFourPlayers = numPlayers === 4;

    if (isFourPlayers) {
      // Single column for 4 players
      return playerNames.map((name, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Player {index + 1}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              const newNames = [...playerNames];
              newNames[index] = text;
              setPlayerNames(newNames);
            }}
            placeholder={`Enter Player ${index + 1} name`}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      ));
    }

    // Two columns for other player counts
    for (let i = 0; i < numPlayers; i += 2) {
      rows.push(
        <View key={i} style={styles.inputRow}>
          <View style={styles.inputColumnContainer}>
            <Text style={styles.inputLabel}>Player {i + 1}</Text>
            <TextInput
              style={styles.input}
              value={playerNames[i]}
              onChangeText={(text) => {
                const newNames = [...playerNames];
                newNames[i] = text;
                setPlayerNames(newNames);
              }}
              placeholder={`Enter Player ${i + 1} name`}
              placeholderTextColor={COLORS.textLight}
            />
          </View>
          {i + 1 < numPlayers && (
            <View style={styles.inputColumnContainer}>
              <Text style={styles.inputLabel}>Player {i + 2}</Text>
              <TextInput
                style={styles.input}
                value={playerNames[i + 1]}
                onChangeText={(text) => {
                  const newNames = [...playerNames];
                  newNames[i + 1] = text;
                  setPlayerNames(newNames);
                }}
                placeholder={`Enter Player ${i + 2} name`}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          )}
        </View>
      );
    }
    return rows;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Enter Player Names</Text>
        <Text style={styles.subtitle}>
          {tournamentType} - {numPlayers} Players
        </Text>

        {/* Player Names Section */}
        <View style={styles.section}>{renderPlayerInputs()}</View>

        {/* Match Format Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Race Format</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.homeScreenBackground,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.homeScreenTitleText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.homeScreenSubtitleText,
    marginBottom: 24,
  },
  section: {
    backgroundColor: COLORS.homeScreenSectionBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.homeScreenAccent,
    marginBottom: 16,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputColumnContainer: {
    width: "48%", // Adjust this value to control spacing between columns
  },
  inputContainer: {
    marginBottom: 16,
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.homeScreenAccent,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textDark,
    width: "100%",
  },
  formatTypeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  formatTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  formatTypeSelected: {
    backgroundColor: COLORS.primary,
  },
  formatTypeText: {
    color: COLORS.homeScreenAccent,
    fontSize: 14,
    fontWeight: "600",
  },
  formatTypeTextSelected: {
    color: COLORS.textWhite,
  },
  formatScrollView: {
    marginHorizontal: -16,
  },
  formatContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  formatButton: {
    backgroundColor: COLORS.homeScreenSectionBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  formatButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  formatButtonText: {
    color: COLORS.homeScreenAccent,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  formatButtonTextSelected: {
    color: COLORS.textWhite,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  startButtonText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default PlayerInputScreen;
