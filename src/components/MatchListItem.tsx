import React from "react";
import { View, StyleSheet, Text } from "react-native";
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
}

const MatchListItem: React.FC<MatchListItemProps> = ({
  item,
  players,
  isMatchLocked,
  onGameResult,
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
    if (isMatchLocked(item) || item.winner) return;
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

  // Regular match display
  return (
    <View style={styles.matchContainer}>
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
    padding: 16,
    marginVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  byeContainer: {
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    marginTop: 8,
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
    marginTop: 8,
  },
});

export default MatchListItem;
