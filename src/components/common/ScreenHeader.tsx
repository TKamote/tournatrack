import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors"; // Updated path with additional ../

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void; // Keep this optional for other screens
  showBack?: boolean; // Add this prop
  titleColor?: string;
  subtitleColor?: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  titleColor,
  subtitleColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, titleColor && { color: titleColor }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subTitle,
                subtitleColor && { color: subtitleColor },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 10,
    // backgroundColor: COLORS.backgroundWhite,
  },
  headerControls: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
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
