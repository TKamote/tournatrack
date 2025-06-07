import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { authService } from "../../services/auth.service";
import { COLORS } from "../../constants/colors";

export const GoogleSignIn: React.FC = () => {
  const handleSignIn = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleSignIn}>
      <Text style={styles.buttonText}>Sign in with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});
