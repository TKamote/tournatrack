import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { Match } from "../../types";
import { COLORS } from "../../constants/colors";

export const MatchHistory: React.FC = () => {
  const { matches } = useTournamentState();

  const sortedMatches = [...matches].sort((a, b) => {
    if (a.round !== b.round) return b.round - a.round;
    return b.matchNumber - a.matchNumber;
  });

  const renderMatch = ({ item }: { item: Match }) => (
    <View style={styles.matchItem}>
      <Text style={styles.matchHeader}>
        {item.bracket.toUpperCase()} - R{item.round} M{item.matchNumber}
      </Text>
      <View style={styles.playerContainer}>
        <Text
          style={[
            styles.playerName,
            item.winner?.id === item.player1?.id && styles.winner,
          ]}
        >
          {item.player1?.name || "TBD"}
        </Text>
        <Text style={styles.vs}>vs</Text>
        <Text
          style={[
            styles.playerName,
            item.winner?.id === item.player2?.id && styles.winner,
          ]}
        >
          {item.player2?.name || "BYE"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match History</Text>
      <FlatList
        data={sortedMatches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    padding: 16,
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
  },
  matchItem: {
    backgroundColor: COLORS.backgroundWhite,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  matchHeader: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  playerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
  },
  winner: {
    fontWeight: "700",
    color: COLORS.success,
  },
  vs: {
    marginHorizontal: 8,
    color: COLORS.textLight,
  },
});
