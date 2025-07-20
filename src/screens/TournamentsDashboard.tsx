import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tournament, Match, Game } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TournamentCard from "../components/TournamentCard";
import { TournamentService } from "../utils/tournamentService";

// Helper function to convert old mock data format to new Match format
const convertOldMatchToNewFormat = (oldMatch: any): Match => {
  const games: Game[] = [];

  // If the old match has score1 and score2, create a single game
  if (oldMatch.score1 !== undefined && oldMatch.score2 !== undefined) {
    games.push({
      id: `${oldMatch.round}-${oldMatch.bracket}-game-1`,
      winner: oldMatch.winner,
      score1: oldMatch.score1,
      score2: oldMatch.score2,
    });
  }

  return {
    id: `${oldMatch.round}-${oldMatch.bracket}-${oldMatch.matchNumber || 1}`,
    round: oldMatch.round,
    matchNumber: oldMatch.matchNumber || 1,
    player1: oldMatch.player1,
    player2: oldMatch.player2,
    winner: oldMatch.winner,
    bracket: oldMatch.bracket,
    isGrandFinalsReset: oldMatch.isGrandFinalsReset || false,
    format: oldMatch.format || {
      type: "raceTo",
      gamesNeededToWin: 3,
      label: "Race to 3",
    },
    games,
    status: oldMatch.status || "completed",
    isLive: false,
    lastUpdated: new Date(),
    createdBy: "mock-data",
  };
};

// Helper function to convert old tournament data to new format
const convertOldTournamentToNewFormat = (oldTournament: any): Tournament => {
  const convertedMatches = oldTournament.matches.map(
    (match: any, index: number) =>
      convertOldMatchToNewFormat({ ...match, matchNumber: index + 1 })
  );

  return {
    id: `mock-${Date.now()}`,
    name: `${oldTournament.type} Tournament`,
    type: oldTournament.type,
    manager: oldTournament.manager,
    managerId: "mock-manager",
    players: Array.isArray(oldTournament.players)
      ? oldTournament.players.map((p: any, index: number) => ({
          id: `player-${index}`,
          name: p.name,
          seed: index + 1,
          losses: 0,
          isEliminated: false,
          totalMatches: 0,
          wins: 0,
          winPercentage: 0,
          averageScore: 0,
          isActive: true,
        }))
      : [],
    matches: convertedMatches,
    format: oldTournament.format || {
      type: "raceTo",
      gamesNeededToWin: 3,
      label: "Race to 3",
    },
    status: oldTournament.status || "in_progress",
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: true,
    maxPlayers: Array.isArray(oldTournament.players)
      ? oldTournament.players.length
      : oldTournament.players,
    currentRound: Math.max(...convertedMatches.map((m: Match) => m.round)),
    totalRounds: Math.max(...convertedMatches.map((m: Match) => m.round)),
  };
};

const TournamentsDashboard: React.FC<any> = ({ navigation }) => {
  const [likedTournaments, setLikedTournaments] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const fadeAnim = new Animated.Value(0);

  // Animate in tournaments
  useEffect(() => {
    if (tournaments.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [tournaments, fadeAnim]);

  // Real-time updates every 1 second to match DetailsScreen sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const publicTournaments =
          await TournamentService.getPublicTournaments();
        setTournaments(publicTournaments);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error updating tournaments:", error);
      }
    }, 1000); // Update every 1 second to match DetailsScreen sync

    return () => clearInterval(interval);
  }, []);

  // Load tournaments and liked tournaments on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load liked tournaments
        const stored = await AsyncStorage.getItem("likedTournaments");
        if (stored) {
          setLikedTournaments(JSON.parse(stored));
        }

        // Load public tournaments from Firebase
        const publicTournaments =
          await TournamentService.getPublicTournaments();

        setTournaments(publicTournaments);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error loading data:", error);
        // If Firebase fails, just show empty state
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const publicTournaments = await TournamentService.getPublicTournaments();
      setTournaments(publicTournaments);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("❌ Error refreshing tournaments:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
          <ActivityIndicator size="large" color="#4fc3f7" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
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
            {tournaments.length > 0
              ? `Watching ${tournaments.length} active tournaments`
              : "No tournaments available yet"}
          </Text>
          {tournaments.length > 0 && (
            <Text style={styles.lastUpdate}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>
        <View style={styles.cardContainer}>
          {tournaments.length > 0 ? (
            tournaments.map((tournament) => (
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
                No tournaments available yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Create a tournament to get started!
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
  lastUpdate: {
    fontSize: 12,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  cardContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#223042",
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#2c3e50",
    position: "relative",
  },
  likeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  cardContent: {
    flex: 1,
  },
  tournamentType: {
    color: "#4fc3f7",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  tournamentDetails: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 4,
  },
  manager: {
    color: "#bdc3c7",
    fontSize: 14,
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
