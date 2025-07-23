import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Tournament, Match } from "../../types";

type TournamentBracketViewProps = {
  tournament: Tournament;
  readOnly?: boolean;
};

const TournamentBracketView: React.FC<TournamentBracketViewProps> = ({
  tournament,
  readOnly,
}) => {
  // Group matches by round instead of bracket
  const groupMatchesByRound = () => {
    const grouped: { [key: string]: Match[] } = {};

    tournament.matches.forEach((match: Match) => {
      const round = match.round;
      if (!grouped[round]) {
        grouped[round] = [];
      }
      grouped[round].push(match);
    });

    return grouped;
  };

  const groupedMatches = groupMatchesByRound();

  const getBracketDisplayName = (bracket: string) => {
    switch (bracket) {
      case "winners":
        return "Winners Bracket";
      case "losers":
        return "Losers Bracket";
      case "grandFinals":
        return "Grand Finals";
      case "main":
        return "Main Bracket";
      default:
        return "Bracket";
    }
  };

  const getPlayerDisplayName = (player: any, losses: number = 0) => {
    const name = player?.name ?? player;
    // Clean the name by removing existing loss suffixes first
    const cleanName = name.replace(/ L[0-2]$/, "");

    // For Double Elimination, show loss count for active matches, but clean names for completed tournaments
    if (
      tournament.type === "Double Elimination" &&
      tournament.status !== "completed"
    ) {
      return `${cleanName} L${losses}`;
    }
    return cleanName;
  };

  const getMatchScore = (match: Match) => {
    // Always calculate scores from games, even if match is not completed
    if (!match.games || match.games.length === 0) {
      return { score1: 0, score2: 0 };
    }

    // Count games won by each player (live scores)
    const player1Games = match.games.filter(
      (g) => g.winner?.id === match.player1?.id
    ).length;
    const player2Games = match.games.filter(
      (g) => g.winner?.id === match.player2?.id
    ).length;

    return { score1: player1Games, score2: player2Games };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tournamentTitle}>{tournament.type} Bracket</Text>
      <Text style={styles.formatText}>
        {tournament.format?.label || "Race to 3"}
      </Text>

      {Object.entries(groupedMatches)
        .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort rounds numerically
        .map(([round, matches]) => {
          return (
            <View key={round} style={styles.roundSection}>
              <View style={styles.roundHeader}>
                <View style={styles.roundBar} />
                <Text style={styles.roundTitle}>Round {round}</Text>
              </View>

              {matches.map((match, idx) => {
                const bracketName = getBracketDisplayName(
                  match.bracket || "winners"
                );
                const { score1, score2 } = getMatchScore(match);

                return (
                  <View key={idx} style={styles.matchCard}>
                    <Text style={styles.matchNumber}>
                      {bracketName}: R{round} - M{idx + 1}
                    </Text>
                    <View style={styles.matchContent}>
                      <View style={styles.playerRow}>
                        <Text
                          style={[
                            styles.playerName,
                            match.winner?.name === match.player1?.name &&
                              styles.winner,
                          ]}
                        >
                          {getPlayerDisplayName(match.player1, 0)}
                        </Text>
                        <Text
                          style={[
                            styles.score,
                            match.winner?.name === match.player1?.name &&
                              styles.winningScore,
                          ]}
                        >
                          {score1}
                        </Text>
                      </View>
                      <View style={styles.playerRow}>
                        <Text
                          style={[
                            styles.playerName,
                            match.winner?.name === match.player2?.name &&
                              styles.winner,
                          ]}
                        >
                          {getPlayerDisplayName(match.player2, 1)}
                        </Text>
                        <Text
                          style={[
                            styles.score,
                            match.winner?.name === match.player2?.name &&
                              styles.winningScore,
                          ]}
                        >
                          {score2}
                        </Text>
                      </View>
                    </View>
                    {match.winner && (
                      <Text style={styles.winnerText}>
                        Winner: {getPlayerDisplayName(match.winner)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

      {!readOnly && (
        <Button
          title="Advance Round"
          onPress={() => {
            /* ... */
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
  },
  tournamentTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  formatText: {
    color: "#bdc3c7",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  bracketSection: {
    marginBottom: 20,
  },
  bracketHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bracketBar: {
    width: 4,
    height: 20,
    backgroundColor: "#3498db",
    marginRight: 8,
    borderRadius: 2,
  },
  bracketTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  matchCard: {
    backgroundColor: "#223042",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  matchNumber: {
    color: "#bdc3c7",
    fontSize: 12,
    marginBottom: 8,
  },
  matchContent: {
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  playerName: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  winner: {
    color: "#3498db",
    fontWeight: "bold",
  },
  score: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  winningScore: {
    color: "#2ecc71",
    fontWeight: "bold",
  },
  winnerText: {
    color: "#bdc3c7",
    fontSize: 12,
    fontStyle: "italic",
  },
  roundSection: {
    marginBottom: 20,
  },
  roundHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roundBar: {
    width: 4,
    height: 20,
    backgroundColor: "#3498db",
    marginRight: 8,
    borderRadius: 2,
  },
  roundTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TournamentBracketView;
