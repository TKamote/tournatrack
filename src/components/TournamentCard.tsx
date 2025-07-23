import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  calculateTournamentProgress,
  getTournamentCompletionInfo,
  getLiveMatchInfo,
} from "../utils/tournament/progressUtils";

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
  tournament?: any; // Add full tournament object
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
  tournament,
}) => {
  // Calculate tournament progress with live updates
  // Use passed tournament object or create one for centralized calculations
  const tournamentData = tournament || {
    id: tournamentId,
    type: tournamentType,
    matches: matches || [],
    players: [],
    format: { gamesNeededToWin: 3 },
    status: status,
  };

  // Use centralized utilities
  const progressPercentage = calculateTournamentProgress(tournamentData);
  const liveMatch = getLiveMatchInfo(tournamentData);
  const completionInfo = getTournamentCompletionInfo(tournamentData);

  // Enhanced status detection - check if tournament is truly complete
  const isTournamentComplete = progressPercentage === 100;

  // Determine status and progress bar color based on completion
  const getStatusText = () => {
    if (progressPercentage === 100) return "Completed";
    if (status === "ongoing") return "Live";
    return status;
  };

  const getProgressColor = () => {
    if (progressPercentage === 100) return "#2ecc71"; // Green for completed
    if (progressPercentage > 50) return "#4fc3f7"; // Blue for good progress
    if (progressPercentage > 0) return "#f39c12"; // Orange for some progress
    return "rgba(255, 255, 255, 0.3)"; // Light for no progress
  };

  // Enhanced status detection
  const actualStatus = isTournamentComplete ? "completed" : status;

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
                `status${
                  actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)
                }`
              ],
            ]}
          >
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.tournamentDetails}>{playerCount}</Text>
          {/* Progress Bar for ongoing tournaments */}
          {actualStatus === "ongoing" && (
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

        {/* Live Match Display */}
        {actualStatus === "ongoing" && liveMatch && (
          <View
            style={[
              styles.liveMatchContainer,
              liveMatch.isMatchPoint && styles.matchPointContainer,
              liveMatch.isCloseMatch && styles.closeMatchContainer,
              liveMatch.isCompleted && styles.completedMatchContainer,
              liveMatch.isTransitionMatch && styles.transitionMatchContainer,
            ]}
          >
            <View style={styles.matchInfo}>
              <Text style={styles.roundText}>Round {liveMatch.round}</Text>
              <Text style={styles.matchFormatText}>
                {liveMatch.matchFormat}
              </Text>
              {liveMatch.isTransitionMatch && (
                <Text style={styles.transitionText}>Last Match</Text>
              )}
              <View style={styles.scoreContainer}>
                <Text style={styles.playerName}>{liveMatch.player1}</Text>
                <Text
                  style={[
                    styles.scoreText,
                    liveMatch.score1 > liveMatch.score2 && styles.winningScore,
                  ]}
                >
                  {liveMatch.score1}
                </Text>
                <Text style={styles.vsText}>vs</Text>
                <Text
                  style={[
                    styles.scoreText,
                    liveMatch.score2 > liveMatch.score1 && styles.winningScore,
                  ]}
                >
                  {liveMatch.score2}
                </Text>
                <Text style={styles.playerName}>{liveMatch.player2}</Text>
              </View>
              {liveMatch.isCompleted ? (
                <View style={styles.matchCompletedBadge}>
                  <Text style={styles.matchCompletedText}>
                    {liveMatch.winner} WINS!
                  </Text>
                </View>
              ) : (
                <View style={styles.gameProgress}>
                  <Text style={styles.gameProgressText}>
                    Game {liveMatch.totalGames + 1} of{" "}
                    {liveMatch.gamesNeeded * 2 - 1}
                  </Text>
                </View>
              )}
              {liveMatch.isMatchPoint && !liveMatch.isCompleted && (
                <View style={styles.matchPointBadge}>
                  <Text style={styles.matchPointText}>MATCH POINT!</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tournament Completion Display - Only show when tournament is completed */}
        {completionInfo && actualStatus === "completed" && (
          <View style={styles.completionContainer}>
            <View style={styles.completionIndicator}>
              <Text style={styles.completionText}>🏆 COMPLETED</Text>
            </View>
            <View style={styles.completionInfo}>
              <Text style={styles.championText}>
                Champion: {completionInfo.champion}
              </Text>
              <View style={styles.finalScoreContainer}>
                <Text style={styles.finalScoreText}>
                  {completionInfo.championScore} -{" "}
                  {completionInfo.runnerUpScore}
                </Text>
              </View>
              <Text style={styles.runnerUpText}>
                Runner-up: {completionInfo.runnerUp}
              </Text>
            </View>
          </View>
        )}

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
  liveMatchContainer: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(52, 152, 219, 0.3)",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e74c3c",
    marginRight: 6,
  },
  liveText: {
    color: "#e74c3c",
    fontSize: 12,
    fontWeight: "bold",
  },
  matchInfo: {
    alignItems: "center",
  },
  roundText: {
    color: "#bdc3c7",
    fontSize: 12,
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  scoreText: {
    color: "#4fc3f7",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  vsText: {
    color: "#bdc3c7",
    fontSize: 12,
    marginHorizontal: 4,
  },
  matchPointContainer: {
    backgroundColor: "rgba(231, 76, 60, 0.2)",
    borderColor: "rgba(231, 76, 60, 0.5)",
  },
  closeMatchContainer: {
    backgroundColor: "rgba(241, 196, 15, 0.1)",
    borderColor: "rgba(241, 196, 15, 0.3)",
  },
  completedMatchContainer: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
    borderColor: "rgba(46, 204, 113, 0.3)",
  },
  transitionMatchContainer: {
    backgroundColor: "rgba(155, 89, 182, 0.1)",
    borderColor: "rgba(155, 89, 182, 0.3)",
  },
  transitionText: {
    color: "#9b59b6",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  matchPointBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  matchPointText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  matchCompletedBadge: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 6,
  },
  matchCompletedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  matchFormatText: {
    color: "#95a5a6",
    fontSize: 11,
    marginBottom: 4,
    fontStyle: "italic",
  },
  winningScore: {
    color: "#2ecc71",
    fontWeight: "bold",
  },
  gameProgress: {
    marginTop: 6,
  },
  gameProgressText: {
    color: "#7f8c8d",
    fontSize: 10,
    textAlign: "center",
  },
  completionContainer: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(46, 204, 113, 0.3)",
  },
  completionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  completionText: {
    color: "#2ecc71",
    fontSize: 12,
    fontWeight: "bold",
  },
  completionInfo: {
    alignItems: "center",
  },
  championText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  finalScoreContainer: {
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  finalScoreText: {
    color: "#2ecc71",
    fontSize: 18,
    fontWeight: "bold",
  },
  runnerUpText: {
    color: "#bdc3c7",
    fontSize: 12,
  },
});

export default TournamentCard;
