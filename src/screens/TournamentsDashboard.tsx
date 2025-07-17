import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tournament, Match, Game } from "../types";

// Helper function to convert old mock data format to new Match format
const convertOldMatchToNewFormat = (oldMatch: any): Match => {
  const games: Game[] = [];

  // If the old match has score1 and score2, create a single game
  if (oldMatch.score1 !== undefined && oldMatch.score2 !== undefined) {
    games.push({
      id: `${oldMatch.round}-${oldMatch.bracket}-game-1`,
      winner: oldMatch.winner,
      score1: oldMatch.score1,
      score2: oldMatch.score2,
    });
  }

  return {
    id: `${oldMatch.round}-${oldMatch.bracket}-${oldMatch.matchNumber || 1}`,
    round: oldMatch.round,
    matchNumber: oldMatch.matchNumber || 1,
    player1: oldMatch.player1,
    player2: oldMatch.player2,
    winner: oldMatch.winner,
    bracket: oldMatch.bracket,
    isGrandFinalsReset: oldMatch.isGrandFinalsReset || false,
    format: oldMatch.format || {
      type: "raceTo",
      gamesNeededToWin: 3,
      label: "Race to 3",
    },
    games,
    status: oldMatch.status || "completed",
    isLive: false,
    lastUpdated: new Date(),
    createdBy: "mock-data",
  };
};

// Helper function to convert old tournament data to new format
const convertOldTournamentToNewFormat = (oldTournament: any): Tournament => {
  const convertedMatches = oldTournament.matches.map(
    (match: any, index: number) =>
      convertOldMatchToNewFormat({ ...match, matchNumber: index + 1 })
  );

  return {
    id: `mock-${Date.now()}`,
    name: `${oldTournament.type} Tournament`,
    type: oldTournament.type,
    manager: oldTournament.manager,
    managerId: "mock-manager",
    players: Array.isArray(oldTournament.players)
      ? oldTournament.players.map((p: any, index: number) => ({
          id: `player-${index}`,
          name: p.name,
          seed: index + 1,
          losses: 0,
          isEliminated: false,
          totalMatches: 0,
          wins: 0,
          winPercentage: 0,
          averageScore: 0,
          isActive: true,
        }))
      : [],
    matches: convertedMatches,
    format: oldTournament.format || {
      type: "raceTo",
      gamesNeededToWin: 3,
      label: "Race to 3",
    },
    status: oldTournament.status || "in_progress",
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: true,
    maxPlayers: Array.isArray(oldTournament.players)
      ? oldTournament.players.length
      : oldTournament.players,
    currentRound: Math.max(...convertedMatches.map((m: Match) => m.round)),
    totalRounds: Math.max(...convertedMatches.map((m: Match) => m.round)),
  };
};

