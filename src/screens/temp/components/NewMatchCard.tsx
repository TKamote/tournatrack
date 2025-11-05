import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants/colors";
import { Match, Player } from "../../../types";

interface NewMatchCardProps {
  match: Match;
  matchNumber: number;
  onScoreChange?: (
    matchId: string,
    playerId: string,
    increment: boolean
  ) => void;
}

const NewMatchCard: React.FC<NewMatchCardProps> = ({
  match,
  matchNumber,
  onScoreChange,
}) => {
  const player1 = match.player1;
  const player2 = match.player2;
  const winner = match.winner;

  // Determine if each player won or lost
  const player1Won = winner?.id === player1?.id;
  const player2Won = winner?.id === player2?.id;

  return (
    <View style={styles.matchContainer}>
      {/* Match Label */}
      <View style={styles.matchLabel}>
        <Text style={styles.matchLabelText}>M{matchNumber}</Text>
      </View>

      {/* Match Grid */}
      <View style={styles.matchGrid}>
        {/* Player 1 Row */}
        <View style={styles.playerRow}>
          <View style={styles.playerNameCell}>
            <Text style={styles.playerName}>{player1?.name || "TBD"}</Text>
          </View>
          <View style={styles.scoreCell}>
            <Text style={[styles.score, player1Won && styles.winningScore]}>
              {match.player1Score || 0}
            </Text>
          </View>
          <View style={styles.controlsCell}>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() => onScoreChange?.(match.id, player1?.id || "", true)}
            >
              <Ionicons name="chevron-up" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() =>
                onScoreChange?.(match.id, player1?.id || "", false)
              }
            >
              <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Player 2 Row */}
        <View style={styles.playerRow}>
          <View style={styles.playerNameCell}>
            <Text style={styles.playerName}>{player2?.name || "TBD"}</Text>
          </View>
          <View style={styles.scoreCell}>
            <Text style={[styles.score, player2Won && styles.winningScore]}>
              {match.player2Score || 0}
            </Text>
          </View>
          <View style={styles.controlsCell}>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() => onScoreChange?.(match.id, player2?.id || "", true)}
            >
              <Ionicons name="chevron-up" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chevronButton}
              onPress={() =>
                onScoreChange?.(match.id, player2?.id || "", false)
              }
            >
              <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  matchContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    minHeight: 70,
  },
  matchLabel: {
    width: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  matchLabelText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  matchGrid: {
    flex: 1,
    padding: 6,
  },
  playerRow: {
    flexDirection: "row",
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassmorphism.border,
  },
  playerNameCell: {
    flex: 2,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  scoreCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.glassmorphism.border,
  },
  controlsCell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: COLORS.glassmorphism.border,
    flexDirection: "column",
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  chevronButton: {
    borderRadius: 3,
    backgroundColor: COLORS.glassmorphism.background,
    minWidth: 16,
    minHeight: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  playerName: {
    fontSize: 12,
    color: COLORS.glassmorphism.text,
    fontWeight: "500",
  },
  score: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.glassmorphism.text,
  },
  winningScore: {
    color: COLORS.success,
  },
  losingScore: {
    textDecorationLine: "line-through",
    color: COLORS.glassmorphism.textSecondary,
  },
});

export default NewMatchCard;
