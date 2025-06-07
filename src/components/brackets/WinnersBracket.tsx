import React from "react";
import { View, StyleSheet } from "react-native";
import { useTournamentState } from "../../hooks/tournament/useTournamentState";
import { useMatchActions } from "../../hooks/tournament/useMatchActions";
import MatchCard from "../matches/MatchCard";

export const WinnersBracket: React.FC = () => {
  const { getCurrentRoundMatches, currentWinnersRound } = useTournamentState();
  const { setMatchWinner } = useMatchActions();

  const currentMatches = getCurrentRoundMatches("winners");

  return (
    <View style={styles.container}>
      {currentMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          onWinnerSet={setMatchWinner}
          roundNumber={currentWinnersRound}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
});
