import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";
import { Match, Player } from "../types";

interface MatchResultsProps {
  match: Match;
  onScore: (player: Player, isPlayer1: boolean) => void;
  isLocked: boolean;
}

export const MatchResults: React.FC<MatchResultsProps> = ({
  match,
  onScore,
  isLocked,
}) => {
  const handleScore = (player: Player | null, isPlayer1: boolean) => {
    if (!player) return;
    onScore(player, isPlayer1);
  };

  const player1Score = match.games.filter(
    (g) => g.winner?.id === match.player1?.id
  ).length;
  const player2Score = match.games.filter(
    (g) => g.winner?.id === match.player2?.id
  ).length;

  // Add check for bye matches
  const isByeMatch = (match: Match): boolean => {
    return Boolean(match.player1 && !match.player2);
  };

  // Use this check in render logic
  if (isByeMatch(match)) {
    return (
      <View style={styles.byeMatchContainer}>
        <Text>{match.player1?.name} advances with bye</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.container}>
        {/* Player 1 */}
        <TouchableOpacity
          style={styles.playerContainer}
          onPress={() => handleScore(match.player1, true)}
          disabled={isLocked}
        >
          <Text
            style={[
              styles.playerName,
              match.winner?.id === match.player1?.id && styles.winnerName,
            ]}
          >
            {match.player1?.name}
          </Text>
          <Text style={styles.score}>{player1Score}</Text>
        </TouchableOpacity>

        <Text style={styles.separator}>-</Text>

        {/* Player 2 */}
        <TouchableOpacity
          style={styles.playerContainer}
          onPress={() => handleScore(match.player2, false)}
          disabled={isLocked}
        >
          <Text style={styles.score}>{player2Score}</Text>
          <Text
            style={[
              styles.playerName,
              match.winner?.id === match.player2?.id && styles.winnerName,
            ]}
          >
            {match.player2?.name}
          </Text>
        </TouchableOpacity>
      </View>

      {match.winner && (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerText}>Winner: {match.winner.name}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 2,
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
  },
  playerContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  playerName: {
    fontSize: 16,
    color: COLORS.textDark,
    flex: 1,
    paddingVertical: 2,
    textAlign: "center",
    borderRadius: 6,
    backgroundColor: "#fff",
    fontWeight: "bold",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    borderWidth: 1,
    borderColor: "transparent",
  },
  winnerName: {
    color: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: "#fff",
    fontWeight: "bold",
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
    minWidth: 26,
    textAlign: "center",
    marginHorizontal: 2,
  },
  separator: {
    fontSize: 24,
    color: COLORS.textLight,
    marginHorizontal: 4,
    fontWeight: "300",
  },
  winnerContainer: {
    alignItems: "center",
    marginTop: 2,
  },
  winnerText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  byeMatchContainer: {
    padding: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
});
