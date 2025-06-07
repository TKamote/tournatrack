import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { useMatchActions } from "../../hooks/tournament/useMatchActions";
import MatchCard from "../matches/MatchCard";
import { COLORS } from "../../constants/colors";

export const LosersBracket: React.FC = () => {
  const { getCurrentRoundMatches, currentLosersRound } = useTournamentState();
  const { setMatchWinner } = useMatchActions();

  const currentMatches = getCurrentRoundMatches("losers");

  return (
    <View style={styles.container}>
      <Text style={styles.bracketTitle}>Losers Bracket</Text>
      {currentMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onWinnerSet={setMatchWinner}
          roundNumber={currentLosersRound}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.backgroundDark,
    marginTop: 16,
  },
  bracketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 8,
  },
});
