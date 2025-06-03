import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Button,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Player, Match, BracketType, TournamentType } from "../types";
import {
  generatePlayers as generateDefaultPlayers,
  createSEInitialMatches,
  generateSENextRoundMatches,
  createDoubleEliminationInitialMatches,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches,
  createMatch,
} from "../utils/tournamentUtils";

interface TournamentScreenProps {
  tournamentType: TournamentType;
  numPlayers: number;
  playerNames: string[];
  onGoBack: () => void;
}

const TournamentScreen: React.FC<TournamentScreenProps> = ({
  tournamentType,
  numPlayers,
  playerNames: receivedPlayerNames,
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
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    setHasInitialized(false);
    setPlayers([]);
    setMatches([]);
  }, [numPlayers, tournamentType, receivedPlayerNames]);

  useEffect(() => {
    if (
      !hasInitialized &&
      receivedPlayerNames &&
      receivedPlayerNames.length === numPlayers &&
      numPlayers > 0
    ) {
      const initialPlayers = receivedPlayerNames.map((name, index) => ({
        id: `player-${index + 1}-${name.replace(/\s+/g, "-").toLowerCase()}`,
        name: name,
        losses: 0,
      }));
      setPlayers(initialPlayers);
    } else if (
      !hasInitialized &&
      (!receivedPlayerNames || receivedPlayerNames.length !== numPlayers) &&
      numPlayers > 0
    ) {
      setPlayers(generateDefaultPlayers(numPlayers));
    }
  }, [receivedPlayerNames, numPlayers, hasInitialized]);

  useEffect(() => {
    if (players.length > 0 && !hasInitialized) {
      let initialMatches: Match[] = [];
      if (tournamentType.startsWith("Single Knockout")) {
        initialMatches = createSEInitialMatches(players);
      } else if (tournamentType.startsWith("Double Elimination")) {
        initialMatches = createDoubleEliminationInitialMatches(players);
      }

      if (initialMatches.length > 0) {
        setMatches(initialMatches);
        setCurrentWinnersRound(1);
        setCurrentLosersRound(1);
        setTournamentOver(false);
        setOverallWinner(null);
        setWbRound1Losers([]);
        setActiveBracketForDisplay(
          tournamentType.startsWith("Double Elimination") ? "all" : "winners"
        );
        setHasInitialized(true);
      }
    }
  }, [players, tournamentType, hasInitialized]);

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

      // --- (F) Set Overall Winner (after Grand Finals played) ---
      // This section in executeAdvanceRound is now largely redundant for GF if handleSetWinner is comprehensive.
      // It might still serve as a fallback for other tournament types or if handleSetWinner misses a case.
      // For DE GF, handleSetWinner should be the primary driver.
      // Consider removing or commenting out the GF-specific parts of Section F in executeAdvanceRound.
      /*
          // const allGrandFinalsMatches = matches // Definition moved up
          //  .concat(newMatchesToAdd)
          //  .filter((m) => m.bracket === "grandFinals");
          if (!tournamentOver && allGrandFinalsMatches.length > 0) { // Check !tournamentOver
            const firstGF = allGrandFinalsMatches.find(
              (m) => !m.isGrandFinalsReset && m.winner
            );
            const resetGF = allGrandFinalsMatches.find(
              (m) => m.isGrandFinalsReset === true && m.winner
            );

            // This logic is now primarily in handleSetWinner
            if (firstGF) {
              const wbPlayerInGF = firstGF.player1; 
              if (firstGF.winner?.id === wbPlayerInGF?.id && !tournamentOver) {
                // setOverallWinner(firstGF.winner!); // Handled by handleSetWinner
                // setTournamentOver(true);           // Handled by handleSetWinner
              } else if (firstGF.winner?.id !== wbPlayerInGF?.id) { // LB Player won first GF
                if (resetGF && !tournamentOver) {
                  // setOverallWinner(resetGF.winner!); // Handled by handleSetWinner
                  // setTournamentOver(true);            // Handled by handleSetWinner
                }
                // Creation of reset match is now in handleSetWinner
              }
            }
          }
      */

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

  const BracketViewButtons = () => {
    if (
      !tournamentType.startsWith("Double Elimination") ||
      tournamentOver ||
      matches.some((m) => m.bracket === "grandFinals")
    ) {
      return null;
    }
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginVertical: 10,
        }}
      >
        <Button
          title="WB"
          onPress={() => setActiveBracketForDisplay("winners")}
          disabled={activeBracketForDisplay === "winners"}
        />
        <View style={{ width: 10 }} />
        <Button
          title="LB"
          onPress={() => setActiveBracketForDisplay("losers")}
          disabled={activeBracketForDisplay === "losers"}
        />
        <View style={{ width: 10 }} />
        <Button
          title="All"
          onPress={() => setActiveBracketForDisplay("all")}
          disabled={activeBracketForDisplay === "all"}
        />
      </View>
    );
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const player1 = players.find((p) => p.id === item.player1?.id);
    const player2 = players.find((p) => p.id === item.player2?.id);

    const player1Name = player1
      ? `${player1.name} (${player1.losses}L)`
      : item.player1
      ? "P1?"
      : "TBD";
    const player2Name = player2
      ? `${player2.name} (${player2.losses}L)`
      : item.player2
      ? "P2?"
      : "TBD / BYE";

    const displayP1Name = tournamentType.startsWith("Single Knockout")
      ? player1?.name || "TBD"
      : player1Name;
    const displayP2Name = tournamentType.startsWith("Single Knockout")
      ? player2?.name || "TBD / BYE"
      : player2Name;

    const matchIsEffectivelyLocked = isMatchLocked(item);

    if (item.player1 && !item.player2 && item.winner) {
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
                item.player1 && handleSetWinner(item.id, item.player1)
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
                item.player2 && handleSetWinner(item.id, item.player2)
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
    return (
      <View style={styles.matchContainer}>
        <Text style={styles.bracketInfoText}>
          {item.bracket.toUpperCase()} - R{item.round} M{item.matchNumber}
        </Text>
        <Text style={styles.matchText}>
          {displayP1Name} vs {displayP2Name}
        </Text>
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
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>&lt; Home</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.titleText}>TournaTrack - {tournamentType}</Text>
        <Text style={styles.subTitle}>{displayTitle()}</Text>
        <BracketViewButtons />
        {tournamentOver && overallWinner ? (
          <Text style={styles.tournamentWinner}>
            🏆 Winner: {overallWinner.name}! 🏆
          </Text>
        ) : matchesForDisplay().length > 0 ? (
          <FlatList
            style={{ width: "100%" }}
            data={matchesForDisplay()}
            keyExtractor={(item) => item.id}
            renderItem={renderMatchItem}
            extraData={{
              playersVersion: players.map((p) => p.id + p.losses).join("-"),
              matchesVersion: matches.map((m) => m.id + m.winner?.id).join("-"),
              currentWinnersRound,
              currentLosersRound,
              activeBracketForDisplay,
              tournamentOver,
            }}
          />
        ) : (
          <Text style={styles.infoText}>
            {!tournamentOver
              ? "Generating matches or no pending matches for current view..."
              : "Tournament ended."}
          </Text>
        )}
        {!tournamentOver && (
          <View style={styles.advanceButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.pressableButton,
                (!allCurrentRoundMatchesCompleted() || tournamentOver) &&
                  styles.pressableButtonDisabled,
                pressed && styles.pressableButtonPressed,
              ]}
              onPress={handleAdvanceRoundPress}
              disabled={!allCurrentRoundMatchesCompleted() || tournamentOver}
            >
              <Text style={styles.pressableButtonText}>Advance Round(s)</Text>
            </Pressable>
          </View>
        )}
        <Modal
          transparent={true}
          animationType="slide"
          visible={isAdvanceModalVisible}
          onRequestClose={() => setIsAdvanceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Advancement</Text>
              <Text style={styles.modalMessage}>
                Advance to next round? Results will be locked.
              </Text>
              <View style={styles.modalButtonContainer}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setIsAdvanceModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={executeAdvanceRound}
                >
                  <Text style={styles.modalButtonText}>YES</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f0f0" },
  container: { flex: 1, padding: 10 },
  headerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: { padding: 10 },
  backButtonText: { fontSize: 16, color: "#007bff" },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#555",
  },
  tournamentWinner: {
    fontSize: 22,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
    marginVertical: 20,
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    color: "#666",
  },
  matchContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 1,
  },
  bracketInfoText: {
    fontSize: 12,
    color: "#666",
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
    borderColor: "#ccc",
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 5,
  },
  playerButtonText: {
    fontSize: 14,
  },
  playerButtonDisabled: {
    backgroundColor: "#e9ecef",
  },
  winnerButton: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
  },
  vsText: {
    marginHorizontal: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
  matchText: {
    fontSize: 14,
  },
  winnerText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
  },
  lockedMatchText: {
    fontSize: 10,
    color: "red",
    textAlign: "center",
    marginTop: 3,
  },
  advanceButtonContainer: {
    marginVertical: 15,
    alignItems: "center",
  },
  pressableButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    elevation: 2,
  },
  pressableButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  pressableButtonPressed: {
    backgroundColor: "#0056b3",
  },
  pressableButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalMessage: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonCancel: { backgroundColor: "#6c757d" },
  modalButtonConfirm: { backgroundColor: "#007bff" },
  modalButtonText: { color: "white", fontSize: 16 },
});

export default TournamentScreen;
