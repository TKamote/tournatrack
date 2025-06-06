import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  Player,
  Match,
  BracketType,
  TournamentType,
  MatchFormat,
} from "../types";
import { COLORS } from "../constants/colors";
import MatchListItem from "../components/MatchListItem";
import {
  generatePlayers as generateDefaultPlayers,
  createSEInitialMatches,
  generateSENextRoundMatches,
  createDoubleEliminationInitialMatches,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches,
  createMatch,
  shuffleArray,
} from "../utils/tournamentUtils";
import BracketSelectionButtons from "../components/BracketSelectionButtons";
import ConfirmActionModal from "../components/ConfirmActionModal";
import PrimaryButton from "../components/PrimaryButton";
import ScreenHeader from "../components/ScreenHeader";
import MatchFormatSelector from "../components/MatchFormatSelector";

interface TournamentScreenProps {
  tournamentType: TournamentType;
  numPlayers: number;
  playerNames: string[];
  matchFormat: MatchFormat; // Add this prop
  onGoBack: () => void;
}

const TournamentScreen: React.FC<TournamentScreenProps> = ({
  tournamentType,
  numPlayers,
  playerNames: receivedPlayerNames,
  matchFormat: receivedMatchFormat,
  onGoBack,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentWinnersRound, setCurrentWinnersRound] = useState(1);
  const [currentLosersRound, setCurrentLosersRound] = useState(1);
  const [tournamentOver, setTournamentOver] = useState(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [wbRound1Losers, setWbRound1Losers] = useState<Player[]>([]);
  const [activeBracketForDisplay, setActiveBracketForDisplay] = useState<
    BracketType | "all"
  >("all");
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const defaultMatchFormats = {
    bo5: { bestOf: 5, gamesNeededToWin: 3 },
    bo7: { bestOf: 7, gamesNeededToWin: 4 },
    bo9: { bestOf: 9, gamesNeededToWin: 5 },
    bo11: { bestOf: 11, gamesNeededToWin: 6 },
  } as const;

  useEffect(() => {
    console.log("Resetting tournament state..."); // Add logging
    setHasInitialized(false);
    setPlayers([]);
    setMatches([]);
  }, [numPlayers, tournamentType]); // Remove receivedPlayerNames from dependencies

  // Update the useEffect that handles initialization
  useEffect(() => {
    if (
      receivedPlayerNames &&
      receivedPlayerNames.length === numPlayers &&
      numPlayers > 0 &&
      receivedMatchFormat // Add this check
    ) {
      const initialPlayers = receivedPlayerNames.map((name, i) => ({
        id: `player-${i + 1}`,
        name,
        losses: 0,
        seed: i + 1,
      }));

      const shuffledPlayers = shuffleArray(initialPlayers);
      setPlayers(shuffledPlayers);

      // Create initial matches with the received format
      let initialMatches: Match[] = [];
      if (tournamentType.startsWith("Single Knockout")) {
        initialMatches = createSEInitialMatches(
          shuffledPlayers,
          receivedMatchFormat
        );
      } else if (tournamentType.startsWith("Double Elimination")) {
        initialMatches = createDoubleEliminationInitialMatches(
          shuffledPlayers,
          receivedMatchFormat
        );
      }

      setMatches(initialMatches);
      setHasInitialized(true);

      console.log("Tournament initialized with format:", receivedMatchFormat);
    }
  }, [receivedPlayerNames, numPlayers, tournamentType, receivedMatchFormat]);

  const isMatchLocked = useCallback(
    (match: Match): boolean => {
      if (tournamentOver) return true;
      if (match.bracket === "winners" && match.round < currentWinnersRound)
        return true;
      if (match.bracket === "losers" && match.round < currentLosersRound)
        return true;
      if (match.bracket === "grandFinals" && overallWinner) return true;
      return false;
    },
    [tournamentOver, currentWinnersRound, currentLosersRound, overallWinner]
  );

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      const targetMatchIndex = matches.findIndex((m) => m.id === matchId);
      if (targetMatchIndex === -1) return;

      const currentTargetMatch = { ...matches[targetMatchIndex] }; // Use a different name to avoid conflict

      if (isMatchLocked(currentTargetMatch)) {
        Alert.alert("Match Locked", "This match's result cannot be changed.");
        return;
      }

      const oldWinner = currentTargetMatch.winner;
      if (oldWinner && oldWinner.id === newWinningPlayer.id) return;

      let newLoserOfMatch: Player | null = null;
      if (currentTargetMatch.player1 && currentTargetMatch.player2) {
        newLoserOfMatch =
          currentTargetMatch.player1.id === newWinningPlayer.id
            ? currentTargetMatch.player2
            : currentTargetMatch.player1;
      }

      // Prepare updated players list (for loss counting)
      let tempUpdatedPlayers = [...players];
      if (
        oldWinner &&
        currentTargetMatch.player1 &&
        currentTargetMatch.player2
      ) {
        const oldLoser =
          currentTargetMatch.player1.id === oldWinner.id
            ? currentTargetMatch.player2
            : currentTargetMatch.player1;
        tempUpdatedPlayers = tempUpdatedPlayers.map((p) =>
          p.id === oldLoser.id
            ? { ...p, losses: Math.max(0, (p.losses || 0) - 1) }
            : p
        );
      }
      if (newLoserOfMatch) {
        tempUpdatedPlayers = tempUpdatedPlayers.map((p) =>
          p.id === newLoserOfMatch!.id
            ? { ...p, losses: (p.losses || 0) + 1 }
            : p
        );
      }

      // Prepare updated matches list
      let tempUpdatedMatches = matches.map((m) =>
        m.id === currentTargetMatch.id ? { ...m, winner: newWinningPlayer } : m
      );
      let tempUpdatedWbRound1Losers = [...wbRound1Losers]; // Keep this if WB R1 logic is still here

      // --- WB R1 Loser Collection (if still relevant in this function structure) ---
      if (
        tournamentType.startsWith("Double Elimination") &&
        currentTargetMatch.bracket === "winners" &&
        currentTargetMatch.round === 1
      ) {
        if (
          oldWinner &&
          currentTargetMatch.player1 &&
          currentTargetMatch.player2
        ) {
          const oldLoser =
            currentTargetMatch.player1.id === oldWinner.id
              ? currentTargetMatch.player2
              : currentTargetMatch.player1;
          tempUpdatedWbRound1Losers = tempUpdatedWbRound1Losers.filter(
            (l) => l.id !== oldLoser.id
          );
          tempUpdatedMatches = tempUpdatedMatches.filter((m) => {
            // Remove old LB R1 match
            if (m.bracket === "losers" && m.round === 1 && !m.winner) {
              if (
                (m.player1?.id === oldLoser.id && !m.player2) ||
                (m.player2?.id === oldLoser.id && !m.player1) ||
                (m.player1?.id === oldLoser.id && m.player2) ||
                (m.player2?.id === oldLoser.id && m.player1)
              ) {
                return false;
              }
            }
            return true;
          });
        }
        if (newLoserOfMatch) {
          const alreadyInList = tempUpdatedWbRound1Losers.some(
            (l) => l.id === newLoserOfMatch!.id
          );
          if (!alreadyInList) {
            tempUpdatedWbRound1Losers = [
              ...tempUpdatedWbRound1Losers,
              { ...newLoserOfMatch! },
            ];
          }
        }
      }

      // --- Grand Finals Specific Logic ---
      if (currentTargetMatch.bracket === "grandFinals") {
        const wbPlayerInGF = currentTargetMatch.player1; // Crucially assumes player1 is WB champ
        const lbPlayerInGF = currentTargetMatch.player2; // Crucially assumes player2 is LB champ

        if (!currentTargetMatch.isGrandFinalsReset) {
          // This is the FIRST Grand Finals match
          if (wbPlayerInGF && newWinningPlayer.id === wbPlayerInGF.id) {
            // WB Champion (player1) wins the first GF match
            setOverallWinner(newWinningPlayer);
            setTournamentOver(true);
            setPlayers(tempUpdatedPlayers);
            setMatches(tempUpdatedMatches);
            setWbRound1Losers(tempUpdatedWbRound1Losers);
            return; // Tournament ends
          } else if (lbPlayerInGF && newWinningPlayer.id === lbPlayerInGF.id) {
            // LB Champion (player2) wins the first GF match - a reset is needed
            const resetMatchExists = tempUpdatedMatches.some(
              (m) =>
                m.bracket === "grandFinals" && m.isGrandFinalsReset === true
            );
            if (!resetMatchExists && wbPlayerInGF && lbPlayerInGF) {
              const gfResetMatch = createMatch(
                `match-gf-reset-1`,
                currentTargetMatch.round, // Keep same round or +1 for visual
                currentTargetMatch.matchNumber + 1, // Increment match number
                wbPlayerInGF, // WB Champ
                lbPlayerInGF, // LB Champ
                "grandFinals",
                true // isGrandFinalsReset = true
              );
              tempUpdatedMatches.push(gfResetMatch);
            }
            // Tournament does NOT end here. UI will update to show the new reset match.
          }
        } else {
          // This is the RESET Grand Finals match
          // The winner of this match is the overall tournament winner.
          setOverallWinner(newWinningPlayer);
          setTournamentOver(true);
          setPlayers(tempUpdatedPlayers);
          setMatches(tempUpdatedMatches);
          setWbRound1Losers(tempUpdatedWbRound1Losers);
          return; // Tournament ends
        }
      }

      // Standard state updates if not a concluding GF match
      setPlayers(tempUpdatedPlayers);
      setMatches(tempUpdatedMatches);
      setWbRound1Losers(tempUpdatedWbRound1Losers);
    },
    [
      matches,
      players,
      wbRound1Losers,
      isMatchLocked,
      tournamentType,
      // numPlayers, // numPlayers might not be needed directly here anymore
      // createMatch is implicitly used, ensure it's stable or add if it's from component state/props
    ]
  );

  // Add these helper functions
  const findNextMatch = (
    currentMatch: Match,
    allMatches: Match[]
  ): Match | null => {
    if (currentMatch.bracket === "winners") {
      // Find next winners bracket match
      return (
        allMatches.find(
          (m) =>
            (m.bracket === "winners" &&
              m.round === currentMatch.round + 1 &&
              !m.player1) ||
            !m.player2
        ) || null
      );
    } else {
      // Find next losers bracket match
      return (
        allMatches.find(
          (m) =>
            (m.bracket === "losers" &&
              m.round === currentMatch.round + 1 &&
              !m.player1) ||
            !m.player2
        ) || null
      );
    }
  };

  const advanceWinner = useCallback((match: Match) => {
    if (!match.winner) return;

    setMatches((prevMatches) => {
      const nextMatch = findNextMatch(match, prevMatches);
      if (!nextMatch) return prevMatches;

      return prevMatches.map((m) => {
        if (m.id === nextMatch.id) {
          // Place winner in next available slot
          if (!m.player1) {
            return { ...m, player1: match.winner };
          } else {
            return { ...m, player2: match.winner };
          }
        }
        return m;
      });
    });
  }, []);

  const handleIncrementScore = useCallback(
    (matchId: string, playerId: string) => {
      setMatches((prevMatches) => {
        return prevMatches.map((match) => {
          if (match.id !== matchId) return match;

          // Initialize games array if it doesn't exist
          const games = match.games || [];
          const winningPlayer = players.find((p) => p.id === playerId);
          if (!winningPlayer) return match;

          // Check current scores before adding new game
          const currentP1Wins = games.filter(
            (g) => g.winner?.id === match.player1?.id
          ).length;
          const currentP2Wins = games.filter(
            (g) => g.winner?.id === match.player2?.id
          ).length;

          // Check if someone has already won
          if (
            currentP1Wins >= match.format.gamesNeededToWin ||
            currentP2Wins >= match.format.gamesNeededToWin
          ) {
            return match; // Don't allow more scores if someone has won
          }

          // Create new game
          const newGame = {
            id: `game-${matchId}-${games.length + 1}`,
            winner: winningPlayer,
          };
          const updatedGames = [...games, newGame];

          // Check if this game resulted in a win
          const p1Wins = updatedGames.filter(
            (g) => g.winner?.id === match.player1?.id
          ).length;
          const p2Wins = updatedGames.filter(
            (g) => g.winner?.id === match.player2?.id
          ).length;

          let winner = null;
          if (p1Wins >= match.format.gamesNeededToWin) {
            winner = match.player1;
          } else if (p2Wins >= match.format.gamesNeededToWin) {
            winner = match.player2;
          }

          // If we have a winner after this game, advance them
          if (winner) {
            advanceWinner(match);
          }

          return {
            ...match,
            games: updatedGames,
            winner,
          };
        });
      });
    },
    [players, advanceWinner] // Add players to dependencies
  );

  const getLosersOfRound = (
    roundNumber: number,
    bracketType: BracketType
  ): Player[] => {
    return matches
      .filter(
        (match) =>
          match.round === roundNumber &&
          match.bracket === bracketType &&
          match.winner
      )
      .reduce((acc: Player[], match) => {
        if (match.player1 && match.player1.id !== match.winner?.id) {
          acc.push(match.player1);
        }
        if (match.player2 && match.player2.id !== match.winner?.id) {
          acc.push(match.player2);
        }
        return acc;
      }, []);
  };

  const matchesForDisplay = (): Match[] => {
    let filteredMatches: Match[] = [];
    if (tournamentOver && overallWinner) {
      const finalMatch = matches.find(
        (m) =>
          m.winner?.id === overallWinner.id &&
          (m.bracket === "winners" || m.bracket === "grandFinals")
      );
      if (finalMatch) {
        filteredMatches = matches.filter(
          (m) =>
            m.bracket === finalMatch.bracket && m.round === finalMatch.round
        );
      } else {
        const lastWBRound = Math.max(
          0,
          ...matches.filter((m) => m.bracket === "winners").map((m) => m.round)
        );
        const lastGFRound = Math.max(
          0,
          ...matches
            .filter((m) => m.bracket === "grandFinals")
            .map((m) => m.round)
        );
        const lastRoundPlayed = Math.max(lastWBRound, lastGFRound);
        if (lastRoundPlayed > 0) {
          filteredMatches = matches.filter(
            (m) =>
              (m.bracket === "winners" || m.bracket === "grandFinals") &&
              m.round === lastRoundPlayed
          );
        }
      }
      if (filteredMatches.length === 0) {
        filteredMatches = matches;
      }
    } else if (tournamentType.startsWith("Single Knockout")) {
      let currentRoundMatches = matches.filter(
        (match) =>
          match.bracket === "winners" && match.round === currentWinnersRound
      );

      if (currentRoundMatches.length > 0) {
        filteredMatches = currentRoundMatches;
      } else {
        if (currentWinnersRound > 1) {
          filteredMatches = matches.filter(
            (match) =>
              match.bracket === "winners" &&
              match.round === currentWinnersRound - 1
          );
        } else {
          filteredMatches = matches.filter(
            (m) => m.bracket === "winners" && !m.winner
          );
        }
      }
      if (
        filteredMatches.length === 0 &&
        !tournamentOver &&
        matches.some((m) => m.bracket === "winners")
      ) {
        filteredMatches = matches.filter((m) => m.bracket === "winners");
      }
    } else if (tournamentType.startsWith("Double Elimination")) {
      if (matches.some((m) => m.bracket === "grandFinals")) {
        filteredMatches = matches.filter((m) => m.bracket === "grandFinals");
      } else if (activeBracketForDisplay === "winners") {
        filteredMatches = matches.filter(
          (m) => m.bracket === "winners" && m.round === currentWinnersRound
        );
        if (
          filteredMatches.length === 0 &&
          currentWinnersRound > 1 &&
          !tournamentOver
        ) {
          filteredMatches = matches.filter(
            (m) =>
              m.bracket === "winners" && m.round === currentWinnersRound - 1
          );
        }
      } else if (activeBracketForDisplay === "losers") {
        filteredMatches = matches.filter(
          (m) => m.bracket === "losers" && m.round === currentLosersRound
        );
        if (
          filteredMatches.length === 0 &&
          currentLosersRound > 1 &&
          !tournamentOver
        ) {
          filteredMatches = matches.filter(
            (m) => m.bracket === "losers" && m.round === currentLosersRound - 1
          );
        }
      } else {
        const wbCurrent = matches.filter(
          (m) => m.bracket === "winners" && m.round === currentWinnersRound
        );
        const lbCurrent = matches.filter(
          (m) => m.bracket === "losers" && m.round === currentLosersRound
        );
        filteredMatches = [...wbCurrent, ...lbCurrent].filter(Boolean);

        if (
          filteredMatches.length === 0 &&
          !tournamentOver &&
          matches.some((m) => !m.winner)
        ) {
          filteredMatches = matches.filter((m) => !m.winner);
        }
      }
    }

    return filteredMatches.sort((a, b) => {
      const bracketOrder = { winners: 1, losers: 2, grandFinals: 3 };
      const bracketComparison =
        (bracketOrder[a.bracket] || 4) - (bracketOrder[b.bracket] || 4);
      if (bracketComparison !== 0) return bracketComparison;
      if (a.round !== b.round) return a.round - b.round;
      return a.matchNumber - b.matchNumber;
    });
  };

  const displayTitle = (): string => {
    if (tournamentOver && overallWinner) return "Tournament Completed!";
    if (matches.some((m) => m.bracket === "grandFinals" && !overallWinner))
      return "Grand Finals";

    if (tournamentType.startsWith("Single Knockout"))
      return `Round ${currentWinnersRound}`;
    if (tournamentType.startsWith("Double Elimination")) {
      let title = "";
      const wbHasPending = matches.some(
        (m) =>
          m.bracket === "winners" &&
          m.round === currentWinnersRound &&
          !m.winner
      );
      const lbHasPending = matches.some(
        (m) =>
          m.bracket === "losers" && m.round === currentLosersRound && !m.winner
      );

      if (
        wbHasPending ||
        activeBracketForDisplay === "winners" ||
        (activeBracketForDisplay === "all" &&
          matches.some(
            (m) => m.bracket === "winners" && m.round === currentWinnersRound
          ))
      ) {
        title += `WB R${currentWinnersRound}`;
      }
      if (
        lbHasPending ||
        activeBracketForDisplay === "losers" ||
        (activeBracketForDisplay === "all" &&
          matches.some(
            (m) => m.bracket === "losers" && m.round === currentLosersRound
          ))
      ) {
        if (title) title += " / ";
        title += `LB R${currentLosersRound}`;
      }
      return title || "Double Elimination";
    }
    return "Tournament";
  };

  const allCurrentRoundMatchesCompleted = useCallback((): boolean => {
    if (tournamentOver) return true;

    const grandFinalsMatches = matches.filter(
      (m) => m.bracket === "grandFinals"
    );
    if (grandFinalsMatches.length > 0) {
      const firstGF = grandFinalsMatches.find((m) => !m.isGrandFinalsReset);
      const resetGF = grandFinalsMatches.find(
        (m) => m.isGrandFinalsReset === true
      );
      if (!firstGF || !firstGF.winner) return false;
      const lbPlayerWonFirstGF =
        firstGF.player2 &&
        firstGF.winner &&
        firstGF.player2.id === firstGF.winner.id;
      if (lbPlayerWonFirstGF) return !!(resetGF && resetGF.winner);
      return true; // WB champ won first GF
    }

    if (tournamentType.startsWith("Single Knockout")) {
      const currentRoundSEMatches = matches.filter(
        (match) =>
          match.round === currentWinnersRound && match.bracket === "winners"
      );
      if (currentRoundSEMatches.length === 0) {
        if (currentWinnersRound > 1) {
          const prevRoundMatches = matches.filter(
            (m) =>
              m.round === currentWinnersRound - 1 && m.bracket === "winners"
          );
          if (prevRoundMatches.length === 1 && prevRoundMatches[0].winner) {
            return true; // Tournament winner found
          }
        }
        return false; // No matches in current round, and not the final winner
      }
      return currentRoundSEMatches.every((match) => !!match.winner);
    } else if (tournamentType.startsWith("Double Elimination")) {
      const expectedWbFinalRound =
        numPlayers === 6 || numPlayers === 8 ? 3 : -1;
      const expectedLbFinalRound =
        numPlayers === 6 || numPlayers === 8 ? 4 : -1;

      // Check if WB Champion is determined
      const wbFinalMatch = matches.find(
        (m) => m.bracket === "winners" && m.round === expectedWbFinalRound
      );
      const wbChampionIsKnown = !!(wbFinalMatch && wbFinalMatch.winner);

      // Check if LB Champion is determined (i.e., LB Final is played)
      const lbFinalMatch = matches.find(
        (m) => m.bracket === "losers" && m.round === expectedLbFinalRound
      );
      const lbChampionIsKnown = !!(lbFinalMatch && lbFinalMatch.winner);

      if (wbChampionIsKnown && lbChampionIsKnown) {
        return true; // Ready for Grand Finals (or GF already handled)
      }

      // --- Pre-Grand Finals ---
      let wbRoundCompleted = true;
      if (currentWinnersRound <= expectedWbFinalRound && !wbChampionIsKnown) {
        // Only check WB if it's not yet at/past its final
        const wbMatchesCurrent = matches.filter(
          (m) => m.bracket === "winners" && m.round === currentWinnersRound
        );
        if (wbMatchesCurrent.length > 0) {
          wbRoundCompleted = wbMatchesCurrent.every((m) => !!m.winner);
        } else if (
          currentWinnersRound > 1 &&
          !matches.some(
            (m) => m.bracket === "winners" && m.round === currentWinnersRound
          )
        ) {
          // If currentWinnersRound has advanced past existing matches, consider it "done" for this check,
          // assuming previous round led to a champion or advancement.
          // This case needs to be careful not to stall if WB champ is found but LB isn't ready.
          const prevWbMatches = matches.filter(
            (m) =>
              m.bracket === "winners" && m.round === currentWinnersRound - 1
          );
          if (!prevWbMatches.some((m) => !m.winner))
            wbRoundCompleted = true; // if prev round fully done
          else wbRoundCompleted = false;
        } else {
          wbRoundCompleted = true; // No matches in this specific WB round (e.g. WB R1 for 2 players, or if WB champ already found)
        }
      }

      let lbRoundCompleted = true;
      if (currentLosersRound <= expectedLbFinalRound && !lbChampionIsKnown) {
        // Only check LB if it's not yet at/past its final
        const lbMatchesCurrent = matches.filter(
          (m) => m.bracket === "losers" && m.round === currentLosersRound
        );
        if (lbMatchesCurrent.length > 0) {
          lbRoundCompleted = lbMatchesCurrent.every((m) => !!m.winner);
        } else if (
          currentLosersRound > 1 &&
          !matches.some(
            (m) => m.bracket === "losers" && m.round === currentLosersRound
          )
        ) {
          // Similar to WB: if currentLosersRound has advanced past existing matches.
          const prevLbMatches = matches.filter(
            (m) => m.bracket === "losers" && m.round === currentLosersRound - 1
          );
          if (!prevLbMatches.some((m) => !m.winner)) lbRoundCompleted = true;
          else lbRoundCompleted = false;
        } else if (
          currentLosersRound === 1 &&
          !matches.some((m) => m.bracket === "losers" && m.round === 1)
        ) {
          // Special case for LB R1: if no LB R1 matches exist (e.g. after WB R1, before LB R1 generated),
          // it's not "completed" in a way that should allow advancement if WB R1 isn't also done.
          // This is tricky. The main check should be if *playable* matches in current rounds are done.
          // If LB R1 hasn't been formed yet, but WB R1 is done, `executeAdvanceRound` should form LB R1.
          // So, if `currentLosersRound` is 1 and no matches exist, it's "completed" for the purpose of `executeAdvanceRound`
          // potentially creating them, *if* the WB side is also ready.
          lbRoundCompleted = true; // Let executeAdvanceRound decide if it can form LB R1
        } else {
          lbRoundCompleted = true; // No matches in this specific LB round
        }
      }

      // If WB final is done, we only care about LB completion up to LB final
      if (wbChampionIsKnown && currentWinnersRound >= expectedWbFinalRound) {
        return lbRoundCompleted; // Advance if current LB round is done (or if LB champ also known)
      }

      // If LB final is done, we only care about WB completion up to WB final
      if (lbChampionIsKnown && currentLosersRound >= expectedLbFinalRound) {
        return wbRoundCompleted; // Advance if current WB round is done (or if WB champ also known)
      }

      // Default: both current rounds must be completed
      return wbRoundCompleted && lbRoundCompleted;
    }
    return false;
  }, [
    matches,
    currentWinnersRound,
    currentLosersRound,
    tournamentOver,
    tournamentType,
    numPlayers,
    overallWinner, // Added overallWinner as it's used in GF check
    // players, // players state was used before, but not in this version
  ]);

  const executeAdvanceRound = () => {
    setIsAdvanceModalVisible(false);
    if (tournamentOver) return;

    let newMatchesToAdd: Match[] = [];
    let losersFromCurrentWBCompletion: Player[] = [];
    let lbWinnersFromThisRound: Player[] = [];

    let advancedWB = false;
    let advancedLB = false;
    let wbChampionDeterminedThisCall: Player | null = null;
    let lbChampionDeterminedThisCall: Player | null = null;

    const initialCurrentWinnersRound = currentWinnersRound;
    const initialCurrentLosersRound = currentLosersRound;

    if (tournamentType.startsWith("Single Knockout")) {
      // ... (existing SE logic - assumed okay for now) ...
      const currentRoundSECompletedMatches = matches.filter(
        (match: Match) =>
          match.bracket === "winners" &&
          match.round === initialCurrentWinnersRound &&
          !!match.winner
      );

      const winners = currentRoundSECompletedMatches
        .map((match: Match) => match.winner!)
        .filter(Boolean) as Player[];

      const nextRoundNumber = initialCurrentWinnersRound + 1;
      const generatedSEMatches = generateSENextRoundMatches(
        winners,
        nextRoundNumber,
        matches.length
      );

      if (generatedSEMatches.length === 0 && winners.length === 1) {
        setOverallWinner(winners[0]);
        setTournamentOver(true);
      } else if (generatedSEMatches.length > 0) {
        setMatches((prev) => [...prev, ...generatedSEMatches]);
        setCurrentWinnersRound(nextRoundNumber);
      }
    } else if (tournamentType.startsWith("Double Elimination")) {
      let newWBMatchesGeneratedThisCall: Match[] = [];
      let newLBMatchesGeneratedThisCall: Match[] = [];

      const expectedWbFinalRound =
        numPlayers === 6 || numPlayers === 8 ? 3 : -1;
      const expectedLbFinalRound =
        numPlayers === 6 || numPlayers === 8 ? 4 : -1;

      // Define allGrandFinalsMatches here so it's in scope for the later else if
      const allGrandFinalsMatches = matches
        .concat(newMatchesToAdd) // newMatchesToAdd will be empty here initially, but this mirrors the later usage
        .filter((m: Match) => m.bracket === "grandFinals");

      // --- (A) Winners' Bracket (WB) Advancement ---
      // Only process WB if it's not past its final round OR if the champion isn't determined yet from a previous call
      const wbFinalMatchOverall = matches.find(
        (m) => m.bracket === "winners" && m.round === expectedWbFinalRound
      );
      const overallWbChampionAlreadyKnown = !!(
        wbFinalMatchOverall && wbFinalMatchOverall.winner
      );

      if (
        initialCurrentWinnersRound <= expectedWbFinalRound &&
        !overallWbChampionAlreadyKnown
      ) {
        const wbMatchesThisRound = matches.filter(
          (m) =>
            m.bracket === "winners" && m.round === initialCurrentWinnersRound
        );
        const allWbMatchesThisRoundCompleted =
          wbMatchesThisRound.length > 0 &&
          wbMatchesThisRound.every((m) => !!m.winner);

        if (allWbMatchesThisRoundCompleted) {
          const wbWinners = wbMatchesThisRound
            .map((m) => m.winner!)
            .filter(Boolean) as Player[];
          losersFromCurrentWBCompletion = getLosersOfRound(
            initialCurrentWinnersRound,
            "winners"
          );

          if (
            initialCurrentWinnersRound === expectedWbFinalRound &&
            wbWinners.length === 1
          ) {
            wbChampionDeterminedThisCall = wbWinners[0];
            // Don't advance currentWinnersRound here; WB is done.
            advancedWB = true; // Mark WB as "processed" for this stage
          } else if (wbWinners.length >= 2) {
            const nextWBRoundNumber = initialCurrentWinnersRound + 1;
            newWBMatchesGeneratedThisCall = generateDEWinnersBracketNextRound(
              wbWinners,
              nextWBRoundNumber,
              matches.length + newMatchesToAdd.length
            );
            if (newWBMatchesGeneratedThisCall.length > 0) {
              setCurrentWinnersRound(nextWBRoundNumber);
              advancedWB = true;
            }
          }
        }
      } else if (overallWbChampionAlreadyKnown) {
        // WB Champion is already known, ensure wbChampionDeterminedThisCall is set if it wasn't from this call
        if (!wbChampionDeterminedThisCall)
          wbChampionDeterminedThisCall = wbFinalMatchOverall!.winner;
      }

      // --- (B) Losers' Bracket (LB) Round 1 Generation (if applicable) ---
      // This logic should run if WB R1 just completed and LB R1 isn't made.
      const lbR1MatchesAlreadyExist = matches.some(
        (m) => m.bracket === "losers" && m.round === 1
      );
      if (
        initialCurrentWinnersRound === 1 && // WB R1 was the focus
        losersFromCurrentWBCompletion.length > 0 && // WB R1 actually produced losers in *this* call
        !lbR1MatchesAlreadyExist &&
        wbRound1Losers.length > 0 // Ensure wbRound1Losers state has been populated by handleSetWinner
      ) {
        let expectedLoserCountForLBR1 = 0;
        if (numPlayers === 6) expectedLoserCountForLBR1 = 2;
        else if (numPlayers === 8) expectedLoserCountForLBR1 = 4;

        // Use wbRound1Losers state as the source of truth for LB R1
        if (wbRound1Losers.length === expectedLoserCountForLBR1) {
          const generatedLbR1Matches = generateDELosersBracketRound1Matches(
            [...wbRound1Losers],
            matches.length +
              newMatchesToAdd.length +
              newWBMatchesGeneratedThisCall.length
          );
          if (generatedLbR1Matches.length > 0) {
            newLBMatchesGeneratedThisCall.push(...generatedLbR1Matches);
            // currentLosersRound is already 1. advancedLB will be set later if these matches are for nextLBRoundNumberTarget
          }
        }
      }

      // --- (C) Losers' Bracket (LB) Advancement (for LB R1 completion and R2+ generation) ---
      const lbFinalMatchOverall = matches.find(
        (m) => m.bracket === "losers" && m.round === expectedLbFinalRound
      );
      const overallLbChampionAlreadyKnown = !!(
        lbFinalMatchOverall && lbFinalMatchOverall.winner
      );

      if (
        initialCurrentLosersRound <= expectedLbFinalRound &&
        !overallLbChampionAlreadyKnown
      ) {
        const lbMatchesThisRound = matches.filter(
          (m) => m.bracket === "losers" && m.round === initialCurrentLosersRound
        );
        const allLbMatchesThisRoundCompleted =
          lbMatchesThisRound.length > 0 &&
          lbMatchesThisRound.every((m) => !!m.winner);

        if (allLbMatchesThisRoundCompleted) {
          lbWinnersFromThisRound = lbMatchesThisRound // These are winners from initialCurrentLosersRound
            .map((m) => m.winner!)
            .filter(Boolean) as Player[];

          if (
            initialCurrentLosersRound === expectedLbFinalRound &&
            lbWinnersFromThisRound.length === 1
          ) {
            if (lbWinnersFromThisRound[0].losses === 1) {
              lbChampionDeterminedThisCall = lbWinnersFromThisRound[0];
            }
            // Don't advance currentLosersRound here; LB is done.
            advancedLB = true; // Mark LB as "processed" for this stage
          } else if (
            lbWinnersFromThisRound.length > 0 ||
            initialCurrentLosersRound === 1
          ) {
            // Allow advancing from LB R1 even if 0 winners (all byes)
            // Try to generate the NEXT LB round
            const nextLBRoundNumberTarget = initialCurrentLosersRound + 1;
            const baseMatchCountForNewLB =
              matches.length +
              newMatchesToAdd.length +
              newWBMatchesGeneratedThisCall.length +
              newLBMatchesGeneratedThisCall.length;

            let generatedNextLbMatches: Match[] = [];

            if (numPlayers === 6 || numPlayers === 8) {
              const expectedWbFinalRound = 3; // WB Final is Round 3 for 6/8 players
              const penultimateLbRound = 3; // LB Round that feeds into LB Final (LB R4) is Round 3
              const actualLbFinalRoundTarget = 4; // The LB Final itself is Round 4

              // LB Round 2: Needs W(LBR1) and L(WBR2)
              if (
                nextLBRoundNumberTarget === 2 &&
                initialCurrentLosersRound === 1 && // LB R1 just finished
                (numPlayers === 6
                  ? lbWinnersFromThisRound.length === 1
                  : lbWinnersFromThisRound.length === 2) &&
                ((initialCurrentWinnersRound === 2 &&
                  losersFromCurrentWBCompletion.length ===
                    (numPlayers === 6 ? 2 : 2)) ||
                  ((currentWinnersRound > 2 || wbChampionDeterminedThisCall) &&
                    matches.some(
                      (m) =>
                        m.bracket === "winners" && m.round === 2 && m.winner
                    )))
              ) {
                const wbR2Losers =
                  initialCurrentWinnersRound === 2 &&
                  losersFromCurrentWBCompletion.length > 0
                    ? losersFromCurrentWBCompletion
                    : getLosersOfRound(2, "winners");
                if (wbR2Losers.length === (numPlayers === 6 ? 2 : 2)) {
                  generatedNextLbMatches =
                    generateDELosersBracketNextRoundMatches(
                      lbWinnersFromThisRound,
                      wbR2Losers,
                      nextLBRoundNumberTarget,
                      numPlayers,
                      baseMatchCountForNewLB
                    );
                }
              }
              // LB Round 3: Needs W(LBR2) (no WB drops for 6P/8P here)
              else if (
                nextLBRoundNumberTarget === 3 && // Target is LB R3
                initialCurrentLosersRound === 2 && // LB R2 just finished
                (numPlayers === 6
                  ? lbWinnersFromThisRound.length === 2
                  : lbWinnersFromThisRound.length === 2)
              ) {
                generatedNextLbMatches =
                  generateDELosersBracketNextRoundMatches(
                    lbWinnersFromThisRound,
                    [],
                    nextLBRoundNumberTarget,
                    numPlayers,
                    baseMatchCountForNewLB
                  );
              }
              // LB Round 4 (LB Final): Needs W(LBR3) and L(WBR3/Final)
              else if (
                nextLBRoundNumberTarget === actualLbFinalRoundTarget && // We are trying to form LB R4
                // Condition 1: LB R3 must be complete (either now or previously)
                ((initialCurrentLosersRound === penultimateLbRound &&
                  lbWinnersFromThisRound.length === 1) ||
                  matches.some(
                    (m) =>
                      m.bracket === "losers" &&
                      m.round === penultimateLbRound &&
                      m.winner
                  )) &&
                // Condition 2: WB R3 (Final) must be complete (either now or previously)
                ((initialCurrentWinnersRound === expectedWbFinalRound &&
                  losersFromCurrentWBCompletion.length === 1) ||
                  matches.some(
                    (m) =>
                      m.bracket === "winners" &&
                      m.round === expectedWbFinalRound &&
                      m.winner
                  ))
              ) {
                // Fetch the winner of LB R3
                let winnerOfLBR3: Player | null = null;
                if (
                  initialCurrentLosersRound === penultimateLbRound &&
                  lbWinnersFromThisRound.length === 1
                ) {
                  winnerOfLBR3 = lbWinnersFromThisRound[0];
                } else {
                  const lbR3WinnerMatch = matches.find(
                    (m) =>
                      m.bracket === "losers" &&
                      m.round === penultimateLbRound &&
                      m.winner
                  );
                  if (lbR3WinnerMatch) winnerOfLBR3 = lbR3WinnerMatch.winner;
                }

                // Fetch the loser of WB R3
                let loserOfWBR3: Player | null = null;
                if (
                  initialCurrentWinnersRound === expectedWbFinalRound &&
                  losersFromCurrentWBCompletion.length === 1
                ) {
                  loserOfWBR3 = losersFromCurrentWBCompletion[0];
                } else {
                  // Ensure getLosersOfRound correctly finds the single loser of the WB final round
                  const wbR3Matches = matches.filter(
                    (m) =>
                      m.bracket === "winners" &&
                      m.round === expectedWbFinalRound &&
                      m.winner
                  );
                  if (wbR3Matches.length === 1) {
                    // Should be exactly one WB final match
                    const wbFinal = wbR3Matches[0];
                    if (
                      wbFinal.player1 &&
                      wbFinal.player1.id !== wbFinal.winner?.id
                    )
                      loserOfWBR3 = wbFinal.player1;
                    else if (
                      wbFinal.player2 &&
                      wbFinal.player2.id !== wbFinal.winner?.id
                    )
                      loserOfWBR3 = wbFinal.player2;
                  }
                }

                if (winnerOfLBR3 && loserOfWBR3) {
                  // Check if LB R4 already exists to prevent duplicates if executeAdvanceRound is called multiple times
                  // when conditions are met but before state updates fully propagate.
                  const lbR4Exists = matches
                    .concat(
                      newMatchesToAdd,
                      newWBMatchesGeneratedThisCall,
                      newLBMatchesGeneratedThisCall
                    )
                    .some(
                      (m) =>
                        m.bracket === "losers" &&
                        m.round === actualLbFinalRoundTarget
                    );
                  if (!lbR4Exists) {
                    generatedNextLbMatches =
                      generateDELosersBracketNextRoundMatches(
                        [winnerOfLBR3],
                        [loserOfWBR3],
                        actualLbFinalRoundTarget,
                        numPlayers,
                        baseMatchCountForNewLB
                      );
                  }
                }
              }
            }

            if (generatedNextLbMatches.length > 0) {
              newLBMatchesGeneratedThisCall.push(...generatedNextLbMatches);
              setCurrentLosersRound(nextLBRoundNumberTarget);
              advancedLB = true;
            }
          }
        }
      } else if (overallLbChampionAlreadyKnown) {
        // LB Champion is already known
        if (!lbChampionDeterminedThisCall)
          lbChampionDeterminedThisCall = lbFinalMatchOverall!.winner;
      }

      newMatchesToAdd.push(
        ...newWBMatchesGeneratedThisCall,
        ...newLBMatchesGeneratedThisCall
      );

      // --- (D) Determine Champions (if not already set by round completion logic) ---
      if (wbChampionDeterminedThisCall && !lbChampionDeterminedThisCall) {
        // Try to see if LB champion can be determined now (e.g. LB final was just added and is a bye)
        const freshLbFinalMatch = newMatchesToAdd.find(
          (m) => m.bracket === "losers" && m.round === expectedLbFinalRound
        );
        if (
          freshLbFinalMatch &&
          freshLbFinalMatch.winner &&
          freshLbFinalMatch.winner.losses === 1
        ) {
          lbChampionDeterminedThisCall = freshLbFinalMatch.winner;
        }
      }
      if (lbChampionDeterminedThisCall && !wbChampionDeterminedThisCall) {
        // Try to see if WB champion can be determined now
        const freshWbFinalMatch = newMatchesToAdd.find(
          (m) => m.bracket === "winners" && m.round === expectedWbFinalRound
        );
        if (freshWbFinalMatch && freshWbFinalMatch.winner) {
          // losses check not needed for WB champ
          wbChampionDeterminedThisCall = freshWbFinalMatch.winner;
        }
      }

      // --- (E) Grand Finals Logic ---
      if (
        wbChampionDeterminedThisCall &&
        lbChampionDeterminedThisCall &&
        !matches // Check against existing matches
          .concat(newMatchesToAdd) // And any matches just added in this cycle
          .some((m: Match) => m.bracket === "grandFinals")
      ) {
        const gfMatch = createMatch(
          `match-gf-1`,
          Math.max(expectedWbFinalRound, expectedLbFinalRound) + 1,
          1,
          wbChampionDeterminedThisCall,
          lbChampionDeterminedThisCall,
          "grandFinals",
          false
        );
        newMatchesToAdd.push(gfMatch);
      }

      if (newMatchesToAdd.length > 0) {
        setMatches((prev) => {
          const existingMatchIds = new Set(prev.map((m: Match) => m.id));
          const trulyNewMatches = newMatchesToAdd.filter(
            (nm: Match) => !existingMatchIds.has(nm.id)
          );
          return [...prev, ...trulyNewMatches];
        });
      } else if (
        !advancedWB &&
        !advancedLB &&
        !wbChampionDeterminedThisCall &&
        !lbChampionDeterminedThisCall &&
        // Re-filter allGrandFinalsMatches here to get the most current state before this check
        !matches
          .concat(newMatchesToAdd)
          .filter((m: Match) => m.bracket === "grandFinals")
          .some((m: Match) => m.winner)
      ) {
        // If nothing happened, and no champs determined, and GFs not resolved, it might be stuck.
        // This is a fallback, ideally allCurrentRoundMatchesCompleted should prevent unnecessary calls.
      }
    }
  };
  const handleAdvanceRoundPress = () => {
    if (!allCurrentRoundMatchesCompleted() || tournamentOver) {
      Alert.alert(
        "Cannot Advance",
        "All matches in the current round(s) must be completed, or the tournament is over."
      );
      return;
    }
    setIsAdvanceModalVisible(true);
  };

  // First, update the initial UI render to show the format selector prominently
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScreenHeader
          title={displayTitle()}
          subtitle={`${numPlayers} Players`}
          onBack={onGoBack}
        />
        <FlatList
          data={matchesForDisplay()}
          renderItem={({ item }) => (
            <MatchListItem
              item={item}
              players={players}
              tournamentType={tournamentType}
              isMatchLocked={isMatchLocked}
              onSetWinner={handleSetWinner}
              onIncrementScore={handleIncrementScore}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />

        {!tournamentOver && (
          <View style={styles.advanceButtonContainer}>
            <TouchableOpacity
              style={[
                styles.advanceButton,
                !allCurrentRoundMatchesCompleted() &&
                  styles.advanceButtonDisabled,
              ]}
              onPress={handleAdvanceRoundPress}
              disabled={!allCurrentRoundMatchesCompleted()}
            >
              <Text style={styles.advanceButtonText}>Advance Round</Text>
            </TouchableOpacity>
          </View>
        )}

        <ConfirmActionModal
          visible={isAdvanceModalVisible}
          title="Advance Round" // Add this line
          message="Are you sure you want to advance to the next round? This cannot be undone."
          onConfirm={executeAdvanceRound}
          onCancel={() => setIsAdvanceModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

// Update styles to remove the ones now in components
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  advanceButtonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: COLORS.backgroundWhite,
    borderTopWidth: 1,
    borderTopColor: COLORS.backgroundLight,
  },
  advanceButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  advanceButtonDisabled: {
    backgroundColor: COLORS.backgroundLight,
    opacity: 0.5,
  },
  advanceButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
    color: COLORS.textDark,
  },
  tournamentWinner: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.success,
    textAlign: "center",
    marginVertical: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    color: COLORS.textLight,
  },
  formatSelectorContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
    width: "100%",
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  debugText: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
    marginVertical: 5,
  },
  setupContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  formatSelectorWrapper: {
    width: "100%",
    marginBottom: 30,
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default TournamentScreen;
