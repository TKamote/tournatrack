import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Match, Player } from "../types";
import { COLORS } from "../constants/colors";
import { MatchFormat } from "../types";
import { MatchInfo } from "./MatchInfo";
import { MatchResults } from "./MatchResults";

interface MatchListItemProps {
  item: Match;
  players: Player[];
  tournamentType: string;
  isMatchLocked: (match: Match) => boolean;
  onGameResult: (
    matchId: string,
    winner: Player,
    score1: number,
    score2: number
  ) => void;
  onResetScore?: (matchId: string) => void;
  currentRound?: number;
  canResetRound?: boolean;
}

const MatchListItem: React.FC<MatchListItemProps> = ({
  item,
  players,
  isMatchLocked,
  onGameResult,
  onResetScore,
  currentRound,
  canResetRound = true,
}) => {
  // ✅ Helper function to get updated player data
  const getCurrentPlayer = (playerId: string): Player | null => {
    return players.find((p) => p.id === playerId) || null;
  };

  // ✅ Get updated player references
  const currentPlayer1 = item.player1
    ? getCurrentPlayer(item.player1.id) || item.player1
    : null;
  const currentPlayer2 = item.player2
    ? getCurrentPlayer(item.player2.id) || item.player2
    : null;

  const handleScore = (player: Player, isPlayer1: boolean) => {
    if (isMatchLocked(item) || item.winner) {
      return;
    }

    onGameResult(item.id, player, isPlayer1 ? 1 : 0, isPlayer1 ? 0 : 1);
  };

  // Handle bye match display
  if (item.player1 && !item.player2) {
    return (
      <View style={styles.matchContainer}>
        <MatchInfo
          round={item.round}
          bracket={item.bracket}
          matchNumber={item.matchNumber}
        />
        <View style={styles.byeContainer}>
          <Text style={styles.byeText}>
            {currentPlayer1?.name} receives a bye
          </Text>
        </View>
      </View>
    );
  }

  // Check if reset should be available
  const canReset =
    onResetScore &&
    item.round === currentRound &&
    item.games.length > 0 &&
    canResetRound;

  // Regular match display
  return (
    <View style={styles.matchContainer}>
      {canReset && (
        <TouchableOpacity
          style={styles.resetIconButton}
          onPress={() => onResetScore(item.id)}
        >
          <Ionicons name="refresh-outline" size={18} color={COLORS.textLight} />
        </TouchableOpacity>
      )}
      <MatchInfo
        round={item.round}
        bracket={item.bracket}
        matchNumber={item.matchNumber}
      />
      {currentPlayer1 && currentPlayer2 ? (
        <MatchResults
          match={{
            ...item,
            player1: currentPlayer1,
            player2: currentPlayer2,
            winner: item.winner
              ? currentPlayer1.id === item.winner.id
                ? currentPlayer1
                : currentPlayer2.id === item.winner.id
                ? currentPlayer2
                : item.winner
              : null,
          }}
          onScore={handleScore}
          isLocked={isMatchLocked(item)}
        />
      ) : (
        <Text style={styles.pendingText}>Waiting for players...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  matchContainer: {
    backgroundColor: COLORS.backgroundWhite,
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 2,
    position: "relative",
  },
  resetIconButton: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
    padding: 4,
  },
  byeContainer: {
    padding: 6,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    marginTop: 4,
  },
  byeText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  pendingText: {
    color: COLORS.textLight,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
});

export default MatchListItem;
