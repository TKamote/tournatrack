import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { Match, Player, TournamentType, MatchFormat } from "../types";
import { generateTournamentPDF } from "../utils/pdfGenerator";

interface TournamentSummaryModalProps {
  visible: boolean;
  winner: Player | null;
  runnerUp: Player | null;
  finalMatch: Match | null;
  matches?: Match[];
  tournamentType?: string;
  matchFormat?: MatchFormat;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const TournamentSummaryModal: React.FC<TournamentSummaryModalProps> = ({
  visible,
  onClose,
  winner,
  runnerUp,
  finalMatch,
  matches = [],
  tournamentType = "Tournament",
  matchFormat,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!winner || !finalMatch) return null;

  const winnerScore = finalMatch.games.filter(
    (g) => g.winner?.id === winner.id
  ).length;
  const runnerUpScore = runnerUp
    ? finalMatch.games.filter((g) => g.winner?.id === runnerUp.id).length
    : 0;

  const handleGeneratePDF = async () => {
    if (!winner || !matchFormat) {
      Alert.alert("Error", "Missing tournament data for PDF generation.");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generateTournamentPDF({
        tournamentType,
        winner,
        runnerUp,
        matches: matches.length > 0 ? matches : [finalMatch],
        matchFormat,
        completedDate: new Date(),
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to generate PDF. Please try again."
      );
      console.error("PDF generation error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible && !!winner}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <Animated.View
          style={[
            styles.modalView,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, SCREEN_HEIGHT],
                    outputRange: [0, SCREEN_HEIGHT],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.titleText}>Tournament Completed!</Text>

          <View style={styles.resultContainer}>
            <Text style={styles.winnerText}>Champion</Text>
            <Text style={styles.playerName}>{winner.name}</Text>

            {runnerUp && (
              <>
                <Text style={styles.runnerUpText}>Runner Up</Text>
                <Text style={styles.playerName}>{runnerUp.name}</Text>
              </>
            )}

            <Text style={styles.scoreText}>
              Final Score: {winnerScore} - {runnerUpScore}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.pdfButton]}
              onPress={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={COLORS.textWhite}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Generate PDF</Text>
                </>
              )}
            </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: COLORS.glassmorphism.modalBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    margin: 20,
    width: "90%",
    borderWidth: 4,
    borderColor: "#FFD700",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textWhite,
    marginBottom: 20,
    textAlign: "center",
  },
  resultContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  winnerText: {
    fontSize: 16,
    color: COLORS.textWhite,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  runnerUpText: {
    fontSize: 14,
    color: COLORS.textWhite,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "center",
  },
  playerName: {
    fontSize: 18,
    color: COLORS.textWhite,
    marginBottom: 10,
    textAlign: "center",
  },
  scoreText: {
    fontSize: 14,
    color: COLORS.textWhite,
    marginTop: 10,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  button: {
    backgroundColor: COLORS.glassmorphism.background,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pdfButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default TournamentSummaryModal;
