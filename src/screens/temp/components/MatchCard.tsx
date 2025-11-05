import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Match, Player } from "../../../types";
import { COLORS } from "../../../constants/colors";

interface MatchCardProps {
  match?: Match;
  isEditMode: boolean;
  onPlayerMove: (
    playerId: string,
    newPosition: { round: number; matchNumber: number; bracket: string }
  ) => void;
  onMatchResult: (matchId: string, winner: Player) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isEditMode,
  onPlayerMove,
  onMatchResult,
}) => {
  // Handle player tap for match result
  const handlePlayerTap = (player: Player | null) => {
    if (!player || !match || match.winner) return;

    onMatchResult(match.id, player);
  };

  // Handle player drag (placeholder for future implementation)
  const handlePlayerDrag = (player: Player | null) => {
    if (!player || !match || !isEditMode) return;

    // TODO: Implement drag functionality
  };

  // Calculate scores
  const player1Score =
    match?.games.filter((g) => g.winner?.id === match.player1?.id).length || 0;

  const player2Score =
    match?.games.filter((g) => g.winner?.id === match.player2?.id).length || 0;

  // Handle bye match
  if (match?.player1 && !match?.player2) {
    return (
      <View style={styles.matchCard}>
        <View style={styles.byeContainer}>
          <Text style={styles.byeText}>
            {match.player1.name} receives a bye
          </Text>
        </View>
      </View>
    );
  }

  // Empty match slot
  if (!match) {
    return (
      <View style={styles.matchCard}>
        <View style={styles.emptySlot}>
          <Text style={styles.emptyText}>Empty</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.matchCard}>
      {/* Player 1 */}
      <TouchableOpacity
        style={[
          styles.playerSlot,
          match.winner?.id === match.player1?.id && styles.winnerSlot,
        ]}
        onPress={() => handlePlayerTap(match.player1)}
        onLongPress={() => handlePlayerDrag(match.player1)}
        disabled={!isEditMode && match.winner !== null}
      >
        <Text
          style={[
            styles.playerName,
            match.winner?.id === match.player1?.id && styles.winnerName,
          ]}
          numberOfLines={1}
        >
          {match.player1?.name || "BYE"}
        </Text>
        <Text style={styles.score}>{player1Score}</Text>
      </TouchableOpacity>

      {/* VS Separator */}
      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      {/* Player 2 */}
      <TouchableOpacity
        style={[
          styles.playerSlot,
          match.winner?.id === match.player2?.id && styles.winnerSlot,
        ]}
        onPress={() => handlePlayerTap(match.player2)}
        onLongPress={() => handlePlayerDrag(match.player2)}
        disabled={!isEditMode && match.winner !== null}
      >
        <Text style={styles.score}>{player2Score}</Text>
        <Text
          style={[
            styles.playerName,
            match.winner?.id === match.player2?.id && styles.winnerName,
          ]}
          numberOfLines={1}
        >
          {match.player2?.name || "BYE"}
        </Text>
      </TouchableOpacity>

      {/* Match Info */}
      <View style={styles.matchInfo}>
        <Text style={styles.matchId}>
          {match.bracket === "winners"
            ? "W"
            : match.bracket === "losers"
            ? "L"
            : "GF"}
          {match.round}-{match.matchNumber}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  matchCard: {
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 4,
    padding: 3,
    marginVertical: 1,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    minHeight: 40,
  },
  playerSlot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  winnerSlot: {
    backgroundColor: COLORS.primary,
  },
  playerName: {
    fontSize: 11,
    color: COLORS.glassmorphism.text,
    flex: 1,
    textAlign: "left",
  },
  winnerName: {
    color: COLORS.textWhite,
    fontWeight: "bold",
  },
  score: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.glassmorphism.text,
    minWidth: 18,
    textAlign: "center",
  },
  vsContainer: {
    alignItems: "center",
    paddingVertical: 1,
  },
  vsText: {
    fontSize: 10,
    color: COLORS.glassmorphism.textSecondary,
    fontWeight: "500",
  },
  matchInfo: {
    alignItems: "center",
    marginTop: 2,
  },
  matchId: {
    fontSize: 10,
    color: COLORS.glassmorphism.textSecondary,
    fontWeight: "500",
  },
  byeContainer: {
    padding: 8,
    alignItems: "center",
  },
  byeText: {
    fontSize: 12,
    color: COLORS.glassmorphism.textSecondary,
    fontStyle: "italic",
  },
  emptySlot: {
    padding: 8,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.glassmorphism.textSecondary,
    fontStyle: "italic",
  },
});

export default MatchCard;
