import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation.types";
import TournamentBracketView from "../../components/tournament/TournamentBracketView";
import {
  calculateTournamentProgress,
  getTotalRequiredMatches,
  getTournamentCompletionInfo,
} from "../../utils/tournament/progressUtils";
import { useTournamentContext } from "../../context/TournamentContext";
import { Tournament, Match, Game } from "../../types";

type TournamentDetailsScreenProps = {
  route: {
    params: {
      tournament: Tournament;
    };
  };
  navigation: any;
};

const TournamentDetailsScreen: React.FC<TournamentDetailsScreenProps> = ({
  route,
}) => {
  const { tournament } = route.params;
  const { tournaments, refreshTournaments } = useTournamentContext();
  const [refreshing, setRefreshing] = useState(false);

  // Get the latest tournament data from centralized context
  const currentTournament =
    tournaments.find((t) => t.id === tournament.id) || tournament;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTournaments();
    setRefreshing(false);
  }, [refreshTournaments]);

  const getTournamentResults = () => {
    // Use the centralized completion info function
    const completionInfo = getTournamentCompletionInfo(currentTournament);

    if (completionInfo) {
      return {
        champion: completionInfo.champion,
        runnerUp: completionInfo.runnerUp,
        finalScore: `${completionInfo.championScore} - ${completionInfo.runnerUpScore}`,
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

          {/* Live Tournament Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Matches</Text>
              <Text style={styles.statValue}>
                {getTotalRequiredMatches(
                  currentTournament.type,
                  currentTournament.maxPlayers
                )}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>
                {
                  currentTournament.matches.filter((m: Match) => m.winner)
                    .length
                }
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
});

export default TournamentDetailsScreen;
