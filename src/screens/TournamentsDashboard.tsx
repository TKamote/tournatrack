import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TournamentsDashboard: React.FC<any> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tournaments Dashboard</Text>
      <Text style={styles.subtitle}>
        This is where your tournaments will be listed.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a252f",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#bdc3c7",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default TournamentsDashboard;
