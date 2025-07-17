import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation.types";
import TournamentBracketView from "../../components/tournament/TournamentBracketView";
import { Match } from "../../types";

type TournamentDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TournamentDetails"
>;

const TournamentDetailsScreen: React.FC<TournamentDetailsScreenProps> = ({
  route,
}) => {
  const { tournament } = route.params;
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Check if tournament is completed (has grand finals with winner)
  useEffect(() => {
    const grandFinalsMatches = tournament.matches.filter(
      (m: Match) => m.bracket === "grandFinals"
    );
    const hasCompletedGrandFinals = grandFinalsMatches.some(
      (m: Match) => m.winner
    );

    if (hasCompletedGrandFinals) {
      setShowCompletionModal(true);
    }
  }, [tournament]);

  const getTournamentResults = () => {
    const grandFinalsMatches = tournament.matches.filter(
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
      const totalScore1 = lastMatch.games.reduce(
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          {Array.isArray(tournament.players)
            ? tournament.players.length
            : tournament.players}{" "}
          Players - Managed by {tournament.manager}
        </Text>
        <TournamentBracketView tournament={tournament} readOnly={true} />
      </ScrollView>

      {/* Tournament Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tournament Completed!</Text>
            {results && (
              <>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Champion:</Text>
                  <Text style={styles.resultValue}>{results.champion}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Runner Up:</Text>
                  <Text style={styles.resultValue}>{results.runnerUp}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Final Score:</Text>
                  <Text style={styles.resultValue}>{results.finalScore}</Text>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCompletionModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
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
});

export default TournamentDetailsScreen;
