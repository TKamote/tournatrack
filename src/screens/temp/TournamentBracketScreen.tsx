import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation.types";
import { COLORS } from "../../constants/colors";
import { MatchFormat, Player, Match } from "../../types";
import { Tournament } from "../../types/tournament.types";
import NewHorizontalBracket from "./components/NewHorizontalBracket";
import PlayerInput from "./components/PlayerInput";
import ManagerControls from "./components/ManagerControls";
import { useUser } from "../../context/UserContext";
import { TournamentService } from "../../utils/tournamentService";
import {
  createDEInitialMatches,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketNextRoundMatches,
  generateGrandFinalsMatch,
  generateGrandFinalsReset,
} from "../../utils/tournament/tournamentUtils";

type TournamentBracketScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "TournamentBracket"
>;

// Storage keys for persistence
const STORAGE_KEYS = {
  PLAYERS: "tournament_players",
  MATCHES: "tournament_matches",
  ROUNDS: "tournament_rounds",
  IS_TOURNAMENT_STARTED: "tournament_started",
  SELECTED_FORMAT: "tournament_format",
  IS_EDIT_MODE: "tournament_edit_mode",
  TOURNAMENT_ID: "current_tournament_id",
};

const TournamentBracketScreen: React.FC<TournamentBracketScreenProps> = ({
  navigation,
}) => {
  const { userId, isAuthenticated, userName } = useUser();
  
  // State management
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [isEditMode, setIsEditMode] = useState(true); // Start in edit mode
  const [isTournamentStarted, setIsTournamentStarted] = useState(false);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>({
    type: "raceTo",
    gamesNeededToWin: 5,
    label: "Race to 5",
  });

  // Format options
  const formatOptions: Array<{ label: string; value: MatchFormat }> = [
    {
      label: "Race to 5",
      value: { type: "raceTo", gamesNeededToWin: 5, label: "Race to 5" },
    },
    {
      label: "Race to 7",
      value: { type: "raceTo", gamesNeededToWin: 7, label: "Race to 7" },
    },
  ];

  // Convert local state to Tournament format
  const createTournamentFromState = useCallback((): Tournament => {
    const id = tournamentId || `tournament-${Date.now()}`;
    return {
      id,
      name: `Tournament ${new Date().toLocaleDateString()}`,
      type: "double_elimination",
      manager: userName || "Unknown",
      managerId: userId || "",
      players,
      matches,
      format: selectedFormat,
      status: isTournamentStarted ? "in_progress" : "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      maxPlayers: 8,
      currentRound,
      totalRounds: Math.ceil(Math.log2(players.length)) * 2 - 1, // Approximate for DE
    };
  }, [players, matches, currentRound, isTournamentStarted, selectedFormat, tournamentId, userId, userName]);

  // Persistence functions
  const saveTournamentData = useCallback(async () => {
    try {
      // Always save to AsyncStorage as fallback
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.PLAYERS, JSON.stringify(players)],
        [STORAGE_KEYS.MATCHES, JSON.stringify(matches)],
        [STORAGE_KEYS.ROUNDS, JSON.stringify(currentRound)],
        [
          STORAGE_KEYS.IS_TOURNAMENT_STARTED,
          JSON.stringify(isTournamentStarted),
        ],
        [STORAGE_KEYS.SELECTED_FORMAT, JSON.stringify(selectedFormat)],
        [STORAGE_KEYS.IS_EDIT_MODE, JSON.stringify(isEditMode)],
        [STORAGE_KEYS.TOURNAMENT_ID, tournamentId || ""],
      ]);

      // Save to Firebase if authenticated and tournament is started
      if (isAuthenticated && userId && (isTournamentStarted || players.length > 0)) {
        try {
          const tournament = createTournamentFromState();
          await TournamentService.saveTournament(tournament);
          if (!tournamentId) {
            setTournamentId(tournament.id);
            await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT_ID, tournament.id);
          }
        } catch (firebaseError) {
          console.error("Error saving to Firebase (will use AsyncStorage):", firebaseError);
          // Continue with AsyncStorage if Firebase fails
        }
      }
    } catch (error) {
      console.error("Error saving tournament data:", error);
    }
  }, [
    players,
    matches,
    currentRound,
    isTournamentStarted,
    selectedFormat,
    isEditMode,
    tournamentId,
    isAuthenticated,
    userId,
    createTournamentFromState,
  ]);

  const loadTournamentData = useCallback(async () => {
    try {
      // Try to load from Firebase first if authenticated
      if (isAuthenticated && userId) {
        try {
          // Get the most recent active tournament for this user
          const userTournaments = await TournamentService.getTournamentsByManager(userId);
          const activeTournament = userTournaments.find(
            (t) => t.status === "in_progress" || t.status === "draft"
          );

          if (activeTournament) {
            // Load from Firebase
            setTournamentId(activeTournament.id);
            setPlayers(activeTournament.players || []);
            setMatches(activeTournament.matches || []);
            setCurrentRound(activeTournament.currentRound || 1);
            setIsTournamentStarted(activeTournament.status === "in_progress");
            setSelectedFormat(activeTournament.format);
            setIsEditMode(activeTournament.status === "draft");

            // Also save to AsyncStorage for offline access
            await AsyncStorage.multiSet([
              [STORAGE_KEYS.PLAYERS, JSON.stringify(activeTournament.players || [])],
              [STORAGE_KEYS.MATCHES, JSON.stringify(activeTournament.matches || [])],
              [STORAGE_KEYS.ROUNDS, JSON.stringify(activeTournament.currentRound || 1)],
              [
                STORAGE_KEYS.IS_TOURNAMENT_STARTED,
                JSON.stringify(activeTournament.status === "in_progress"),
              ],
              [STORAGE_KEYS.SELECTED_FORMAT, JSON.stringify(activeTournament.format)],
              [STORAGE_KEYS.IS_EDIT_MODE, JSON.stringify(activeTournament.status === "draft")],
              [STORAGE_KEYS.TOURNAMENT_ID, activeTournament.id],
            ]);
            return; // Successfully loaded from Firebase
          }
        } catch (firebaseError) {
          console.error("Error loading from Firebase, falling back to AsyncStorage:", firebaseError);
          // Fall through to AsyncStorage
        }
      }

      // Fallback to AsyncStorage
      const data = await AsyncStorage.multiGet([
        STORAGE_KEYS.PLAYERS,
        STORAGE_KEYS.MATCHES,
        STORAGE_KEYS.ROUNDS,
        STORAGE_KEYS.IS_TOURNAMENT_STARTED,
        STORAGE_KEYS.SELECTED_FORMAT,
        STORAGE_KEYS.IS_EDIT_MODE,
        STORAGE_KEYS.TOURNAMENT_ID,
      ]);

      const [
        playersData,
        matchesData,
        roundsData,
        startedData,
        formatData,
        editModeData,
        tournamentIdData,
      ] = data;

      if (playersData[1]) {
        const loadedPlayers = JSON.parse(playersData[1]);
        // Remove duplicates based on ID
        const uniquePlayers = loadedPlayers.filter(
          (player: Player, index: number, self: Player[]) =>
            index === self.findIndex((p) => p.id === player.id)
        );
        setPlayers(uniquePlayers);
      }
      if (matchesData[1]) {
        setMatches(JSON.parse(matchesData[1]));
      }
      if (roundsData[1]) {
        setCurrentRound(JSON.parse(roundsData[1]));
      }
      if (startedData[1]) {
        setIsTournamentStarted(JSON.parse(startedData[1]));
      }
      if (formatData[1]) {
        setSelectedFormat(JSON.parse(formatData[1]));
      }
      if (editModeData[1]) {
        setIsEditMode(JSON.parse(editModeData[1]));
      }
      if (tournamentIdData[1]) {
        setTournamentId(tournamentIdData[1]);
      }
    } catch (error) {
      console.error("Error loading tournament data:", error);
    }
  }, [isAuthenticated, userId]);

  // Initialize tournament with 8 players
  const initializeTournament = useCallback(() => {
    if (players.length === 8) {
      const initialMatches = createDEInitialMatches(players, selectedFormat);
      setMatches(initialMatches);
      setCurrentRound(1);
    }
  }, [players, selectedFormat]);

  // Load tournament data on mount
  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  // Save tournament data when it changes
  useEffect(() => {
    if (players.length > 0 || matches.length > 0) {
      saveTournamentData();
    }
  }, [
    players,
    matches,
    currentRound,
    isTournamentStarted,
    selectedFormat,
    isEditMode,
    saveTournamentData,
  ]);

  // Initialize when players are set
  useEffect(() => {
    if (players.length === 8 && matches.length === 0) {
      initializeTournament();
    }
  }, [players, matches.length, initializeTournament]);

  // Handle player input
  const handlePlayerAdd = (playerName: string) => {
    if (players.length >= 8) {
      Alert.alert(
        "Maximum Players",
        "Maximum 8 players allowed for this tournament."
      );
      return;
    }

    // Generate unique ID by finding the highest existing ID
    const existingIds = players.map((p) =>
      parseInt(p.id.replace("player-", ""))
    );
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = `player-${maxId + 1}`;

    const newPlayer: Player = {
      id: newId,
      name: playerName.trim(),
      seed: players.length + 1,
      losses: 0,
      isEliminated: false,
    };

    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handlePlayerRemove = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    // Reset matches if players change
    setMatches([]);
    setCurrentRound(1);
  };

  const handlePlayerEdit = (playerId: string, newName: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, name: newName.trim() } : p))
    );
  };

  // Handle player movement in bracket (for drag & drop)
  const handlePlayerMove = (
    playerId: string,
    newPosition: { round: number; matchNumber: number; bracket: string }
  ) => {
    // TODO: Implement drag & drop logic
  };

  // Start tournament
  const handleStartTournament = async () => {
    if (players.length !== 8) {
      Alert.alert(
        "Invalid Setup",
        "Please add exactly 8 players to start the tournament."
      );
      return;
    }

    if (matches.length === 0) {
      Alert.alert("Invalid Setup", "Please initialize the tournament first.");
      return;
    }

    setIsEditMode(false);
    setIsTournamentStarted(true);
    
    // Generate tournament ID if not exists
    if (!tournamentId) {
      const newId = `tournament-${Date.now()}`;
      setTournamentId(newId);
      await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT_ID, newId);
    }

    // Save to Firebase immediately when starting
    if (isAuthenticated && userId) {
      try {
        const tournament = {
          ...createTournamentFromState(),
          status: "in_progress" as const,
        };
        await TournamentService.saveTournament(tournament);
      } catch (error) {
        console.error("Error saving tournament to Firebase:", error);
      }
    }

    Alert.alert("Tournament Started!", "The tournament is now live!");
  };

  // Handle match result
  const handleMatchResult = (matchId: string, winner: Player) => {
    setMatches((prev) =>
      prev.map((match) => (match.id === matchId ? { ...match, winner } : match))
    );
  };

  // Handle score change
  const handleScoreChange = (
    matchId: string,
    playerId: string,
    increment: boolean
  ) => {
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id === matchId) {
          const isPlayer1 = match.player1?.id === playerId;
          const currentScore = isPlayer1
            ? match.player1Score || 0
            : match.player2Score || 0;
          const newScore = increment
            ? currentScore + 1
            : Math.max(0, currentScore - 1);

          return {
            ...match,
            player1Score: isPlayer1 ? newScore : match.player1Score,
            player2Score: !isPlayer1 ? newScore : match.player2Score,
          };
        }
        return match;
      })
    );
  };

  // Advance to next round
  const handleAdvanceRound = () => {
    // TODO: Implement round advancement logic
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Manager Controls */}
          <ManagerControls
            isEditMode={isEditMode}
            isTournamentStarted={isTournamentStarted}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
            onStartTournament={handleStartTournament}
            formatOptions={formatOptions}
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
            playerCount={players.length}
          />

          {/* Player Input Section */}
          <PlayerInput
            players={players}
            onPlayerAdd={handlePlayerAdd}
            onPlayerRemove={handlePlayerRemove}
            onPlayerEdit={handlePlayerEdit}
          />

          {/* Tournament Status */}
          {isTournamentStarted && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                Round {currentRound} • {matches.filter((m) => m.winner).length}{" "}
                matches completed
              </Text>
            </View>
          )}

          {/* Tournament Bracket */}
          {players.length > 0 && (
            <View style={styles.bracketContainer}>
              <NewHorizontalBracket
                players={players}
                matches={matches}
                isEditMode={isEditMode}
                onPlayerMove={handlePlayerMove}
                onMatchResult={handleMatchResult}
                onAdvanceRound={handleAdvanceRound}
                onScoreChange={handleScoreChange}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.singleElimBackground,
  },
  container: {
    flexGrow: 1,
    padding: 6,
    backgroundColor: COLORS.singleElimBackground,
  },
  bracketContainer: {
    flex: 1,
    marginTop: 6,
  },
  statusContainer: {
    padding: 6,
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 4,
    marginTop: 6,
    alignItems: "center",
  },
  statusText: {
    color: COLORS.glassmorphism.text,
    fontSize: 14,
    fontWeight: "500",
  },
  editPlayersButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "center",
  },
  editPlayersButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default TournamentBracketScreen;