const TournamentsDashboard: React.FC<any> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Tournaments Dashboard</Text>
        <Text style={styles.subtitle}>
          This is where your tournaments will be listed.
        </Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              const oldTournamentData = {
                type: "Double Elimination",
                players: [
                  { name: "Alice" },
                  { name: "Bob" },
                  { name: "Carol" },
                  { name: "Dave" },
                  { name: "Eve" },
                  { name: "Frank" },
                  { name: "Grace" },
                  { name: "Henry" },
                ],
                matches: [
                  // Winners Bracket - Round 1
                  {
                    round: 1,
                    bracket: "winners",
                    player1: { name: "Seven" },
                    player2: { name: "One" },
                    winner: { name: "Seven" },
                    score1: 3,
                    score2: 0,
                  },
                  {
                    round: 1,
                    bracket: "winners",
                    player1: { name: "Six" },
                    player2: { name: "Eight" },
                    winner: { name: "Eight" },
                    score1: 0,
                    score2: 3,
                  },
                  {
                    round: 1,
                    bracket: "winners",
                    player1: { name: "Two" },
                    player2: { name: "Four" },
                    winner: { name: "Two" },
                    score1: 3,
                    score2: 0,
                  },
                  {
                    round: 1,
                    bracket: "winners",
                    player1: { name: "Five" },
                    player2: { name: "Three" },
                    winner: { name: "Five" },
                    score1: 3,
                    score2: 0,
                  },

                  // Winners Bracket - Round 2
                  {
                    round: 2,
                    bracket: "winners",
                    player1: { name: "Seven" },
                    player2: { name: "Eight" },
                    winner: { name: "Seven" },
                    score1: 3,
                    score2: 2,
                  },
                  {
                    round: 2,
                    bracket: "winners",
                    player1: { name: "Two" },
                    player2: { name: "Five" },
                    winner: { name: "Two" },
                    score1: 3,
                    score2: 2,
                  },

                  // Winners Bracket - Round 3
                  {
                    round: 3,
                    bracket: "winners",
                    player1: { name: "Seven" },
                    player2: { name: "Two" },
                    winner: { name: "Two" },
                    score1: 1,
                    score2: 3,
                  },

                  // Losers Bracket - Round 1
                  {
                    round: 1,
                    bracket: "losers",
                    player1: { name: "One" },
                    player2: { name: "Six" },
                    winner: { name: "One" },
                    score1: 3,
                    score2: 2,
                  },
                  {
                    round: 1,
                    bracket: "losers",
                    player1: { name: "Four" },
                    player2: { name: "Three" },
                    winner: { name: "Three" },
                    score1: 0,
                    score2: 3,
                  },

                  // Losers Bracket - Round 2
                  {
                    round: 2,
                    bracket: "losers",
                    player1: { name: "One" },
                    player2: { name: "Eight" },
                    winner: { name: "One" },
                    score1: 3,
                    score2: 2,
                  },
                  {
                    round: 2,
                    bracket: "losers",
                    player1: { name: "Three" },
                    player2: { name: "Five" },
                    winner: { name: "Three" },
                    score1: 3,
                    score2: 0,
                  },

                  // Losers Bracket - Round 3
                  {
                    round: 3,
                    bracket: "losers",
                    player1: { name: "One" },
                    player2: { name: "Three" },
                    winner: { name: "Three" },
                    score1: 2,
                    score2: 3,
                  },
                  {
                    round: 3,
                    bracket: "losers",
                    player1: { name: "Eight" },
                    player2: { name: "Five" },
                    winner: { name: "Eight" },
                    score1: 3,
                    score2: 0,
                  },

                  // Losers Bracket - Round 4
                  {
                    round: 4,
                    bracket: "losers",
                    player1: { name: "Three" },
                    player2: { name: "Eight" },
                    winner: { name: "Three" },
                    score1: 3,
                    score2: 1,
                  },

                  // Losers Bracket - Round 5
                  {
                    round: 5,
                    bracket: "losers",
                    player1: { name: "Seven" },
                    player2: { name: "Three" },
                    winner: { name: "Three" },
                    score1: 2,
                    score2: 3,
                  },

                  // Grand Finals
                  {
                    round: 6,
                    bracket: "grandFinals",
                    player1: { name: "Two" },
                    player2: { name: "Three" },
                    winner: { name: "Three" },
                    score1: 0,
                    score2: 3,
                  },
                  {
                    round: 6,
                    bracket: "grandFinals",
                    player1: { name: "Two" },
                    player2: { name: "Three" },
                    winner: { name: "Two" },
                    score1: 3,
                    score2: 1,
                  },
                ],
                manager: "David",
                format: { type: "raceTo", gamesNeededToWin: 3 },
                status: "ongoing",
              };

              const convertedTournament =
                convertOldTournamentToNewFormat(oldTournamentData);
              navigation.navigate("TournamentDetails", {
                tournament: convertedTournament,
              });
            }}
          >
            <Text style={styles.tournamentType}>Double Elimination</Text>
            <Text style={styles.tournamentDetails}>8 Players</Text>
            <Text style={styles.manager}>Manager: David</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("TournamentDetails", {
                tournament: {
                  type: "Double Elimination",
                  players: [
                    { name: "Alice" },
                    { name: "Bob" },
                    { name: "Carol" },
                    { name: "Dave" },
                  ],
                  matches: [
                    // Winners Bracket - Round 1
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Alice" },
                      player2: { name: "Bob" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Carol" },
                      player2: { name: "Dave" },
                      winner: { name: "Dave" },
                      score1: 2,
                      score2: 3,
                    },
                    // Winners Bracket - Round 2
                    {
                      round: 2,
                      bracket: "winners",
                      player1: { name: "Alice" },
                      player2: { name: "Dave" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 2,
                    },
                    // Losers Bracket - Round 1
                    {
                      round: 1,
                      bracket: "losers",
                      player1: { name: "Bob" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 1,
                      score2: 3,
                    },
                    // Losers Bracket - Round 2
                    {
                      round: 2,
                      bracket: "losers",
                      player1: { name: "Dave" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 2,
                      score2: 3,
                    },
                    // Grand Finals
                    {
                      round: 3,
                      bracket: "grandFinals",
                      player1: { name: "Alice" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 2,
                      score2: 3,
                    },
                    {
                      round: 3,
                      bracket: "grandFinals",
                      player1: { name: "Alice" },
                      player2: { name: "Carol" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                  ],
                  manager: "David",
                  format: {
                    type: "raceTo",
                    gamesNeededToWin: 3,
                    label: "Race to 3",
                  },
                  status: "ongoing",
                },
              })
            }
          >
            <Text style={styles.tournamentType}>Double Elimination</Text>
            <Text style={styles.tournamentDetails}>4 Players</Text>
            <Text style={styles.manager}>Manager: David</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("TournamentDetails", {
                tournament: {
                  type: "Double Elimination",
                  players: [
                    { name: "Alice" },
                    { name: "Bob" },
                    { name: "Carol" },
                    { name: "Dave" },
                    { name: "Eve" },
                    { name: "Frank" },
                    { name: "Grace" },
                    { name: "Henry" },
                    { name: "Ivy" },
                    { name: "Jack" },
                    { name: "Kathy" },
                    { name: "Leo" },
                    { name: "Mona" },
                    { name: "Nate" },
                    { name: "Olivia" },
                    { name: "Paul" },
                  ],
                  matches: [
                    // Winners Bracket - Round 1
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Alice" },
                      player2: { name: "Bob" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Carol" },
                      player2: { name: "Dave" },
                      winner: { name: "Carol" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Eve" },
                      player2: { name: "Frank" },
                      winner: { name: "Eve" },
                      score1: 3,
                      score2: 0,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Grace" },
                      player2: { name: "Henry" },
                      winner: { name: "Grace" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Ivy" },
                      player2: { name: "Jack" },
                      winner: { name: "Jack" },
                      score1: 1,
                      score2: 3,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Kathy" },
                      player2: { name: "Leo" },
                      winner: { name: "Kathy" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Mona" },
                      player2: { name: "Nate" },
                      winner: { name: "Mona" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "winners",
                      player1: { name: "Olivia" },
                      player2: { name: "Paul" },
                      winner: { name: "Paul" },
                      score1: 0,
                      score2: 3,
                    },
                    // Winners Bracket - Round 2
                    {
                      round: 2,
                      bracket: "winners",
                      player1: { name: "Alice" },
                      player2: { name: "Carol" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 2,
                      bracket: "winners",
                      player1: { name: "Eve" },
                      player2: { name: "Grace" },
                      winner: { name: "Grace" },
                      score1: 2,
                      score2: 3,
                    },
                    {
                      round: 2,
                      bracket: "winners",
                      player1: { name: "Jack" },
                      player2: { name: "Kathy" },
                      winner: { name: "Jack" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 2,
                      bracket: "winners",
                      player1: { name: "Mona" },
                      player2: { name: "Paul" },
                      winner: { name: "Paul" },
                      score1: 1,
                      score2: 3,
                    },
                    // Winners Bracket - Semifinals
                    {
                      round: 3,
                      bracket: "winners",
                      player1: { name: "Alice" },
                      player2: { name: "Grace" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 3,
                      bracket: "winners",
                      player1: { name: "Jack" },
                      player2: { name: "Paul" },
                      winner: { name: "Paul" },
                      score1: 2,
                      score2: 3,
                    },
                    // Winners Bracket - Final
                    {
                      round: 4,
                      bracket: "winners",
                      player1: { name: "Alice" },
                      player2: { name: "Paul" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    // Losers Bracket - Round 1
                    {
                      round: 1,
                      bracket: "losers",
                      player1: { name: "Bob" },
                      player2: { name: "Dave" },
                      winner: { name: "Dave" },
                      score1: 2,
                      score2: 3,
                    },
                    {
                      round: 1,
                      bracket: "losers",
                      player1: { name: "Frank" },
                      player2: { name: "Henry" },
                      winner: { name: "Henry" },
                      score1: 1,
                      score2: 3,
                    },
                    {
                      round: 1,
                      bracket: "losers",
                      player1: { name: "Ivy" },
                      player2: { name: "Leo" },
                      winner: { name: "Leo" },
                      score1: 2,
                      score2: 3,
                    },
                    {
                      round: 1,
                      bracket: "losers",
                      player1: { name: "Nate" },
                      player2: { name: "Olivia" },
                      winner: { name: "Olivia" },
                      score1: 0,
                      score2: 3,
                    },
                    // Losers Bracket - Round 2
                    {
                      round: 2,
                      bracket: "losers",
                      player1: { name: "Dave" },
                      player2: { name: "Eve" },
                      winner: { name: "Dave" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 2,
                      bracket: "losers",
                      player1: { name: "Henry" },
                      player2: { name: "Kathy" },
                      winner: { name: "Kathy" },
                      score1: 1,
                      score2: 3,
                    },
                    {
                      round: 2,
                      bracket: "losers",
                      player1: { name: "Leo" },
                      player2: { name: "Mona" },
                      winner: { name: "Leo" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 2,
                      bracket: "losers",
                      player1: { name: "Olivia" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 0,
                      score2: 3,
                    },
                    // Losers Bracket - Round 3
                    {
                      round: 3,
                      bracket: "losers",
                      player1: { name: "Dave" },
                      player2: { name: "Kathy" },
                      winner: { name: "Kathy" },
                      score1: 2,
                      score2: 3,
                    },
                    {
                      round: 3,
                      bracket: "losers",
                      player1: { name: "Leo" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 1,
                      score2: 3,
                    },
                    // Losers Bracket - Round 4
                    {
                      round: 4,
                      bracket: "losers",
                      player1: { name: "Kathy" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 2,
                      score2: 3,
                    },
                    // Losers Bracket - Round 5
                    {
                      round: 5,
                      bracket: "losers",
                      player1: { name: "Grace" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 2,
                      score2: 3,
                    },
                    // Losers Bracket - Round 6
                    {
                      round: 6,
                      bracket: "losers",
                      player1: { name: "Paul" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 1,
                      score2: 3,
                    },
                    // Losers Bracket - Round 7
                    {
                      round: 7,
                      bracket: "losers",
                      player1: { name: "Alice" },
                      player2: { name: "Carol" },
                      winner: { name: "Carol" },
                      score1: 2,
                      score2: 3,
                    },
                    // Grand Finals
                    {
                      round: 8,
                      bracket: "grandFinals",
                      player1: { name: "Carol" },
                      player2: { name: "Alice" },
                      winner: { name: "Carol" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 8,
                      bracket: "grandFinals",
                      player1: { name: "Carol" },
                      player2: { name: "Alice" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                  ],
                  manager: "David",
                  format: {
                    type: "raceTo",
                    gamesNeededToWin: 3,
                    label: "Race to 3",
                  },
                  status: "ongoing",
                },
              })
            }
          >
            <Text style={styles.tournamentType}>Double Elimination</Text>
            <Text style={styles.tournamentDetails}>16 Players</Text>
            <Text style={styles.manager}>Manager: Jerome</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("TournamentDetails", {
                tournament: {
                  type: "Single Elimination",
                  players: [
                    { name: "Alice" },
                    { name: "Bob" },
                    { name: "Carol" },
                    { name: "Dave" },
                  ],
                  matches: [
                    // Quarterfinals
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Bob" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Carol" },
                      player2: { name: "Dave" },
                      winner: { name: "Carol" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Eve" },
                      player2: { name: "Frank" },
                      winner: { name: "Eve" },
                      score1: 3,
                      score2: 0,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Grace" },
                      player2: { name: "Henry" },
                      winner: { name: "Grace" },
                      score1: 3,
                      score2: 1,
                    },
                    // Semifinals
                    {
                      round: 2,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Carol" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 2,
                      bracket: "main",
                      player1: { name: "Eve" },
                      player2: { name: "Grace" },
                      winner: { name: "Grace" },
                      score1: 2,
                      score2: 3,
                    },
                    // Final
                    {
                      round: 3,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Grace" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                  ],
                  manager: "David",
                  format: {
                    type: "raceTo",
                    gamesNeededToWin: 3,
                    label: "Race to 3",
                  },
                  status: "ongoing",
                },
              })
            }
          >
            <Text style={styles.tournamentType}>Single Elimination</Text>
            <Text style={styles.tournamentDetails}>8 Players</Text>
            <Text style={styles.manager}>Manager: Jerome</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("TournamentDetails", {
                tournament: {
                  type: "Single Elimination",
                  players: [
                    { name: "Alice" },
                    { name: "Bob" },
                    { name: "Carol" },
                    { name: "Dave" },
                    { name: "Eve" },
                    { name: "Frank" },
                    { name: "Grace" },
                    { name: "Henry" },
                    { name: "Ivy" },
                    { name: "Jack" },
                    { name: "Kathy" },
                    { name: "Leo" },
                    { name: "Mona" },
                    { name: "Nate" },
                    { name: "Olivia" },
                    { name: "Paul" },
                  ],
                  matches: [
                    // Round 1
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Bob" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Carol" },
                      player2: { name: "Dave" },
                      winner: { name: "Carol" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Eve" },
                      player2: { name: "Frank" },
                      winner: { name: "Eve" },
                      score1: 3,
                      score2: 0,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Grace" },
                      player2: { name: "Henry" },
                      winner: { name: "Grace" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Ivy" },
                      player2: { name: "Jack" },
                      winner: { name: "Jack" },
                      score1: 1,
                      score2: 3,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Kathy" },
                      player2: { name: "Leo" },
                      winner: { name: "Kathy" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Mona" },
                      player2: { name: "Nate" },
                      winner: { name: "Mona" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 1,
                      bracket: "main",
                      player1: { name: "Olivia" },
                      player2: { name: "Paul" },
                      winner: { name: "Paul" },
                      score1: 0,
                      score2: 3,
                    },
                    // Quarterfinals
                    {
                      round: 2,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Carol" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                    {
                      round: 2,
                      bracket: "main",
                      player1: { name: "Eve" },
                      player2: { name: "Grace" },
                      winner: { name: "Grace" },
                      score1: 2,
                      score2: 3,
                    },
                    {
                      round: 2,
                      bracket: "main",
                      player1: { name: "Jack" },
                      player2: { name: "Kathy" },
                      winner: { name: "Jack" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 2,
                      bracket: "main",
                      player1: { name: "Mona" },
                      player2: { name: "Paul" },
                      winner: { name: "Paul" },
                      score1: 1,
                      score2: 3,
                    },
                    // Semifinals
                    {
                      round: 3,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Grace" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 2,
                    },
                    {
                      round: 3,
                      bracket: "main",
                      player1: { name: "Jack" },
                      player2: { name: "Paul" },
                      winner: { name: "Paul" },
                      score1: 2,
                      score2: 3,
                    },
                    // Final
                    {
                      round: 4,
                      bracket: "main",
                      player1: { name: "Alice" },
                      player2: { name: "Paul" },
                      winner: { name: "Alice" },
                      score1: 3,
                      score2: 1,
                    },
                  ],
                  manager: "David",
                  format: {
                    type: "raceTo",
                    gamesNeededToWin: 3,
                    label: "Race to 3",
                  },
                  status: "ongoing",
                },
              })
            }
          >
            <Text style={styles.tournamentType}>Single Elimination</Text>
            <Text style={styles.tournamentDetails}>16 Players</Text>
            <Text style={styles.manager}>Manager: Jerome</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1a252f",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#bdc3c7",
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#223042",
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#2c3e50",
  },
  tournamentType: {
    color: "#4fc3f7",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  tournamentDetails: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 4,
  },
  manager: {
    color: "#bdc3c7",
    fontSize: 14,
  },
});

export default TournamentsDashboard;
