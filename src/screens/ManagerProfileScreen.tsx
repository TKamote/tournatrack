import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useNavigation } from "@react-navigation/native";
import TournamentCard from "../components/TournamentCard";
import { ManagerProvider, useManager } from "../context/ManagerContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ManagerProfileScreenProps {
  route: { params: { managerId: string } };
}

const ManagerProfileContent: React.FC = () => {
  const navigation = useNavigation();
  const { manager, tournaments, loading } = useManager();

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color="#FFD700" />
        );
      }
    }
    return stars;
  };

  const renderAvatar = () => {
    if (
      manager?.avatar &&
      typeof manager.avatar === "string" &&
      manager.avatar.startsWith("http")
    ) {
      return (
        <Image
          source={{ uri: manager.avatar }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      );
    }
    // fallback to initial
    return (
      <Text style={styles.avatarText}>
        {manager?.avatar ? String(manager.avatar).charAt(0) : "M"}
      </Text>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#1a252f", position: "relative" }}
    >
      {/* Always-visible debug logout button at the top */}
      <TouchableOpacity
        style={{
          backgroundColor: "red",
          padding: 10,
          margin: 10,
          borderRadius: 8,
          zIndex: 9999,
        }}
        onPress={async () => {
          await AsyncStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: "Auth" }],
          } as any);
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Logout (Dev)</Text>
      </TouchableOpacity>
      <View style={[styles.container, { flex: 1, position: "relative" }]}>
        {/* Back button outside ScrollView */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={{ color: "white", fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: 120 },
          ]}
        >
          {" "}
          {/* Add extra bottom padding */} {/* Add extra bottom padding */}
          {/* Compact Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>{renderAvatar()}</View>
            {!manager ? (
              <ActivityIndicator
                size="small"
                color="#4fc3f7"
                style={{ marginVertical: 8 }}
              />
            ) : (
              <>
                <Text style={styles.name}>{manager?.name || "Manager"}</Text>
                <Text style={styles.country}>{manager?.country || "-"}</Text>
                <Text style={styles.ageBracket}>
                  {manager?.ageBracket || "-"}
                </Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statNumber}>
                    {manager?.tournamentsHosted || 0}
                  </Text>
                  <Text style={styles.statLabel}>Tournaments</Text>
                  <View style={styles.starsContainer}>
                    {renderStars(manager?.starRating || 4.5)}
                  </View>
                </View>
              </>
            )}
          </View>
          {/* Manager's Tournaments */}
          <Text style={styles.sectionTitle}>
            Tournaments by {manager?.name || "Manager"}
          </Text>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#4fc3f7"
              style={{ marginTop: 24 }}
            />
          ) : tournaments.length === 0 ? (
            <Text style={styles.emptyText}>
              No tournaments found for this manager.
            </Text>
          ) : (
            tournaments.slice(0, 5).map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournamentId={tournament.id}
                tournamentType={tournament.type}
                playerCount={`${tournament.players.length} Players`}
                manager={tournament.manager}
                isLiked={false}
                onLike={() => {}}
                onPress={() =>
                  (navigation as any).navigate("TournamentDetails", {
                    tournament,
                  })
                }
                status={
                  tournament.status === "completed"
                    ? "completed"
                    : tournament.status === "in_progress"
                    ? "ongoing"
                    : undefined
                }
                managerAvatar={tournament.manager.charAt(0)}
                matches={tournament.matches}
                tournament={tournament}
              />
            ))
          )}
        </ScrollView>
        {/* Temporary Logout Button */}
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 32,
            left: 32,
            right: 32,
            backgroundColor: "#e74c3c",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 9999,
          }}
          onPress={async () => {
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            } as any);
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
            Logout (Dev)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const ManagerProfileScreen: React.FC<ManagerProfileScreenProps> = ({
  route,
}) => {
  const { managerId } = route.params;
  return (
    <ManagerProvider managerId={managerId}>
      <ManagerProfileContent />
    </ManagerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a252f",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  backButton: {
    position: "absolute",
    top: 30,
    left: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 8,
    zIndex: 9999,
  },
  profileCard: {
    backgroundColor: "rgba(34, 48, 66, 0.8)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
    marginTop: 48, // Add margin to push profile card below back button
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(52, 152, 219, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  country: {
    fontSize: 14,
    color: "#bdc3c7",
    marginBottom: 2,
  },
  ageBracket: {
    fontSize: 12,
    color: "#bdc3c7",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4fc3f7",
    marginRight: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#bdc3c7",
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: "row",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyText: {
    color: "#bdc3c7",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
  },
});

export default ManagerProfileScreen;
