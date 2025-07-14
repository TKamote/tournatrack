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
import { Player, Match } from "../../types";
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

export const DoubleElim4Screen: React.FC<DoubleElim4ScreenProps> = ({
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
      playerNames.length === 4 &&
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
                  // Alert.alert(
                  //   "Tournament Complete! 🏆",
                  //   `${cleanWinner.name} is the Champion!`,
                  //   [{ text: "OK" }]
                  // );
                }, 100);
              } else if (winner.id === lbPlayer?.id) {
                if (wbPlayer)
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0);
                if (!match.isGrandFinalsReset) {
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
                    // Alert.alert(
                    //   "Tournament Complete! 🏆",
                    //   `${cleanWinner.name} is the Champion!`,
                    //   [{ text: "OK" }]
                    // );
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
      // Round 3 → Grand Finals: WB final winner + LB final winner
      // Find the WB winner from round 2 (the undefeated player)
      const wbWinner = players.find((p) => p.losses === 0);
      const lbWinners = lbMatches.map((m) => m.winner!);

      if (wbWinner && lbWinners.length === 1) {
        nextRoundMatches.push(
          createMatch(
            `de4-gf-1`,
            nextRound,
            1,
            wbWinner,
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
    }
  }, [matches, currentRound, matchFormat]);

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
    return `Double Elimination (4) - Round ${currentRound}`;
  }, [tournamentOver, overallWinner, matches, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    return match.winner !== null || !match.player1 || !match.player2;
  }, []);

  // Update canAdvanceRound to only check for matches that actually exist in the current round
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
