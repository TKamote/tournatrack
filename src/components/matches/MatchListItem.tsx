import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Match, Player } from "../../types";
import { COLORS } from "../../constants/colors";
import { MatchResults } from "./MatchResults";
import { MatchInfo } from "./MatchInfo";

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
  onSetWinner,
}) => {
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
          <Text style={styles.byeText}>{item.player1.name} receives a bye</Text>
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
      {item.player1 && item.player2 ? (
        <MatchResults
          match={item}
          onScore={handleScore}
          onSetWinner={onSetWinner}
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
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
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
