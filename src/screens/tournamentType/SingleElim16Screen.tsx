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

interface SingleElim16ScreenProps {
  route: {
    params: {
      playerNames: string[];
      matchFormat: MatchFormat;
    };
  };
  navigation: any;
}

export const SingleElim16Screen: React.FC<SingleElim16ScreenProps> = ({
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
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");

  // Save tournament to Firebase
  const saveTournamentToFirebase = useCallback(
    async (tournamentData: Tournament) => {
      try {
        await TournamentService.saveTournament(tournamentData);
        console.log("Tournament saved to Firebase:", tournamentData.id);
      } catch (error) {
        console.error("Error saving tournament to Firebase:", error);
      }
    },
    []
  );

  // Initialize tournament
  useEffect(() => {
    if (
      playerNames &&
      playerNames.length === 16 &&
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

      const shuffledPlayers = shuffleArray(initialPlayers);

      // Create Round 1 matches (8 matches)
      const round1Matches: Match[] = [];
      for (let i = 0; i < 8; i++) {
        round1Matches.push(
          createMatch(
            `se16-r1-${i + 1}`,
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

      // Create tournament object for Firebase
      const tournamentId = `se16-${Date.now()}`;
      const tournament: Tournament = {
        id: tournamentId,
        name: "Single Elimination Tournament",
        type: "Single Elimination",
        manager: "David",
        managerId: "manager-1",
        players: shuffledPlayers,
        matches: round1Matches,
        format: matchFormat,
        status: "in_progress",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        maxPlayers: 16,
        currentRound: 1,
        totalRounds: 4,
      };

      setPlayers(shuffledPlayers);
      setMatches(round1Matches);
      setTournamentId(tournamentId);
      setHasInitialized(true);

      // Save to Firebase
      saveTournamentToFirebase(tournament);
    }
  }, [playerNames, matchFormat, hasInitialized, saveTournamentToFirebase]);

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

            // Check if this is the final match (round 4, match 1)
            if (match.round === 4 && match.matchNumber === 1) {
              setTimeout(() => {
                setTournamentOver(true);
                setOverallWinner(winner);
                setFinalMatch(updatedMatch);
                setShowSummaryModal(true);
              }, 100);
            }
          }

          return updatedMatch;
        });
      });
    },
    [matchFormat, updatePlayerElimination]
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
      // Round 1 → Round 2: 8 winners → 4 matches
      for (let i = 0; i < Math.floor(winners.length / 2); i++) {
        newMatches.push(
          createMatch(
            `se16-r2-${i + 1}`,
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
      // Round 2 → Round 3: 4 winners → 2 matches
      for (let i = 0; i < Math.floor(winners.length / 2); i++) {
        newMatches.push(
          createMatch(
            `se16-r3-${i + 1}`,
            3,
            i + 1,
            winners[i * 2],
            winners[i * 2 + 1],
            "winners",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 3) {
      // Round 3 → Round 4 (Finals): 2 winners → 1 match
      if (winners.length === 2) {
        newMatches.push(
          createMatch(
            "se16-r4-1",
            4,
            1,
            winners[0],
            winners[1],
            "winners",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 4) {
      // Tournament complete
      if (winners.length === 1) {
        const finalMatch = matches.find(
          (m) => m.round === 4 && m.matchNumber === 1
        );
        setTournamentOver(true);
        setOverallWinner(winners[0]);
        setFinalMatch(finalMatch || null);
        setShowSummaryModal(true);
        return;
      }
    }

    if (newMatches.length > 0) {
      setMatches((prev) => [...prev, ...newMatches]);
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
    return `Single Elimination (16) - Round ${currentRound}`;
  }, [tournamentOver, overallWinner, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    return match.winner !== null || !match.player1 || !match.player2;
  }, []);

  const canAdvanceRound = useCallback(() => {
    const currentMatches = matches.filter((m) => m.round === currentRound);
    return currentMatches.every((m) => m.winner !== null);
  }, [matches, currentRound]);

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
                  tournamentType="Single Elimination (16)"
                  isMatchLocked={isMatchLocked}
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
  container: {
    flex: 1,
    padding: 16,
  },
  formatBanner: {
    backgroundColor: COLORS.glassmorphism.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  formatText: {
    color: COLORS.textWhite,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 80,
  },
  advanceButton: {
    backgroundColor: "#111",
    paddingVertical: 16,
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
