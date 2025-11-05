import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS } from "../../../constants/colors";
import { Player, Match } from "../../../types";
import NewMatchCard from "./NewMatchCard";

interface NewHorizontalBracketProps {
  players: Player[];
  matches: Match[];
  isEditMode: boolean;
  onPlayerMove: (playerId: string, newPosition: any) => void;
  onMatchResult: (matchId: string, winner: Player) => void;
  onAdvanceRound: () => void;
  onScoreChange?: (
    matchId: string,
    playerId: string,
    increment: boolean
  ) => void;
}

const NewHorizontalBracket: React.FC<NewHorizontalBracketProps> = ({
  players,
  matches,
  isEditMode,
  onPlayerMove,
  onMatchResult,
  onAdvanceRound,
  onScoreChange,
}) => {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <View style={styles.container}>
      <Text style={styles.bracketTitle}>Tournament Bracket</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {rounds.map((roundNumber) => (
          <View key={roundNumber} style={styles.roundContainer}>
            <Text style={styles.roundTitle}>Round {roundNumber}</Text>
            <View style={styles.matchesContainer}>
              {matchesByRound[roundNumber].map((match, index) => (
                <NewMatchCard
                  key={match.id}
                  match={match}
                  matchNumber={index + 1}
                  onScoreChange={onScoreChange}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
  },
  bracketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.glassmorphism.text,
    textAlign: "center",
    marginBottom: 8,
  },
  horizontalScroll: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingRight: 20,
  },
  roundContainer: {
    marginRight: 20,
    minWidth: 200,
  },
  roundTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.glassmorphism.textSecondary,
    textAlign: "center",
    marginBottom: 6,
  },
  matchesContainer: {
    gap: 6,
  },
});

export default NewHorizontalBracket;
