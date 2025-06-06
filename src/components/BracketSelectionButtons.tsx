import React from "react";
import { View, Button } from "react-native";
import { BracketType } from "../types";

interface BracketSelectionButtonsProps {
  activeBracket: BracketType | "all";
  onBracketChange: (bracket: BracketType | "all") => void;
  showButtons: boolean;
}

const BracketSelectionButtons: React.FC<BracketSelectionButtonsProps> = ({
  activeBracket,
  onBracketChange,
  showButtons,
}) => {
  if (!showButtons) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        marginVertical: 10,
      }}
    >
      <Button
        title="WB"
        onPress={() => onBracketChange("winners")}
        disabled={activeBracket === "winners"}
      />
      <View style={{ width: 10 }} />
      <Button
        title="LB"
        onPress={() => onBracketChange("losers")}
        disabled={activeBracket === "losers"}
      />
      <View style={{ width: 10 }} />
      <Button
        title="All"
        onPress={() => onBracketChange("all")}
        disabled={activeBracket === "all"}
      />
    </View>
  );
};

export default BracketSelectionButtons;
