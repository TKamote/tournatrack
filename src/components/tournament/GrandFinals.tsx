import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { useMatchActions } from "../../hooks/tournament/useMatchActions";
import MatchCard from "../matches/MatchCard";
import { COLORS } from "../../constants/colors";

export const GrandFinals: React.FC = () => {
  const { getCurrentRoundMatches } = useTournamentState();
  const { setMatchWinner } = useMatchActions();

  const grandFinalsMatches = getCurrentRoundMatches().filter(
    (match) => match.bracket === "grandFinals"
  );

  if (grandFinalsMatches.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grand Finals</Text>
      {grandFinalsMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onWinnerSet={setMatchWinner}
          roundNumber={match.round}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: "center",
  },
});
