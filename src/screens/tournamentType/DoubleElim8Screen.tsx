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
  createDEInitialMatches,
} from "../../utils/tournament/tournamentUtils";
import ConfirmActionModal from "../../components/ConfirmActionModal";
import ScreenHeader from "../../components/ScreenHeader";
import IncompleteMatchesModal from "../../components/IncompleteMatchesModal";
import TournamentSummaryModal from "../../components/TournamentSummaryModal";
import { RoundSeparator } from "../../components/RoundSeparator";
import { Ionicons } from "@expo/vector-icons";
import TournamentBracketView from "../../components/tournament/TournamentBracketView";
import { TournamentService } from "../../utils/tournamentService";
import { useUser } from "../../context/UserContext";

interface DoubleElimination8ScreenProps {
  route: {
    params: {
      playerNames: string[];
      matchFormat: MatchFormat;
    };
  };
  navigation: any;
}

export const DoubleElimination8Screen: React.FC<
  DoubleElimination8ScreenProps
> = ({ route, navigation }) => {
  const { playerNames, matchFormat } = route.params;
  const { userName, userId } = useUser();

  // State
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
        await TournamentService.saveTournament(tournamentData);
      } catch (error) {
        console.error("Error saving tournament to Firebase:", error);
      }
    },
    []
  );

  // Update tournament in Firebase
  const updateTournamentInFirebase = useCallback(
    async (updatedMatches: Match[], updatedStatus?: string) => {
      if (!tournamentId) return;

      // Check for different types of changes
      const completedMatches = updatedMatches.filter((match) => match.winner);
      const newRounds = updatedMatches.filter((match) => match.round > 1);
      const totalMatches = updatedMatches.length;

      // Always update if we have more than initial matches or any completed matches
      const hasChanges =
        completedMatches.length > 0 || newRounds.length > 0 || totalMatches > 8;

      if (!hasChanges) {
        return;
      }

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
          status: (updatedStatus as TournamentStatus) || "in_progress",
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublic: true,
          maxPlayers: 8,
          currentRound,
          totalRounds: 4,
        };

        await TournamentService.saveTournament(updatedTournament);
      } catch (error) {
        console.error("Error updating tournament in Firebase:", error);
      }
    },
    [tournamentId, players, matchFormat, currentRound, userName, userId]
  );

  // Initialize tournament
  useEffect(() => {
    if (
      playerNames &&
      playerNames.length === 8 &&
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
      const initialMatches = createDEInitialMatches(
        shuffledPlayers,
        matchFormat
      );

      // Create tournament object for Firebase
      const tournamentId = `de8-${Date.now()}`;
      const tournament: Tournament = {
        id: tournamentId,
        name: "Double Elimination Tournament",
        type: "Double Elimination",
        manager: userName,
        managerId: userId,
        players: shuffledPlayers,
        matches: initialMatches,
        format: matchFormat,
        status: "in_progress",
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: true, // Make it public so supporters can see it
        maxPlayers: 8,
        currentRound: 1,
        totalRounds: 4,
      };

      setPlayers(shuffledPlayers);
      setMatches(initialMatches);
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

          const updatedPlayer = {
            ...player,
            losses: newLossCount,
            isEliminated: isNowEliminated,
            name: `${baseName} L${newLossCount}`,
          };

          return updatedPlayer;
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

            // ✅ GRAND FINALS SPECIAL LOGIC - CHECK FIRST!
            if (match.bracket === "grandFinals") {
              // Get updated player data for winner
              const updatedWinner =
                players.find((p) => p.id === winner.id) || winner;
              const wbPlayer =
                match.player1?.losses === 0 ? match.player1 : match.player2;
              const lbPlayer =
                match.player1?.losses === 1 ? match.player1 : match.player2;

              if (winner.id === wbPlayer?.id) {
                // L0 player wins → LB player gets 2nd loss + Tournament over
                if (lbPlayer) {
                  setTimeout(() => updatePlayerLosses(lbPlayer.id), 0); // ✅ ADD THIS!
                }

                setTimeout(() => {
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
                  // Alert.alert(
                  //   "Tournament Complete! 🏆",
                  //   `${cleanWinner.name} is the Champion!`,
                  //   [{ text: "OK" }]
                  // );
                }, 100);
              } else if (winner.id === lbPlayer?.id) {
                // L1 player wins → WB player gets 1st loss + Bracket Reset
                if (wbPlayer) {
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0); // ✅ ADD THIS TOO!
                }

                if (!match.isGrandFinalsReset) {
                  // Create the bracket reset match
                  setTimeout(() => {
                    const resetMatch = createMatch(
                      `gf-reset-${Date.now()}`,
                      match.round,
                      2,
                      wbPlayer!,
                      lbPlayer,
                      "grandFinals",
                      true, // This is the reset match
                      matchFormat
                    );

                    setMatches((prev) => [...prev, resetMatch]);
                  }, 100);
                } else {
                  // This WAS the reset match → Tournament over
                  setTimeout(() => {
                    setTournamentOver(true);
                    // Clean winner name by removing loss record
                    const cleanWinner = {
                      ...winner,
                      name: winner.name.replace(/ L[0-2]$/, ""),
                    };
                    setOverallWinner(cleanWinner);
                    // Clean runner-up name by removing loss record
                    const cleanRunnerUp = wbPlayer
                      ? {
                          ...wbPlayer,
                          name: wbPlayer.name.replace(/ L[0-2]$/, ""),
                        }
                      : wbPlayer;
                    setRunnerUp(cleanRunnerUp);
                    setFinalMatch(updatedMatch);
                    setShowSummaryModal(true);
                    // Alert.alert(
                    //   "Tournament Complete! 🏆",
                    //   `${cleanWinner.name} is the Champion!`,
                    //   [{ text: "OK" }]
                    // );
                  }, 100);
                }
              }
            } else {
              // Regular match logic
              const losingPlayer =
                match.player1?.id === winner.id ? match.player2 : match.player1;
              if (losingPlayer) {
                setTimeout(() => updatePlayerLosses(losingPlayer.id), 0);
              }
            }
          }

          return updatedMatch;
        });
      });
    },
    [matchFormat, updatePlayerLosses]
  );

  // Handle set winner
  const handleSetWinner = useCallback(
    (matchId: string, winner: Player) => {
      setMatches((prevMatches) => {
        return prevMatches.map((match) => {
          if (match.id === matchId) {
            // ✅ GRAND FINALS SPECIAL LOGIC
            if (match.bracket === "grandFinals") {
              const wbPlayer =
                match.player1?.losses === 0 ? match.player1 : match.player2;
              const lbPlayer =
                match.player1?.losses === 1 ? match.player1 : match.player2;

              if (winner.id === wbPlayer?.id) {
                // L0 player wins → LB player gets 2nd loss + Tournament over
                if (lbPlayer) {
                  setTimeout(() => updatePlayerLosses(lbPlayer.id), 0); // ✅ ADD THIS!
                }

                setTimeout(() => {
                  setTournamentOver(true);
                  setOverallWinner(winner);
                  setRunnerUp(lbPlayer);
                  setFinalMatch({ ...match, winner });
                  setShowSummaryModal(true);

                  // Update Firebase with completed status
                  const updatedMatches = matches.map((m) =>
                    m.id === matchId ? { ...m, winner } : m
                  );
                  updateTournamentInFirebase(updatedMatches, "completed");

                  // Alert.alert(
                  //   "Tournament Complete! 🏆",
                  //   `${winner.name} is the Champion!`,
                  //   [{ text: "OK" }]
                  // );
                }, 100);
              } else if (
                winner.id === lbPlayer?.id &&
                !match.isGrandFinalsReset
              ) {
                // L1 player wins first GF → WB player gets 1st loss + Bracket Reset
                if (wbPlayer) {
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0); // ✅ ADD THIS!
                }

                setTimeout(() => {
                  const resetMatch = createMatch(
                    `gf-reset-${Date.now()}`,
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

                  // Alert.alert(
                  //   "Tournament Complete! 🏆",
                  //   `${winner.name} is the Champion!`,
                  //   [{ text: "OK" }]
                  // );
                }, 100);
              }
            } else {
              // Regular match - Update losing player losses
              const losingPlayer =
                match.player1?.id === winner.id ? match.player2 : match.player1;
              if (losingPlayer) {
                setTimeout(() => updatePlayerLosses(losingPlayer.id), 0);
              }
            }

            return { ...match, winner };
          }
          return match;
        });

        // Update Firebase with new matches
        const updatedMatches = prevMatches.map((match) => {
          if (match.id === matchId) {
            return { ...match, winner };
          }
          return match;
        });

        // Update Firebase
        updateTournamentInFirebase(updatedMatches);
      });
    },
    [updatePlayerLosses, matchFormat, updateTournamentInFirebase]
  );

  // Check if we can advance to next round
  const canAdvanceRound = useCallback((): boolean => {
    const currentRoundMatches = matches.filter(
      (match) =>
        match.round === currentRound && !match.bracket.includes("grandFinals")
    );
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

  // Execute advance round (called by modal)
  const executeAdvanceRound = useCallback(() => {
    setShowAdvanceModal(false);

    const currentRoundMatches = matches.filter(
      (match) => match.round === currentRound && match.winner
    );

    if (currentRoundMatches.length === 0) return;

    const nextRoundMatches: Match[] = [];
    const nextRound = currentRound + 1;

    // Get Winners and Losers bracket matches separately
    const wbMatches = currentRoundMatches.filter(
      (m) => m.bracket === "winners"
    );
    const lbMatches = currentRoundMatches.filter((m) => m.bracket === "losers");

    const wbWinners = wbMatches.map((m) => m.winner!);
    const wbLosers = wbMatches.map((m) =>
      m.player1?.id === m.winner?.id ? m.player2! : m.player1!
    );

    const lbWinners = lbMatches.map((m) => m.winner!);

    // **WINNERS BRACKET LOGIC**
    // Create next WB matches if there are enough winners
    if (wbWinners.length >= 2) {
      for (let i = 0; i < wbWinners.length; i += 2) {
        if (wbWinners[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `match-wb${nextRound}-${Math.floor(i / 2) + 1}`,
              nextRound,
              Math.floor(i / 2) + 1,
              wbWinners[i],
              wbWinners[i + 1],
              "winners",
              false,
              matchFormat
            )
          );
        }
      }
    }

    // **LOSERS BRACKET LOGIC**
    if (currentRound === 1) {
      // Round 2: WB R1 losers enter LB
      for (let i = 0; i < wbLosers.length; i += 2) {
        if (wbLosers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `match-lb${nextRound}-${Math.floor(i / 2) + 1}`,
              nextRound,
              Math.floor(i / 2) + 1,
              wbLosers[i],
              wbLosers[i + 1],
              "losers",
              false,
              matchFormat
            )
          );
        }
      }
    } else if (currentRound === 2) {
      // Round 3: LB R2 winners + WB R2 losers
      const allLbPlayers = [...lbWinners, ...wbLosers];
      for (let i = 0; i < allLbPlayers.length; i += 2) {
        if (allLbPlayers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `match-lb${nextRound}-${Math.floor(i / 2) + 1}`,
              nextRound,
              Math.floor(i / 2) + 1,
              allLbPlayers[i],
              allLbPlayers[i + 1],
              "losers",
              false,
              matchFormat
            )
          );
        }
      }
    } else if (currentRound === 3) {
      // Round 4: LB R3 winners only (LB semifinals)
      for (let i = 0; i < lbWinners.length; i += 2) {
        if (lbWinners[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `match-lb${nextRound}-${Math.floor(i / 2) + 1}`,
              nextRound,
              Math.floor(i / 2) + 1,
              lbWinners[i],
              lbWinners[i + 1],
              "losers",
              false,
              matchFormat
            )
          );
        }
      }
    } else if (currentRound === 4) {
      // Round 5: LB Final (WB R3 loser vs LB R4 winner)

      // Get the WB R3 loser (from previous round)
      const wbR3Match = matches.find(
        (m) => m.bracket === "winners" && m.round === 3 && m.winner
      );
      const wbR3Loser = wbR3Match
        ? wbR3Match.player1?.id === wbR3Match.winner?.id
          ? wbR3Match.player2
          : wbR3Match.player1
        : null;

      // LB R4 winner is in lbWinners array
      if (wbR3Loser && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `match-lbf-${nextRound}`,
            nextRound,
            1,
            wbR3Loser, // WB R3 loser from previous round
            lbWinners[0], // LB R4 winner from current round
            "losers",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 5) {
      // Round 6: Grand Finals (WB Champion vs LB Champion)
      const wbChampion =
        wbWinners.length === 1
          ? wbWinners[0]
          : matches.find(
              (m) => m.bracket === "winners" && m.round === 3 && m.winner
            )?.winner;

      if (wbChampion && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `match-gf-1`,
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

    // Add matches and advance
    if (nextRoundMatches.length > 0) {
      setMatches((prev) => [...prev, ...nextRoundMatches]);
      setCurrentRound(nextRound);
    }
  }, [matches, currentRound, matchFormat]);

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
    return `Double Elimination (8) - Round ${currentRound}`;
  }, [tournamentOver, overallWinner, matches, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    return match.winner !== null || !match.player1 || !match.player2;
  }, []);

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
                  tournamentType="Double Elimination (8)"
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

        {/* Add the Advance Button - DEBUG VERSION */}
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
          onConfirm={executeAdvanceRound} // Change from () => {}
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
  debugText: {
    color: COLORS.textDark,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
