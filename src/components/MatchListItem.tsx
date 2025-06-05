import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Match, Player, TournamentType } from "../types"; // Adjust path if your types.ts is elsewhere
import { COLORS } from "../constants/colors"; // Adjust path if your colors.ts is elsewhere

interface MatchListItemProps {
  item: Match;
  players: Player[];
  tournamentType: TournamentType;
  isMatchLocked: (match: Match) => boolean;
  onSetWinner: (matchId: string, winner: Player) => void;
}

const MatchListItem: React.FC<MatchListItemProps> = ({
  item,
  players,
  tournamentType,
  isMatchLocked,
  onSetWinner,
}) => {
  const player1 = players.find((p) => p.id === item.player1?.id);
  const player2 = players.find((p) => p.id === item.player2?.id);

  const player1Name = player1
    ? `${player1.name} (${player1.losses}L)`
    : item.player1
    ? "P1?" // Should ideally not happen if players array is synced
    : "TBD";
  const player2Name = player2
    ? `${player2.name} (${player2.losses}L)`
    : item.player2
    ? "P2?" // Should ideally not happen
    : "TBD / BYE";

  const displayP1Name = tournamentType.startsWith("Single Knockout")
    ? player1?.name || "TBD"
    : player1Name;
  const displayP2Name = tournamentType.startsWith("Single Knockout")
    ? player2?.name || "TBD / BYE"
    : player2Name;

  const matchIsEffectivelyLocked = isMatchLocked(item);

  if (item.player1 && !item.player2 && item.winner) {
    // BYE match display
    return (
      <View style={styles.matchContainer}>
        <Text style={styles.bracketInfoText}>
          {item.bracket.toUpperCase()} - R{item.round} M{item.matchNumber}
        </Text>
        <Text style={styles.matchText}>{displayP1Name} gets a BYE</Text>
        {matchIsEffectivelyLocked && (
          <Text style={styles.lockedMatchText}>Locked</Text>
        )}
      </View>
    );
  }

  if (item.player1 && item.player2) {
    // Standard match display
    return (
      <View style={styles.matchContainer}>
        <Text style={styles.bracketInfoText}>
          {item.bracket.toUpperCase()} - R{item.round} M{item.matchNumber}
        </Text>
        <View style={styles.playerRow}>
          <TouchableOpacity
            style={[
              styles.playerButton,
              item.winner?.id === item.player1.id && styles.winnerButton,
              matchIsEffectivelyLocked && styles.playerButtonDisabled,
            ]}
            onPress={() =>
              item.player1 && onSetWinner(item.id, item.player1)
            }
            disabled={matchIsEffectivelyLocked || !item.player1}
          >
            <Text style={styles.playerButtonText}>{displayP1Name}</Text>
          </TouchableOpacity>
          <Text style={styles.vsText}>vs</Text>
          <TouchableOpacity
            style={[
              styles.playerButton,
              item.winner?.id === item.player2.id && styles.winnerButton,
              matchIsEffectivelyLocked && styles.playerButtonDisabled,
            ]}
            onPress={() =>
              item.player2 && onSetWinner(item.id, item.player2)
            }
            disabled={matchIsEffectivelyLocked || !item.player2}
          >
            <Text style={styles.playerButtonText}>{displayP2Name}</Text>
          </TouchableOpacity>
        </View>
        {item.winner && (
          <Text style={styles.winnerText}>
            Winner: {players.find((p) => p.id === item.winner!.id)?.name}
          </Text>
        )}
        {matchIsEffectivelyLocked && item.winner && (
          <Text style={styles.lockedMatchText}>Locked</Text>
        )}
      </View>
    );
  }

  // Fallback for TBD vs TBD matches (e.g., future rounds not yet populated)
  return (
    <View style={styles.matchContainer}>
      <Text style={styles.bracketInfoText}>
        {item.bracket.toUpperCase()} - R{item.round} M{item.matchNumber}
      </Text>
      <Text style={styles.matchText}>
        {displayP1Name} vs {displayP2Name}
      </Text>
      {item.winner && ( // Should not happen for TBD vs TBD, but good for safety
        <Text style={styles.winnerText}>
          Winner: {players.find((p) => p.id === item.winner!.id)?.name}
        </Text>
      )}
      {matchIsEffectivelyLocked && item.winner && ( // If a future match somehow got locked
        <Text style={styles.lockedMatchText}>Locked</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  matchContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
  },
  bracketInfoText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 5,
  },
  playerButtonText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  playerButtonDisabled: {
    backgroundColor: COLORS.secondaryLight, // Using secondaryLight for disabled
  },
  winnerButton: {
    backgroundColor: COLORS.successBackground,
    borderColor: COLORS.successBorder,
  },
  vsText: {
    marginHorizontal: 5,
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textDark,
  },
  matchText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  winnerText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.success,
    textAlign: "center",
  },
  lockedMatchText: {
    fontSize: 10,
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 3,
  },
});

export default MatchListItem;