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
              Your privacy is important to us. This policy explains how we
              handle your information.
            </Text>

            <Text style={styles.subtitle}>1. Data Collection</Text>
            <Text style={styles.paragraph}>
              TournaTrack does not collect, store, or transmit any personal
              data. All tournament information is stored locally on your device.
            </Text>

            <Text style={styles.subtitle}>2. No Tracking</Text>
            <Text style={styles.paragraph}>
              We do not use tracking technologies, cookies, or analytics
              services. Your tournament data remains private and local to your
              device.
            </Text>

            <Text style={styles.subtitle}>3. Third-Party Services</Text>
            <Text style={styles.paragraph}>
              This app does not integrate with third-party services that would
              collect or process your personal information.
            </Text>

            <Text style={styles.subtitle}>4. Data Security</Text>
            <Text style={styles.paragraph}>
              Since no data is transmitted or stored externally, your tournament
              information is as secure as your device itself.
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
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these terms or privacy policy,
              please contact us through the app store review system. Alternatively you can visit www.TournaTrack@PDFReportMaker.com
            </Text>

            <Text style={styles.paragraph}>
              Last updated: {new Date().toLocaleDateString()}
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
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 14,
    color: COLORS.textMedium,
    flex: 1,
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});

export default TermsOfUseScreen;
