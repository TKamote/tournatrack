import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MatchFormat } from "../../../types";
import { COLORS } from "../../../constants/colors";

interface ManagerControlsProps {
  isEditMode: boolean;
  isTournamentStarted: boolean;
  onToggleEditMode: () => void;
  onStartTournament: () => void;
  formatOptions: Array<{ label: string; value: MatchFormat }>;
  selectedFormat: MatchFormat;
  onFormatChange: (format: MatchFormat) => void;
  playerCount: number;
}

const ManagerControls: React.FC<ManagerControlsProps> = ({
  isEditMode,
  isTournamentStarted,
  onToggleEditMode,
  onStartTournament,
  formatOptions,
  selectedFormat,
  onFormatChange,
  playerCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Mode Toggle and Start Tournament */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, isEditMode && styles.modeButtonActive]}
          onPress={onToggleEditMode}
        >
          <Text
            style={[
              styles.modeButtonText,
              isEditMode && styles.modeButtonTextActive,
            ]}
          >
            {isEditMode ? "Edit Mode" : "View Mode"}
          </Text>
        </TouchableOpacity>

        {isEditMode && (
          <TouchableOpacity
            style={[
              styles.startButton,
              playerCount === 8
                ? styles.startButtonReady
                : styles.startButtonDisabled,
            ]}
            onPress={playerCount === 8 ? onStartTournament : undefined}
            disabled={playerCount !== 8}
          >
            <Text style={styles.startButtonText}>
              {playerCount === 8
                ? "✓ Start Tournament"
                : `Add ${8 - playerCount} more players`}
            </Text>
          </TouchableOpacity>
        )}

        {isTournamentStarted && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Format Selection */}
      {isEditMode && (
        <View style={styles.formatContainer}>
          <View style={styles.formatInlineContainer}>
            <Text style={styles.formatTitle}>Race Format:</Text>
            <View style={styles.formatOptions}>
              {formatOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.formatButton,
                    selectedFormat.gamesNeededToWin ===
                      option.value.gamesNeededToWin &&
                      styles.formatButtonSelected,
                  ]}
                  onPress={() => onFormatChange(option.value)}
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
          </View>
        </View>
      )}

      {/* Tournament Status */}
      {isTournamentStarted && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Tournament is live! Matches can be played.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  modeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modeButton: {
    backgroundColor: COLORS.singleElimBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    color: COLORS.glassmorphism.text,
    fontSize: 14,
    fontWeight: "500",
  },
  modeButtonTextActive: {
    color: COLORS.textWhite,
    fontWeight: "600",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textWhite,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  formatContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  formatInlineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.glassmorphism.text,
    marginRight: 8,
  },
  formatOptions: {
    flexDirection: "row",
  },
  formatButton: {
    backgroundColor: COLORS.singleElimBackground,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    minWidth: 80,
  },
  formatButtonSelected: {
    backgroundColor: COLORS.textLight,
    borderColor: COLORS.textLight,
  },
  formatButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.glassmorphism.text,
    textAlign: "center",
  },
  formatButtonTextSelected: {
    color: COLORS.textWhite,
    fontWeight: "600",
  },
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  startButtonReady: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.glassmorphism.textSecondary,
    borderColor: COLORS.glassmorphism.textSecondary,
  },
  startButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "500",
  },
  statusContainer: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  statusText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ManagerControls;
