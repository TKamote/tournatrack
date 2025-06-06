import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MatchFormat } from "../types";
import { COLORS } from "../constants/colors";

interface MatchFormatSelectorProps {
  selectedFormat: MatchFormat | null; // Update the props interface to allow null
  onFormatChange: (format: MatchFormat) => void;
  disabled?: boolean; // Add this prop
}

const MatchFormatSelector: React.FC<MatchFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  disabled = false,
}) => {
  const formats: MatchFormat[] = [
    { bestOf: 5, gamesNeededToWin: 3 },
    { bestOf: 7, gamesNeededToWin: 4 },
    { bestOf: 9, gamesNeededToWin: 5 },
    { bestOf: 11, gamesNeededToWin: 6 },
  ];

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <View style={styles.buttonContainer}>
        {formats.map((format) => (
          <TouchableOpacity
            key={format.bestOf}
            style={[
              styles.button,
              selectedFormat?.gamesNeededToWin === format.gamesNeededToWin &&
                styles.selectedButton,
              disabled && styles.buttonDisabled,
            ]}
            onPress={() => !disabled && onFormatChange(format)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.buttonText,
                selectedFormat?.gamesNeededToWin === format.gamesNeededToWin &&
                  styles.selectedButtonText,
              ]}
            >
              Race to {format.gamesNeededToWin}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  containerDisabled: {
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 10,
  },
  button: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundWhite,
    borderWidth: 1,
    borderColor: COLORS.primary,
    margin: 4,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  selectedButton: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.textLight,
  },
  selectedButtonText: {
    color: COLORS.textWhite,
  },
});

export default MatchFormatSelector;
