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
  } = route.params || {};

  // Add error state and early return
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!route.params) {
      setError("Missing tournament configuration");
      return;
    }

    if (
      !tournamentType ||
      !numPlayers ||
      !receivedPlayerNames ||
      !receivedMatchFormat
    ) {
      setError("Invalid tournament configuration");
      return;
    }
  }, [route.params]);

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        isEliminated: false,
      }));

      const shuffledPlayers = shuffleArray(initialPlayers);
      let initialMatches: Match[] = [];

      if (tournamentType.startsWith("Double Elimination")) {
        if (numPlayers === 6) {
          // Create 4 Round 1 matches (2 actual + 2 byes)
          initialMatches = [
            // First bye match
            createMatch(
              "match-wb1-1",
              1,
              1,
              shuffledPlayers[0], // P1 gets bye
              null,
              "winners",
              false,
              receivedMatchFormat
            ),
            // First actual match
            createMatch(
              "match-wb1-2",
              1,
              2,
              shuffledPlayers[2], // P3
              shuffledPlayers[3], // P4
              "winners",
              false,
              receivedMatchFormat
            ),
            // Second actual match
            createMatch(
              "match-wb1-3",
              1,
              3,
              shuffledPlayers[4], // P5
              shuffledPlayers[5], // P6
              "winners",
              false,
              receivedMatchFormat
            ),
            // Second bye match
            createMatch(
              "match-wb1-4",
              1,
              4,
              shuffledPlayers[1], // P2 gets bye
              null,
              "winners",
              false,
              receivedMatchFormat
            ),
          ];
        } else if (players.length === 8) {
          // Create 4 Round 1 matches for 8 players
          for (let i = 0; i < 4; i++) {
            initialMatches.push(
              createMatch(
                `match-wb1-${i + 1}`,
                1,
                i + 1,
                shuffledPlayers[i * 2],
                shuffledPlayers[i * 2 + 1],
                "winners",
                false,
                receivedMatchFormat
              )
            );
          }
        }
      } else {
        // Keep existing Single Elimination logic
        for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
          initialMatches.push(
            createMatch(
              `match-r1-${i + 1}`,
              1,
              i + 1,
              shuffledPlayers[i * 2],
              shuffledPlayers[i * 2 + 1],
              "winners",
              false,
              receivedMatchFormat
            )
          );
        }
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

  // Update matchesForDisplay to properly filter and return matches
  const matchesForDisplay = (): Match[] => {
    if (matches.length === 0) {
      return [];
    }

    // For Round 1, show all initial matches
    if (currentRound === 1) {
      return matches.filter((m) => m.round === 1);
    }

    // For other rounds
    if (activeBracketForDisplay === "all") {
      return matches.filter(
        (m) =>
          // Show current round winners bracket matches
          (m.bracket === "winners" && m.round === currentRound) ||
          // Show current round losers bracket matches
          (m.bracket === "losers" && m.round === currentLosersRound) ||
          // Show grand finals matches if they exist
          m.bracket === "grandFinals"
      );
    }

    // When specific bracket is selected
    return matches.filter(
      (m) =>
        m.bracket === activeBracketForDisplay &&
        m.round ===
          (activeBracketForDisplay === "winners"
            ? currentRound
            : currentLosersRound)
    );
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

    setMatches((prevMatches) => {
      // Keep existing Single Elimination logic untouched
      if (!tournamentType.startsWith("Double Elimination")) {
        const incompleteMatches = prevMatches.filter(
          (m) => m.round === currentRound && !m.winner
        );

        if (incompleteMatches.length > 0) {
          setShowIncompleteModal(true);
          return prevMatches;
        }

        const winningPlayers = prevMatches
          .filter((m) => m.round === currentRound && m.winner)
          .map((m) => m.winner!);

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

      const currentWinnersMatches = prevMatches.filter(
        (m) => m.bracket === "winners" && m.round === currentRound
      );
      const currentLosersMatches = prevMatches.filter(
        (m) => m.bracket === "losers" && m.round === currentLosersRound
      );

      // Check for incomplete actual matches
      const hasIncompleteMatches = [
        ...currentWinnersMatches.filter((m) => m.player1 && m.player2),
        ...currentLosersMatches,
      ].some((m) => !m.winner);

      if (hasIncompleteMatches) {
        setShowIncompleteModal(true);
        return prevMatches;
      }

      let newMatches: Match[] = [];

      // 6-player Double Elimination
      if (players.length === 6) {
        if (currentRound === 1) {
          // Get winners from the two actual matches
          const actualMatchWinners = currentWinnersMatches
            .filter((m) => m.player1 && m.player2 && m.winner)
            .map((m) => m.winner!);

          // Get bye players (P1 and P2)
          const byePlayers = currentWinnersMatches
            .filter((m) => !m.player2)
            .map((m) => m.player1!);

          // Create Winners Bracket Round 2 (bye players vs winners)
          const winnersNextRound = [
            createMatch(
              "match-wb2-1",
              2,
              1,
              byePlayers[0],
              actualMatchWinners[0],
              "winners",
              false,
              receivedMatchFormat
            ),
            createMatch(
              "match-wb2-2",
              2,
              2,
              actualMatchWinners[1],
              byePlayers[1],
              "winners",
              false,
              receivedMatchFormat
            ),
          ];

          // Get losers from actual matches for Losers Bracket
          const actualMatchLosers = currentWinnersMatches
            .filter((m) => m.player1 && m.player2)
            .map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            );

          // Create first Losers match
          const losersNextRound = [
            createMatch(
              "match-lb1-1",
              1,
              1,
              actualMatchLosers[0],
              actualMatchLosers[1],
              "losers",
              false,
              receivedMatchFormat
            ),
          ];

          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 2) {
          // Get winners from WB Round 2
          const wbR2Winners = currentWinnersMatches
            .filter((m) => m.winner)
            .map((m) => m.winner!);

          // Create WB Finals match
          const winnersNextRound = [
            createMatch(
              "match-wb3-1",
              3,
              1,
              wbR2Winners[0],
              wbR2Winners[1],
              "winners",
              false,
              receivedMatchFormat
            ),
          ];

          // Get losers from WB Round 2 for LB
          const wbR2Losers = currentWinnersMatches.map((m) =>
            m.player1!.id === m.winner!.id ? m.player2! : m.player1!
          );

          // Get winner from LB Round 1
          const lbR1Winner = currentLosersMatches[0]?.winner;

          // Create LB Round 2 matches - THIS IS WHERE WE FIX THE PROGRESSION
          const losersNextRound = [];

          // First LB R2 match: LB R1 winner vs first WB R2 loser
          if (lbR1Winner) {
            losersNextRound.push(
              createMatch(
                "match-lb2-1",
                2,
                1,
                lbR1Winner,
                wbR2Losers[0],
                "losers",
                false,
                receivedMatchFormat
              )
            );
          }

          // Second LB R2 match: Second WB R2 loser waits
          losersNextRound.push(
            createMatch(
              "match-lb2-2",
              2,
              2,
              wbR2Losers[1],
              null, // This player waits for winner of first LB R2 match
              "losers",
              false,
              receivedMatchFormat
            )
          );

          newMatches = [...winnersNextRound, ...losersNextRound];
        } else {
          // Handle subsequent rounds normally
          const winnersNextRound = generateDEWinnersBracketNextRound(
            currentWinnersMatches,
            currentRound + 1,
            receivedMatchFormat
          );

          const losersNextRound = generateDELosersBracketNextRoundMatches(
            currentLosersMatches,
            currentWinnersMatches.map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            ),
            currentLosersRound + 1,
            receivedMatchFormat
          );

          newMatches = [...winnersNextRound, ...losersNextRound];
        }
      } else if (players.length === 8) {
        if (currentRound === 1) {
          const r1Winners = currentWinnersMatches
            .filter((m) => m.winner)
            .map((m) => m.winner!);

          // Create Winners Bracket Round 2
          const winnersNextRound = [
            createMatch(
              "match-wb2-1",
              2,
              1,
              r1Winners[0],
              r1Winners[1],
              "winners",
              false,
              receivedMatchFormat
            ),
            createMatch(
              "match-wb2-2",
              2,
              2,
              r1Winners[2],
              r1Winners[3],
              "winners",
              false,
              receivedMatchFormat
            ),
          ];

          // Get Round 1 losers
          const r1Losers = currentWinnersMatches.map((m) =>
            m.player1!.id === m.winner!.id ? m.player2! : m.player1!
          );

          // Create Losers Bracket Round 1
          const losersNextRound = [
            createMatch(
              "match-lb1-1",
              1,
              1,
              r1Losers[0],
              r1Losers[1],
              "losers",
              false,
              receivedMatchFormat
            ),
            createMatch(
              "match-lb1-2",
              1,
              2,
              r1Losers[2],
              r1Losers[3],
              "losers",
              false,
              receivedMatchFormat
            ),
          ];

          newMatches = [...winnersNextRound, ...losersNextRound];
        } else {
          const winnersNextRound = generateDEWinnersBracketNextRound(
            currentWinnersMatches,
            currentRound + 1,
            receivedMatchFormat
          );

          const losersNextRound = generateDELosersBracketNextRoundMatches(
            currentLosersMatches,
            currentWinnersMatches.map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            ),
            currentLosersRound + 1,
            receivedMatchFormat
          );

          newMatches = [...winnersNextRound, ...losersNextRound];
        }
      }

      // Check for Grand Finals
      if (newMatches.length === 0) {
        const wbChampion = prevMatches.find(
          (m) => m.bracket === "winners" && m.round === currentRound && m.winner
        )?.winner;
        const lbChampion = prevMatches.find(
          (m) =>
            m.bracket === "losers" && m.round === currentLosersRound && m.winner
        )?.winner;

        if (wbChampion && lbChampion) {
          newMatches = [
            createMatch(
              "match-gf-1",
              currentRound + 1,
              1,
              wbChampion,
              lbChampion,
              "grandFinals",
              false,
              receivedMatchFormat
            ),
          ];
        }
      }

      setCurrentRound((prev) => prev + 1);
      setCurrentLosersRound((prev) => prev + 1);
      return [...prevMatches, ...newMatches];
    });
  }, [
    tournamentType,
    currentRound,
    currentLosersRound,
    players.length,
    receivedMatchFormat,
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
  errorText: {
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 20,
  },
});
