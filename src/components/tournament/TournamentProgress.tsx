import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { useMatchActions } from "../../hooks/tournament/useMatchActions";
import { COLORS } from "../../constants/colors";

export const TournamentProgress: React.FC = () => {
  const {
    currentWinnersRound,
    currentLosersRound,
    tournamentType,
    isRoundComplete,
  } = useTournamentState();
  const { advanceRound } = useMatchActions();

  const isDoubleElimination = tournamentType.startsWith("Double");
  const canAdvance = isRoundComplete(
    isDoubleElimination ? currentWinnersRound : currentWinnersRound,
    isDoubleElimination ? "winners" : undefined
  );

  return (
    <View style={styles.container}>
      <View style={styles.roundInfo}>
        <Text style={styles.roundText}>
          Winners Round {currentWinnersRound}
        </Text>
        {isDoubleElimination && (
          <Text style={styles.roundText}>
            Losers Round {currentLosersRound}
          </Text>
        )}
      </View>

      {canAdvance && (
        <TouchableOpacity style={styles.advanceButton} onPress={advanceRound}>
          <Text style={styles.buttonText}>Advance Round</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
  },
  roundInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  roundText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  advanceButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.textWhite,
    fontWeight: "600",
  },
});
