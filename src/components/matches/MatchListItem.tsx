import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Match, Player } from "../../types";
import { COLORS } from "../../constants/colors";
import { MatchResults } from "./MatchResults";
import { MatchInfo } from "./MatchInfo";

interface MatchListItemProps {
  item: Match;
  players: Player[];
  tournamentType: string;
  isMatchLocked: (match: Match) => boolean;
  onSetWinner: (matchId: string, winner: Player) => void;
  onGameResult: (
    matchId: string,
    winner: Player,
    score1: number,
    score2: number
  ) => void;
}

const MatchListItem: React.FC<MatchListItemProps> = ({
  item,
  isMatchLocked,
  onGameResult,
  onSetWinner,
}) => {
  const handleScore = (player: Player, isPlayer1: boolean) => {
    // Only allow scoring if match isn't locked and no winner yet
    if (isMatchLocked(item) || item.winner) return;

    // Add game result
    onGameResult(item.id, player, isPlayer1 ? 1 : 0, isPlayer1 ? 0 : 1);
  };

  const PlayerDisplay = ({ player }: { player: Player }) => (
    <Text style={styles.playerName}>
      {player.name} {player.losses > 0 ? `(L${player.losses})` : ""}
    </Text>
  );

  return (
    <View style={styles.container}>
      <MatchInfo
        round={item.round}
        matchNumber={item.matchNumber}
        bracket={item.bracket}
      />
      <MatchResults
        match={item}
        onScore={handleScore}
        isLocked={isMatchLocked(item)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerName: {
    // Add your styles for playerName here
  },
});

export default MatchListItem;
