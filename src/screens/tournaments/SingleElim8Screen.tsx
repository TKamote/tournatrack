import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Player, Match, MatchFormat } from "../../types";
import { COLORS } from "../../constants/colors";
import MatchListItem from "../../components/matches/MatchListItem";
import {
  createMatch,
  shuffleArray,
} from "../../utils/tournament/tournamentUtils";
import ConfirmActionModal from "../../components/common/ConfirmActionModal";
import ScreenHeader from "../../components/common/ScreenHeader";
import IncompleteMatchesModal from "../../components/tournament/IncompleteMatchesModal";
import TournamentSummaryModal from "../../components/tournament/TournamentSummaryModal";
import { RoundSeparator } from "../../components/tournament/RoundSeparator";

interface SingleElim8ScreenProps {
  route: {
    params: {
      playerNames: string[];
      matchFormat: MatchFormat;
    };
  };
  navigation: any;
}

export const SingleElim8Screen: React.FC<SingleElim8ScreenProps> = ({
  route,
  navigation,
}) => {
  const { playerNames, matchFormat } = route.params;

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [tournamentOver, setTournamentOver] = useState(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Initialize tournament
  useEffect(() => {
    if (
      playerNames &&
      playerNames.length === 8 &&
      matchFormat &&
      !hasInitialized
    ) {
      const initialPlayers = playerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name,
        losses: 0,
        seed: i + 1,
        isEliminated: false,
      }));

      const shuffledPlayers = shuffleArray(initialPlayers);

      // Create Round 1 matches (4 matches)
      const round1Matches: Match[] = [];
      for (let i = 0; i < 4; i++) {
        round1Matches.push(
          createMatch(
            `se8-r1-${i + 1}`,
            1,
            i + 1,
            shuffledPlayers[i * 2],
            shuffledPlayers[i * 2 + 1],
            "winners",
            false,
            matchFormat
          )
        );
      }

      setPlayers(shuffledPlayers);
      setMatches(round1Matches);
      setHasInitialized(true);

      console.log("SE-8 Tournament initialized:", {
        players: shuffledPlayers.length,
        matches: round1Matches.length,
      });
    }
  }, [playerNames, matchFormat, hasInitialized]);

  // Handle game result
  const handleIncrementScore = useCallback(
    (matchId: string, winner: Player, score1: number, score2: number) => {
      setMatches((prevMatches) => {
        return prevMatches.map((match) => {
          if (match.id !== matchId || match.winner) return match;

          const newGame = {
            id: `game-${match.games.length + 1}`,
            winner,
            score1,
            score2,
          };

          const updatedGames = [...match.games, newGame];
          const playerScore = updatedGames.filter(
            (g) => g.winner?.id === winner.id
          ).length;

          console.log(
            `SE-8 Match ${matchId}: ${winner.name} now has ${playerScore}/${matchFormat.gamesNeededToWin} games`
          );

          // Auto-declare winner when race target is reached
          let updatedMatch = { ...match, games: updatedGames };

          if (playerScore >= matchFormat.gamesNeededToWin) {
            console.log(
              `🏆 SE-8 AUTO-WINNER: ${winner.name} wins match ${matchId}!`
            );
            updatedMatch.winner = winner;
          }

          return updatedMatch;
        });
      });
    },
    [matchFormat]
  );

  // Handle set winner
  const handleSetWinner = useCallback((matchId: string, winner: Player) => {
    setMatches((prevMatches) => {
      return prevMatches.map((match) => {
        if (match.id === matchId) {
          return { ...match, winner };
        }
        return match;
      });
    });
  }, []);

  // Advance to next round
  const executeAdvanceRound = useCallback(() => {
    setShowAdvanceModal(false);

    const currentMatches = matches.filter((m) => m.round === currentRound);
    const incompleteMatches = currentMatches.filter(
      (m) => m.player1 && m.player2 && !m.winner
    );

    if (incompleteMatches.length > 0) {
      setShowIncompleteModal(true);
      return;
    }

    const winners = currentMatches
      .filter((m) => m.winner)
      .map((m) => m.winner!);

    let newMatches: Match[] = [];

    if (currentRound === 1) {
      // Round 1 → Round 2 (Semifinals): 4 winners → 2 matches
      for (let i = 0; i < Math.floor(winners.length / 2); i++) {
        newMatches.push(
          createMatch(
            `se8-r2-${i + 1}`,
            2,
            i + 1,
            winners[i * 2],
            winners[i * 2 + 1],
            "winners",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 2) {
      // Round 2 → Round 3 (Finals): 2 winners → 1 match
      if (winners.length === 2) {
        newMatches.push(
          createMatch(
            "se8-r3-1",
            3,
            1,
            winners[0],
            winners[1],
            "winners",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 3) {
      // Tournament complete
      if (winners.length === 1) {
        setTournamentOver(true);
        setOverallWinner(winners[0]);
        setShowSummaryModal(true);
        Alert.alert(
          "Tournament Complete! 🏆",
          `${winners[0].name} is the Champion!`,
          [{ text: "OK" }]
        );
        return;
      }
    }

    if (newMatches.length > 0) {
      setMatches((prev) => [...prev, ...newMatches]);
      setCurrentRound((prev) => prev + 1);
      console.log(`SE-8 Advanced to Round ${currentRound + 1}`);
    }
  }, [currentRound, matches, matchFormat]);

  // Display functions
  const matchesForDisplay = useCallback((): Match[] => {
    return matches
      .filter((match) => match.player1 !== null)
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.matchNumber - b.matchNumber;
      });
  }, [matches]);

  const displayTitle = useCallback((): string => {
    if (tournamentOver && overallWinner) return "Tournament Complete!";
    return `Single Elimination (8) - Round ${currentRound}`;
  }, [tournamentOver, overallWinner, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    return match.winner !== null || !match.player1 || !match.player2;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title={displayTitle()} subtitle="8 Players" />

        <View style={styles.formatBanner}>
          <Text style={styles.formatText}>
            Race to {matchFormat.gamesNeededToWin}
          </Text>
        </View>

        <FlatList
          data={matchesForDisplay()}
          renderItem={({ item, index }) => {
            const prevItem = index > 0 ? matchesForDisplay()[index - 1] : null;
            const showSeparator =
              index === 0 || !prevItem || prevItem.round !== item.round;

            return (
              <>
                {showSeparator && (
                  <RoundSeparator round={item.round} bracket={item.bracket} />
                )}
                <MatchListItem
                  item={item}
                  players={players}
                  tournamentType="Single Elimination (8)"
                  isMatchLocked={isMatchLocked}
                  onSetWinner={handleSetWinner}
                  onGameResult={handleIncrementScore}
                />
              </>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />

        {!tournamentOver && (
          <TouchableOpacity
            style={styles.advanceButton}
            onPress={() => setShowAdvanceModal(true)}
          >
            <Text style={styles.advanceButtonText}>Advance to Next Round</Text>
          </TouchableOpacity>
        )}

        <ConfirmActionModal
          visible={showAdvanceModal}
          title="Advance to Next Round"
          message="Are you sure you want to advance to the next round?"
          onConfirm={executeAdvanceRound}
          onCancel={() => setShowAdvanceModal(false)}
        />

        <IncompleteMatchesModal
          visible={showIncompleteModal}
          onClose={() => setShowIncompleteModal(false)}
        />

        <TournamentSummaryModal
          visible={showSummaryModal}
          winner={overallWinner}
          runnerUp={null}
          finalMatch={null}
          onClose={() => setShowSummaryModal(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  formatBanner: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  formatText: {
    color: COLORS.backgroundWhite,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 80,
  },
  advanceButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 16,
  },
  advanceButtonText: {
    color: COLORS.backgroundWhite,
    fontWeight: "bold",
  },
});
