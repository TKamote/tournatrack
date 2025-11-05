import React from "react";
import { View, StyleSheet } from "react-native";
import { Match } from "../../../types";
import { COLORS } from "../../../constants/colors";

interface BracketConnectionsProps {
  matches: Match[];
}

const BracketConnections: React.FC<BracketConnectionsProps> = ({ matches }) => {
  // This component will handle the visual connections between matches
  // For now, we'll create a placeholder that can be enhanced with SVG lines later

  return (
    <View style={styles.container}>
      {/* TODO: Implement SVG lines connecting matches */}
      {/* This will require:
          1. Calculating positions of match cards
          2. Drawing lines between winners and next round matches
          3. Different line styles for winners/losers brackets
          4. Arrows showing flow direction
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none", // Allow touches to pass through
  },
});

export default BracketConnections;
