import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Player, Match } from "../../../types";
import { COLORS } from "../../../constants/colors";
import MatchCard from "./MatchCard";
import BracketConnections from "./BracketConnections";

interface HorizontalBracketProps {
  players: Player[];
  matches: Match[];
  isEditMode: boolean;
  onPlayerMove: (
    playerId: string,
    newPosition: { round: number; matchNumber: number; bracket: string }
  ) => void;
  onMatchResult: (matchId: string, winner: Player) => void;
  onAdvanceRound: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

const HorizontalBracket: React.FC<HorizontalBracketProps> = ({
  players,
  matches,
  isEditMode,
  onPlayerMove,
  onMatchResult,
  onAdvanceRound,
}) => {
  // Group matches by round and bracket
  const groupMatchesByRound = () => {
    const grouped: { [key: string]: Match[] } = {};

    matches.forEach((match) => {
      const key = `${match.bracket}-${match.round}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(match);
    });

    return grouped;
  };

  const groupedMatches = groupMatchesByRound();

  // Calculate bracket structure for 8 players
  const getBracketStructure = () => {
    return {
      winners: {
        round1: { matches: 4, title: "Round 1" },
        round2: { matches: 2, title: "Round 2" },
        round3: { matches: 1, title: "Finals" },
      },
      losers: {
        round1: { matches: 2, title: "Round 1" },
        round2: { matches: 2, title: "Round 2" },
        round3: { matches: 1, title: "Round 3" },
        round4: { matches: 1, title: "Finals" },
      },
      grandFinals: {
        round1: { matches: 1, title: "Grand Finals" },
      },
    };
  };

  const bracketStructure = getBracketStructure();

  // Render bracket section
  const renderBracketSection = (bracketType: string, rounds: any) => {
    return (
      <View style={styles.bracketSection}>
        <Text style={styles.bracketTitle}>
          {bracketType === "winners"
            ? "Winners Bracket"
            : bracketType === "losers"
            ? "Losers Bracket"
            : "Grand Finals"}
        </Text>

        <View style={styles.roundsContainer}>
          {Object.entries(rounds).map(
            ([roundKey, roundInfo]: [string, any]) => {
              const roundNumber = parseInt(roundKey.replace("round", ""));
              const roundMatches =
                groupedMatches[`${bracketType}-${roundNumber}`] || [];

              return (
                <View key={roundKey} style={styles.roundColumn}>
                  <Text style={styles.roundTitle}>{roundInfo.title}</Text>

                  <View style={styles.matchesContainer}>
                    {Array.from({ length: roundInfo.matches }, (_, index) => {
                      const match = roundMatches.find(
                        (m) => m.matchNumber === index + 1
                      );

                      return (
                        <View
                          key={`${bracketType}-${roundNumber}-${index + 1}`}
                          style={styles.matchWrapper}
                        >
                          <MatchCard
                            match={match}
                            isEditMode={isEditMode}
                            onPlayerMove={onPlayerMove}
                            onMatchResult={onMatchResult}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Winners Bracket */}
        {renderBracketSection("winners", bracketStructure.winners)}

        {/* Losers Bracket */}
        {renderBracketSection("losers", bracketStructure.losers)}

        {/* Grand Finals */}
        {renderBracketSection("grandFinals", bracketStructure.grandFinals)}
      </ScrollView>

      {/* Bracket Connections */}
      <BracketConnections matches={matches} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.singleElimBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    minWidth: screenWidth * 3, // Ensure horizontal scrolling
  },
  bracketSection: {
    marginRight: 32,
    minWidth: 200,
  },
  bracketTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.glassmorphism.text,
    textAlign: "center",
    marginBottom: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 4,
  },
  roundsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  roundColumn: {
    marginRight: 24,
    minWidth: 120,
  },
  roundTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.glassmorphism.textSecondary,
    textAlign: "center",
    marginBottom: 6,
  },
  matchesContainer: {
    alignItems: "center",
  },
  matchWrapper: {
    marginBottom: 4,
    width: "100%",
  },
});

export default HorizontalBracket;
