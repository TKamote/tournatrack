import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useNavigation } from "@react-navigation/native";

interface ManagerProfileScreenProps {
  route: any;
}

const ManagerProfileScreen: React.FC<ManagerProfileScreenProps> = ({
  route,
}) => {
  const navigation = useNavigation();
  // Mock data - will be replaced with real data later
  const manager = {
    name: "David",
    country: "Phil / Naga City",
    ageBracket: "40+",
    avatar: "D", // For now just initial, will be photo later
    tournamentsHosted: 12,
    starRating: 4.5,
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={20} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={20} color="#FFD700" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={20} color="#FFD700" />
        );
      }
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      {/* Back button outside ScrollView */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 55,
          left: 20,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: 12,
          borderRadius: 8,
          zIndex: 9999,
        }}
        onPress={() => {
          console.log("Back pressed!");
          navigation.goBack();
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: "white", fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{manager.avatar}</Text>
          </View>

          {/* Basic Info */}
          <Text style={styles.name}>{manager.name}</Text>
          <Text style={styles.country}>{manager.country}</Text>
          <Text style={styles.ageBracket}>{manager.ageBracket}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{manager.tournamentsHosted}</Text>
              <Text style={styles.statLabel}>Tournaments Hosted</Text>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rating</Text>
            <View style={styles.starsContainer}>
              {renderStars(manager.starRating)}
            </View>
            <Text style={styles.ratingText}>{manager.starRating}/5</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a252f",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 110,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
    zIndex: 999,
    elevation: 999,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 999,
    elevation: 999,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 16,
  },
  profileCard: {
    backgroundColor: "rgba(34, 48, 66, 0.8)",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(52, 152, 219, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  country: {
    fontSize: 18,
    color: "#bdc3c7",
    marginBottom: 6,
  },
  ageBracket: {
    fontSize: 16,
    color: "#bdc3c7",
    marginBottom: 32,
  },
  statsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4fc3f7",
  },
  statLabel: {
    fontSize: 14,
    color: "#bdc3c7",
    marginTop: 4,
  },
  ratingContainer: {
    alignItems: "center",
  },
  ratingLabel: {
    fontSize: 16,
    color: "#bdc3c7",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ManagerProfileScreen;
