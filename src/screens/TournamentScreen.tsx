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
  createMatch,
  shuffleArray,
  createDEInitialMatches,
} from "../utils/tournament/tournamentUtils";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import ScreenHeader from "../components/common/ScreenHeader";
import IncompleteMatchesModal from "../components/tournament/IncompleteMatchesModal";
import TournamentSummaryModal from "../components/tournament/TournamentSummaryModal";
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournamentOver, setTournamentOver] = useState(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentLosersRound, setCurrentLosersRound] = useState(1);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [runnerUp, setRunnerUp] = useState<Player | null>(null);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);

  // ✅ Validation useEffect
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

  // ✅ Reset tournament state when parameters change
  useEffect(() => {
    console.log("Resetting tournament state...");
    setHasInitialized(false);
    setPlayers([]);
    setMatches([]);
    setCurrentRound(1);
    setCurrentLosersRound(1);
    setTournamentOver(false);
    setOverallWinner(null);
    setRunnerUp(null);
    setFinalMatch(null);
  }, [numPlayers, tournamentType]);

  // ✅ Initialize tournament
  useEffect(() => {
    if (
      receivedPlayerNames &&
      receivedPlayerNames.length === numPlayers &&
      numPlayers > 0 &&
      receivedMatchFormat &&
      !hasInitialized
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

      console.log("Tournament initialized:", {
        players: shuffledPlayers.length,
        matches: initialMatches.length,
      });

      setPlayers(shuffledPlayers);
      setMatches(initialMatches);
      setHasInitialized(true);
    }
  }, [
    receivedPlayerNames,
    numPlayers,
    tournamentType,
    receivedMatchFormat,
    hasInitialized,
  ]);

  // ✅ Helper function to update player losses
  const updatePlayerLosses = useCallback((loserId: string) => {
    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => {
        if (player.id === loserId) {
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
        return player;
      });
    });
  }, []);

  // ✅ Simplified handleIncrementScore - ONLY handles scoring, not winner setting
  const handleIncrementScore = useCallback(
    (matchId: string, winner: Player, score1: number, score2: number) => {
      setMatches((prevMatches) => {
        return prevMatches.map((match) => {
          if (match.id !== matchId) return match;
          if (match.winner) return match; // Already completed

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

          // ✅ Only update games, winner is set separately by handleSetWinner
          return { ...match, games: updatedGames };
        });
      });
    },
    []
  );

  // ✅ Simplified handleSetWinner - handles winner logic and loss updates
  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      console.log(
        `=== Setting winner for match ${matchId}: ${newWinningPlayer.name} ===`
      );

      setMatches((prevMatches) => {
        const targetMatch = prevMatches.find((m) => m.id === matchId);
        if (!targetMatch || targetMatch.winner) {
          console.log(`Match ${matchId} already has winner or doesn't exist`);
          return prevMatches;
        }

        const losingPlayer =
          targetMatch.player1?.id === newWinningPlayer.id
            ? targetMatch.player2
            : targetMatch.player1;

        // ✅ Update losing player losses immediately
        if (losingPlayer) {
          updatePlayerLosses(losingPlayer.id);
        }

        const updatedMatch = {
          ...targetMatch,
          winner: newWinningPlayer,
        };

        const updatedMatches = prevMatches.map((match) =>
          match.id === matchId ? updatedMatch : match
        );

        // ✅ Handle Grand Finals logic
        if (targetMatch.bracket === "grandFinals") {
          if (targetMatch.isGrandFinalsReset) {
            // Tournament complete
            setOverallWinner(newWinningPlayer);
            setRunnerUp(losingPlayer);
            setFinalMatch(updatedMatch);
            setTournamentOver(true);
            setShowSummaryModal(true);

            Alert.alert(
              "Tournament Complete! 🏆",
              `${newWinningPlayer.name} is the Champion!`,
              [{ text: "OK" }]
            );
            return updatedMatches;
          } else {
            // First Grand Finals
            const wbPlayer = targetMatch.player1;
            const lbPlayer = targetMatch.player2;

            if (wbPlayer && newWinningPlayer.id === wbPlayer.id) {
              // WB Champion wins - Tournament over
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
              return updatedMatches;
            } else if (lbPlayer && newWinningPlayer.id === lbPlayer.id) {
              // LB Champion wins - Create reset match
              console.log(
                `Creating Grand Finals Reset: ${wbPlayer!.name} vs ${
                  lbPlayer.name
                }`
              );

              const resetMatch = createMatch(
                `match-gf-reset-${Date.now()}`,
                targetMatch.round,
                2,
                wbPlayer!,
                lbPlayer,
                "grandFinals",
                true,
                receivedMatchFormat
              );

              return [...updatedMatches, resetMatch];
            }
          }
        }

        return updatedMatches;
      });
    },
    [updatePlayerLosses, receivedMatchFormat]
  );

  // ✅ Tournament advancement logic
  const executeAdvanceRound = useCallback(() => {
    setIsAdvanceModalVisible(false);
    console.log(`=== ADVANCING FROM ROUND ${currentRound} ===`);

    setMatches((prevMatches) => {
      const currentWinnersMatches = prevMatches.filter(
        (m) => m.bracket === "winners" && m.round === currentRound
      );

      const incompleteWinnersMatches = currentWinnersMatches.filter(
        (m) => m.player1 && m.player2 && !m.winner
      );

      if (incompleteWinnersMatches.length > 0) {
        console.log(
          `❌ Cannot advance - ${incompleteWinnersMatches.length} incomplete matches`
        );
        setShowIncompleteModal(true);
        return prevMatches;
      }

      let newMatches: Match[] = [];
      const isPlayerEliminated = (player: Player): boolean => {
        if (!player) return true;
        return player.losses >= 2;
      };

      if (players.length === 8) {
        if (currentRound === 1) {
          // R1→R2: Create WB R2 + LB R1
          const wbR1Winners = currentWinnersMatches
            .filter((m) => m.winner)
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

          const losersFromWBR1 = currentWinnersMatches
            .filter((m) => m.winner)
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

          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 2) {
          // R2→R3: Create WB R3 + LB R2
          const wbR2Winners = currentWinnersMatches
            .filter((m) => m.winner)
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

          newMatches = [...winnersNextRound, ...losersNextRound];
        } else if (currentRound === 3) {
          // R3→R4: Create LB R3
          const lbR2Winners = prevMatches
            .filter((m) => m.bracket === "losers" && m.round === 2 && m.winner)
            .map((m) => m.winner!)
            .filter((p) => !isPlayerEliminated(p));

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
          }

          newMatches = losersNextRound;
        } else if (currentRound === 4) {
          // R4→R5: Create LB R4
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
          }

          newMatches = losersNextRound;
        } else if (currentRound === 5) {
          // R5→GF: Create Grand Finals
          const existingGF = prevMatches.find(
            (m) => m.bracket === "grandFinals"
          );

          if (!existingGF) {
            const wbChampion = prevMatches
              .filter(
                (m) => m.bracket === "winners" && m.round === 3 && m.winner
              )
              .map((m) => m.winner!)[0];

            const lbChampion = prevMatches
              .filter(
                (m) => m.bracket === "losers" && m.round === 4 && m.winner
              )
              .map((m) => m.winner!)[0];

            if (wbChampion && lbChampion) {
              newMatches = [
                createMatch(
                  "match-gf-1",
                  6,
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
        }
      }

      if (newMatches.length > 0) {
        setCurrentRound((prev) => prev + 1);
        console.log(`✅ Advanced to Round ${currentRound + 1}`);
      }

      return [...prevMatches, ...newMatches];
    });
  }, [currentRound, players.length, receivedMatchFormat]);

  // ✅ Display functions
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
    if (tournamentType.startsWith("Single Knockout"))
      return `Single Elimination - Round ${currentRound}`;
    if (tournamentType.startsWith("Double Elimination"))
      return `Double Elimination - Round ${currentRound}`;
    return "Tournament";
  }, [tournamentOver, overallWinner, matches, tournamentType, currentRound]);

  const isMatchLocked = useCallback((match: Match): boolean => {
    if (match.winner) return true;
    if (!match.player1 || !match.player2) return true;
    return false;
  }, []);

  // ✅ Sync player objects in matches when players change
  useEffect(() => {
    setMatches((prevMatches) => {
      return prevMatches.map((match) => {
        const updatedPlayer1 = match.player1
          ? players.find((p) => p.id === match.player1?.id) || match.player1
          : null;
        const updatedPlayer2 = match.player2
          ? players.find((p) => p.id === match.player2?.id) || match.player2
          : null;

        // Only update if names changed (loss count updated)
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

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              Race to {receivedMatchFormat?.gamesNeededToWin}
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
  errorText: {
    color: COLORS.textPrimary,
    textAlign: "center",
    marginTop: 20,
  },
});
