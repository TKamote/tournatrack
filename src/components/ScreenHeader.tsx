import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBackButton = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subTitle}>{subtitle}</Text>}
        </View>
        {/* Empty View for layout balance when back button is shown */}
        {showBackButton && <View style={styles.backButton} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
  },
  headerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
    width: 80, // Fixed width to ensure title stays centered
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    color: COLORS.textDark,
  },
  subTitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: COLORS.textMedium,
  },
});

export default ScreenHeader;
