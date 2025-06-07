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
  generateSENextRoundMatches,
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
      // Initialize players with IDs and seeds
      const initialPlayers = receivedPlayerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name,
        losses: 0,
        seed: i + 1,
      }));

      // Create initial matches based on tournament type
      let initialMatches: Match[] = [];

      if (tournamentType === "Single Knockout") {
        // Create matches for first round
        for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
          const match: Match = {
            id: `match-r1-${i + 1}`,
            round: 1,
            matchNumber: i + 1,
            player1: initialPlayers[i * 2],
            player2: initialPlayers[i * 2 + 1],
            winner: null,
            games: [],
            bracket: "winners",
            isGrandFinalsReset: false,
            format: receivedMatchFormat,
          };
          initialMatches.push(match);
        }
      } else if (tournamentType === "Double Elimination") {
        // Create first round matches for winners bracket
        for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
          const match: Match = {
            id: `match-wb-r1-${i + 1}`,
            round: 1,
            matchNumber: i + 1,
            player1: initialPlayers[i * 2],
            player2: initialPlayers[i * 2 + 1],
            winner: null,
            games: [],
            bracket: "winners",
            isGrandFinalsReset: false,
            format: receivedMatchFormat,
          };
          initialMatches.push(match);
        }
      }

      setPlayers(initialPlayers);
      setMatches(initialMatches);
      setHasInitialized(true);
    }
  }, [receivedPlayerNames, numPlayers, tournamentType, receivedMatchFormat]);

  const isMatchLocked = useCallback(
    (match: Match): boolean => {
      if (tournamentOver) return true;
      if (match.bracket === "winners" && match.round < currentRound)
        return true;
      if (match.bracket === "losers" && match.round < currentRound) return true;
      if (match.bracket === "grandFinals" && overallWinner) return true;
      return false;
    },
    [tournamentOver, currentRound, overallWinner]
  );

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      const currentTargetMatch = matches.find((m) => m.id === matchId);
      if (!currentTargetMatch) return;

      // Update the match with the winner
      const tempUpdatedMatches = matches.map((m) => {
        if (m.id === matchId) {
          return { ...m, winner: newWinningPlayer };
        }
        return m;
      });

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
          } else if (lbPlayerInGF && newWinningPlayer.id === lbPlayerInGF.id) {
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
            tempUpdatedMatches.push(gfResetMatch);
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
        }
      }

      setMatches(tempUpdatedMatches);
    },
    [matches, receivedMatchFormat]
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
      setMatches((prevMatches: Match[]) => {
        return prevMatches.map((match) => {
          if (match.id !== matchId) return match;

          const newGame: Game = {
            id: `game-${match.games.length + 1}`,
            winner,
            score1,
            score2,
          };

          return {
            ...match,
            games: [...match.games, newGame],
          };
        });
      });
    },
    [players]
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
    // Add your round advancement logic here
    setCurrentRound((prev) => prev + 1);
  }, []);

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
            renderItem={({ item }) => (
              <MatchListItem
                item={item}
                players={players}
                tournamentType={tournamentType}
                isMatchLocked={isMatchLocked}
                onSetWinner={handleSetWinner}
                onGameResult={handleIncrementScore}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />

          {/* Advance Round Button */}
          {!tournamentOver && matches.length > 0 && (
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
});
