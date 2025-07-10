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
import { DoubleElim7ScreenProps } from "../../types/navigation.types";
import {
  createMatch,
  shuffleArray,
  createDEInitialMatches,
} from "../../utils/tournament/tournamentUtils";
import ScreenHeader from "../../components/common/ScreenHeader";

const DoubleElim7Screen: React.FC<DoubleElim7ScreenProps> = ({
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
      playerNames.length === 7 &&
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
      // Use the utility for 7 players
      const round1Matches = createDEInitialMatches(
        shuffledPlayers,
        matchFormat
      );
      setPlayers(shuffledPlayers);
      setMatches(round1Matches);
      setHasInitialized(true);
      console.log("DE-7 matches after initialization:", round1Matches);
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
                  setOverallWinner(winner);
                  setRunnerUp(lbPlayer);
                  setFinalMatch(updatedMatch);
                  setShowSummaryModal(true);
                  Alert.alert(
                    "Tournament Complete! 🏆",
                    `${winner.name} is the Champion!`,
                    [{ text: "OK" }]
                  );
                }, 100);
              } else if (winner.id === lbPlayer?.id) {
                if (wbPlayer)
                  setTimeout(() => updatePlayerLosses(wbPlayer.id), 0);
                if (!match.isGrandFinalsReset) {
                  setTimeout(() => {
                    const resetMatch = createMatch(
                      `de7-gf-reset-${Date.now()}`,
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
                    setOverallWinner(winner);
                    setRunnerUp(wbPlayer);
                    setFinalMatch(updatedMatch);
                    setShowSummaryModal(true);
                    Alert.alert(
                      "Tournament Complete! 🏆",
                      `${winner.name} is the Champion!`,
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

  // Placeholder: just advance round number for now
  const executeAdvanceRound = useCallback(() => {
    setShowAdvanceModal(false);
    setCurrentRound((prev) => prev + 1);
    // TODO: Implement actual match progression logic for 7-player DE
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title={`Double Elimination (7) - Round ${currentRound}`}
          subtitle="7 Players"
        />
        <Text style={styles.formatBanner}>
          Race to {matchFormat.gamesNeededToWin}
        </Text>
        <FlatList
          // For debugging, you can use: data={matches}
          data={matches.filter((m) => m.round === currentRound)}
          renderItem={({ item }) => (
            <View style={styles.matchCard}>
              <Text style={styles.matchTitle}>
                {item.bracket === "winners"
                  ? "Winners Bracket"
                  : item.bracket === "losers"
                  ? "Losers Bracket"
                  : "Grand Finals"}
              </Text>
              <Text style={styles.matchPlayers}>
                {item.player1?.name || "BYE"} vs {item.player2?.name || "BYE"}
              </Text>
              <Text style={styles.matchScore}>
                Score:{" "}
                {item.games.map((g) => `${g.score1}-${g.score2}`).join(", ")}
              </Text>
              {item.winner && (
                <Text style={styles.matchWinner}>
                  Winner: {item.winner.name}
                </Text>
              )}
            </View>
          )}
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
        {/* Modals and summary placeholders can be added here */}
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

export default DoubleElim7Screen;
