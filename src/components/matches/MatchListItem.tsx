import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Match, Player } from "../../types";
import { COLORS } from "../../constants/colors";

interface MatchListItemProps {
  item: Match;
  players: Player[];
  tournamentType: string;
  isMatchLocked: (match: Match) => boolean;
  onSetWinner: (matchId: string, winner: Player) => void;
  onGameResult: (
    matchId: string,
    winner: Player,
    score1: number,
    score2: number
  ) => void;
}

const MatchListItem: React.FC<MatchListItemProps> = ({
  item,
  isMatchLocked,
  onGameResult,
}) => {
  const player1Score = item.games.filter(
    (g) => g.winner?.id === item.player1?.id
  ).length;
  const player2Score = item.games.filter(
    (g) => g.winner?.id === item.player2?.id
  ).length;
  const raceTarget = item.format.gamesNeededToWin;

  // Check if match is completed
  const isMatchCompleted =
    player1Score === raceTarget || player2Score === raceTarget;

  const handlePlayerPress = (player: Player | null, isPlayer1: boolean) => {
    if (!player || isMatchCompleted || isMatchLocked(item)) return;

    onGameResult(item.id, player, isPlayer1 ? 1 : 0, isPlayer1 ? 0 : 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.matchContent}>
        <TouchableOpacity
          style={[
            styles.playerName,
            item.winner?.id === item.player1?.id && styles.winnerName,
          ]}
          disabled={isMatchCompleted || isMatchLocked(item)}
          onPress={() => handlePlayerPress(item.player1, true)}
        >
          <Text style={styles.playerNameText}>
            {item.player1?.name || "TBD"}
          </Text>
        </TouchableOpacity>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{player1Score}</Text>
          <Text style={styles.scoreSeparator}>-</Text>
          <Text style={styles.scoreText}>{player2Score}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.playerName,
            item.winner?.id === item.player2?.id && styles.winnerName,
          ]}
          disabled={isMatchCompleted || isMatchLocked(item)}
          onPress={() => handlePlayerPress(item.player2, false)}
        >
          <Text style={styles.playerNameText}>
            {item.player2?.name || "TBD"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 12,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerName: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
  },
  winnerName: {
    backgroundColor: COLORS.primary + "15",
  },
  playerNameText: {
    fontSize: 18, // Increased from 16 to 18
    color: COLORS.textDark,
    textAlign: "center",
  },
  winnerNameText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textDark,
    minWidth: 30,
    textAlign: "center",
  },
  scoreSeparator: {
    fontSize: 24,
    color: COLORS.textLight,
    marginHorizontal: 8,
  },
  winnerScore: {
    color: COLORS.primary,
  },
});

export default MatchListItem;
