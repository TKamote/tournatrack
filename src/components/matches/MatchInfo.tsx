import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import { BracketType } from "../../types";

interface MatchInfoProps {
  round: number;
  matchNumber: number;
  bracket: BracketType;
}

export const MatchInfo: React.FC<MatchInfoProps> = ({
  round,
  matchNumber,
  bracket,
}) => {
  const getBracketText = (bracket: BracketType) => {
    switch (bracket) {
      case "winners":
        return "Winners Bracket";
      case "losers":
        return "Losers Bracket";
      case "grandFinals":
        return "Grand Finals";
      default:
        return "";
    }
  };

  // Get correct match number based on bracket and round
  const getDisplayMatchNumber = () => {
    return matchNumber;
  };

  // Get correct round number
  const getDisplayRound = () => {
    return round;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.bracketText}>{getBracketText(bracket)}: </Text>
      <Text style={styles.matchText}>
        R {getDisplayRound()} - M {getDisplayMatchNumber()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  matchText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  bracketText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
});
