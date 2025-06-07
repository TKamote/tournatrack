import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Match, Player, TournamentType } from "../types";
import { COLORS } from "../constants/colors";

interface MatchListItemProps {
  item: Match;
  players: Player[];
  tournamentType: TournamentType;
  isMatchLocked: (match: Match) => boolean;
  onSetWinner: (matchId: string, winner: Player) => void;
  onIncrementScore: (matchId: string, playerId: string) => void;
}

const MatchListItem: React.FC<MatchListItemProps> = ({
  item,
  players,
  tournamentType,
  isMatchLocked,
  onIncrementScore,
}) => {
  const player1 = players.find((p) => p.id === item.player1?.id);
  const player2 = players.find((p) => p.id === item.player2?.id);
  const matchIsEffectivelyLocked = isMatchLocked(item);

  // Add helper functions to check game states
  const getGameScores = () => {
    if (!item.games) return { p1Score: 0, p2Score: 0 };
    const p1Score = item.games.filter(
      (g) => g.winner?.id === item.player1?.id
    ).length;
    const p2Score = item.games.filter(
      (g) => g.winner?.id === item.player2?.id
    ).length;
    return { p1Score, p2Score };
  };

  const isByeMatch = !item.player2;
  const { p1Score, p2Score } = getGameScores();
  const isP1Winner = p1Score >= item.format.gamesNeededToWin;
  const isP2Winner = p2Score >= item.format.gamesNeededToWin;

  // Get player side styles based on state
  const getPlayerSideStyle = (isPlayer1: boolean) => {
    const baseStyle = [styles.playerSide];
    if (isByeMatch && isPlayer1) {
      baseStyle.push({
        ...styles.playerSide,
        ...styles.byeWinnerSide,
      });
    } else if ((isPlayer1 && isP1Winner) || (!isPlayer1 && isP2Winner)) {
      baseStyle.push({
        ...styles.playerSide,
        ...styles.winnerSide,
      });
    }
    return baseStyle;
  };

  // Get button style based on state
  const getButtonStyle = (isPlayer1: boolean) => {
    const baseStyle = [styles.scoreButton];
    if (matchIsEffectivelyLocked) {
      baseStyle.push({
        ...styles.scoreButton,
        ...styles.buttonDisabled,
      });
    } else if ((isPlayer1 && isP1Winner) || (!isPlayer1 && isP2Winner)) {
      baseStyle.push({
        ...styles.scoreButton,
        ...styles.winnerButton,
      });
    }
    return baseStyle;
  };

  return (
    <View style={styles.matchContainer}>
      <Text style={styles.helperText}>Tap Player to add win</Text>

      <Text style={styles.matchTitle}>
        {item.bracket.toUpperCase()} - R{item.round} M{item.matchNumber}
      </Text>

      <Text style={styles.raceFormat}>
        Race to {item.format.gamesNeededToWin}
      </Text>

      <View style={styles.scoreContainer}>
        {/* Player 1 Side */}
        <View style={getPlayerSideStyle(true)}>
          {!isByeMatch && (
            <TouchableOpacity
              style={getButtonStyle(true)}
              onPress={() => item.player1 && onIncrementScore(item.id, item.player1.id)}
              disabled={matchIsEffectivelyLocked || !item.player1 || isP1Winner || isP2Winner}
            >
              <Text style={styles.scoreButtonText}>{player1?.name || "TBD"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Score Display */}
        <View style={styles.scoreDisplay}>
          <Text style={styles.scoreText}>{`${p1Score} - ${p2Score}`}</Text>
        </View>

        {/* Player 2 Side */}
        <View style={getPlayerSideStyle(false)}>
          {!isByeMatch && (
            <TouchableOpacity
              style={getButtonStyle(false)}
              onPress={() => item.player2 && onIncrementScore(item.id, item.player2.id)}
              disabled={matchIsEffectivelyLocked || !item.player2 || isP1Winner || isP2Winner}
            >
              <Text style={styles.scoreButtonText}>{player2?.name || "BYE"}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {item.winner && (
        <Text style={styles.winnerText}>Winner: {item.winner.name}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  matchContainer: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  matchTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  raceFormat: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  playerSide: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  winnerSide: {
    backgroundColor: COLORS.success + "20",
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  byeWinnerSide: {
    backgroundColor: COLORS.success + "20",
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "right",
    marginBottom: 4,
    fontStyle: "italic",
  },
  scoreDisplay: {
    paddingHorizontal: 4,
    flex: 1,
    alignItems: "center",
    maxWidth: "30%", // Reduced since we don't show names here anymore
  },
  scoreText: {
    fontSize: 20, // Reduced from 24
    fontWeight: "bold",
    color: COLORS.primary,
  },
  scoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 8, // Reduced padding for longer names
    borderRadius: 6,
    minWidth: 80, // Add minimum width for consistency
  },
  winnerButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  scoreButtonText: {
    color: COLORS.textWhite,
    fontSize: 14, // Reduced size for longer names
    fontWeight: "600",
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.backgroundLight,
    opacity: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  winnerText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.success,
    textAlign: "center",
    marginTop: 10,
  },
});

export default MatchListItem;
