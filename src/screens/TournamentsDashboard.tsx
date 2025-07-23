import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TournamentCard from "../components/TournamentCard";
import { useTournamentContext } from "../context/TournamentContext";

const TournamentsDashboard: React.FC<any> = ({ navigation }) => {
  const { tournaments, loading, error, refreshTournaments } =
    useTournamentContext();
  const [likedTournaments, setLikedTournaments] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  // Load liked tournaments on component mount
  React.useEffect(() => {
    const loadLikedTournaments = async () => {
      try {
        const stored = await AsyncStorage.getItem("likedTournaments");
        if (stored) {
          setLikedTournaments(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading liked tournaments:", error);
      }
    };

    loadLikedTournaments();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTournaments();
    setRefreshing(false);
  }, [refreshTournaments]);

  // Filter tournaments to show only relevant ones
  const filteredTournaments = tournaments.filter((tournament) => {
    // Show completed tournaments
    if (tournament.status === "completed") return true;

    // Show tournaments that are in progress (regardless of match completion)
    if (tournament.status === "in_progress") return true;

    // Show tournaments with at least one completed match (active)
    const hasCompletedMatches = tournament.matches.some(
      (match) => match.winner
    );
    if (hasCompletedMatches) return true;

    // Show tournaments with active matches (not completed but in progress)
    const hasActiveMatches = tournament.matches.some(
      (match) => !match.winner && match.player1 && match.player2
    );
    if (hasActiveMatches) return true;

    // Show tournaments created in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isRecent = tournament.createdAt > oneDayAgo;
    if (isRecent) return true;

    return false;
  });

  const toggleLike = async (tournamentId: string) => {
    try {
      const newLikedTournaments = likedTournaments.includes(tournamentId)
        ? likedTournaments.filter((id) => id !== tournamentId)
        : [...likedTournaments, tournamentId];

      setLikedTournaments(newLikedTournaments);
      await AsyncStorage.setItem(
        "likedTournaments",
        JSON.stringify(newLikedTournaments)
      );
    } catch (error) {
      console.error("Error saving liked tournaments:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshTournaments}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Live Tournaments</Text>
          <Text style={styles.subtitle}>
            {filteredTournaments.length > 0
              ? `Showing ${filteredTournaments.length} relevant tournaments (filtered from ${tournaments.length} total)`
              : "No relevant tournaments available yet"}
          </Text>
        </View>
        <View style={styles.cardContainer}>
          {filteredTournaments.length > 0 ? (
            filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournamentId={tournament.id}
                tournamentType={tournament.type}
                playerCount={`${tournament.players.length} Players`}
                manager={tournament.manager}
                isLiked={likedTournaments.includes(tournament.id)}
                onLike={toggleLike}
                status={(() => {
                  // Check if all matches are completed
                  const allMatchesCompleted = tournament.matches.every(
                    (match) => match.winner
                  );
                  const hasMatches = tournament.matches.length > 0;

                  if (allMatchesCompleted && hasMatches) {
                    return "completed";
                  } else if (tournament.status === "in_progress") {
                    return "ongoing";
                  } else if (tournament.status === "completed") {
                    return "completed";
                  } else {
                    return "upcoming";
                  }
                })()}
                managerAvatar={tournament.manager.charAt(0)}
                navigation={navigation}
                matches={tournament.matches}
                tournament={tournament}
                onPress={() => {
                  navigation.navigate("TournamentDetails", {
                    tournament: tournament,
                  });
                }}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No relevant tournaments available
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Create a new tournament or check back later!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a252f",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a252f",
  },
  loadingText: {
    color: "#bdc3c7",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a252f",
    padding: 20,
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#bdc3c7",
    marginBottom: 8,
  },
  cardContainer: {
    gap: 16,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#bdc3c7",
    fontSize: 14,
    textAlign: "center",
  },
});

export default TournamentsDashboard;
