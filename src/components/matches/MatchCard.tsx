import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Match, Player } from "../../types";
import { COLORS } from "../../constants/colors";

interface MatchCardProps {
  match: Match;
  onWinnerSet: (matchId: string, winner: Player) => void;
  roundNumber: number;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onWinnerSet,
  roundNumber,
}) => {
  const { player1, player2, winner } = match;

  const handlePlayerPress = (player: Player) => {
    if (!winner && player) {
      onWinnerSet(match.id, player);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.roundText}>Round {roundNumber}</Text>
      <View style={styles.matchupContainer}>
        <TouchableOpacity
          style={[
            styles.playerButton,
            winner?.id === player1?.id && styles.winnerButton,
          ]}
          onPress={() => player1 && handlePlayerPress(player1)}
          disabled={!!winner}
        >
          <Text style={styles.playerText}>{player1?.name || "TBD"}</Text>
        </TouchableOpacity>

        <Text style={styles.vsText}>vs</Text>

        <TouchableOpacity
          style={[
            styles.playerButton,
            winner?.id === player2?.id && styles.winnerButton,
          ]}
          onPress={() => player2 && handlePlayerPress(player2)}
          disabled={!!winner}
        >
          <Text style={styles.playerText}>{player2?.name || "BYE"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  matchupContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerButton: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    alignItems: "center",
  },
  winnerButton: {
    backgroundColor: COLORS.success,
  },
  playerText: {
    color: COLORS.textWhite,
    fontWeight: "600",
  },
  vsText: {
    marginHorizontal: 12,
    color: COLORS.textDark,
  },
});

export default MatchCard;
