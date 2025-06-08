import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  Player,
  Match,
  BracketType,
  TournamentType,
  MatchFormat,
  Game,
} from "../types";
import { COLORS } from "../constants/colors";
import MatchListItem from "../components/matches/MatchListItem";
import {
  generatePlayers as generateDefaultPlayers,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches,
  createMatch,
  shuffleArray,
} from "../utils/tournament/tournamentUtils";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import ScreenHeader from "../components/common/ScreenHeader";
import IncompleteMatchesModal from "../components/tournament/IncompleteMatchesModal";
import TournamentSummaryModal from "../components/tournament/TournamentSummaryModal";
import { findNextMatch } from "../utils/tournament/matchUtils";
import { TournamentProvider } from "../contexts/tournament/TournamentContext";
import { TournamentBrackets } from "../components/brackets/TournamentBrackets";
import { TournamentScreenProps } from "../types/navigation.types";
import { RoundSeparator } from "../components/tournament/RoundSeparator";

export const TournamentScreen: React.FC<TournamentScreenProps> = ({
  route,
  navigation,
}) => {
  const {
    tournamentType,
    numPlayers,
    playerNames: receivedPlayerNames,
    matchFormat: receivedMatchFormat,
  } = route.params;

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentOver, setTournamentOver] = useState(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [wbRound1Losers, setWbRound1Losers] = useState<Player[]>([]);
  const [activeBracketForDisplay, setActiveBracketForDisplay] = useState<
    BracketType | "all"
  >("all");
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [currentRound, setCurrentRound] = useState(1); // <-- Add this state
  const [currentLosersRound, setCurrentLosersRound] = useState(1);
  const [currentWinnersRound, setCurrentWinnersRound] = useState(1);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [runnerUp, setRunnerUp] = useState<Player | null>(null);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);

  // Add new state for tracking tournament progress
  const [hasNextRound, setHasNextRound] = useState(true);
  const [isTournamentComplete, setIsTournamentComplete] = useState(false);

  const defaultMatchFormats = {
    bo5: { bestOf: 5, gamesNeededToWin: 3 },
    bo7: { bestOf: 7, gamesNeededToWin: 4 },
    bo9: { bestOf: 9, gamesNeededToWin: 5 },
    bo11: { bestOf: 11, gamesNeededToWin: 6 },
  } as const;

  useEffect(() => {
    console.log("Resetting tournament state..."); // Add logging
    setHasInitialized(false);
    setPlayers([]);
    setMatches([]);
    setCurrentRound(1);
    setCurrentLosersRound(1);
    setCurrentWinnersRound(1);
  }, [numPlayers, tournamentType]); // Remove receivedPlayerNames from dependencies

  // First, add console.log statements to track initialization
  useEffect(() => {
    if (
      receivedPlayerNames &&
      receivedPlayerNames.length === numPlayers &&
      numPlayers > 0 &&
      receivedMatchFormat
    ) {
      // Initialize players with IDs, seeds, and isEliminated property
      const initialPlayers = receivedPlayerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name,
        losses: 0,
        seed: i + 1,
        isEliminated: false, // Add this required property
      }));

      // Shuffle players for random matchups
      const shuffledPlayers = shuffleArray(initialPlayers);

      // Create initial matches using our existing createMatch utility
      let initialMatches: Match[] = [];
      for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
        const match = createMatch(
          `match-r1-${i + 1}`,
          1,
          i + 1,
          shuffledPlayers[i * 2],
          shuffledPlayers[i * 2 + 1],
          "winners",
          false,
          receivedMatchFormat
        );
        initialMatches.push(match);
      }

      setPlayers(shuffledPlayers);
      setMatches(initialMatches);
      setHasInitialized(true);
    }
  }, [receivedPlayerNames, numPlayers, tournamentType, receivedMatchFormat]);

  const isMatchLocked = useCallback(
    (match: Match): boolean => {
      // Lock if match has a winner
      if (match.winner) return true;

      // Lock if match players aren't set
      if (!match.player1 || !match.player2) return true;

      // Lock if previous round matches aren't complete
      const previousRoundMatches = matches.filter(
        (m) => m.round === match.round - 1 && m.bracket === match.bracket
      );

      if (previousRoundMatches.length > 0) {
        return previousRoundMatches.some((m) => !m.winner);
      }

      return false;
    },
    [matches]
  );

  const getLosersOfRound = useCallback(
    (roundNumber: number, bracketType: BracketType): Player[] => {
      return matches
        .filter(
          (match) =>
            match.round === roundNumber &&
            match.bracket === bracketType &&
            match.winner !== null
        )
        .reduce((acc: Player[], match) => {
          if (match.player1 && match.player1.id !== match.winner?.id) {
            acc.push(match.player1);
          }
          if (match.player2 && match.player2.id !== match.winner?.id) {
            acc.push(match.player2);
          }
          return acc;
        }, []);
    },
    [matches]
  );

  const handleAdvanceWinner = useCallback(
    (match: Match) => {
      if (!match.winner) return;

      setMatches((prevMatches) => {
        const nextMatch = findNextMatch(matches, currentRound, "winners");
        if (!nextMatch) return prevMatches;

        return prevMatches.map((m) => {
          if (m.id === nextMatch.id) {
            // Place winner in next available slot
            if (!m.player1) {
              return { ...m, player1: match.winner };
            } else {
              return { ...m, player2: match.winner };
            }
          }
          return m;
        });
      });
    },
    [matches, currentRound]
  );

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      setMatches((prevMatches) => {
        const updatedMatches = [...prevMatches];
        const currentTargetMatch = updatedMatches.find((m) => m.id === matchId);
        if (!currentTargetMatch) return prevMatches;

        // Update players' loss count
        const updatedPlayers = players.map((player) => {
          if (
            currentTargetMatch.player1?.id === player.id &&
            player.id !== newWinningPlayer.id
          ) {
            return {
              ...player,
              losses: player.losses + 1,
              isEliminated: player.losses + 1 >= 2,
            };
          }
          if (
            currentTargetMatch.player2?.id === player.id &&
            player.id !== newWinningPlayer.id
          ) {
            return {
              ...player,
              losses: player.losses + 1,
              isEliminated: player.losses + 1 >= 2,
            };
          }
          return player;
        });
        setPlayers(updatedPlayers);

        if (currentTargetMatch.bracket === "grandFinals") {
          const lbPlayerInGF = currentTargetMatch.player2;
          const wbPlayerInGF = currentTargetMatch.player1;

          if (!currentTargetMatch.isGrandFinalsReset) {
            if (wbPlayerInGF && newWinningPlayer.id === wbPlayerInGF.id) {
              // WB Champion wins - tournament over
              setOverallWinner(newWinningPlayer);
              setRunnerUp(lbPlayerInGF);
              setFinalMatch(currentTargetMatch);
              setTournamentOver(true);
              setShowSummaryModal(true);
              return updatedMatches;
            } else if (
              lbPlayerInGF &&
              newWinningPlayer.id === lbPlayerInGF.id
            ) {
              // Create reset match with same format
              const gfResetMatch = createMatch(
                `match-gf-reset-1`,
                currentTargetMatch.round,
                currentTargetMatch.matchNumber + 1,
                wbPlayerInGF,
                lbPlayerInGF,
                "grandFinals",
                true,
                receivedMatchFormat
              );
              return [...updatedMatches, gfResetMatch];
            }
          } else {
            // Reset match winner is tournament winner
            setOverallWinner(newWinningPlayer);
            setRunnerUp(
              newWinningPlayer.id === wbPlayerInGF?.id
                ? lbPlayerInGF
                : wbPlayerInGF
            );
            setFinalMatch(currentTargetMatch);
            setTournamentOver(true);
            setShowSummaryModal(true);
            return updatedMatches;
          }
        }

        return updatedMatches;
      });
    },
    [matches, players, receivedMatchFormat]
  );

  const advanceWinner = useCallback((match: Match) => {
    if (!match.winner) return;

    setMatches((prevMatches) => {
      const nextMatch = findNextMatch(matches, currentRound, "winners");
      if (!nextMatch) return prevMatches;

      return prevMatches.map((m) => {
        if (m.id === nextMatch.id) {
          // Place winner in next available slot
          if (!m.player1) {
            return { ...m, player1: match.winner };
          } else {
            return { ...m, player2: match.winner };
          }
        }
        return m;
      });
    });
  }, []);

  const handleIncrementScore = useCallback(
    (matchId: string, winner: Player, score1: number, score2: number) => {
      setMatches((prevMatches) => {
        const updatedMatches = prevMatches.map((match) => {
          if (match.id !== matchId) return match;

          // If match already has a winner, don't update
          if (match.winner) return match;

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

          if (playerScore === match.format.gamesNeededToWin) {
            const updatedMatch = {
              ...match,
              games: updatedGames,
              winner,
            };

            // Handle Single Elimination finals
            if (!tournamentType.startsWith("Double")) {
              const isFinalMatch =
                match.round === Math.ceil(Math.log2(numPlayers));
              if (isFinalMatch) {
                setOverallWinner(winner);
                setRunnerUp(
                  match.player1?.id === winner.id
                    ? match.player2
                    : match.player1
                );
                setFinalMatch(updatedMatch);
                setTournamentOver(true);
                setShowSummaryModal(true);
              }
            }

            handleAdvanceWinner(updatedMatch);
            return updatedMatch;
          }

          return { ...match, games: updatedGames };
        });

        return updatedMatches;
      });
    },
    [handleAdvanceWinner, tournamentType, numPlayers]
  );

  // Update matchesForDisplay to always return something
  const matchesForDisplay = (): Match[] => {
    if (matches.length === 0) {
      return [];
    }
    return matches;
  };

  const displayTitle = (): string => {
    if (tournamentOver && overallWinner) {
      return "Tournament Completed!";
    }

    if (matches.some((m) => m.bracket === "grandFinals" && !overallWinner)) {
      return "Grand Finals";
    }

    if (tournamentType.startsWith("Single Knockout")) {
      return `Round ${currentRound}`;
    }

    if (tournamentType.startsWith("Double Elimination")) {
      let title = "";
      const wbHasPending = matches.some(
        (m) => m.bracket === "winners" && m.round === currentRound && !m.winner
      );
      const lbHasPending = matches.some(
        (m) => m.bracket === "losers" && m.round === currentRound && !m.winner
      );

      if (wbHasPending || activeBracketForDisplay === "winners") {
        title += `WB R${currentRound}`;
      }
      if (lbHasPending || activeBracketForDisplay === "losers") {
        if (title) {
          title += " / ";
        }
        title += `LB R${currentRound}`;
      }
      return title || "Double Elimination";
    }

    return "Tournament"; // Default return
  };

  const executeAdvanceRound = useCallback(() => {
    setIsAdvanceModalVisible(false);

    setMatches((prevMatches: Match[]): Match[] => {
      if (!tournamentType.startsWith("Double")) {
        // Check incomplete matches
        const incompleteMatches = prevMatches.filter(
          (m) => m.round === currentRound && !m.winner
        );

        if (incompleteMatches.length > 0) {
          setShowIncompleteModal(true);
          return prevMatches;
        }

        // Calculate final round number based on number of players
        const finalRound = Math.ceil(Math.log2(numPlayers));

        // Check if this is the final round
        if (currentRound === finalRound - 1) {
          // For 8 players, only generate one match for Round 3 (finals)
          const winningPlayers = prevMatches
            .filter(m => m.round === currentRound && m.winner)
            .map(m => m.winner!);

          const nextRoundMatchCount = Math.floor(winningPlayers.length / 2);
          const nextRoundMatches: Match[] = [];

          for (let i = 0; i < nextRoundMatchCount; i++) {
            nextRoundMatches.push(
              createMatch(
                `match-r${currentRound + 1}-${i + 1}`,
                currentRound + 1,
                i + 1,
                winningPlayers[i * 2],
                winningPlayers[i * 2 + 1],
                "winners",
                false,
                receivedMatchFormat
              )
            );
          }

          setCurrentRound((prev) => prev + 1);
          return [...prevMatches, ...nextRoundMatches];
        }

        if (currentRound === finalRound) {
          const finalMatch = prevMatches.find(
            (m) => m.round === currentRound && m.winner
          );
          if (finalMatch?.winner) {
            setOverallWinner(finalMatch.winner);
            setRunnerUp(
              finalMatch.player1?.id === finalMatch.winner.id
                ? finalMatch.player2
                : finalMatch.player1
            );
            setFinalMatch(finalMatch);
            setTournamentOver(true);
            setShowSummaryModal(true);
          }
          return prevMatches;
        }

        // For non-final, non-penultimate rounds, generate next round matches
        const winningPlayers = prevMatches
          .filter(m => m.round === currentRound && m.winner)
          .map(m => m.winner!);

        const nextRoundMatchCount = Math.floor(winningPlayers.length / 2);
        const nextRoundMatches: Match[] = [];

        for (let i = 0; i < nextRoundMatchCount; i++) {
          nextRoundMatches.push(
            createMatch(
              `match-r${currentRound + 1}-${i + 1}`,
              currentRound + 1,
              i + 1,
              winningPlayers[i * 2],
              winningPlayers[i * 2 + 1],
              "winners",
              false,
              receivedMatchFormat
            )
          );
        }

        setCurrentRound((prev) => prev + 1);
        return [...prevMatches, ...nextRoundMatches];
      }

      // Double Elimination logic - keep existing code
      if (tournamentType.startsWith("Double Elimination")) {
        // Check incomplete matches
        const currentRoundWinners = prevMatches.filter(
          (m) =>
            m.round === currentRound && m.bracket === "winners" && !m.winner
        );
        const currentRoundLosers = prevMatches.filter(
          (m) => m.round === currentRound && m.bracket === "losers" && !m.winner
        );

        // Filter only unique matches for the winners bracket
        const nextWinnersMatches = generateDEWinnersBracketNextRound(
          prevMatches.filter(
            (m) => m.bracket === "winners" && m.round === currentRound // Only use current round matches
          ),
          currentRound + 1,
          receivedMatchFormat
        );

        // Get losers only from current round
        const losers = getLosersOfRound(currentRound, "winners").filter(
          (player) => player.losses < 2
        );

        let losersMatches: Match[] = [];
        if (currentRound === 1) {
          // First round losers handling stays the same
          losersMatches = generateDELosersBracketRound1Matches(
            losers,
            prevMatches.length,
            receivedMatchFormat
          );
        } else {
          // For subsequent rounds, only use active losers from current round
          const activeLosersPlayers = players.filter(
            (p) => p.losses === 1 && !p.isEliminated
          );
          losersMatches = generateDELosersBracketNextRoundMatches(
            prevMatches.filter(
              (m) => m.bracket === "losers" && m.round === currentRound // Only use current round matches
            ),
            activeLosersPlayers,
            currentRound,
            receivedMatchFormat
          );
        }

        setCurrentRound((prev) => prev + 1);
        return [...prevMatches, ...nextWinnersMatches, ...losersMatches];
      }

      return prevMatches; // Ensure we always return Match[]
    });
  }, [
    currentRound,
    tournamentType,
    numPlayers,
    receivedMatchFormat,
    getLosersOfRound,
    players,
  ]);

  // Add return statement for the component
  return (
    <TournamentProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScreenHeader
            title={displayTitle()}
            subtitle={`${numPlayers} Players`}
          />

          {/* Format Banner */}
          <View style={styles.formatBanner}>
            <Text style={styles.formatText}>
              Race to {receivedMatchFormat.gamesNeededToWin}
            </Text>
          </View>

          {/* Matches List */}
          <FlatList
            data={matchesForDisplay()}
            renderItem={({ item, index }) => {
              const prevItem =
                index > 0 ? matchesForDisplay()[index - 1] : null;
              const showSeparator =
                !prevItem ||
                prevItem.round !== item.round ||
                prevItem.bracket !== item.bracket;

              return (
                <>
                  {showSeparator && (
                    <RoundSeparator round={item.round} bracket={item.bracket} />
                  )}
                  <MatchListItem
                    item={item}
                    players={players}
                    tournamentType={tournamentType}
                    isMatchLocked={isMatchLocked}
                    onSetWinner={handleSetWinner}
                    onGameResult={handleIncrementScore}
                  />
                </>
              );
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />

          {/* Advance Round Button */}
          {!tournamentOver && (
            <TouchableOpacity
              style={styles.advanceButton}
              onPress={() => setIsAdvanceModalVisible(true)}
            >
              <Text style={styles.advanceButtonText}>
                Advance to Next Round
              </Text>
            </TouchableOpacity>
          )}

          {/* Modals */}
          <ConfirmActionModal
            visible={isAdvanceModalVisible}
            title="Advance to Next Round"
            message="Are you sure you want to advance to the next round?"
            onConfirm={executeAdvanceRound}
            onCancel={() => setIsAdvanceModalVisible(false)}
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
    </TournamentProvider>
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
  roundSeparator: {
    backgroundColor: COLORS.backgroundLight,
    padding: 8,
    marginVertical: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  roundSeparatorText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
  playerWithLosses: {
    color: COLORS.textLight,
  },
});
