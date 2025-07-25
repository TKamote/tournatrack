import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import { TournamentType } from "../types";
import { COLORS } from "../constants/colors";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleTournamentSelect = (type: TournamentType, players: number) => {
    navigation.navigate("PlayerInput", {
      tournamentType: type,
      numPlayers: players,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>TournaTrack</Text>
        <Text style={styles.subtitle}>Create and manage your tournaments</Text>

        {/* Double Elimination Section - Featured */}
        <View style={[styles.section, styles.featuredSection]}>
          <Text style={styles.sectionTitle}>Double Elimination</Text>
          <Text style={styles.featuredTag}>FEATURED</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PlayerInput4")}
            >
              <Text style={styles.buttonText}>4 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PlayerInput8")}
            >
              <Text style={styles.buttonText}>8 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PlayerInput16")}
            >
              <Text style={styles.buttonText}>16 Players</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Single Elimination Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Single Knockout</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PlayerInputSingle4")}
            >
              <Text style={styles.buttonText}>4 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PlayerInputSingle8")}
            >
              <Text style={styles.buttonText}>8 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("PlayerInputSingle16")}
            >
              <Text style={styles.buttonText}>16 Players</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.homeScreenBackground,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.glassmorphism.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.glassmorphism.textSecondary,
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  featuredSection: {
    borderWidth: 2,
    borderColor: COLORS.glassmorphism.borderMedium,
    backgroundColor: COLORS.glassmorphism.backgroundMedium,
  },
  featuredTag: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: COLORS.glassmorphism.backgroundMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: COLORS.glassmorphism.text,
    fontSize: 12,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.glassmorphism.text,
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: COLORS.glassmorphism.backgroundMedium,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  buttonText: {
    color: COLORS.glassmorphism.text,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default HomeScreen;
