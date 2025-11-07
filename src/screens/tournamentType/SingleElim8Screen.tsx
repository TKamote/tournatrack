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
import { Player, Match, MatchFormat, Tournament } from "../../types";
import { TournamentStatus } from "../../types/tournament.types";
import { COLORS } from "../../constants/colors";
import MatchListItem from "../../components/MatchListItem";
import {
  createMatch,
  shuffleArray,
} from "../../utils/tournament/tournamentUtils";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import ScreenHeader from "../../components/ScreenHeader";
import IncompleteMatchesModal from "../../components/IncompleteMatchesModal";
import TournamentSummaryModal from "../../components/TournamentSummaryModal";
import { RoundSeparator } from "../../components/RoundSeparator";
import { Ionicons } from "@expo/vector-icons";
import { TournamentService } from "../../utils/tournamentService";
import { useUser } from "../../context/UserContext";

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
  const { userName, userId } = useUser();

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [tournamentOver, setTournamentOver] = useState(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");

  // Save tournament to Firebase
  const saveTournamentToFirebase = useCallback(
    async (tournamentData: Tournament) => {
      try {
        await TournamentService.saveTournament(tournamentData);
      } catch (error) {
        // Error saving tournament
      }
    },
    []
  );

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
        totalMatches: 0,
        wins: 0,
        winPercentage: 0,
        averageScore: 0,
        isActive: true,
      }));

      // Ordered seeding: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5
      const orderedPlayers = [...initialPlayers];

      // Create Round 1 matches (4 matches) with ordered seeding
      const round1Matches: Match[] = [];
      for (let i = 0; i < 4; i++) {
        const player1Index = i;
        const player2Index = 7 - i; // 7, 6, 5, 4
        round1Matches.push(
          createMatch(
            `se8-r1-${i + 1}`,
            1,
            i + 1,
            orderedPlayers[player1Index],
            orderedPlayers[player2Index],
            "winners",
            false,
            matchFormat
          )
        );
      }

      // Create tournament object for Firebase
      const tournamentId = `se8-${Date.now()}`;
      const tournament: Tournament = {
        id: tournamentId,
        name: "Single Elimination Tournament",
        type: "Single Elimination",
        manager: userName,
        managerId: userId,
        players: orderedPlayers,
        matches: round1Matches,
        format: matchFormat,
        status: "in_progress",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        maxPlayers: 8,
        currentRound: 1,
        totalRounds: 3,
      };

      setPlayers(orderedPlayers);
      setMatches(round1Matches);
      setTournamentId(tournamentId);
      setHasInitialized(true);

      // Save to Firebase
      saveTournamentToFirebase(tournament);
    }
  }, [
    playerNames,
    matchFormat,
    hasInitialized,
    saveTournamentToFirebase,
    userName,
    userId,
  ]);

  // Update player elimination status
  const updatePlayerElimination = useCallback((playerId: string) => {
    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => {
        if (player.id === playerId) {
          return {
            ...player,
            isEliminated: true,
          };
        }
        return player;
      });
    });
  }, []);

  // Update tournament in Firebase
  const updateTournamentInFirebase = useCallback(
    async (updatedMatches: Match[], updatedStatus?: string) => {
      if (!tournamentId) return;

      // Check for different types of changes
      const completedMatches = updatedMatches.filter((match) => match.winner);
      const newRounds = updatedMatches.filter((match) => match.round > 1);
      const totalMatches = updatedMatches.length;

      // Always update if we have completed matches OR new rounds OR any game updates
      const hasChanges =
        completedMatches.length > 0 ||
        newRounds.length > 0 ||
        updatedMatches.some((match) => match.games && match.games.length > 0);

      if (!hasChanges) {
        return;
      }

      try {
        const updatedTournament: Tournament = {
          id: tournamentId,
          name: "Single Elimination Tournament",
          type: "Single Elimination",
          manager: userName,
          managerId: userId,
          players,
          matches: updatedMatches,
          format: matchFormat,
          status: (updatedStatus as TournamentStatus) || "in_progress",
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          maxPlayers: 8,
          currentRound: Math.max(...updatedMatches.map((m) => m.round)),
          totalRounds: 3,
        };

        try {
          await TournamentService.saveTournament(updatedTournament);
        } catch (updateError: any) {
          // Error updating tournament
        }
      } catch (error) {
        // Error in updateTournamentInFirebase
      }
    },
    [tournamentId, players, matchFormat, userName, userId]
  );

  // Handle game result
  const handleIncrementScore = useCallback(
    (matchId: string, winner: Player, score1: number, score2: number) => {
      setMatches((prevMatches) => {
        const updatedMatches = prevMatches.map((match) => {
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

          // Auto-declare winner when race target is reached
          let updatedMatch = { ...match, games: updatedGames };

          if (playerScore >= matchFormat.gamesNeededToWin) {
            updatedMatch.winner = winner;

            // Mark the losing player as eliminated
            const losingPlayer =
              match.player1?.id === winner.id ? match.player2 : match.player1;
            if (losingPlayer) {
              setTimeout(() => updatePlayerElimination(losingPlayer.id), 0);
            }

            // Check if this is the final match (round 3, match 1)
            if (match.round === 3 && match.matchNumber === 1) {
              setTimeout(() => {
                setTournamentOver(true);
                setOverallWinner(winner);
                setFinalMatch(updatedMatch);
                setShowSummaryModal(true);

                // Update Firebase with completed status
                const finalUpdatedMatches = updatedMatches.map((m) =>
                  m.id === matchId ? updatedMatch : m
                );
                updateTournamentInFirebase(finalUpdatedMatches, "completed");
              }, 100);
            }
          }

          return updatedMatch;
        });

        // Update Firebase with current match state
        updateTournamentInFirebase(updatedMatches);

        return updatedMatches;
      });
    },
    [matchFormat, updatePlayerElimination, updateTournamentInFirebase]
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

  // Handle reset score
  const handleResetScore = useCallback(
    (matchId: string) => {
      setMatches((prevMatches) => {
        const matchToReset = prevMatches.find((m) => m.id === matchId);
        if (!matchToReset) return prevMatches;

        // Only allow reset if match is in current round
        if (matchToReset.round !== currentRound) {
          Alert.alert(
            "Cannot Reset",
            "You can only reset scores for matches in the current round."
          );
          return prevMatches;
        }

        // Check if round has been advanced (matches exist in higher rounds)
        const hasAdvancedRound = prevMatches.some(
          (m) => m.round > currentRound
        );
        if (hasAdvancedRound) {
          Alert.alert(
            "Cannot Reset",
            "You cannot reset scores after advancing to the next round."
          );
          return prevMatches;
        }

        // If match had a winner, undo player elimination
        if (matchToReset.winner) {
          const losingPlayer =
            matchToReset.player1?.id === matchToReset.winner.id
              ? matchToReset.player2
              : matchToReset.player1;
          if (losingPlayer) {
            setPlayers((prevPlayers) =>
              prevPlayers.map((p) =>
                p.id === losingPlayer.id ? { ...p, isEliminated: false } : p
              )
            );
          }

          // If this was the final match (Round 3), undo tournament completion
          if (matchToReset.round === 3) {
            setTournamentOver(false);
            setOverallWinner(null);
            setFinalMatch(null);
            setShowSummaryModal(false);
          }
        }

        // Reset the match: clear games and winner
        const updatedMatches = prevMatches.map((match) => {
          if (match.id === matchId) {
            return { ...match, games: [], winner: null };
          }
          return match;
        });

        // Update Firebase
        updateTournamentInFirebase(updatedMatches);

        return updatedMatches;
      });
    },
    [currentRound, updateTournamentInFirebase]
  );

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
        const finalMatch = matches.find(
          (m) => m.round === 3 && m.matchNumber === 1
        );
        setTournamentOver(true);
        setOverallWinner(winners[0]);
        setFinalMatch(finalMatch || null);
        setShowSummaryModal(true);
        return;
      }
    }

    if (newMatches.length > 0) {
      setMatches((prev) => {
        const allMatches = [...prev, ...newMatches];

        // Update Firebase with new matches
        updateTournamentInFirebase(allMatches);

        return allMatches;
      });
      setCurrentRound((prev) => prev + 1);
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
    const isLocked = match.winner !== null || !match.player1 || !match.player2;
    return isLocked;
  }, []);

  const canAdvanceRound = useCallback(() => {
    const currentMatches = matches.filter((m) => m.round === currentRound);
    return currentMatches.every((m) => m.winner !== null);
  }, [matches, currentRound]);

  // Check if shuffle is allowed (no games have scores)
  const canShuffle = useCallback(() => {
    return !matches.some((match) => match.games.length > 0);
  }, [matches]);

  // Handle shuffle players
  const handleShufflePlayers = useCallback(() => {
    if (!canShuffle()) return;

    const shuffledPlayers = shuffleArray([...players]);

    // Recreate Round 1 matches with shuffled players
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

    // Keep matches from other rounds, only update Round 1
    const otherMatches = matches.filter((m) => m.round !== 1);
    const updatedMatches = [...round1Matches, ...otherMatches];

    setPlayers(shuffledPlayers);
    setMatches(updatedMatches);

    // Update Firebase
    if (tournamentId) {
      const updatedTournament: Tournament = {
        id: tournamentId,
        name: "Single Elimination Tournament",
        type: "Single Elimination",
        manager: userName,
        managerId: userId,
        players: shuffledPlayers,
        matches: updatedMatches,
        format: matchFormat,
        status: "in_progress",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        maxPlayers: 8,
        currentRound: currentRound,
        totalRounds: 3,
      };
      updateTournamentInFirebase(updatedMatches);
    }
  }, [players, matches, matchFormat, canShuffle, tournamentId, userName, userId, currentRound, updateTournamentInFirebase]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title={displayTitle()}
          titleColor={COLORS.singleElimText}
        />

        <View style={styles.formatBanner}>
          <Text style={styles.formatText}>
            Race to {matchFormat.gamesNeededToWin}
          </Text>
          {canShuffle() && (
            <TouchableOpacity
              style={styles.shuffleButton}
              onPress={handleShufflePlayers}
            >
              <Ionicons name="shuffle-outline" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={matchesForDisplay()}
          renderItem={({ item, index }) => {
            const prevItem = index > 0 ? matchesForDisplay()[index - 1] : null;
            const showSeparator =
              index === 0 || !prevItem || prevItem.round !== item.round;

            // Check if round can be reset (no matches in higher rounds)
            const canResetRound = !matches.some((m) => m.round > currentRound);

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
                  onGameResult={handleIncrementScore}
                  onResetScore={handleResetScore}
                  currentRound={currentRound}
                  canResetRound={canResetRound}
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
            style={[
              styles.advanceButton,
              !canAdvanceRound() && styles.advanceButtonDisabled,
            ]}
            onPress={() => setShowAdvanceModal(true)}
            disabled={!canAdvanceRound()}
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
          finalMatch={finalMatch}
          matches={matches}
          tournamentType="Single Elimination (8 Players)"
          matchFormat={matchFormat}
          onClose={() => setShowSummaryModal(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  shuffleButton: {
    position: "absolute",
    top: 1,
    right: 1,
    zIndex: 10,
    padding: 7,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  formatBanner: {
    backgroundColor: COLORS.glassmorphism.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    position: "relative",
  },
  formatText: {
    color: COLORS.textWhite,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  advanceButton: {
    backgroundColor: "#111",
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  advanceButtonDisabled: {
    backgroundColor: COLORS.glassmorphism.backgroundLight,
    borderColor: COLORS.glassmorphism.border,
  },
  advanceButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
