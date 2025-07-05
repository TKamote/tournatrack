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
import { DoubleElim6ScreenProps } from "../../types/navigation.types";

export const DoubleElim6Screen: React.FC<DoubleElim6ScreenProps> = ({
  route,
  navigation,
}) => {
  const { playerNames, matchFormat } = route.params;

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

  // Initialize tournament
  useEffect(() => {
    if (
      playerNames &&
      playerNames.length === 6 &&
      matchFormat &&
      !hasInitialized
    ) {
      const initialPlayers = playerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name: `${name} L0`,
        losses: 0,
        seed: i + 1,
        isEliminated: false,
      }));

      const shuffledPlayers = shuffleArray(initialPlayers);

      // DE-6 specific bracket: Top 2 seeds get byes, bottom 4 play
      const round1Matches: Match[] = [];

      // Match 1: Seed 3 vs Seed 6
      round1Matches.push(
        createMatch(
          "de6-wb1-1",
          1,
          1,
          shuffledPlayers[2], // Seed 3
          shuffledPlayers[5], // Seed 6
          "winners",
          false,
          matchFormat
        )
      );

      // Match 2: Seed 4 vs Seed 5
      round1Matches.push(
        createMatch(
          "de6-wb1-2",
          1,
          2,
          shuffledPlayers[3], // Seed 4
          shuffledPlayers[4], // Seed 5
          "winners",
          false,
          matchFormat
        )
      );

      setPlayers(shuffledPlayers);
      setMatches(round1Matches);
      setHasInitialized(true);

      console.log("DE-6 Tournament initialized:", {
        players: shuffledPlayers.length,
        matches: round1Matches.length,
        topSeeds: [shuffledPlayers[0].name, shuffledPlayers[1].name],
      });
    }
  }, [playerNames, matchFormat, hasInitialized]);

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

          console.log(`DE-6 Updated: ${player.name} → ${updatedPlayer.name}`);
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

          console.log(
            `DE-6 Match ${matchId}: ${winner.name} now has ${playerScore}/${matchFormat.gamesNeededToWin} games`
          );

          // Auto-declare winner when race target is reached
          let updatedMatch = { ...match, games: updatedGames };

          if (playerScore >= matchFormat.gamesNeededToWin) {
            console.log(
              `🏆 DE-6 AUTO-WINNER: ${winner.name} wins match ${matchId}!`
            );
            updatedMatch.winner = winner;

            // Update losing player losses
            const losingPlayer =
              match.player1?.id === winner.id ? match.player2 : match.player1;
            if (losingPlayer) {
              setTimeout(() => updatePlayerLosses(losingPlayer.id), 0);
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
            if (match.bracket === "grandFinals") {
              // **GRAND FINALS LOGIC (same as handleIncrementScore)**
              const wbPlayer =
                match.player1?.losses === 0 ? match.player1 : match.player2;
              const lbPlayer =
                match.player1?.losses === 1 ? match.player1 : match.player2;

              if (winner.id === wbPlayer?.id) {
                if (lbPlayer) {
                  setTimeout(() => updatePlayerLosses(lbPlayer.id), 0);
                }
                setTimeout(() => {
                  setTournamentOver(true);
                  setOverallWinner(winner);
                  setRunnerUp(lbPlayer);
                  setFinalMatch({ ...match, winner });
                  setShowSummaryModal(true);
                  Alert.alert(
                    "Tournament Complete! 🏆",
                    `${winner.name} is the Champion!`,
                    [{ text: "OK" }]
                  );
                }, 100);
              } else if (
                winner.id === lbPlayer?.id &&
                !match.isGrandFinalsReset
              ) {
                if (wbPlayer) {
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0);
                }
                setTimeout(() => {
                  const resetMatch = createMatch(
                    `de6-gf-reset-${Date.now()}`,
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
                setTimeout(() => {
                  setTournamentOver(true);
                  setOverallWinner(winner);
                  setRunnerUp(winner.id === wbPlayer?.id ? lbPlayer : wbPlayer);
                  setFinalMatch({ ...match, winner });
                  setShowSummaryModal(true);
                  Alert.alert(
                    "Tournament Complete! 🏆",
                    `${winner.name} is the Champion!`,
                    [{ text: "OK" }]
                  );
                }, 100);
              }
            } else {
              // Regular match
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
      });
    },
    [updatePlayerLosses, matchFormat]
  );

  // Display functions
  const matchesForDisplay = useCallback((): Match[] => {
    return matches
      .filter((match) => match.player1 !== null)
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        const bracketPriority = { winners: 1, losers: 2, grandFinals: 3 };
        if (a.bracket !== b.bracket)
          return bracketPriority[a.bracket] - bracketPriority[b.bracket];
        return a.matchNumber - b.matchNumber;
      });
  }, [matches]);

  const displayTitle = useCallback((): string => {
    if (tournamentOver && overallWinner) return "Tournament Complete!";
    if (matches.some((m) => m.bracket === "grandFinals")) return "Grand Finals";
    return `Double Elimination (6) - Round ${currentRound}`;
  }, [tournamentOver, overallWinner, matches, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    return match.winner !== null || !match.player1 || !match.player2;
  }, []);

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

  // **DE-6 COMPLETE ADVANCE ROUND LOGIC**
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
      // **Round 2: BYE players (seeds 1,2) + WB R1 winners in WB semifinals**
      const [seed1, seed2] = players.slice(0, 2); // BYE players
      const allWBPlayers = [...wbWinners, seed1, seed2]; // 4 total

      // Create 2 WB semifinals
      for (let i = 0; i < allWBPlayers.length; i += 2) {
        if (allWBPlayers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de6-wb${nextRound}-${Math.floor(i / 2) + 1}`,
              nextRound,
              Math.floor(i / 2) + 1,
              allWBPlayers[i],
              allWBPlayers[i + 1],
              "winners",
              false,
              matchFormat
            )
          );
        }
      }

      // **LB Round 1: WB R1 losers**
      for (let i = 0; i < wbLosers.length; i += 2) {
        if (wbLosers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de6-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
      // **Round 3: WB Finals + LB matches**
      // WB Finals
      if (wbWinners.length === 2) {
        nextRoundMatches.push(
          createMatch(
            `de6-wb${nextRound}-1`,
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

      // LB: LB R1 winners + WB R2 losers
      const allLbPlayers = [...lbWinners, ...wbLosers];
      for (let i = 0; i < allLbPlayers.length; i += 2) {
        if (allLbPlayers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de6-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
      // **Round 4: LB Finals**
      for (let i = 0; i < lbWinners.length; i += 2) {
        if (lbWinners[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de6-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
      // **Round 5: LB Final (WB R3 loser vs LB R4 winner)**
      const wbR3Match = matches.find(
        (m) => m.bracket === "winners" && m.round === 3 && m.winner
      );
      const wbR3Loser = wbR3Match
        ? wbR3Match.player1?.id === wbR3Match.winner?.id
          ? wbR3Match.player2
          : wbR3Match.player1
        : null;

      if (wbR3Loser && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `de6-lbf-${nextRound}`,
            nextRound,
            1,
            wbR3Loser,
            lbWinners[0],
            "losers",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 5) {
      // **Round 6: Grand Finals**
      const wbChampion = matches.find(
        (m) => m.bracket === "winners" && m.round === 3 && m.winner
      )?.winner;

      if (wbChampion && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `de6-gf-1`,
            nextRound,
            1,
            wbChampion,
            lbWinners[0],
            "grandFinals",
            false,
            matchFormat
          )
        );
      }
    }

    if (nextRoundMatches.length > 0) {
      setMatches((prev) => [...prev, ...nextRoundMatches]);
      setCurrentRound(nextRound);
      console.log(`DE-6 Advanced to Round ${nextRound}:`, nextRoundMatches);
    }
  }, [matches, currentRound, matchFormat, players]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader title={displayTitle()} subtitle="6 Players" />

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
                  tournamentType="Double Elimination (6)"
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
          onConfirm={executeAdvanceRound} // Replace the empty function
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
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.backgroundLight,
  },
  advanceButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  advanceButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  advanceButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
