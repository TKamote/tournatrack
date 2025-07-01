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

interface DoubleElim6ScreenProps {
  route: {
    params: {
      playerNames: string[];
      matchFormat: MatchFormat;
    };
  };
  navigation: any;
}

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
            const losingPlayer =
              match.player1?.id === winner.id ? match.player2 : match.player1;
            if (losingPlayer) {
              setTimeout(() => updatePlayerLosses(losingPlayer.id), 0);
            }
            return { ...match, winner };
          }
          return match;
        });
      });
    },
    [updatePlayerLosses]
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

        <ConfirmActionModal
          visible={showAdvanceModal}
          title="Advance to Next Round"
          message="Are you sure you want to advance to the next round?"
          onConfirm={() => {}} // Will implement advance logic later
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
});
