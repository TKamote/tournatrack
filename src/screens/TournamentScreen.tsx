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
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches,
  createMatch,
  shuffleArray,
  createDEInitialMatches,
  generateGrandFinalsMatch,
  generateGrandFinalsReset,
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
  const [tournamentWinner, setTournamentWinner] = useState<Player | null>(null); // Add this state

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
      // Initialize players
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
        // Use the centralized logic from tournamentUtils
        initialMatches = createDEInitialMatches(
          shuffledPlayers,
          receivedMatchFormat
        );
      } else {
        // Handle Single Elimination logic
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
      // ✅ Add debug logging RIGHT HERE at the very beginning
      console.log(`=== DEBUG: handleSetWinner called ===`);
      console.log(`Match ID: ${matchId}`);
      console.log(`Winner: ${newWinningPlayer.name}`);

      setMatches((prevMatches) => {
        const updatedMatches = [...prevMatches];
        const currentTargetMatch = updatedMatches.find((m) => m.id === matchId);

        // ✅ Add more debug logging here
        console.log(`Match found: ${currentTargetMatch ? "YES" : "NO"}`);
        if (currentTargetMatch) {
          console.log(`Match bracket: ${currentTargetMatch.bracket}`);
          console.log(
            `Is Grand Finals Reset: ${currentTargetMatch.isGrandFinalsReset}`
          );
          console.log(
            `Current match winner: ${currentTargetMatch.winner?.name || "None"}`
          );
        }

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
          console.log(`=== GRAND FINALS LOGIC TRIGGERED ===`);
          console.log(`Grand Finals match detected: ${currentTargetMatch.id}`);

          // Update the match with winner first
          const updatedMatch = {
            ...currentTargetMatch,
            winner: newWinningPlayer,
          };
          const updatedMatchesWithWinner = updatedMatches.map((m) =>
            m.id === matchId ? updatedMatch : m
          );

          if (currentTargetMatch.isGrandFinalsReset) {
            console.log(`=== GRAND FINALS RESET COMPLETION LOGIC ===`);
            // Grand Finals Reset completed - winner takes all
            console.log(
              `Grand Finals Reset completed - Winner: ${newWinningPlayer.name}`
            );
            const loser =
              currentTargetMatch.player1?.id === newWinningPlayer.id
                ? currentTargetMatch.player2
                : currentTargetMatch.player1;

            console.log(`Setting tournament winner: ${newWinningPlayer.name}`);
            console.log(`Setting runner-up: ${loser?.name}`);

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
            console.log(`=== FIRST GRAND FINALS LOGIC ===`);
            // First Grand Finals match
            const wbPlayer = currentTargetMatch.player1; // WB Champion
            const lbPlayer = currentTargetMatch.player2; // LB Champion

            if (wbPlayer && newWinningPlayer.id === wbPlayer.id) {
              // WB Champion wins - tournament over
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
              // LB Champion wins - create reset match
              console.log(
                `Grand Finals Reset needed: ${newWinningPlayer.name} forces reset!`
              );
              const resetMatch = createMatch(
                `match-gf-reset-${Date.now()}`,
                currentTargetMatch.round,
                2,
                wbPlayer!,
                lbPlayer,
                "grandFinals",
                true,
                receivedMatchFormat
              );
              return [...updatedMatchesWithWinner, resetMatch];
            }
          }
        }

        console.log(`=== REGULAR MATCH LOGIC ===`);
        // Continue with regular match logic for non-Grand Finals matches
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

    // Show ALL matches, sorted by round and bracket for clear progression
    return matches
      .filter((match) => {
        // Show all matches that have players assigned
        return match.player1 !== null;
      })
      .sort((a, b) => {
        // First sort by round
        if (a.round !== b.round) {
          return a.round - b.round;
        }

        // Then by bracket priority (winners first, then losers, then grand finals)
        const bracketPriority = {
          winners: 1,
          losers: 2,
          grandFinals: 3,
        };

        if (a.bracket !== b.bracket) {
          return bracketPriority[a.bracket] - bracketPriority[b.bracket];
        }

        // Finally by match number
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
      // Show current active rounds
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

    setMatches((prevMatches) => {
      // Check for incomplete matches in the current round
      const currentWinnersMatches = prevMatches.filter(
        (m) => m.bracket === "winners" && m.round === currentRound
      );
      const currentLosersMatches = prevMatches.filter(
        (m) => m.bracket === "losers" && m.round === currentLosersRound
      );

      const hasIncompleteMatches = [
        ...currentWinnersMatches.filter((m) => m.player1 && m.player2),
        ...currentLosersMatches,
      ].some((m) => !m.winner);

      if (hasIncompleteMatches) {
        setShowIncompleteModal(true);
        return prevMatches;
      }

      let newMatches: Match[] = [];

      // Handle 6-player Double Elimination
      if (players.length === 6) {
        if (currentRound === 1) {
          // Get winners from Winners Bracket Round 1
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

          // Get losers from Winners Bracket Round 1
          const actualMatchLosers = currentWinnersMatches
            .filter((m) => m.player1 && m.player2 && m.winner)
            .map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            );

          console.log(
            `LB R1: Got ${actualMatchLosers.length} losers from WB R1`
          );

          // Create Losers Bracket Round 1 matches
          const losersNextRound: Match[] = [];
          if (actualMatchLosers.length >= 2) {
            for (let i = 0; i < Math.floor(actualMatchLosers.length / 2); i++) {
              const lbMatch = createMatch(
                `match-lb1-${i + 1}`,
                1,
                i + 1,
                actualMatchLosers[i * 2],
                actualMatchLosers[i * 2 + 1],
                "losers",
                false,
                receivedMatchFormat
              );
              losersNextRound.push(lbMatch);
            }

            // Handle odd number of losers
            if (actualMatchLosers.length % 2 === 1) {
              const byeMatch = createMatch(
                `match-lb1-${losersNextRound.length + 1}`,
                1,
                losersNextRound.length + 1,
                actualMatchLosers[actualMatchLosers.length - 1],
                null,
                "losers",
                false,
                receivedMatchFormat
              );
              losersNextRound.push(byeMatch);
            }
          }

          newMatches = [...winnersNextRound, ...losersNextRound];
        } else {
          // Handle subsequent rounds normally
          const winnersNextRound = generateDEWinnersBracketNextRound(
            currentWinnersMatches,
            currentRound + 1,
            receivedMatchFormat
          );

          const losersNextRound = generateDELosersBracketNextRoundMatches(
            prevMatches.filter((m) => m.bracket === "losers"),
            currentWinnersMatches.map((m) =>
              m.player1!.id === m.winner!.id ? m.player2! : m.player1!
            ),
            currentLosersRound + 1, // ✅ Change back to +1
            receivedMatchFormat
          );

          newMatches = [...winnersNextRound, ...losersNextRound];
        }
      }

      // If no new matches were created, check if we can advance to Grand Finals
      if (newMatches.length === 0) {
        // Check if we have a Grand Finals match that needs reset
        const currentGrandFinalsMatch = prevMatches.find(
          (m) =>
            m.bracket === "grandFinals" && m.winner && !m.isGrandFinalsReset
        );

        if (currentGrandFinalsMatch) {
          // ✅ Check if reset match already exists
          const existingResetMatch = prevMatches.find(
            (m) => m.bracket === "grandFinals" && m.isGrandFinalsReset
          );

          if (!existingResetMatch) {
            // Check if we need Grand Finals reset
            const resetMatches = generateGrandFinalsReset(
              currentGrandFinalsMatch,
              receivedMatchFormat
            );
            if (resetMatches.length > 0) {
              newMatches = resetMatches;
              console.log("Grand Finals Reset created");
            } else {
              // WB Champion won - tournament is over
              const winner = currentGrandFinalsMatch.winner!;
              console.log(`Tournament Winner: ${winner.name}`);
              setTournamentWinner(winner);

              Alert.alert(
                "Tournament Complete! 🏆",
                `Congratulations ${winner.name}!`,
                [
                  {
                    text: "Back to Home",
                    onPress: () => navigation.navigate("Home"),
                  },
                ]
              );
            }
          } else {
            // ✅ Reset match exists but not completed - don't advance further
            console.log("Waiting for Grand Finals Reset to be completed");
            return prevMatches; // Stop here - don't advance rounds
          }
        } else {
          // Check for existing Grand Finals Reset that's incomplete
          const incompleteResetMatch = prevMatches.find(
            (m) =>
              m.bracket === "grandFinals" && m.isGrandFinalsReset && !m.winner
          );

          if (incompleteResetMatch) {
            // ✅ Reset match exists but incomplete - stop advancing
            console.log("Waiting for Grand Finals Reset to be completed");
            return prevMatches;
          }

          // ✅ Check if Grand Finals already exists before creating
          const existingGrandFinalsMatch = prevMatches.find(
            (m) => m.bracket === "grandFinals"
          );

          if (!existingGrandFinalsMatch) {
            // Find Winners Bracket Champion (highest round winner in winners bracket)
            const wbMatches = prevMatches.filter(
              (m) => m.bracket === "winners" && m.winner
            );
            const wbChampion =
              wbMatches.length > 0
                ? wbMatches.reduce((latest, current) =>
                    current.round > latest.round ? current : latest
                  ).winner
                : null;

            // Find Losers Bracket Champion (highest round winner in losers bracket)
            const lbMatches = prevMatches.filter(
              (m) => m.bracket === "losers" && m.winner
            );
            const lbChampion =
              lbMatches.length > 0
                ? lbMatches.reduce((latest, current) =>
                    current.round > latest.round ? current : latest
                  ).winner
                : null;

            console.log(
              `Checking for champions - WB: ${
                wbChampion?.name || "None"
              }, LB: ${lbChampion?.name || "None"}`
            );

            if (wbChampion && lbChampion) {
              console.log(
                `Creating Grand Finals: ${wbChampion.name} vs ${lbChampion.name}`
              );

              newMatches = [
                createMatch(
                  "match-gf-1",
                  Math.max(currentRound, currentLosersRound) + 1,
                  1,
                  wbChampion,
                  lbChampion,
                  "grandFinals",
                  false,
                  receivedMatchFormat
                ),
              ];
            }
          } else {
            // ✅ Grand Finals exists but incomplete - stop advancing
            const incompleteGF = prevMatches.find(
              (m) => m.bracket === "grandFinals" && !m.winner
            );

            if (incompleteGF) {
              console.log("Waiting for Grand Finals to be completed");
              return prevMatches;
            }
          }
        }
      }

      // ✅ Only update rounds if new matches were actually created
      if (newMatches.length > 0) {
        setCurrentRound((prev) => {
          console.log(`Updating currentRound: ${prev} -> ${prev + 1}`);
          return prev + 1;
        });

        // Handle losers round increment logic...
        if (currentRound === 1) {
          // Don't increment after Round 1
        } else {
          const losersMatchesCreated = newMatches.some(
            (m) => m.bracket === "losers"
          );
          if (losersMatchesCreated) {
            setCurrentLosersRound((prev) => {
              console.log(
                `Updating currentLosersRound: ${prev} -> ${prev + 1}`
              );
              return prev + 1;
            });
          }
        }

        console.log(`Advancing to Round ${currentRound + 1}`);
      } else {
        console.log(
          "No new matches created - tournament waiting for match completion"
        );
      }

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

              // Show separator when:
              // 1. It's the first item
              // 2. Round changes
              // 3. Bracket changes within the same round
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
