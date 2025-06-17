import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
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
  generateDELosersBracketNextRoundMatches,
  createMatch,
  shuffleArray,
  createDEInitialMatches,
  generateGrandFinalsMatch,
  generateGrandFinalsReset,
  getPlayerDisplayName,
} from "../utils/tournament/tournamentUtils";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import ScreenHeader from "../components/common/ScreenHeader";
import IncompleteMatchesModal from "../components/tournament/IncompleteMatchesModal";
import TournamentSummaryModal from "../components/tournament/TournamentSummaryModal";
import { findNextMatch } from "../utils/tournament/matchUtils";
import { TournamentProvider } from "../contexts/tournament/TournamentContext";
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
  const [activeBracketForDisplay, setActiveBracketForDisplay] = useState<
    BracketType | "all"
  >("all");
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentLosersRound, setCurrentLosersRound] = useState(1);
  const [currentWinnersRound, setCurrentWinnersRound] = useState(1);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [runnerUp, setRunnerUp] = useState<Player | null>(null);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);
  const [tournamentWinner, setTournamentWinner] = useState<Player | null>(null);

  useEffect(() => {
    console.log("Resetting tournament state...");
    setHasInitialized(false);
    setPlayers([]);
    setMatches([]);
    setCurrentRound(1);
    setCurrentLosersRound(1);
    setCurrentWinnersRound(1);
  }, [numPlayers, tournamentType]);

  useEffect(() => {
    if (
      receivedPlayerNames &&
      receivedPlayerNames.length === numPlayers &&
      numPlayers > 0 &&
      receivedMatchFormat
    ) {
      const initialPlayers = receivedPlayerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name: `${name} L0`,
        losses: 0,
        seed: i + 1,
        isEliminated: false,
      }));

      const shuffledPlayers = shuffleArray(initialPlayers);
      let initialMatches: Match[] = [];

      if (tournamentType.startsWith("Double Elimination")) {
        initialMatches = createDEInitialMatches(
          shuffledPlayers,
          receivedMatchFormat
        );
      } else {
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
      if (match.winner) return true;
      if (!match.player1 || !match.player2) return true;

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

  const getUpdatedPlayersWithLossIndicators = (players: Player[]): Player[] => {
    return players.map((player) => ({
      ...player,
      name: `${player.name.replace(/ L[0-9]$/, "")} L${player.losses}`,
    }));
  };

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      console.log(`=== DEBUG: handleSetWinner called ===`);
      console.log(`Match ID: ${matchId}`);
      console.log(`Winner: ${newWinningPlayer.name}`);

      setMatches((prevMatches) => {
        const updatedMatches = [...prevMatches];
        const currentTargetMatch = updatedMatches.find((m) => m.id === matchId);

        if (!currentTargetMatch) return prevMatches;

        // ✅ FIX: Check if match already has winner to prevent double-processing
        if (currentTargetMatch.winner) {
          console.log(
            `Match ${matchId} already has winner: ${currentTargetMatch.winner.name}`
          );
          return prevMatches;
        }

        const losingPlayer =
          currentTargetMatch.player1?.id === newWinningPlayer.id
            ? currentTargetMatch.player2
            : currentTargetMatch.player1;

        console.log(
          `Winner: ${newWinningPlayer.name}, Loser: ${losingPlayer?.name}`
        );

        const updatedMatch = {
          ...currentTargetMatch,
          winner: newWinningPlayer,
        };
        const updatedMatchesWithWinner = updatedMatches.map((match) =>
          match.id === matchId ? updatedMatch : match
        );

        // ✅ FIX: Update player losses properly
        setPlayers((prevPlayers) => {
          return prevPlayers.map((player) => {
            if (losingPlayer && player.id === losingPlayer.id) {
              const newLossCount = player.losses + 1;
              const baseName = player.name.replace(/ L[0-2]$/, "");
              const isNowEliminated = newLossCount >= 2;

              console.log(
                `${player.name} loses! New loss count: ${newLossCount}, Eliminated: ${isNowEliminated}`
              );

              return {
                ...player,
                losses: newLossCount,
                isEliminated: isNowEliminated,
                name: `${baseName} L${newLossCount}`,
              };
            }

            const baseName = player.name.replace(/ L[0-2]$/, "");
            return {
              ...player,
              name: `${baseName} L${player.losses}`,
            };
          });
        });

        if (currentTargetMatch.bracket === "grandFinals") {
          console.log(`=== GRAND FINALS LOGIC TRIGGERED ===`);

          if (currentTargetMatch.isGrandFinalsReset) {
            // Grand Finals Reset completed - Tournament over
            console.log(`=== GRAND FINALS RESET COMPLETION ===`);
            const loser =
              currentTargetMatch.player1?.id === newWinningPlayer.id
                ? currentTargetMatch.player2
                : currentTargetMatch.player1;

            setOverallWinner(newWinningPlayer);
            setRunnerUp(loser);
            setFinalMatch(updatedMatch);
            setTournamentOver(true);
            setShowSummaryModal(true);

            Alert.alert(
              "Tournament Complete! 🏆",
              `${newWinningPlayer.name} is the Champion!`,
              [{ text: "OK" }]
            );

            return updatedMatchesWithWinner;
          } else {
            // First Grand Finals match
            console.log(`=== FIRST GRAND FINALS LOGIC ===`);
            const wbPlayer = currentTargetMatch.player1; // WB Champion
            const lbPlayer = currentTargetMatch.player2; // LB Champion

            if (wbPlayer && newWinningPlayer.id === wbPlayer.id) {
              // WB Champion wins - Tournament over
              console.log(
                `Tournament Winner: ${newWinningPlayer.name} (WB Champion won GF1)`
              );

              setOverallWinner(newWinningPlayer);
              setRunnerUp(lbPlayer);
              setFinalMatch(updatedMatch);
              setTournamentOver(true);
              setShowSummaryModal(true);

              Alert.alert(
                "Tournament Complete! 🏆",
                `${newWinningPlayer.name} is the Champion!`,
                [{ text: "OK" }]
              );

              return updatedMatchesWithWinner;
            } else if (lbPlayer && newWinningPlayer.id === lbPlayer.id) {
              // LB Champion wins - CREATE RESET MATCH
              console.log(
                `Grand Finals Reset needed: ${newWinningPlayer.name} forces reset!`
              );

              const resetMatch = createMatch(
                `match-gf-reset-${Date.now()}`,
                currentTargetMatch.round,
                2,
                wbPlayer!, // WB Champion
                lbPlayer, // LB Champion
                "grandFinals",
                true, // ✅ This marks it as reset match
                receivedMatchFormat
              );

              console.log(
                `✅ Grand Finals Reset created: ${wbPlayer!.name} vs ${
                  lbPlayer.name
                }`
              );

              // Add the reset match to the matches
              return [...updatedMatchesWithWinner, resetMatch];
            }
          }
        }

        console.log(`=== REGULAR MATCH LOGIC ===`);
        return updatedMatches.map((match) =>
          match.id === matchId ? { ...match, winner: newWinningPlayer } : match
        );
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

          // ✅ FIX: Prevent double-processing
          if (match.winner) {
            console.log(
              `Match ${matchId} already has winner: ${match.winner.name}`
            );
            return match;
          }

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
            `Match ${matchId}: ${winner.name} now has ${playerScore}/${match.format.gamesNeededToWin} games`
          );

          if (playerScore === match.format.gamesNeededToWin) {
            const losingPlayer =
              match.player1?.id === winner.id ? match.player2 : match.player1;

            if (losingPlayer) {
              console.log(
                `${losingPlayer.name} loses via Race to ${match.format.gamesNeededToWin}! Incrementing losses...`
              );

              // ✅ FIX: Update player losses immediately
              setPlayers((prevPlayers) => {
                return prevPlayers.map((player) => {
                  if (player.id === losingPlayer.id) {
                    const newLossCount = player.losses + 1;
                    const baseName = player.name.replace(/ L[0-2]$/, "");
                    const isNowEliminated = newLossCount >= 2;

                    console.log(
                      `${player.name} loses! New loss count: ${newLossCount}, Eliminated: ${isNowEliminated}`
                    );

                    return {
                      ...player,
                      losses: newLossCount,
                      isEliminated: isNowEliminated,
                      name: `${baseName} L${newLossCount}`,
                    };
                  }

                  const baseName = player.name.replace(/ L[0-2]$/, "");
                  return {
                    ...player,
                    name: `${baseName} L${player.losses}`,
                  };
                });
              });
            }

            const updatedMatch = {
              ...match,
              games: updatedGames,
              winner,
            };

            if (match.bracket === "grandFinals") {
              console.log(`=== GRAND FINALS MATCH WON ===`);
              console.log(`Winner: ${winner.name}, Match ID: ${match.id}`);
              console.log(`Is Grand Finals Reset: ${match.isGrandFinalsReset}`);

              if (match.isGrandFinalsReset) {
                console.log(`=== GRAND FINALS RESET COMPLETED ===`);
                console.log(`Tournament Winner: ${winner.name}`);

                const runnerUp =
                  match.player1?.id === winner.id
                    ? match.player2
                    : match.player1;

                setOverallWinner(winner);
                setRunnerUp(runnerUp);
                setFinalMatch(updatedMatch);
                setTournamentOver(true);
                setShowSummaryModal(true);

                Alert.alert(
                  "Tournament Complete! 🏆",
                  `${winner.name} is the Champion!`,
                  [{ text: "OK" }]
                );

                return updatedMatch;
              } else {
                const wbPlayer = match.player1;
                const lbPlayer = match.player2;

                if (wbPlayer && winner.id === wbPlayer.id) {
                  console.log(
                    `Tournament Winner: ${winner.name} (WB Champion won GF1)`
                  );

                  setOverallWinner(winner);
                  setRunnerUp(lbPlayer);
                  setFinalMatch(updatedMatch);
                  setTournamentOver(true);
                  setShowSummaryModal(true);

                  Alert.alert(
                    "Tournament Complete! 🏆",
                    `${winner.name} is the Champion!`,
                    [{ text: "OK" }]
                  );

                  return updatedMatch;
                } else if (lbPlayer && winner.id === lbPlayer.id) {
                  console.log(
                    `Grand Finals Reset needed: ${winner.name} forces reset!`
                  );

                  return updatedMatch;
                }
              }
            }

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

        // Update player objects in matches after loss tracking
        setTimeout(() => {
          setMatches((prevMatches) => {
            return prevMatches.map((match) => {
              const updatedPlayer1 = match.player1
                ? players.find((p) => p.id === match.player1?.id) ||
                  match.player1
                : null;
              const updatedPlayer2 = match.player2
                ? players.find((p) => p.id === match.player2?.id) ||
                  match.player2
                : null;

              return {
                ...match,
                player1: updatedPlayer1,
                player2: updatedPlayer2,
              };
            });
          });
        }, 100);

        return updatedMatches;
      });

      setTimeout(() => {
        setMatches((prevMatches) => {
          return prevMatches.map((match) => {
            const updatedPlayer1 = match.player1
              ? players.find((p) => p.id === match.player1?.id) || match.player1
              : null;
            const updatedPlayer2 = match.player2
              ? players.find((p) => p.id === match.player2?.id) || match.player2
              : null;

            return {
              ...match,
              player1: updatedPlayer1,
              player2: updatedPlayer2,
            };
          });
        });
      }, 100);
    },
    [handleAdvanceWinner, tournamentType, numPlayers, players]
  );

  const matchesForDisplay = (): Match[] => {
    if (matches.length === 0) {
      return [];
    }

    return matches
      .filter((match) => {
        return match.player1 !== null;
      })
      .sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round;
        }

        const bracketPriority = {
          winners: 1,
          losers: 2,
          grandFinals: 3,
        };

        if (a.bracket !== b.bracket) {
          return bracketPriority[a.bracket] - bracketPriority[b.bracket];
        }

        return a.matchNumber - b.matchNumber;
      });
  };

  const displayTitle = (): string => {
    if (tournamentOver && overallWinner) {
      return "Tournament Complete!";
    }

    if (matches.some((m) => m.bracket === "grandFinals")) {
      return "Grand Finals";
    }

    if (tournamentType.startsWith("Single Knockout")) {
      return `Single Elimination - Round ${currentRound}`;
    }

    if (tournamentType.startsWith("Double Elimination")) {
      const hasActiveWB = matches.some(
        (m) =>
          m.bracket === "winners" &&
          m.round === currentRound &&
          !m.winner &&
          m.player1 &&
          m.player2
      );
      const hasActiveLB = matches.some(
        (m) =>
          m.bracket === "losers" &&
          m.round === currentLosersRound &&
          !m.winner &&
          m.player1 &&
          m.player2
      );

      if (hasActiveWB && hasActiveLB) {
        return `Double Elimination - WB R${currentRound} / LB R${currentLosersRound}`;
      } else if (hasActiveWB) {
        return `Double Elimination - Winners R${currentRound}`;
      } else if (hasActiveLB) {
        return `Double Elimination - Losers R${currentLosersRound}`;
      }

      return "Double Elimination";
    }

    return "Tournament";
  };

  const executeAdvanceRound = useCallback(() => {
    setIsAdvanceModalVisible(false);

    console.log(`=== ADVANCING FROM ROUND ${currentRound} ===`);
    console.log(
      `Current Winners Round: ${currentRound}, Current Losers Round: ${currentLosersRound}`
    );

    setMatches((prevMatches) => {
      const currentWinnersMatches = prevMatches.filter(
        (m) => m.bracket === "winners" && m.round === currentRound
      );

      // ✅ FIX: Get ACTUAL current losers matches based on context
      let currentLosersMatches: Match[] = [];

      if (currentRound === 1) {
        // No losers matches exist yet in Round 1
        currentLosersMatches = [];
      } else if (currentRound === 2) {
        // LB R1 should be completed
        currentLosersMatches = prevMatches.filter(
          (m) => m.bracket === "losers" && m.round === 1
        );
      } else if (currentRound === 3) {
        // LB R2 should be completed
        currentLosersMatches = prevMatches.filter(
          (m) => m.bracket === "losers" && m.round === 2
        );
      } else if (currentRound === 4) {
        // LB R3 should be completed
        currentLosersMatches = prevMatches.filter(
          (m) => m.bracket === "losers" && m.round === 3
        );
      } else {
        // Fallback
        currentLosersMatches = prevMatches.filter(
          (m) => m.bracket === "losers" && m.round === currentLosersRound
        );
      }

      console.log(
        `Current Winners Matches (R${currentRound}):`,
        currentWinnersMatches.length
      );
      console.log(`Current Losers Matches:`, currentLosersMatches.length);

      // ✅ FIX: Better incomplete match checking
      const incompleteWinnersMatches = currentWinnersMatches.filter(
        (m) => m.player1 && m.player2 && !m.winner
      );
      const incompleteLosersMatches = currentLosersMatches.filter(
        (m) => m.player1 && m.player2 && !m.winner
      );

      if (
        incompleteWinnersMatches.length > 0 ||
        incompleteLosersMatches.length > 0
      ) {
        console.log(`❌ Cannot advance - Incomplete matches:`, {
          winners: incompleteWinnersMatches.length,
          losers: incompleteLosersMatches.length,
        });
        setShowIncompleteModal(true);
        return prevMatches;
      }

      let newMatches: Match[] = [];

      // ✅ FIX: Strict elimination check
      const isPlayerEliminated = (player: Player): boolean => {
        if (!player) return true;
        return player.losses >= 2;
      };

      if (players.length === 8) {
        if (currentRound === 1) {
          console.log(`=== 8-PLAYER ROUND 1→2 ADVANCEMENT ===`);

          // Create WB R2
          const wbR1Winners = currentWinnersMatches
            .filter((m) => m.winner && m.player1 && m.player2)
            .map((m) => m.winner!)
            .filter((p) => !isPlayerEliminated(p));

          const winnersNextRound: Match[] = [];
          for (let i = 0; i < Math.floor(wbR1Winners.length / 2); i++) {
            winnersNextRound.push(
              createMatch(
                `match-wb2-${i + 1}`,
                2,
                i + 1,
                wbR1Winners[i * 2],
                wbR1Winners[i * 2 + 1],
                "winners",
                false,
                receivedMatchFormat
              )
            );
          }

          // Create LB R1
          const losersFromWBR1 = currentWinnersMatches
            .filter((m) => m.winner && m.player1 && m.player2)
            .map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            )
            .filter((p) => !isPlayerEliminated(p));

          const losersNextRound: Match[] = [];
          for (let i = 0; i < Math.floor(losersFromWBR1.length / 2); i++) {
            losersNextRound.push(
              createMatch(
                `match-lb1-${i + 1}`,
                1,
                i + 1,
                losersFromWBR1[i * 2],
                losersFromWBR1[i * 2 + 1],
                "losers",
                false,
                receivedMatchFormat
              )
            );
          }

          console.log(
            `✅ Created WB R2: ${winnersNextRound.length}, LB R1: ${losersNextRound.length}`
          );
          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 2) {
          console.log(`=== 8-PLAYER ROUND 2→3 ADVANCEMENT ===`);

          // Create WB R3
          const wbR2Winners = currentWinnersMatches
            .filter((m) => m.winner && m.player1 && m.player2)
            .map((m) => m.winner!)
            .filter((p) => !isPlayerEliminated(p));

          const winnersNextRound: Match[] = [];
          if (wbR2Winners.length === 2) {
            winnersNextRound.push(
              createMatch(
                "match-wb3-1",
                3,
                1,
                wbR2Winners[0],
                wbR2Winners[1],
                "winners",
                false,
                receivedMatchFormat
              )
            );
          }

          // Get WB R2 losers and LB R1 winners for LB R2
          const wbR2Losers = currentWinnersMatches
            .filter((m) => m.winner)
            .map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            )
            .filter((p) => !isPlayerEliminated(p));

          const lbR1Winners = prevMatches
            .filter((m) => m.bracket === "losers" && m.round === 1 && m.winner)
            .map((m) => m.winner!)
            .filter((p) => !isPlayerEliminated(p));

          // Create LB R2
          const losersNextRound: Match[] = [];
          for (
            let i = 0;
            i < Math.min(lbR1Winners.length, wbR2Losers.length);
            i++
          ) {
            losersNextRound.push(
              createMatch(
                `match-lb2-${i + 1}`,
                2,
                i + 1,
                lbR1Winners[i],
                wbR2Losers[i],
                "losers",
                false,
                receivedMatchFormat
              )
            );
          }

          console.log(
            `✅ Created WB R3: ${winnersNextRound.length}, LB R2: ${losersNextRound.length}`
          );
          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 3) {
          console.log(`=== 8-PLAYER ROUND 3→4 ADVANCEMENT ===`);

          // WB R3 is complete - WB Champion determined, no more WB matches
          const winnersNextRound: Match[] = [];

          // Get LB R2 winners for LB R3
          const lbR2Winners = prevMatches
            .filter((m) => m.bracket === "losers" && m.round === 2 && m.winner)
            .map((m) => m.winner!)
            .filter((p) => !isPlayerEliminated(p));

          // Create LB R3: LB R2 winners fight each other
          const losersNextRound: Match[] = [];
          if (lbR2Winners.length === 2) {
            losersNextRound.push(
              createMatch(
                "match-lb3-1",
                3,
                1,
                lbR2Winners[0],
                lbR2Winners[1],
                "losers",
                false,
                receivedMatchFormat
              )
            );
            console.log(
              `✅ LB R3 Created: ${lbR2Winners[0].name} vs ${lbR2Winners[1].name}`
            );
          }

          console.log(`✅ Created LB R3: ${losersNextRound.length}`);
          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 4) {
          console.log(`=== 8-PLAYER ROUND 4→5 ADVANCEMENT ===`);

          // No more WB matches
          const winnersNextRound: Match[] = [];

          // Get WB R3 loser and LB R3 winner for LB R4
          const wbR3Losers = prevMatches
            .filter((m) => m.bracket === "winners" && m.round === 3 && m.winner)
            .map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            )
            .filter((p) => !isPlayerEliminated(p));

          const lbR3Winners = prevMatches
            .filter((m) => m.bracket === "losers" && m.round === 3 && m.winner)
            .map((m) => m.winner!)
            .filter((p) => !isPlayerEliminated(p));

          // Create LB R4: LB R3 winner vs WB R3 loser
          const losersNextRound: Match[] = [];
          if (lbR3Winners.length === 1 && wbR3Losers.length === 1) {
            losersNextRound.push(
              createMatch(
                "match-lb4-1",
                4,
                1,
                lbR3Winners[0],
                wbR3Losers[0],
                "losers",
                false,
                receivedMatchFormat
              )
            );
            console.log(
              `✅ LB R4 Created: ${lbR3Winners[0].name} vs ${wbR3Losers[0].name}`
            );
          }

          console.log(`✅ Created LB R4: ${losersNextRound.length}`);
          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 5) {
          console.log(`=== 8-PLAYER ROUND 5→GF ADVANCEMENT ===`);

          // ✅ FIX: Check if Grand Finals already exists
          const existingGF = prevMatches.find(
            (m) => m.bracket === "grandFinals"
          );

          if (existingGF) {
            console.log(`Grand Finals already exists - no new matches needed`);
            newMatches = [];
          } else {
            // Create Grand Finals
            const wbChampion = prevMatches
              .filter(
                (m) => m.bracket === "winners" && m.round === 3 && m.winner
              )
              .map((m) => m.winner!)
              .filter((p) => !isPlayerEliminated(p))[0];

            const lbChampion = prevMatches
              .filter(
                (m) => m.bracket === "losers" && m.round === 4 && m.winner
              )
              .map((m) => m.winner!)
              .filter((p) => !isPlayerEliminated(p))[0];

            if (wbChampion && lbChampion) {
              newMatches = [
                createMatch(
                  "match-gf-1",
                  6,
                  1,
                  wbChampion, // WB Champion gets bracket advantage
                  lbChampion, // LB Champion
                  "grandFinals",
                  false, // ✅ First GF match is NOT a reset
                  receivedMatchFormat
                ),
              ];
              console.log(
                `✅ Grand Finals Created: ${wbChampion.name} vs ${lbChampion.name}`
              );
            }
          }
        }
      }

      // Handle Grand Finals completion and reset logic
      if (newMatches.length === 0) {
        console.log(`=== NO NEW MATCHES - CHECKING TOURNAMENT COMPLETION ===`);

        // Check for completed Grand Finals that needs reset
        const completedGrandFinals = prevMatches.find(
          (m) =>
            m.bracket === "grandFinals" && m.winner && !m.isGrandFinalsReset
        );

        if (completedGrandFinals) {
          const wbPlayer = completedGrandFinals.player1; // WB Champion
          const lbPlayer = completedGrandFinals.player2; // LB Champion
          const winner = completedGrandFinals.winner;

          // If LB Champion won, create reset match
          if (lbPlayer && winner && winner.id === lbPlayer.id) {
            const existingReset = prevMatches.find(
              (m) => m.bracket === "grandFinals" && m.isGrandFinalsReset
            );

            if (!existingReset) {
              console.log(`✅ Creating Grand Finals Reset automatically`);
              const resetMatch = createMatch(
                `match-gf-reset-${Date.now()}`,
                completedGrandFinals.round,
                2,
                wbPlayer!, // WB Champion
                lbPlayer, // LB Champion
                "grandFinals",
                true, // Reset match
                receivedMatchFormat
              );
              newMatches = [resetMatch];
            }
          }
        }
      }

      // Update round counters
      if (newMatches.length > 0) {
        setCurrentRound((prev) => prev + 1);
        console.log(`✅ Advanced to Round ${currentRound + 1}`);
      }

      return [...prevMatches, ...newMatches];
    });
  }, [
    currentRound,
    currentLosersRound,
    players.length,
    receivedMatchFormat,
    navigation,
  ]);

  // Update player objects in matches when players change
  useEffect(() => {
    setMatches((prevMatches) => {
      return prevMatches.map((match) => {
        const updatedPlayer1 = match.player1
          ? players.find((p) => p.id === match.player1?.id) || match.player1
          : null;
        const updatedPlayer2 = match.player2
          ? players.find((p) => p.id === match.player2?.id) || match.player2
          : null;

        if (
          (updatedPlayer1 && updatedPlayer1.name !== match.player1?.name) ||
          (updatedPlayer2 && updatedPlayer2.name !== match.player2?.name)
        ) {
          return {
            ...match,
            player1: updatedPlayer1,
            player2: updatedPlayer2,
          };
        }

        return match;
      });
    });
  }, [players]);

  return (
    <TournamentProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScreenHeader
            title={displayTitle()}
            subtitle={`${numPlayers} Players`}
          />

          <View style={styles.formatBanner}>
            <Text style={styles.formatText}>
              Race to {receivedMatchFormat.gamesNeededToWin}
            </Text>
          </View>

          <FlatList
            data={matchesForDisplay()}
            renderItem={({ item, index }) => {
              const prevItem =
                index > 0 ? matchesForDisplay()[index - 1] : null;

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
            showsVerticalScrollIndicator={true}
          />

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
