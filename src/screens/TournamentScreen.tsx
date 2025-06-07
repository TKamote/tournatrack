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
import ConfirmActionModal from "../components/ConfirmActionModal";
import ScreenHeader from "../components/ScreenHeader";
import IncompleteMatchesModal from "../components/IncompleteMatchesModal";
import TournamentSummaryModal from "../components/TournamentSummaryModal";
import { findNextMatch } from "../utils/matchAdvancementUtils";

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
  const [tournamentOver, setTournamentOver] = useState(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [wbRound1Losers, setWbRound1Losers] = useState<Player[]>([]);
  const [activeBracketForDisplay, setActiveBracketForDisplay] = useState<
    BracketType | "all"
  >("all");
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [currentRound, setCurrentRound] = useState(1); // <-- Add this state
  const [currentLosersRound, setCurrentLosersRound] = useState(1);
  const [currentWinnersRound, setCurrentWinnersRound] = useState(1);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [runnerUp, setRunnerUp] = useState<Player | null>(null);
  const [finalMatch, setFinalMatch] = useState<Match | null>(null);

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
    setCurrentRound(1);
    setCurrentLosersRound(1);
    setCurrentWinnersRound(1);
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
      if (match.bracket === "winners" && match.round < currentRound)
        return true;
      if (match.bracket === "losers" && match.round < currentRound) return true;
      if (match.bracket === "grandFinals" && overallWinner) return true;
      return false;
    },
    [tournamentOver, currentRound, overallWinner]
  );

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      const currentTargetMatch = matches.find((m) => m.id === matchId);
      if (!currentTargetMatch) return;

      // Update the match with the winner
      const tempUpdatedMatches = matches.map((m) => {
        if (m.id === matchId) {
          return { ...m, winner: newWinningPlayer };
        }
        return m;
      });

      if (currentTargetMatch.bracket === "grandFinals") {
        const lbPlayerInGF = currentTargetMatch.player2;
        const wbPlayerInGF = currentTargetMatch.player1;

        if (!currentTargetMatch.isGrandFinalsReset) {
          if (wbPlayerInGF && newWinningPlayer.id === wbPlayerInGF.id) {
            // WB Champion wins - tournament over
            setOverallWinner(newWinningPlayer);
            setRunnerUp(lbPlayerInGF);
            setFinalMatch(currentTargetMatch);
            setTournamentOver(true);
            setShowSummaryModal(true);
          } else if (lbPlayerInGF && newWinningPlayer.id === lbPlayerInGF.id) {
            // Create reset match with same format
            const gfResetMatch = createMatch(
              `match-gf-reset-1`,
              currentTargetMatch.round,
              currentTargetMatch.matchNumber + 1,
              wbPlayerInGF,
              lbPlayerInGF,
              "grandFinals",
              true,
              receivedMatchFormat
            );
            tempUpdatedMatches.push(gfResetMatch);
          }
        } else {
          // Reset match winner is tournament winner
          setOverallWinner(newWinningPlayer);
          setRunnerUp(
            newWinningPlayer.id === wbPlayerInGF?.id
              ? lbPlayerInGF
              : wbPlayerInGF
          );
          setFinalMatch(currentTargetMatch);
          setTournamentOver(true);
          setShowSummaryModal(true);
        }
      }

      setMatches(tempUpdatedMatches);
    },
    [matches, receivedMatchFormat]
  );

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
        (match) => match.bracket === "winners" && match.round === currentRound
      );

      if (currentRoundMatches.length > 0) {
        filteredMatches = currentRoundMatches;
      } else {
        if (currentRound > 1) {
          filteredMatches = matches.filter(
            (match) =>
              match.bracket === "winners" && match.round === currentRound - 1
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
          (m) => m.bracket === "winners" && m.round === currentRound
        );
        if (
          filteredMatches.length === 0 &&
          currentRound > 1 &&
          !tournamentOver
        ) {
          filteredMatches = matches.filter(
            (m) => m.bracket === "winners" && m.round === currentRound - 1
          );
        }
      } else if (activeBracketForDisplay === "losers") {
        filteredMatches = matches.filter(
          (m) => m.bracket === "losers" && m.round === currentRound
        );
        if (
          filteredMatches.length === 0 &&
          currentRound > 1 &&
          !tournamentOver
        ) {
          filteredMatches = matches.filter(
            (m) => m.bracket === "losers" && m.round === currentRound - 1
          );
        }
      } else {
        const wbCurrent = matches.filter(
          (m) => m.bracket === "winners" && m.round === currentRound
        );
        const lbCurrent = matches.filter(
          (m) => m.bracket === "losers" && m.round === currentRound
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
      return `Round ${currentRound}`;
    if (tournamentType.startsWith("Double Elimination")) {
      let title = "";
      const wbHasPending = matches.some(
        (m) => m.bracket === "winners" && m.round === currentRound && !m.winner
      );
      const lbHasPending = matches.some(
        (m) => m.bracket === "losers" && m.round === currentRound && !m.winner
      );

      if (
        wbHasPending ||
        activeBracketForDisplay === "winners" ||
        (activeBracketForDisplay === "all" &&
          matches.some(
            (m) => m.bracket === "winners" && m.round === currentRound
          ))
      ) {
        title += `WB R${currentRound}`;
      }
      if (
        lbHasPending ||
        activeBracketForDisplay === "losers" ||
        (activeBracketForDisplay === "all" &&
          matches.some(
            (m) => m.bracket === "losers" && m.round === currentRound
          ))
      ) {
        if (title) title += " / ";
        title += `LB R${currentRound}`;
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
        (match) => match.round === currentRound && match.bracket === "winners"
      );
      if (currentRoundSEMatches.length === 0) {
        if (currentRound > 1) {
          const prevRoundMatches = matches.filter(
            (m) => m.round === currentRound - 1 && m.bracket === "winners"
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
      if (currentRound <= expectedWbFinalRound && !wbChampionIsKnown) {
        // Only check WB if it's not yet at/past its final
        const wbMatchesCurrent = matches.filter(
          (m) => m.bracket === "winners" && m.round === currentRound
        );
        if (wbMatchesCurrent.length > 0) {
          wbRoundCompleted = wbMatchesCurrent.every((m) => !!m.winner);
        } else if (
          currentRound > 1 &&
          !matches.some(
            (m) => m.bracket === "winners" && m.round === currentRound
          )
        ) {
          // If currentRound has advanced past existing matches, consider it "done" for this check,
          // assuming previous round led to a champion or advancement.
          // This case needs to be careful not to stall if WB champ is found but LB isn't ready.
          const prevWbMatches = matches.filter(
            (m) => m.bracket === "winners" && m.round === currentRound - 1
          );
          if (!prevWbMatches.some((m) => !m.winner))
            wbRoundCompleted = true; // if prev round fully done
          else wbRoundCompleted = false;
        } else {
          wbRoundCompleted = true; // No matches in this specific WB round (e.g. WB R1 for 2 players, or if WB champ already found)
        }
      }

      let lbRoundCompleted = true;
      if (currentRound <= expectedLbFinalRound && !lbChampionIsKnown) {
        // Only check LB if it's not yet at/past its final
        const lbMatchesCurrent = matches.filter(
          (m) => m.bracket === "losers" && m.round === currentRound
        );
        if (lbMatchesCurrent.length > 0) {
          lbRoundCompleted = lbMatchesCurrent.every((m) => !!m.winner);
        } else if (
          currentRound > 1 &&
          !matches.some(
            (m) => m.bracket === "losers" && m.round === currentRound
          )
        ) {
          // Similar to WB: if currentRound has advanced past existing matches.
          const prevLbMatches = matches.filter(
            (m) => m.bracket === "losers" && m.round === currentRound - 1
          );
          if (!prevLbMatches.some((m) => !m.winner)) lbRoundCompleted = true;
          else lbRoundCompleted = false;
        } else if (
          currentRound === 1 &&
          !matches.some((m) => m.bracket === "losers" && m.round === 1)
        ) {
          // Special case for LB R1: if no LB R1 matches exist (e.g. after WB R1, before LB R1 generated),
          // it's not "completed" in a way that should allow advancement if WB R1 isn't also done.
          // This is tricky. The main check should be if *playable* matches in current rounds are done.
          // If LB R1 hasn't been formed yet, but WB R1 is done, `executeAdvanceRound` should form LB R1.
          // So, if `currentRound` is 1 and no matches exist, it's "completed" for the purpose of `executeAdvanceRound`
          // potentially creating them, *if* the WB side is also ready.
          lbRoundCompleted = true; // Let executeAdvanceRound decide if it can form LB R1
        } else {
          lbRoundCompleted = true; // No matches in this specific LB round
        }
      }

      // If WB final is done, we only care about LB completion up to LB final
      if (wbChampionIsKnown && currentRound >= expectedWbFinalRound) {
        return lbRoundCompleted; // Advance if current LB round is done (or if LB champ also known)
      }

      // If LB final is done, we only care about WB completion up to WB final
      if (lbChampionIsKnown && currentRound >= expectedLbFinalRound) {
        return wbRoundCompleted; // Advance if current WB round is done (or if WB champ also known)
      }

      // Default: both current rounds must be completed
      return wbRoundCompleted && lbRoundCompleted;
    }
    return false;
  }, [
    matches,
    currentRound,
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

    const initialCurrentWinnersRound = currentRound;
    const initialCurrentLosersRound = currentRound;

    const currentWBMatches = matches.filter(
      (m) => m.bracket === "winners" && m.round === currentWinnersRound
    );
    const currentLBMatches = matches.filter(
      (m) => m.bracket === "losers" && m.round === currentLosersRound
    );

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
        currentRoundSECompletedMatches, // Pass the completed matches instead of just winners
        nextRoundNumber,
        receivedMatchFormat
      );

      if (generatedSEMatches.length === 0 && winners.length === 1) {
        setOverallWinner(winners[0]);
        setTournamentOver(true);
      } else if (generatedSEMatches.length > 0) {
        setMatches((prev) => [...prev, ...generatedSEMatches]);
        setCurrentRound(nextRoundNumber);
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
          const wbWinners = currentWBMatches
            .filter((m) => m.winner)
            .map((m) => m.winner!);
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
              currentWBMatches, // Pass the matches array instead of winners array
              nextWBRoundNumber,
              receivedMatchFormat
            );
            if (newWBMatchesGeneratedThisCall.length > 0) {
              setCurrentRound(nextWBRoundNumber);
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
            wbRound1Losers,
            matches.length,
            receivedMatchFormat
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
                  ((currentRound > 2 || wbChampionDeterminedThisCall) &&
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
                      currentLBMatches, // This is already Match[]
                      wbR2Losers, // This is Player[], which is correct
                      nextLBRoundNumberTarget,
                      receivedMatchFormat
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
                    currentLBMatches, // This is Match[]
                    [], // Empty array of new losers
                    nextLBRoundNumberTarget,
                    receivedMatchFormat
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
                        matches.filter(
                          (m) =>
                            m.bracket === "losers" && m.round === currentRound
                        ), // Get actual matches
                        [loserOfWBR3], // Array of new losers
                        actualLbFinalRoundTarget,
                        receivedMatchFormat
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
          false,
          receivedMatchFormat // Use the same format throughout
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
  const canAdvanceRound = useCallback(() => {
    if (tournamentType.startsWith("Single Knockout")) {
      const currentMatches = matches.filter(
        (m) => m.round === currentRound && !m.isGrandFinalsReset
      );
      return currentMatches.every((m) => m.winner !== null);
    } else {
      // For Double Elimination, use the existing allCurrentRoundMatchesCompleted logic
      return allCurrentRoundMatchesCompleted();
    }
  }, [matches, currentRound, tournamentType, allCurrentRoundMatchesCompleted]);

  const handleAdvanceRoundPress = useCallback(() => {
    if (!allCurrentRoundMatchesCompleted()) {
      setShowIncompleteModal(true);
      return;
    }
    setIsAdvanceModalVisible(true);
  }, [allCurrentRoundMatchesCompleted]);

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
                !canAdvanceRound() && styles.advanceButtonDisabled,
              ]}
              onPress={handleAdvanceRoundPress}
            >
              <Text style={styles.advanceButtonText}>
                {tournamentType.startsWith("Single Knockout")
                  ? `Advance to Round ${currentRound + 1}`
                  : "Advance Round"}
              </Text>
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

        <IncompleteMatchesModal
          visible={showIncompleteModal}
          onClose={() => setShowIncompleteModal(false)}
        />

        <TournamentSummaryModal
          visible={showSummaryModal && !!overallWinner && !!finalMatch}
          onClose={() => setShowSummaryModal(false)}
          winner={overallWinner!}
          runnerUp={runnerUp}
          tournamentType={tournamentType}
          finalMatch={finalMatch!}
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
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  advanceButtonDisabled: {
    backgroundColor: COLORS.disabledButton,
    opacity: 0.8, // increased from 0.5 for better visibility
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
