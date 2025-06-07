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
              onPress={() => handleTournamentSelect("Double Elimination", 6)}
            >
              <Text style={styles.buttonText}>6 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleTournamentSelect("Double Elimination", 8)}
            >
              <Text style={styles.buttonText}>8 Players</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Single Elimination Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Single Knockout</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleTournamentSelect("Single Knockout", 4)}
            >
              <Text style={styles.buttonText}>4 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleTournamentSelect("Single Knockout", 8)}
            >
              <Text style={styles.buttonText}>8 Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleTournamentSelect("Single Knockout", 16)}
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
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.homeScreenTitleText,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.homeScreenSubtitleText,
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: COLORS.homeScreenSectionBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  featuredSection: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.homeScreenSectionBackground,
  },
  featuredTag: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.homeScreenAccent,
    marginBottom: 16,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default HomeScreen;
