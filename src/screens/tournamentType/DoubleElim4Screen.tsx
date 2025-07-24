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
import { Player, Match, Tournament } from "../../types";
import { TournamentStatus } from "../../types/tournament.types";
import { COLORS } from "../../constants/colors";
import { DoubleElim4ScreenProps } from "../../types/navigation.types";
import {
  createMatch,
  shuffleArray,
  createDEInitialMatches,
} from "../../utils/tournament/tournamentUtils";
import ScreenHeader from "../../components/ScreenHeader";
import MatchListItem from "../../components/MatchListItem";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import IncompleteMatchesModal from "../../components/IncompleteMatchesModal";
import TournamentSummaryModal from "../../components/TournamentSummaryModal";
import { RoundSeparator } from "../../components/RoundSeparator";
import { Ionicons } from "@expo/vector-icons";
import { TournamentService } from "../../utils/tournamentService";
import { useUser } from "../../context/UserContext";

export const DoubleElim4Screen: React.FC<DoubleElim4ScreenProps> = ({
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
  const [runnerUp, setRunnerUp] = useState<Player | null>(null);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [tournamentId, setTournamentId] = useState<string>("");

  // Save tournament to Firebase
  const saveTournamentToFirebase = useCallback(
    async (tournamentData: Tournament) => {
      try {
        console.log("🔥🔥🔥 INITIAL SAVE TO FIREBASE 🔥🔥🔥");
        console.log("📊 Tournament data:", {
          id: tournamentData.id,
          name: tournamentData.name,
          type: tournamentData.type,
          players: tournamentData.players.length,
          matches: tournamentData.matches.length,
          status: tournamentData.status,
          isPublic: tournamentData.isPublic,
        });

        await TournamentService.saveTournament(tournamentData);
        console.log("✅ Tournament saved to Firebase:", tournamentData.id);
      } catch (error) {
        console.error("❌ Error saving tournament to Firebase:", error);
        console.error("❌ Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          tournamentId: tournamentData.id,
        });
      }
    },
    []
  );

  // Initialize tournament
  useEffect(() => {
    if (
      playerNames &&
      playerNames.length === 4 &&
      matchFormat &&
      !hasInitialized
    ) {
      console.log(
        "[TournamentCreation] userName:",
        userName,
        "userId:",
        userId
      );
      const initialPlayers = playerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name: `${name} L0`,
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
      const round1Matches = createDEInitialMatches(
        shuffledPlayers,
        matchFormat
      );

      // Create tournament object for Firebase
      const tournamentId = `de4-${Date.now()}`;
      const tournament: Tournament = {
        id: tournamentId,
        name: "Double Elimination Tournament",
        type: "Double Elimination",
        manager: userName,
        managerId: userId,
        players: shuffledPlayers,
        matches: round1Matches,
        format: matchFormat,
        status: "in_progress",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true,
        maxPlayers: 4,
        currentRound: 1,
        totalRounds: 3,
      };

      setPlayers(shuffledPlayers);
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

  // Update player losses
  const updatePlayerLosses = useCallback((playerId: string) => {
    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => {
        if (player.id === playerId) {
          const newLossCount = player.losses + 1;
          const baseName = player.name.replace(/ L[0-2]$/, "");
          const isNowEliminated = newLossCount >= 2;
          return {
            ...player,
            losses: newLossCount,
            isEliminated: isNowEliminated,
            name: `${baseName} L${newLossCount}`,
          };
        }
        return player;
      });
    });
  }, []);

  // Update tournament in Firebase
  const updateTournamentInFirebase = useCallback(
    async (updatedMatches: Match[], tournamentStatus?: TournamentStatus) => {
      console.log("🔥🔥🔥 FIREBASE UPDATE FUNCTION CALLED 🔥🔥🔥");
      console.log(
        "🔄 UPDATE FUNCTION CALLED with",
        updatedMatches.length,
        "matches"
      );
      if (!tournamentId) return;

      try {
        const updatedTournament: Tournament = {
          id: tournamentId,
          name: "Double Elimination Tournament",
          type: "Double Elimination",
          manager: userName,
          managerId: userId,
          players,
          matches: updatedMatches,
          format: matchFormat,
          status: tournamentStatus || "in_progress",
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          maxPlayers: 4,
          currentRound: Math.max(...updatedMatches.map((m) => m.round)),
          totalRounds: 3,
        };

        console.log(
          "🔥 Attempting to update tournament in Firebase:",
          tournamentId
        );
        console.log("📊 Data being saved:", {
          tournamentId: updatedTournament.id,
          matchesCount: updatedTournament.matches.length,
          completedMatches: updatedTournament.matches.filter((m) => m.winner)
            .length,
          rounds: updatedTournament.matches.map((m) => m.round),
          status: updatedTournament.status,
        });

        try {
          await TournamentService.saveTournament(updatedTournament);
          console.log(
            "✅ Tournament updated in Firebase:",
            tournamentId,
            "with",
            updatedMatches.filter((m) => m.winner).length,
            "completed matches"
          );
        } catch (updateError: any) {
          console.error(
            "❌ Error updating tournament in Firebase:",
            updateError
          );
          console.error("❌ Update error details:", {
            code: updateError?.code,
            message: updateError?.message,
            tournamentId: tournamentId,
          });
        }
      } catch (error) {
        console.error("❌ Error in updateTournamentInFirebase:", error);
      }
    },
    [tournamentId, players, matchFormat, userName, userId]
  );

  // Handle game result
  const handleIncrementScore = useCallback(
    (matchId: string, winner: Player, score1: number, score2: number) => {
      console.log("🎯 HANDLE INCREMENT SCORE CALLED:", {
        matchId,
        winner: winner.name,
        score1,
        score2,
      });

      setMatches((prevMatches) => {
        const updatedMatches = prevMatches.map((match) => {
          if (match.id !== matchId || match.winner) return match;

          const newGame = {
            id: `game-${match.games.length + 1}`,
            winner,
            score1,
            score2,
          };

          console.log("🎮 GAME PLAYED:", {
            matchId: match.id,
            gameId: newGame.id,
            winner: winner.name,
            score: `${score1}-${score2}`,
            totalGames: match.games.length + 1,
          });

          const updatedGames = [...match.games, newGame];
          const playerScore = updatedGames.filter(
            (g) => g.winner?.id === winner.id
          ).length;
          let updatedMatch = { ...match, games: updatedGames };
          if (playerScore >= matchFormat.gamesNeededToWin) {
            updatedMatch.winner = winner;

            console.log("🏆 MATCH COMPLETED:", {
              matchId: match.id,
              round: match.round,
              bracket: match.bracket,
              winner: winner.name,
              score: `${playerScore}-${
                matchFormat.gamesNeededToWin - playerScore
              }`,
              gamesPlayed: updatedGames.length,
            });
            // Grand Finals logic
            if (match.bracket === "grandFinals") {
              const wbPlayer =
                match.player1?.losses === 0 ? match.player1 : match.player2;
              const lbPlayer =
                match.player1?.losses === 1 ? match.player1 : match.player2;
              if (winner.id === wbPlayer?.id) {
                if (lbPlayer) updatePlayerLosses(lbPlayer.id);

                setTournamentOver(true);
                // Clean winner name by removing loss record
                const cleanWinner = {
                  ...winner,
                  name: winner.name.replace(/ L[0-2]$/, ""),
                };
                setOverallWinner(cleanWinner);
                // Clean runner-up name by removing loss record
                const cleanRunnerUp = lbPlayer
                  ? {
                      ...lbPlayer,
                      name: lbPlayer.name.replace(/ L[0-2]$/, ""),
                    }
                  : lbPlayer;
                setRunnerUp(cleanRunnerUp);
                setFinalMatch(updatedMatch);
                setShowSummaryModal(true);

                // Update Firebase with completed tournament status
                updateTournamentInFirebase(updatedMatches, "completed");
              } else if (
                winner.id === lbPlayer?.id &&
                !match.isGrandFinalsReset
              ) {
                // L1 player wins first GF → WB player gets 1st loss + Bracket Reset
                if (wbPlayer) {
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0);
                }

                setTimeout(() => {
                  const resetMatch = createMatch(
                    `de4-gf-reset-${Date.now()}`,
                    match.round,
                    2,
                    wbPlayer!,
                    lbPlayer,
                    "grandFinals",
                    true,
                    matchFormat
                  );

                  setMatches((prev) => [...prev, resetMatch]);
                }, 100);
              } else if (match.isGrandFinalsReset) {
                // Reset match completed → Tournament over
                const runnerUp =
                  winner.id === wbPlayer?.id ? lbPlayer : wbPlayer;
                setTimeout(() => {
                  setTournamentOver(true);
                  setOverallWinner(winner);
                  setRunnerUp(runnerUp);
                  setFinalMatch({ ...match, winner });
                  setShowSummaryModal(true);

                  // Update Firebase with completed status
                  const updatedMatches = matches.map((m) =>
                    m.id === matchId ? { ...m, winner } : m
                  );
                  updateTournamentInFirebase(updatedMatches, "completed");
                }, 100);
              }
            } else {
              // Regular match
              const losingPlayer =
                match.player1?.id === winner.id ? match.player2 : match.player1;
              if (losingPlayer) updatePlayerLosses(losingPlayer.id);
            }
          }
          return updatedMatch;
        });

        // Update Firebase with current match state
        console.log("🔥🔥🔥 ABOUT TO CALL FIREBASE UPDATE 🔥🔥🔥");
        console.log(
          "🔥🔥🔥 updateTournamentInFirebase function:",
          typeof updateTournamentInFirebase
        );
        if (updateTournamentInFirebase) {
          updateTournamentInFirebase(updatedMatches);
        } else {
          console.log("❌ updateTournamentInFirebase is undefined!");
        }

        return updatedMatches;
      });
    },
    [
      matchFormat,
      updatePlayerLosses,
      updateTournamentInFirebase,
      userName,
      userId,
    ]
  );

  // **DE-4 COMPLETE ADVANCE ROUND LOGIC**
  const executeAdvanceRound = useCallback(() => {
    setShowAdvanceModal(false);

    const currentRoundMatches = matches.filter(
      (match) => match.round === currentRound && match.winner
    );

    if (currentRoundMatches.length === 0) return;

    const nextRoundMatches: Match[] = [];
    const nextRound = currentRound + 1;

    const wbMatches = currentRoundMatches.filter(
      (m) => m.bracket === "winners"
    );
    const lbMatches = currentRoundMatches.filter((m) => m.bracket === "losers");

    const wbWinners = wbMatches.map((m) => m.winner!);
    const wbLosers = wbMatches.map((m) =>
      m.player1?.id === m.winner?.id ? m.player2! : m.player1!
    );
    const lbWinners = lbMatches.map((m) => m.winner!);

    if (currentRound === 1) {
      // Round 1 → Round 2: 2 winners → 1 final
      if (wbWinners.length === 2) {
        nextRoundMatches.push(
          createMatch(
            `de4-wb${nextRound}-1`,
            nextRound,
            1,
            wbWinners[0],
            wbWinners[1],
            "winners",
            false,
            matchFormat
          )
        );
      }

      // Round 1 → Round 2: 2 losers → 1 match
      if (wbLosers.length === 2) {
        nextRoundMatches.push(
          createMatch(
            `de4-lb${nextRound}-1`,
            nextRound,
            1,
            wbLosers[0],
            wbLosers[1],
            "losers",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 2) {
      // Round 2 → Round 3: WB final loser vs LB winner → Losers Final
      const wbLosers = wbMatches.map((m) =>
        m.player1?.id === m.winner?.id ? m.player2! : m.player1!
      );

      if (wbLosers.length === 1 && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `de4-lb${nextRound}-1`,
            nextRound,
            1,
            wbLosers[0],
            lbWinners[0],
            "losers",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 3) {
      // Round 4: Grand Finals (WB Champion vs LB Champion)
      const wbChampion =
        wbWinners.length === 1
          ? wbWinners[0]
          : matches.find(
              (m) => m.bracket === "winners" && m.round === 2 && m.winner
            )?.winner;

      if (wbChampion && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `de4-gf-1`,
            nextRound,
            1,
            wbChampion, // Undefeated WB champion
            lbWinners[0], // LB champion
            "grandFinals",
            false,
            matchFormat
          )
        );
      }
    }

    if (nextRoundMatches.length > 0) {
      console.log("🎯 CREATING NEW ROUND:", {
        currentRound,
        newMatchesCount: nextRoundMatches.length,
        newMatches: nextRoundMatches.map((m) => ({
          id: m.id,
          round: m.round,
          bracket: m.bracket,
          player1: m.player1?.name,
          player2: m.player2?.name,
        })),
      });

      const allMatches = [...matches, ...nextRoundMatches];
      setMatches(allMatches);

      // Update Firebase with new matches immediately
      updateTournamentInFirebase(allMatches);
      setCurrentRound(nextRound);
    }
  }, [matches, currentRound, matchFormat, updateTournamentInFirebase]);

  // Update Firebase when tournament state changes
  useEffect(() => {
    if (hasInitialized && matches.length > 0) {
      const status = tournamentOver ? "completed" : "in_progress";
      console.log("🔄 Tournament state changed, updating Firebase:", {
        tournamentId,
        status,
        matchesCount: matches.length,
        completedMatches: matches.filter((m) => m.winner).length,
        tournamentOver,
      });
      updateTournamentInFirebase(matches, status);
    }
  }, [
    tournamentOver,
    hasInitialized,
    matches,
    updateTournamentInFirebase,
    tournamentId,
  ]);

  // Display functions
  const matchesForDisplay = useCallback((): Match[] => {
    return matches
      .filter((match) => match.player1 !== null)
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        const bracketPriority = {
          winners: 1,
          losers: 2,
          grandFinals: 3,
          main: 1,
        };
        if (a.bracket !== b.bracket)
          return bracketPriority[a.bracket] - bracketPriority[b.bracket];
        return a.matchNumber - b.matchNumber;
      });
  }, [matches]);

  const displayTitle = useCallback((): string => {
    if (tournamentOver && overallWinner) return "Tournament Complete!";
    if (matches.some((m) => m.bracket === "grandFinals")) return "Grand Finals";
    return `Double Elimination (4) - Round ${currentRound}`;
  }, [tournamentOver, overallWinner, matches, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    const isLocked = match.winner !== null || !match.player1 || !match.player2;
    return isLocked;
  }, []);

  // Update canAdvanceRound to check all matches in current round including Grand Finals
  const canAdvanceRound = useCallback((): boolean => {
    const currentRoundMatches = matches.filter(
      (match) => match.round === currentRound
    );

    // If we're in Grand Finals, check if the Grand Finals match is completed
    if (currentRoundMatches.some((match) => match.bracket === "grandFinals")) {
      const grandFinalsMatch = currentRoundMatches.find(
        (match) => match.bracket === "grandFinals"
      );
      return grandFinalsMatch ? !!grandFinalsMatch.winner : false;
    }

    return (
      currentRoundMatches.length > 0 &&
      currentRoundMatches.every((match) => match.winner)
    );
  }, [matches, currentRound]);

  // Handle advance round
  const handleAdvanceRound = useCallback(() => {
    if (canAdvanceRound()) {
      setShowAdvanceModal(true);
    } else {
      setShowIncompleteModal(true);
    }
  }, [canAdvanceRound]);

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
              index === 0 ||
              !prevItem ||
              prevItem.round !== item.round ||
              (prevItem.round === item.round &&
                prevItem.bracket !== item.bracket);

            return (
              <>
                {showSeparator && (
                  <RoundSeparator round={item.round} bracket={item.bracket} />
                )}
                <MatchListItem
                  item={item}
                  players={players}
                  tournamentType="Double Elimination (4)"
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

        {/* Add the Advance Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.advanceButton,
              !canAdvanceRound() && styles.advanceButtonDisabled,
            ]}
            onPress={handleAdvanceRound}
            disabled={!canAdvanceRound()}
          >
            <Text style={styles.advanceButtonText}>Advance to Next Round</Text>
          </TouchableOpacity>
        </View>

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
          runnerUp={runnerUp}
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
  buttonContainer: {
    // Removed padding and backgroundColor for a cleaner look
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
