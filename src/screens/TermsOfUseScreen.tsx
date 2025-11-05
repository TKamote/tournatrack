import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { COLORS } from "../constants/colors";
import ScreenHeader from "../components/ScreenHeader";

const TermsOfUseScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title="Terms of Use & Privacy Policy"
          subtitle="App Information"
          showBack={false}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms of Use</Text>
            <Text style={styles.paragraph}>
              Welcome to TournaTrack. By using this app, you agree to these
              terms of use.
            </Text>

            <Text style={styles.subtitle}>1. App Usage</Text>
            <Text style={styles.paragraph}>
              TournaTrack is designed for tournament management and bracket
              creation. You may use this app for personal and non-commercial
              purposes.
            </Text>

            <Text style={styles.subtitle}>2. No Warranty</Text>
            <Text style={styles.paragraph}>
              This app is provided "as is" without any warranties. We do not
              guarantee that the app will be error-free or uninterrupted.
            </Text>

            <Text style={styles.subtitle}>3. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              We shall not be liable for any damages arising from the use of
              this app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <Text style={styles.paragraph}>
              EFFECTIVE DATE: {new Date().toLocaleDateString()}
            </Text>

            <Text style={styles.paragraph}>
              Welcome to TournaTrack. We respect your privacy and are committed
              to protecting your personal data. This Privacy Policy explains how
              we handle any information when using our tournament management
              app.
            </Text>

            <Text style={styles.subtitle}>Information We Collect</Text>
            <Text style={styles.paragraph}>
              TournaTrack only accesses the following data to provide its core
              functionality:
            </Text>

            <Text style={styles.paragraph}>
              1. User-Provided Tournament Data: Any information you enter into
              the app (such as player names, match results, tournament brackets)
              is used only for tournament management and is not transmitted to
              our servers.
            </Text>

            <Text style={styles.subtitle}>How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              All data processing occurs locally on your device. We use your
              information only to:
            </Text>
            <Text style={styles.paragraph}>
              • Generate and manage tournament brackets
            </Text>
            <Text style={styles.paragraph}>
              • Track match results and player progress
            </Text>
            <Text style={styles.paragraph}>
              • Display tournament information and statistics
            </Text>

            <Text style={styles.subtitle}>Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              Local Storage Only: All data (including player names, match
              results, and tournament brackets) is stored locally on your
              device.
            </Text>
            <Text style={styles.paragraph}>
              • No External Servers: We do not collect, transmit, or store any
              of your information on external servers.
            </Text>
            <Text style={styles.paragraph}>
              • No Analytics: We do not use any analytics tools to track your
              app usage.
            </Text>

            <Text style={styles.subtitle}>Sharing Your Information</Text>
            <Text style={styles.paragraph}>
              We do not share your personal information with third parties. Your
              tournament data remains completely private and local to your
              device.
            </Text>

            <Text style={styles.subtitle}>Age Requirements</Text>
            <Text style={styles.paragraph}>
              Our app is intended for users 17 years of age and older. We do not
              knowingly collect personal information from users under 17 years
              of age. This age requirement helps ensure responsible use of
              tournament management features.
            </Text>

            <Text style={styles.subtitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              Since all data is stored locally on your device, you have complete
              control over your tournament information. You can manage your data
              directly within the app or through your device's settings.
            </Text>

            <Text style={styles.subtitle}>Changes to This Privacy Policy</Text>
            <Text style={styles.paragraph}>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Effective Date" at the top.
            </Text>

            <Text style={styles.subtitle}>International Data Transfers</Text>
            <Text style={styles.paragraph}>
              Since all data remains on your device, no international data
              transfers occur.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tournament Progression Reference
            </Text>
            <Text style={styles.paragraph}>
              Below are the progression charts for each tournament type. You can
              reference these to understand how brackets advance round by round.
            </Text>

            <Text style={styles.subtitle}>Single Elimination (4 Players)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Round</Text>
                <Text style={styles.tableHeader}>Matches</Text>
                <Text style={styles.tableHeader}>Players</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>2 matches</Text>
                <Text style={styles.tableCell}>4 → 2</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>2 (Final)</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>2 → 1</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Single Elimination (8 Players)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Round</Text>
                <Text style={styles.tableHeader}>Matches</Text>
                <Text style={styles.tableHeader}>Players</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>4 matches</Text>
                <Text style={styles.tableCell}>8 → 4</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>2</Text>
                <Text style={styles.tableCell}>2 matches</Text>
                <Text style={styles.tableCell}>4 → 2</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3 (Final)</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>2 → 1</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Single Elimination (16 Players)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Round</Text>
                <Text style={styles.tableHeader}>Matches</Text>
                <Text style={styles.tableHeader}>Players</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>8 matches</Text>
                <Text style={styles.tableCell}>16 → 8</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>2</Text>
                <Text style={styles.tableCell}>4 matches</Text>
                <Text style={styles.tableCell}>8 → 4</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>2 matches</Text>
                <Text style={styles.tableCell}>4 → 2</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>4 (Final)</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>2 → 1</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Double Elimination (4 Players)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Round</Text>
                <Text style={styles.tableHeader}>Winners Bracket</Text>
                <Text style={styles.tableHeader}>Losers Bracket</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>2 matches</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>2</Text>
                <Text style={styles.tableCell}>1 final</Text>
                <Text style={styles.tableCell}>1 match</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>-</Text>
                <Text style={styles.tableCell}>1 final</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>4 (Grand Finals)</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>5 (Reset)*</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Double Elimination (8 Players)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Round</Text>
                <Text style={styles.tableHeader}>Winners Bracket</Text>
                <Text style={styles.tableHeader}>Losers Bracket</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>4 matches</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>2</Text>
                <Text style={styles.tableCell}>2 matches</Text>
                <Text style={styles.tableCell}>2 matches</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>1 final</Text>
                <Text style={styles.tableCell}>2 matches</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>4</Text>
                <Text style={styles.tableCell}>-</Text>
                <Text style={styles.tableCell}>1 final</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>5 (Grand Finals)</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>6 (Reset)*</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
            </View>

            <Text style={styles.subtitle}>Double Elimination (16 Players)</Text>
            <View style={styles.tableContainer}>
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Round</Text>
                <Text style={styles.tableHeader}>Winners Bracket</Text>
                <Text style={styles.tableHeader}>Losers Bracket</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>1</Text>
                <Text style={styles.tableCell}>8 matches</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>2</Text>
                <Text style={styles.tableCell}>4 matches</Text>
                <Text style={styles.tableCell}>4 matches</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>3</Text>
                <Text style={styles.tableCell}>2 matches</Text>
                <Text style={styles.tableCell}>4 matches</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>4</Text>
                <Text style={styles.tableCell}>1 final</Text>
                <Text style={styles.tableCell}>3 matches</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>5</Text>
                <Text style={styles.tableCell}>-</Text>
                <Text style={styles.tableCell}>2 matches</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>6</Text>
                <Text style={styles.tableCell}>-</Text>
                <Text style={styles.tableCell}>1 final</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>7 (Grand Finals)</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>8 (Reset)*</Text>
                <Text style={styles.tableCell}>1 match</Text>
                <Text style={styles.tableCell}>-</Text>
              </View>
            </View>

            <Text style={styles.paragraph}>
              * Bracket Reset: If the losers bracket champion wins the first
              Grand Finals match, a second match is played to determine the true
              champion.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy or Terms of
              Use, please contact us at:
            </Text>
            <Text style={styles.paragraph}>
              • Email: support@tournatracker.com
            </Text>
            <Text style={styles.paragraph}>
              • App Store Reviews: You can also contact us through the app store
              review system
            </Text>

            <Text style={styles.paragraph}>
              By using our app, you consent to our Privacy Policy and Terms of
              Use.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 20,
    color: COLORS.textMedium,
    marginBottom: 12,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: COLORS.backgroundDark,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
  },
  tableHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 12,
    color: COLORS.textMedium,
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});

export default TermsOfUseScreen;
 