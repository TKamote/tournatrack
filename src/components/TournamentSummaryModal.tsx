import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { COLORS } from "../constants/colors";
// Update the import path below if your types are located elsewhere, e.g. '../../types'
import { Match, Player, TournamentType } from "../types";

interface TournamentSummaryModalProps {
  visible: boolean;
  winner: Player | null; // Changed from Player
  runnerUp: Player | null; // Changed from Player
  finalMatch: Match | null; // Changed from Match
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const TournamentSummaryModal: React.FC<TournamentSummaryModalProps> = ({
  visible,
  onClose,
  winner,
  runnerUp,
  finalMatch,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
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
  button: {
    backgroundColor: COLORS.glassmorphism.background,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TournamentSummaryModal;
