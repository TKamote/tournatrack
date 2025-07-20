import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation.types";
import TournamentBracketView from "../../components/tournament/TournamentBracketView";
import { Match } from "../../types";
import { TournamentService } from "../../utils/tournamentService";
import {
  calculateTournamentProgress,
  getLiveMatchInfo,
  getTotalRequiredMatches,
} from "../../utils/tournament/progressUtils";

type TournamentDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TournamentDetails"
>;

const TournamentDetailsScreen: React.FC<TournamentDetailsScreenProps> = ({
  route,
}) => {
  const { tournament } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [currentTournament, setCurrentTournament] = useState(tournament);

  // Initial fetch of latest tournament data
  useEffect(() => {
    const fetchLatestTournament = async () => {
      try {
        const latestTournament = await TournamentService.getTournament(
          tournament.id
        );

        if (latestTournament) {
          setCurrentTournament(latestTournament);
        }
      } catch (error) {
        console.error("Error in initial tournament fetch:", error);
      }
    };

    fetchLatestTournament();
  }, [tournament.id]);

  // Real-time updates every 500ms for better sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedTournament = await TournamentService.getTournament(
          tournament.id
        );

        if (updatedTournament) {
          setCurrentTournament(updatedTournament);
        }
      } catch (error) {
        console.error("Error updating tournament:", error);
      }
    }, 500); // Update every 500ms for immediate sync

    return () => clearInterval(interval);
  }, [tournament.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const updatedTournament = await TournamentService.getTournament(
        tournament.id
      );

      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    } catch (error) {
      console.error("Error refreshing tournament:", error);
    } finally {
      setRefreshing(false);
    }
  }, [tournament.id]);

  const getTournamentResults = () => {
    const grandFinalsMatches = currentTournament.matches.filter(
      (m: Match) => m.bracket === "grandFinals"
    );
    const lastMatch = grandFinalsMatches[grandFinalsMatches.length - 1];

    if (
      lastMatch &&
      lastMatch.winner &&
      lastMatch.player1 &&
      lastMatch.player2
    ) {
      const champion = lastMatch.winner;
      const runnerUp =
        lastMatch.winner.name === lastMatch.player1.name
          ? lastMatch.player2
          : lastMatch.player1;

      // Calculate final score from games
      const totalScore1 = (lastMatch.games ?? []).reduce(
        (sum, game) => sum + game.score1,
        0
      );
      const totalScore2 = lastMatch.games.reduce(
        (sum, game) => sum + game.score2,
        0
      );

      return {
        champion: champion.name,
        runnerUp: runnerUp.name,
        finalScore: `${totalScore1} - ${totalScore2}`,
      };
    }
    return null;
  };

  const results = getTournamentResults();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {Array.isArray(currentTournament.players)
              ? currentTournament.players.length
              : currentTournament.players}{" "}
            Players - Managed by {currentTournament.manager}
          </Text>
          <Text style={styles.lastUpdate}>
            Last updated: {currentTournament.updatedAt.toLocaleTimeString()}
          </Text>

          {/* Debug: Tournament Type */}
          <Text style={styles.debugText}>
            Debug: Tournament Type = "{currentTournament.type}"
          </Text>

          {/* Live Tournament Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Matches</Text>
              <Text style={styles.statValue}>
                {getTotalRequiredMatches(currentTournament.type)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>
                {currentTournament.matches.filter((m) => m.winner).length}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Progress</Text>
              <Text style={styles.statValue}>
                {calculateTournamentProgress(currentTournament)}%
              </Text>
            </View>
          </View>
        </View>
        <TournamentBracketView tournament={currentTournament} readOnly={true} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a252f",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  lastUpdate: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 152, 219, 0.3)",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    color: "#bdc3c7",
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: "#4fc3f7",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: { fontSize: 14, color: "#bdc3c7", marginBottom: 8 },
  formatText: { fontSize: 14, color: "#bdc3c7", marginBottom: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#223042",
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultLabel: {
    color: "#bdc3c7",
    fontSize: 14,
  },
  resultValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  debugText: {
    color: "#ff6b6b",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
});

export default TournamentDetailsScreen;
