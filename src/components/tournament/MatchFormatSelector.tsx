import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { MatchFormat } from "../../types";

interface MatchFormatSelectorProps {
  selectedFormat: MatchFormat;
  onFormatSelect: (format: MatchFormat) => void;
}

const MatchFormatSelector: React.FC<MatchFormatSelectorProps> = ({
  selectedFormat,
  onFormatSelect,
}) => {
  const formatOptions: MatchFormat[] = [
    { type: "raceTo", gamesNeededToWin: 3, label: "Race to 3" },
    { type: "raceTo", gamesNeededToWin: 5, label: "Race to 5" },
    { type: "raceTo", gamesNeededToWin: 6, label: "Race to 6" },
    { type: "raceTo", gamesNeededToWin: 7, label: "Race to 7" },
    { type: "raceTo", gamesNeededToWin: 9, label: "Race to 9" },
    { type: "raceTo", gamesNeededToWin: 11, label: "Race to 11" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Race Format</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.formatContainer}>
          {formatOptions.map((format) => (
            <TouchableOpacity
              key={format.label}
              style={[
                styles.formatButton,
                selectedFormat.gamesNeededToWin === format.gamesNeededToWin &&
                  styles.formatButtonSelected,
              ]}
              onPress={() => onFormatSelect(format)}
            >
              <Text
                style={[
                  styles.formatButtonText,
                  selectedFormat.gamesNeededToWin === format.gamesNeededToWin &&
                    styles.formatButtonTextSelected,
                ]}
              >
                {format.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.homeScreenAccent,
    marginBottom: 16,
    textAlign: "center",
  },
  scrollView: {
    marginHorizontal: -16,
  },
  formatContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
  },
  formatButton: {
    backgroundColor: COLORS.homeScreenSectionBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  formatButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  formatButtonText: {
    color: COLORS.homeScreenAccent,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  formatButtonTextSelected: {
    color: COLORS.textWhite,
  },
});

export default MatchFormatSelector;
