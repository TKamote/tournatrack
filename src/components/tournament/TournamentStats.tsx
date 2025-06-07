import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { COLORS } from "../../constants/colors";

export const TournamentStats: React.FC = () => {
  const { players, matches } = useTournamentState();

  const playerStats = players
    .map((player) => {
      const playerMatches = matches.filter(
        (m) => m.player1?.id === player.id || m.player2?.id === player.id
      );
      const wins = matches.filter((m) => m.winner?.id === player.id).length;
      const losses = playerMatches.length - wins;

      return {
        ...player,
        matches: playerMatches.length,
        wins,
        losses,
        winRate:
          playerMatches.length > 0
            ? Math.round((wins / playerMatches.length) * 100)
            : 0,
      };
    })
    .sort((a, b) => b.winRate - a.winRate);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerCell}>Player</Text>
        <Text style={styles.headerCell}>W/L</Text>
        <Text style={styles.headerCell}>Rate</Text>
      </View>
      {playerStats.map((stat) => (
        <View key={stat.id} style={styles.row}>
          <Text style={styles.cell}>{stat.name}</Text>
          <Text style={styles.cell}>
            {stat.wins}/{stat.losses}
          </Text>
          <Text style={styles.cell}>{stat.winRate}%</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
  },
  headerCell: {
    flex: 1,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  row: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: COLORS.backgroundWhite,
    marginVertical: 1,
  },
  cell: {
    flex: 1,
    color: COLORS.textDark,
  },
});
