import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

interface PrimaryButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: any; // You can make this more specific with ViewStyle if needed
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onPress,
  title,
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    elevation: 2,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: COLORS.secondary,
  },
  buttonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PrimaryButton;
