import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TournamentCardProps {
  tournamentId: string;
  tournamentType: string;
  playerCount: string;
  manager: string;
  isLiked: boolean;
  onLike: (tournamentId: string) => void;
  onPress: () => void;
  status?: "ongoing" | "completed" | "upcoming";
  managerAvatar?: string;
  navigation?: any;
  matches?: any[]; // Add matches for progress calculation
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournamentId,
  tournamentType,
  playerCount,
  manager,
  isLiked,
  onLike,
  onPress,
  status = "ongoing",
  managerAvatar,
  navigation,
  matches = [],
}) => {
  // Calculate tournament progress
  const calculateProgress = () => {
    if (!matches || matches.length === 0) return 0;

    const totalMatches = matches.length;
    const completedMatches = matches.filter(
      (match) => match.status === "completed" || match.winner
    ).length;

    return Math.round((completedMatches / totalMatches) * 100);
  };

  const progressPercentage = calculateProgress();

  // Determine status and progress bar color based on completion
  const getStatusText = () => {
    if (progressPercentage === 100) return "Completed";
    if (status === "ongoing") return "Live";
    return status;
  };

  const getProgressColor = () => {
    if (progressPercentage === 100) return "#2ecc71"; // Green for completed
    if (progressPercentage > 50) return "#4fc3f7"; // Blue for good progress
    return "rgba(255, 255, 255, 0.3)"; // Light for low progress
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => onLike(tournamentId)}
      >
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={20}
          color={isLiked ? "#e74c3c" : "#bdc3c7"}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.cardContent} onPress={onPress}>
        <View style={styles.headerRow}>
          <Text style={styles.tournamentType}>{tournamentType}</Text>
          <View
            style={[
              styles.statusBadge,
              styles[
                `status${status.charAt(0).toUpperCase() + status.slice(1)}`
              ],
            ]}
          >
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.tournamentDetails}>{playerCount}</Text>
          {/* Progress Bar for ongoing tournaments */}
          {status === "ongoing" && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.managerRow}
          onPress={() => {
            // Navigate to manager profile
            if (navigation) {
              navigation.navigate("ManagerProfile", {
                managerId: tournamentId,
              });
            }
          }}
        >
          {managerAvatar && (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{manager.charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.manager}>Manager: {manager}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(34, 48, 66, 0.8)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    width: 357,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    backdropFilter: "blur(10px)",
    // Glassmorphism effect
    backgroundColor: "rgba(34, 48, 66, 0.7)",
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
  },
  likeButton: {
    position: "absolute",
    bottom: -10,
    right: 28,
    zIndex: 1,
    padding: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardContent: {
    flex: 1,
  },
  tournamentType: {
    color: "#4fc3f7",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tournamentDetails: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  manager: {
    color: "#bdc3c7",
    fontSize: 14,
    fontWeight: "400",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusOngoing: {
    backgroundColor: "rgba(52, 152, 219, 0.2)",
    borderColor: "rgba(52, 152, 219, 0.5)",
  },
  statusCompleted: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderColor: "rgba(46, 204, 113, 0.5)",
  },
  statusUpcoming: {
    backgroundColor: "rgba(155, 89, 182, 0.2)",
    borderColor: "rgba(155, 89, 182, 0.5)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  managerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(52, 152, 219, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    width: 80, // Same width as status badge
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default TournamentCard;
