import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import { BracketType } from "../../types";

interface RoundSeparatorProps {
  round: number;
  bracket: BracketType;
}

export const RoundSeparator: React.FC<{
  round: number;
  bracket: BracketType;
}> = ({ round, bracket }) => {
  const getBracketDisplay = () => {
    switch (bracket) {
      case "winners":
        return `Winners Bracket - Round ${round}`;
      case "losers":
        return `Losers Bracket - Round ${round}`;
      case "grandFinals":
        return "Grand Finals";
      default:
        return `Round ${round}`;
    }
  };

  return (
    <View style={styles.roundSeparator}>
      <Text style={styles.roundSeparatorText}>{getBracketDisplay()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  roundSeparator: {
    backgroundColor: COLORS.backgroundLight,
    padding: 8,
    marginVertical: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  roundSeparatorText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
});
