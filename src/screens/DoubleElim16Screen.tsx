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
import { Player, Match, MatchFormat } from "../types";
import { COLORS } from "../constants/colors";
import { DoubleElim16ScreenProps } from "../types/navigation.types";
import {
  createMatch,
  shuffleArray,
  createDEInitialMatches,
} from "../utils/tournament/tournamentUtils";
import ScreenHeader from "../components/ScreenHeader";
import MatchListItem from "../components/MatchListItem";
import ConfirmActionModal from "../components/ConfirmActionModal";

const DoubleElim16Screen: React.FC<DoubleElim16ScreenProps> = ({
  route,
  navigation,
}) => {
  const { playerNames, matchFormat } = route.params;

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
      playerNames.length === 16 &&
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
      const round1Matches = createDEInitialMatches(
        shuffledPlayers,
        matchFormat
      );
      setPlayers(shuffledPlayers);
      setMatches(round1Matches);
      setHasInitialized(true);
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
          let updatedMatch = { ...match, games: updatedGames };
          if (playerScore >= matchFormat.gamesNeededToWin) {
            updatedMatch.winner = winner;
            // Grand Finals logic
            if (match.bracket === "grandFinals") {
              const wbPlayer =
                match.player1?.losses === 0 ? match.player1 : match.player2;
              const lbPlayer =
                match.player1?.losses === 1 ? match.player1 : match.player2;
              if (winner.id === wbPlayer?.id) {
                if (lbPlayer)
                  setTimeout(() => updatePlayerLosses(lbPlayer.id), 0);
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
                  Alert.alert(
                    "Tournament Complete! 🏆",
                    `${cleanWinner.name} is the Champion!`,
                    [{ text: "OK" }]
                  );
                }, 100);
              } else if (winner.id === lbPlayer?.id) {
                if (wbPlayer)
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0);
                if (!match.isGrandFinalsReset) {
                  setTimeout(() => {
                    const resetMatch = createMatch(
                      `de16-gf-reset-${Date.now()}`,
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
                } else {
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
                    Alert.alert(
                      "Tournament Complete! 🏆",
                      `${cleanWinner.name} is the Champion!`,
                      [{ text: "OK" }]
                    );
                  }, 100);
                }
              }
            } else {
              // Regular match
              const losingPlayer =
                match.player1?.id === winner.id ? match.player2 : match.player1;
              if (losingPlayer)
                setTimeout(() => updatePlayerLosses(losingPlayer.id), 0);
            }
          }
          return updatedMatch;
        });
      });
    },
    [matchFormat, updatePlayerLosses]
  );

  // Advance round logic
  const executeAdvanceRound = useCallback(() => {
    setShowAdvanceModal(false);

    const currentRoundMatches = matches.filter(
      (match) => match.round === currentRound && match.winner
    );
    if (currentRoundMatches.length === 0) return;

    const nextRoundMatches: Match[] = [];
    const nextRound = currentRound + 1;

    // Winners and Losers bracket separation
    const wbMatches = currentRoundMatches.filter(
      (m) => m.bracket === "winners"
    );
    const lbMatches = currentRoundMatches.filter((m) => m.bracket === "losers");
    const wbWinners = wbMatches.map((m) => m.winner!);
    const wbLosers = wbMatches.map((m) =>
      m.player1?.id === m.winner?.id ? m.player2! : m.player1!
    );
    const lbWinners = lbMatches.map((m) => m.winner!);

    // --- DE-16 BRACKET LOGIC ---
    if (currentRound === 1) {
      // Round 1 → Round 2: 8 winners → 4 matches
      for (let i = 0; i < wbWinners.length; i += 2) {
        if (wbWinners[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de16-wb${nextRound}-${Math.floor(i / 2) + 1}`,
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

      // Round 1 → Round 2: 8 losers → 4 matches
      for (let i = 0; i < wbLosers.length; i += 2) {
        if (wbLosers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de16-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
      // Round 2 → Round 3: 4 WB winners → 2 matches
      for (let i = 0; i < wbWinners.length; i += 2) {
        if (wbWinners[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de16-wb${nextRound}-${Math.floor(i / 2) + 1}`,
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

      // Round 2 → Round 3: 4 LB winners + 4 WB losers → 4 matches
      const allLbPlayers = [...lbWinners, ...wbLosers];
      for (let i = 0; i < allLbPlayers.length; i += 2) {
        if (allLbPlayers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de16-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
      // Round 3 → Round 4: 2 WB winners → 1 final
      if (wbWinners.length === 2) {
        nextRoundMatches.push(
          createMatch(
            `de16-wb${nextRound}-1`,
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

      // Round 3 → Round 4: 4 LB winners + 2 WB losers → 6 players → 3 matches
      const allLbPlayers = [...lbWinners, ...wbLosers];
      for (let i = 0; i < allLbPlayers.length; i += 2) {
        if (allLbPlayers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de16-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
    } else if (currentRound === 4) {
      // Round 4 → Round 5: WB champion determined, LB semifinals
      // LB: 3 winners + 1 WB loser = 4 players → 2 matches
      const allLbPlayers = [...lbWinners, ...wbLosers];
      for (let i = 0; i < allLbPlayers.length; i += 2) {
        if (allLbPlayers[i + 1]) {
          nextRoundMatches.push(
            createMatch(
              `de16-lb${nextRound}-${Math.floor(i / 2) + 1}`,
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
    } else if (currentRound === 5) {
      // Round 5 → Round 6: LB final
      if (lbWinners.length === 2) {
        nextRoundMatches.push(
          createMatch(
            `de16-lb${nextRound}-1`,
            nextRound,
            1,
            lbWinners[0],
            lbWinners[1],
            "losers",
            false,
            matchFormat
          )
        );
      }
    } else if (currentRound === 6) {
      // Round 6 → Grand Finals: WB Champion vs LB Champion
      const wbChampion = matches.find(
        (m) => m.bracket === "winners" && m.round === 4 && m.winner
      )?.winner;
      const lbChampion = matches.find(
        (m) => m.bracket === "losers" && m.round === 6 && m.winner
      )?.winner;

      if (wbChampion && lbChampion) {
        nextRoundMatches.push(
          createMatch(
            `de16-gf-1`,
            nextRound,
            1,
            wbChampion,
            lbChampion,
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
    }
  }, [matches, currentRound, matchFormat]);

  // Advance round logic (simplified for placeholder)
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
          title={`Double Elimination (16) - Round ${currentRound}`}
          subtitle="16 Players"
        />
        <Text style={styles.formatBanner}>
          Race to {matchFormat.gamesNeededToWin}
        </Text>
        <FlatList
          data={matches.filter((m) => m.round === currentRound)}
          renderItem={({ item, index }) => {
            const prevItem = index > 0 ? matches[index - 1] : null;
            const showSeparator =
              index === 0 ||
              !prevItem ||
              prevItem.round !== item.round ||
              (prevItem.round === item.round &&
                prevItem.bracket !== item.bracket);
            return (
              <>
                {/* Optionally add a round/bracket separator here */}
                <MatchListItem
                  item={item}
                  players={players}
                  tournamentType="Double Elimination (16)"
                  isMatchLocked={(match) =>
                    match.winner !== null || !match.player1 || !match.player2
                  }
                  onGameResult={handleIncrementScore}
                />
              </>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
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

        <ConfirmActionModal
          visible={showAdvanceModal}
          title="Advance to Next Round"
          message="Are you sure you want to advance to the next round?"
          onConfirm={executeAdvanceRound}
          onCancel={() => setShowAdvanceModal(false)}
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
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  matchCard: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  matchPlayers: {
    fontSize: 15,
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  matchWinner: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 24,
  },
  advanceButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  advanceButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  advanceButtonText: {
    color: COLORS.textWhite,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default DoubleElim16Screen;
