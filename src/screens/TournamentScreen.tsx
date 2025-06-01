import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  Button,
  TouchableOpacity,
  Pressable,
  Alert, // Added
  Modal, // Added
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Player, Match, BracketType } from "../types";
import {
  generatePlayers,
  createSEInitialMatches,
  generateSENextRoundMatches,
  createDoubleEliminationInitialMatches,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches, // <-- Add this import
} from "../utils/tournamentUtils";
import { TournamentType } from "./HomeScreen";

interface TournamentScreenProps {
  tournamentType: TournamentType;
  numPlayers: number;
  onGoBack: () => void;
}

const TournamentScreen: React.FC<TournamentScreenProps> = ({
  tournamentType,
  numPlayers,
  onGoBack,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentWinnersRound, setCurrentWinnersRound] = useState<number>(1);
  const [currentLosersRound, setCurrentLosersRound] = useState<number>(1);
  const [activeBracketForDisplay, setActiveBracketForDisplay] = useState<
    BracketType | "all"
  >("winners");
  const [tournamentOver, setTournamentOver] = useState<boolean>(false);
  const [overallWinner, setOverallWinner] = useState<Player | null>(null);
  const [wbRound1Losers, setWbRound1Losers] = useState<Player[]>([]);
  const [isAdvanceModalVisible, setIsAdvanceModalVisible] = useState(false); // New state for modal

  useEffect(() => {
    console.log(
      `Initializing ${tournamentType} tournament with ${numPlayers} players...`
    );
    const initialPlayers = generatePlayers(numPlayers);
    setPlayers(initialPlayers);

    let firstRoundMatches: Match[] = [];
    if (tournamentType.startsWith("Single Knockout")) {
      firstRoundMatches = createSEInitialMatches(initialPlayers);
      setCurrentWinnersRound(1);
      setActiveBracketForDisplay("winners");
    } else if (tournamentType.startsWith("Double Elimination")) {
      firstRoundMatches = createDoubleEliminationInitialMatches(initialPlayers);
      setCurrentWinnersRound(1);
      setCurrentLosersRound(1);
      setActiveBracketForDisplay("winners");
    }
    setMatches(firstRoundMatches);
    setTournamentOver(false);
    setOverallWinner(null);
    setCurrentWinnersRound(1);
    setCurrentLosersRound(1);
    setWbRound1Losers([]);
    setIsAdvanceModalVisible(false); // Ensure modal is hidden on re-init
  }, [tournamentType, numPlayers]);

  // Moved isMatchLocked before handleSetWinner
  const isMatchLocked = useCallback(
    (match: Match): boolean => {
      if (tournamentOver) return true;

      // A match is locked if its round is less than the current active round for its bracket.
      if (match.bracket === "winners" && match.round < currentWinnersRound) {
        // console.log(`Match ${match.id} (WB R${match.round}) is LOCKED because current WB round is ${currentWinnersRound}`);
        return true;
      }
      if (match.bracket === "losers" && match.round < currentLosersRound) {
        // console.log(`Match ${match.id} (LB R${match.round}) is LOCKED because current LB round is ${currentLosersRound}`);
        return true;
      }

      // Grand finals locking might need specific logic if it's considered a separate phase
      if (match.bracket === "grandFinals" && overallWinner) return true;

      return false;
    },
    [
      tournamentOver,
      currentWinnersRound,
      currentLosersRound,
      // matches, // matches can be a frequent changer; only add if complex logic truly needs it
      overallWinner,
      // tournamentType, // tournamentType doesn't change after init for this screen
    ]
  );

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      const targetMatchIndex = matches.findIndex((m) => m.id === matchId);
      if (targetMatchIndex === -1) {
        console.error(`Match with ID ${matchId} not found.`);
        return;
      }
      const targetMatch = { ...matches[targetMatchIndex] };
      if (isMatchLocked(targetMatch)) {
        Alert.alert(
          "Match Locked",
          "This match's result cannot be changed as subsequent rounds may depend on it or have already been processed."
        );
        return;
      }

      const oldWinner = targetMatch.winner;
      const player1 = targetMatch.player1;
      const player2 = targetMatch.player2;

      // If clicking the same winner again, do nothing (or allow unsetting if desired - more complex)
      if (oldWinner && oldWinner.id === newWinningPlayer.id) {
        console.log(
          `Player ${newWinningPlayer.name} is already the winner of match ${matchId}. No change.`
        );
        return;
      }

      let newLoserOfMatch: Player | null = null;
      if (player1 && player2) {
        // Determine new loser only if two players were in the match
        newLoserOfMatch =
          player1.id === newWinningPlayer.id ? player2 : player1;
      }

      // --- State Update Logic ---
      let finalPlayers = [...players];
      let finalMatches = [...matches];
      let finalWbRound1Losers = [...wbRound1Losers]; // Operate on copies

      // 1. Handle consequences of the OLD outcome (if changing a winner)
      if (oldWinner && player1 && player2) {
        const oldLoserOfMatch = player1.id === oldWinner.id ? player2 : player1;
        console.log(
          `Changing winner for match ${targetMatch.id}. Old winner: ${oldWinner.name}, Old loser: ${oldLoserOfMatch.name}. New winner: ${newWinningPlayer.name}`
        );

        finalPlayers = finalPlayers.map((p) =>
          p.id === oldLoserOfMatch.id
            ? { ...p, losses: Math.max(0, (p.losses || 0) - 1) }
            : p
        );

        if (
          tournamentType.startsWith("Double Elimination") &&
          targetMatch.bracket === "winners" &&
          targetMatch.round === 1 &&
          numPlayers === 8
        ) {
          finalWbRound1Losers = finalWbRound1Losers.filter(
            (l) => l.id !== oldLoserOfMatch.id
          );
          finalMatches = finalMatches.filter((m) => {
            if (m.bracket === "losers" && m.round === 1 && !m.winner) {
              if (
                m.player1?.id === oldLoserOfMatch.id ||
                m.player2?.id === oldLoserOfMatch.id
              ) {
                console.log(
                  `Removing unplayed LB match ${m.id} due to winner change affecting ${oldLoserOfMatch.name}`
                );
                return false;
              }
            }
            return true;
          });
        }
      }

      // 2. Update the target match with the NEW winner
      finalMatches = finalMatches.map((m) =>
        m.id === targetMatch.id ? { ...m, winner: newWinningPlayer } : m
      );

      // 3. Process consequences for the NEW loser
      if (newLoserOfMatch) {
        const newLoserId = newLoserOfMatch.id;
        let currentLosses = 0;
        finalPlayers = finalPlayers.map((p) => {
          if (p.id === newLoserId) {
            currentLosses = (p.losses || 0) + 1;
            return { ...p, losses: currentLosses };
          }
          return p;
        });

        if (tournamentType.startsWith("Double Elimination")) {
          if (targetMatch.bracket === "winners") {
            console.log(
              `${newLoserOfMatch.name} drops from WB (match ${targetMatch.id}).`
            );
            if (targetMatch.round === 1 && numPlayers === 8) {
              const alreadyExists = finalWbRound1Losers.some(
                (l) => l.id === newLoserOfMatch.id
              );
              if (!alreadyExists) {
                finalWbRound1Losers = [
                  ...finalWbRound1Losers,
                  { ...newLoserOfMatch },
                ];
                console.log(
                  // Log immediately after adding
                  "HANDLE_SET_WINNER: Added to wbRound1Losers:",
                  newLoserOfMatch.name,
                  "Current list:",
                  finalWbRound1Losers.map((p) => p.name)
                );
              }

              // Check if it's time to generate LB R1 matches
              // This check is now outside the .map or a chained function
              if (finalWbRound1Losers.length === 4) {
                console.log(
                  "HANDLE_SET_WINNER: All 4 WB R1 Losers collected for LB R1 generation:",
                  finalWbRound1Losers.map((p) => p.name + `(${p.id})`)
                );

                // Filter out any existing unplayed LB R1 matches before adding new ones
                // This is to prevent duplicates if this logic somehow runs multiple times
                // or if a winner is changed back and forth.
                const matchesWithoutExistingUnplayedLBR1 = finalMatches.filter(
                  (m) => !(m.bracket === "losers" && m.round === 1 && !m.winner)
                );

                console.log(
                  "HANDLE_SET_WINNER: PRE-CALL to generateDELosersBracketRound1Matches. Losers being passed:",
                  finalWbRound1Losers.map((p) => `${p.name}(${p.id})`),
                  "Count for existingMatchCount:",
                  matchesWithoutExistingUnplayedLBR1.length
                );

                const newLBM = generateDELosersBracketRound1Matches(
                  [...finalWbRound1Losers], // Pass a copy
                  matchesWithoutExistingUnplayedLBR1.length
                );

                if (newLBM && newLBM.length > 0) {
                  console.log(
                    "HANDLE_SET_WINNER: POST-CALL - SUCCESSFULLY Generated LB R1 matches:",
                    newLBM.map(
                      (m) =>
                        `(${m.player1?.name} vs ${m.player2?.name}) ID: ${m.id}`
                    )
                  );
                  finalMatches = [
                    ...matchesWithoutExistingUnplayedLBR1,
                    ...newLBM,
                  ];
                  finalWbRound1Losers = []; // Clear the collector
                  console.log(
                    "HANDLE_SET_WINNER: wbRound1Losers cleared after LB R1 generation."
                  );
                } else {
                  console.log(
                    "HANDLE_SET_WINNER: POST-CALL - generateDELosersBracketRound1Matches returned no matches. wbRound1Losers at this point:",
                    finalWbRound1Losers.map((p) => p.name)
                    // Not clearing finalWbRound1Losers here, as generation failed.
                  );
                }
              }
            }
          } else if (targetMatch.bracket === "losers") {
            if (currentLosses >= 2) {
              console.log(
                `${newLoserOfMatch.name} (now ${currentLosses}L) is eliminated from LB.`
              );
            }
          }
        }
      }

      // Apply all state updates
      setPlayers(finalPlayers);
      setMatches(finalMatches);
      setWbRound1Losers(finalWbRound1Losers);
    },
    [
      matches,
      players,
      tournamentType,
      numPlayers,
      wbRound1Losers, // Still need this for initial read
      isMatchLocked,
      // generateDELosersBracketRound1Matches is a direct import, not needed in deps if stable
      // currentWinnersRound, currentLosersRound, overallWinner are for isMatchLocked
    ]
  );

  const handleAdvanceRound = () => {
    if (tournamentOver) return;

    if (tournamentType.startsWith("Single Knockout")) {
      const completedMatchesThisRound = matches.filter(
        (match) =>
          match.round === currentWinnersRound &&
          match.winner &&
          match.bracket === "winners"
      );
      const winners = completedMatchesThisRound
        .map((match) => match.winner!)
        .filter(Boolean) as Player[];

      if (winners.length === 1 && completedMatchesThisRound.length === 1) {
        setOverallWinner(winners[0]);
        setTournamentOver(true);
        return;
      }
      if (winners.length < 2 && completedMatchesThisRound.length > 0) {
        if (winners.length === 1) {
          setOverallWinner(winners[0]);
          setTournamentOver(true);
          return;
        }
        console.log("Not enough winners to form the next round for SE.");
        return;
      }
      if (winners.length === 0) {
        console.log("No winners from current round to advance for SE.");
        return;
      }

      const nextRoundNumber = currentWinnersRound + 1;
      const newMatches = generateSENextRoundMatches(
        winners,
        nextRoundNumber,
        matches.length
      );

      if (newMatches.length === 0 && winners.length === 1) {
        setOverallWinner(winners[0]);
        setTournamentOver(true);
        return;
      } else if (newMatches.length === 1 && newMatches[0].winner) {
        setMatches((prev) => [...prev, ...newMatches]);
        setOverallWinner(newMatches[0].winner!);
        setTournamentOver(true);
        setCurrentWinnersRound(nextRoundNumber);
        return;
      }
      setMatches((prev) => [...prev, ...newMatches]);
      setCurrentWinnersRound(nextRoundNumber);
    } else if (tournamentType.startsWith("Double Elimination")) {
      console.log("Attempting to advance round for Double Elimination...");
      const currentWBRoundMatches = matches.filter(
        (m) => m.bracket === "winners" && m.round === currentWinnersRound
      );
      const allCurrentWBRoundMatchesCompleted =
        currentWBRoundMatches.length > 0 &&
        currentWBRoundMatches.every((m) => !!m.winner);

      if (allCurrentWBRoundMatchesCompleted) {
        const wbWinners = currentWBRoundMatches
          .map((m) => m.winner!)
          .filter(Boolean) as Player[];
        if (wbWinners.length >= 2) {
          const nextWBRoundNumber = currentWinnersRound + 1;
          const newWBMatches = generateDEWinnersBracketNextRound(
            wbWinners,
            nextWBRoundNumber,
            matches.length
          );
          if (newWBMatches.length > 0) {
            setMatches((prev) => [...prev, ...newWBMatches]);
            setCurrentWinnersRound(nextWBRoundNumber);
            console.log(
              `Advanced Winners' Bracket to round ${nextWBRoundNumber}`
            );
          } else if (wbWinners.length === 1) {
            console.log(
              `Winner of Winners' Bracket: ${wbWinners[0].name}. Waiting for Losers' Bracket.`
            );
          }
        } else if (wbWinners.length === 1) {
          console.log(
            `Winner of Winners' Bracket: ${wbWinners[0].name}. Waiting for Losers' Bracket.`
          );
        }
      } else {
        console.log(
          "Not all Winners' Bracket matches for current round are completed."
        );
      }

      // --- Losers' Bracket Advancement (Very Basic Placeholder) ---
      // TODO: Implement full LB advancement logic
      // This would involve:
      // 1. Identifying losers from completed WB matches who need to be placed in LB.
      // 2. Creating new LB matches.
      // 3. Advancing winners of existing LB matches.
      console.log("Losers' Bracket advancement logic needs to be implemented.");

      // --- Check for Grand Finals ---
      // TODO: Implement Grand Finals check
      // This would happen when one player remains in WB and one in LB.
    }
  };

  // Define matchesForDisplay as a function
  const matchesForDisplay = (): Match[] => {
    let filteredMatches: Match[] = [];
    if (tournamentOver && overallWinner) {
      // If tournament is over, try to show the round that produced the winner
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
        // Fallback: show all matches from the last played round in winners or grand finals
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
        // Absolute fallback if tournament is over
        filteredMatches = matches;
      }
    } else if (tournamentType.startsWith("Single Knockout")) {
      // Primarily show matches of the current designated round
      let currentRoundMatches = matches.filter(
        (match) =>
          match.bracket === "winners" && match.round === currentWinnersRound
      );

      if (currentRoundMatches.length > 0) {
        // If there are matches for the current round, display them
        filteredMatches = currentRoundMatches;
      } else {
        // No matches for currentWinnersRound.
        // This could mean:
        // 1. Tournament just advanced, currentWinnersRound incremented, but matches for this new round haven't been generated/added yet (should be brief).
        // 2. All matches for currentWinnersRound are done, and we are waiting for next round generation.
        if (currentWinnersRound > 1) {
          // If current round is > 1 and has no matches, show the completed previous round.
          // This handles the state where R1 is done, CWR is 2, but R2 matches are not yet shown/clicked.
          filteredMatches = matches.filter(
            (match) =>
              match.bracket === "winners" &&
              match.round === currentWinnersRound - 1
          );
        } else {
          // Still on Round 1, but no matches? This is an anomaly if initialized.
          // Or, all R1 matches are done, and R2 is about to be generated.
          // Show all pending matches in winners bracket as a fallback.
          filteredMatches = matches.filter(
            (m) => m.bracket === "winners" && !m.winner
          );
        }
      }
      // If, after all this, filteredMatches is still empty and tournament not over,
      // show all winners bracket matches as a last resort (should indicate an issue).
      if (
        filteredMatches.length === 0 &&
        !tournamentOver &&
        matches.some((m) => m.bracket === "winners")
      ) {
        console.warn(
          "matchesForDisplay (SE): No specific matches found, showing all WB matches as fallback."
        );
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
          // If no WB matches for current round, show previous completed WB round
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
          // If no LB matches for current round, show previous completed LB round
          filteredMatches = matches.filter(
            (m) => m.bracket === "losers" && m.round === currentLosersRound - 1
          );
        }
      } else {
        // "all"
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
          filteredMatches = matches.filter((m) => !m.winner); // Show all pending
        }
      }
    }

    // If still no matches and tournament not over (e.g. initial state or error), show all matches.
    if (filteredMatches.length === 0 && !tournamentOver && matches.length > 0) {
      // console.warn("matchesForDisplay: No specific matches found for current view, showing all matches.");
      // return matches.sort(/* ... */); // Avoid showing all if not intended.
      // Instead, let it be empty if no specific logic above catches it.
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

  // Define displayTitle as a function
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

    const grandFinalsMatchesFromState = matches.filter(
      (m) => m.bracket === "grandFinals"
    );

    if (grandFinalsMatchesFromState.length > 0) {
      const firstGF = grandFinalsMatchesFromState.find(
        (m) => !m.isGrandFinalsReset
      );
      const resetGF = grandFinalsMatchesFromState.find(
        (m) => m.isGrandFinalsReset === true
      );

      if (!firstGF) {
        console.warn(
          "allCurrentRoundMatchesCompleted: GF matches exist but no firstGF found."
        );
        return false; // Path 1
      }
      if (!firstGF.winner) {
        return false; // Path 2: First GF not played
      }

      const lbPlayerWonFirstGF =
        firstGF.player2 &&
        firstGF.winner &&
        firstGF.player2.id === firstGF.winner.id;

      if (lbPlayerWonFirstGF) {
        if (!resetGF) {
          return true; // Path 3: Ready to generate reset match
        }
        if (!resetGF.winner) {
          return false; // Path 4: Reset match pending
        }
        return true; // Path 5: Reset match played
      } else {
        return true; // Path 6: WB player won first GF
      }
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
            return true; // Tournament ended
          }
        }
        return false;
      }
      return currentRoundSEMatches.every((match) => !!match.winner);
    } else if (tournamentType.startsWith("Double Elimination")) {
      const wbMatchesCurrentRound = matches.filter(
        (m) => m.bracket === "winners" && m.round === currentWinnersRound
      );
      const lbMatchesCurrentRound = matches.filter(
        (m) => m.bracket === "losers" && m.round === currentLosersRound
      );

      const wbCompleted =
        wbMatchesCurrentRound.length > 0
          ? wbMatchesCurrentRound.every((m) => !!m.winner)
          : true;
      const lbCompleted =
        lbMatchesCurrentRound.length > 0
          ? lbMatchesCurrentRound.every((m) => !!m.winner)
          : true;

      if (numPlayers === 8) {
        if (currentWinnersRound === 1 && currentLosersRound === 1) {
          return wbCompleted && lbCompleted;
        }
        if (currentWinnersRound === 2 && currentLosersRound === 2) {
          return wbCompleted && lbCompleted;
        }
        if (currentWinnersRound === 3 && currentLosersRound === 3) {
          return wbCompleted && lbCompleted;
        }
        if (currentWinnersRound === 3 && currentLosersRound === 4) {
          const wbR3Matches = matches.filter(
            (m) => m.bracket === "winners" && m.round === 3
          );
          const wbR3Completed =
            wbR3Matches.length > 0
              ? wbR3Matches.every((m) => !!m.winner)
              : true;
          return wbR3Completed && lbCompleted;
        }
      }

      if (
        wbMatchesCurrentRound.length === 0 &&
        lbMatchesCurrentRound.length === 0 &&
        !grandFinalsMatchesFromState.length
      ) {
        const wbChamp = players.find(
          (p) =>
            p.losses === 0 &&
            matches.some(
              (m) =>
                m.bracket === "winners" &&
                m.winner?.id === p.id &&
                m.round === (numPlayers === 8 ? 3 : -1) // Max WB round for DE-8 is 3
            )
        );
        const lbChamp = players.find(
          (p) =>
            p.losses === 1 &&
            matches.some(
              (m) =>
                m.bracket === "losers" &&
                m.winner?.id === p.id &&
                m.round === (numPlayers === 8 ? 4 : -1) // Max LB round for DE-8 is 4
            )
        );
        if (wbChamp && lbChamp) {
          return true; // Ready for GF
        }
      }
      // If specific DE-8 stage conditions aren't met, or for other numPlayers,
      // rely on the general wbCompleted && lbCompleted.
      if (wbCompleted && lbCompleted) {
        return true;
      }
    }
    // Default fallback if no other condition was met (e.g., unknown tournament type, or a DE logic path not returning)
    return false;
  }, [
    matches,
    currentWinnersRound,
    currentLosersRound,
    tournamentOver,
    tournamentType,
    numPlayers,
    players,
  ]);

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

    // Conditionally hide losses for SE
    const displayP1Name = tournamentType.startsWith("Single Knockout")
      ? player1?.name || "TBD"
      : player1Name;
    const displayP2Name = tournamentType.startsWith("Single Knockout")
      ? player2?.name || "TBD / BYE"
      : player2Name;

    const matchIsEffectivelyLocked = isMatchLocked(item);

    if (item.player1 && !item.player2 && item.winner) {
      // Bye with auto-winner
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
      // Standard match
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
              <Text style={styles.matchText}>{displayP1Name}</Text>
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
              <Text style={styles.matchText}>{displayP2Name}</Text>
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
    // Fallback for TBD vs TBD or other unhandled cases
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

  const executeAdvanceRound = () => {
    setIsAdvanceModalVisible(false);
    if (tournamentOver) return;

    console.log("Executing Advance Round...");
    let newMatchesToAdd: Match[] = [];
    // --- DECLARE MISSING VARIABLES HERE ---
    let collectedWBLosersForLB: Player[] = [];
    let advancedWB = false;
    let advancedLB = false;
    let wbChampion: Player | null = null;
    let lbChampion: Player | null = null;
    // --- END OF DECLARATIONS ---

    if (tournamentType.startsWith("Single Knockout")) {
      // Define currentRoundSEMatches here to get completed matches for the current round
      const currentRoundSECompletedMatches = matches.filter(
        (
          match: Match // Added type for match
        ) =>
          match.bracket === "winners" &&
          match.round === currentWinnersRound &&
          !!match.winner // Ensure we only get completed matches
      );

      const winners = currentRoundSECompletedMatches // Use the correct variable
        .map((match: Match) => match.winner!) // Added type for match
        .filter(Boolean) as Player[];

      const nextRoundNumber = currentWinnersRound + 1;
      const generatedSEMatches = generateSENextRoundMatches(
        winners,
        nextRoundNumber,
        matches.length
      );

      if (generatedSEMatches.length === 0 && winners.length === 1) {
        setOverallWinner(winners[0]);
        setTournamentOver(true);
        console.log(
          `SE Tournament Over (final match was this one). Winner: ${winners[0].name}`
        );
      } else if (generatedSEMatches.length > 0) {
        setMatches((prev) => [...prev, ...generatedSEMatches]);
        setCurrentWinnersRound(nextRoundNumber);
        console.log(
          `SE: Advanced to Round ${nextRoundNumber}. New matches added:`,
          generatedSEMatches.map((m) => m.id)
        );
      } else if (generatedSEMatches.length === 0 && winners.length > 1) {
        console.log(
          "SE: No new matches generated, but multiple winners. This indicates an issue or unhandled end state."
        );
      } else if (
        winners.length === 0 &&
        currentRoundSECompletedMatches.length > 0
      ) {
        // All matches in the round are done, but no winners (e.g., all draws if that were possible, or an error)
        console.log(
          "SE: All matches in current round completed, but no winners to advance."
        );
      } else if (
        winners.length === 0 &&
        currentRoundSECompletedMatches.length === 0
      ) {
        // No completed matches in the current round. This case should ideally be caught by allCurrentRoundMatchesCompleted()
        console.log(
          "SE: No completed matches in the current round to advance from."
        );
      }
    } else if (tournamentType.startsWith("Double Elimination")) {
      console.log(
        `DE: Advancing. Current WB R${currentWinnersRound}, LB R${currentLosersRound}`
      );
      // --- Initialize arrays for newly generated matches in this call ---
      let newWBMatchesGeneratedThisCall: Match[] = [];
      let newLBMatchesGeneratedThisCall: Match[] = [];
      // ---

      // --- Winners' Bracket (WB) Advancement ---
      const wbMatchesThisRound = matches.filter(
        (m) => m.bracket === "winners" && m.round === currentWinnersRound
      );
      const allWbMatchesThisRoundCompleted =
        wbMatchesThisRound.length > 0 &&
        wbMatchesThisRound.every((m) => !!m.winner);

      if (allWbMatchesThisRoundCompleted) {
        const wbWinners = wbMatchesThisRound
          .map((m) => m.winner!)
          .filter(Boolean) as Player[];
        collectedWBLosersForLB = wbMatchesThisRound
          .map((m) => (m.player1?.id === m.winner?.id ? m.player2 : m.player1))
          .filter(Boolean) as Player[];

        console.log(
          `DE WB R${currentWinnersRound} completed. Winners: ${wbWinners.map(
            (p) => p.name
          )}, Losers for LB: ${collectedWBLosersForLB.map(
            (p: Player) => p.name
          )}`
        );

        if (
          wbWinners.length === 1 &&
          !matches.concat(newMatchesToAdd).some(
            // Check against potentially already added matches too
            (m) => m.bracket === "winners" && m.round > currentWinnersRound
          ) &&
          !matches
            .concat(newMatchesToAdd)
            .some((m) => m.bracket === "grandFinals")
        ) {
          console.log(`DE: Winners' Bracket Champion: ${wbWinners[0].name}.`);
          wbChampion = wbWinners[0];
        } else if (wbWinners.length >= 2) {
          const nextWBRoundNumber = currentWinnersRound + 1;
          // Assign to newWBMatchesGeneratedThisCall
          newWBMatchesGeneratedThisCall = generateDEWinnersBracketNextRound(
            wbWinners,
            nextWBRoundNumber,
            matches.length + newMatchesToAdd.length // Base count before adding from this call
          );
          if (newWBMatchesGeneratedThisCall.length > 0) {
            // newMatchesToAdd will be updated later with all generated matches
            setCurrentWinnersRound(nextWBRoundNumber);
            advancedWB = true;
            console.log(`DE: Generated WB R${nextWBRoundNumber} matches.`);
          }
        }
      } else {
        console.log(`DE: WB R${currentWinnersRound} not fully completed.`);
      }

      // --- Losers' Bracket (LB) Advancement ---
      const lbMatchesThisRound = matches.filter(
        (m) => m.bracket === "losers" && m.round === currentLosersRound
      );
      const allLbMatchesThisRoundCompleted =
        lbMatchesThisRound.length > 0 &&
        lbMatchesThisRound.every((m) => !!m.winner);
      let lbWinnersFromThisRound: Player[] = [];

      if (allLbMatchesThisRoundCompleted) {
        lbWinnersFromThisRound = lbMatchesThisRound
          .map((m) => m.winner!)
          .filter(Boolean) as Player[];
        console.log(
          `DE LB R${currentLosersRound} completed. Winners: ${lbWinnersFromThisRound.map(
            (p) => p.name
          )}`
        );
        if (
          lbWinnersFromThisRound.length === 1 &&
          !matches.concat(newMatchesToAdd).some(
            // Check against potentially already added matches
            (m) => m.bracket === "losers" && m.round > currentLosersRound
          ) &&
          !matches
            .concat(newMatchesToAdd)
            .some((m) => m.bracket === "grandFinals")
        ) {
          console.log(
            `DE: Losers' Bracket Champion: ${lbWinnersFromThisRound[0].name}.`
          );
          lbChampion = lbWinnersFromThisRound[0];
        }
      } else if (lbMatchesThisRound.length > 0) {
        console.log(`DE: LB R${currentLosersRound} not fully completed.`);
      } else {
        console.log(`DE: No matches in LB R${currentLosersRound} to complete.`);
      }

      // --- Generate Next LB Round (if conditions met) ---
      const nextLBRoundNumber = currentLosersRound + 1;
      // Base match count before adding WB or LB matches from this specific call
      const baseMatchCountForNewLB =
        matches.length +
        newMatchesToAdd.length +
        newWBMatchesGeneratedThisCall.length;

      if (numPlayers === 8) {
        if (
          currentLosersRound === 1 &&
          allLbMatchesThisRoundCompleted &&
          currentWinnersRound === 2 && // WB R2 should have been processed (advancedWB implies this)
          allWbMatchesThisRoundCompleted && // WB R1 was completed to get here
          collectedWBLosersForLB.length === 2 && // These are losers from WB R2
          lbWinnersFromThisRound.length === 2
        ) {
          console.log("DE: Conditions met to generate LB Round 2.");
          // Assign to newLBMatchesGeneratedThisCall
          newLBMatchesGeneratedThisCall =
            generateDELosersBracketNextRoundMatches(
              lbWinnersFromThisRound,
              collectedWBLosersForLB,
              nextLBRoundNumber,
              numPlayers,
              baseMatchCountForNewLB
            );
        } else if (
          currentLosersRound === 2 &&
          allLbMatchesThisRoundCompleted &&
          lbWinnersFromThisRound.length === 2
        ) {
          console.log("DE: Conditions met to generate LB Round 3.");
          // Assign to newLBMatchesGeneratedThisCall
          newLBMatchesGeneratedThisCall =
            generateDELosersBracketNextRoundMatches(
              lbWinnersFromThisRound,
              [],
              nextLBRoundNumber,
              numPlayers,
              baseMatchCountForNewLB
            );
        } else if (
          currentLosersRound === 3 &&
          allLbMatchesThisRoundCompleted &&
          currentWinnersRound === 3 && // WB R3 (Final) should be done
          allWbMatchesThisRoundCompleted && // WB R3 was completed
          collectedWBLosersForLB.length === 1 && // Loser from WB R3 (WB Final)
          lbWinnersFromThisRound.length === 1
        ) {
          console.log("DE: Conditions met to generate LB Round 4 (LB Final).");
          // Assign to newLBMatchesGeneratedThisCall
          newLBMatchesGeneratedThisCall =
            generateDELosersBracketNextRoundMatches(
              lbWinnersFromThisRound,
              collectedWBLosersForLB,
              nextLBRoundNumber,
              numPlayers,
              baseMatchCountForNewLB
            );
        }
      }

      if (newLBMatchesGeneratedThisCall.length > 0) {
        // newMatchesToAdd will be updated later
        setCurrentLosersRound(nextLBRoundNumber);
        advancedLB = true;
        console.log(`DE: Generated LB R${nextLBRoundNumber} matches.`);
      }

      // Consolidate all newly generated matches for this advancement call
      newMatchesToAdd.push(
        ...newWBMatchesGeneratedThisCall,
        ...newLBMatchesGeneratedThisCall
      );

      // --- Determine Champions if not already set by specific round completion ---
      const matchesAfterThisAdvancement = matches.concat(newMatchesToAdd);

      if (!wbChampion) {
        const potentialWbFinalMatches = matchesAfterThisAdvancement.filter(
          (m: Match) => m.bracket === "winners" && m.winner // Typed m
        );
        if (potentialWbFinalMatches.length > 0) {
          const highestWbRoundPlayed = Math.max(
            ...potentialWbFinalMatches.map((m: Match) => m.round) // Typed m
          );
          const finalWbMatchesInHighestRound = potentialWbFinalMatches.filter(
            (m: Match) => m.round === highestWbRoundPlayed // Typed m
          );

          const allHighestRoundWbPlayed = finalWbMatchesInHighestRound.every(
            (m: Match) => m.winner // Typed m
          );
          const noFutureUnplayedWbMatches = !matchesAfterThisAdvancement.some(
            (
              m: Match // Typed m
            ) =>
              m.bracket === "winners" &&
              m.round > highestWbRoundPlayed &&
              !m.winner
          );
          const distinctWinnersInHighestRound = new Set(
            finalWbMatchesInHighestRound.map((m: Match) => m.winner!.id) // Typed m
          );

          if (
            allHighestRoundWbPlayed &&
            noFutureUnplayedWbMatches &&
            distinctWinnersInHighestRound.size === 1 &&
            finalWbMatchesInHighestRound.length === 1
          ) {
            const foundWbChampion = players.find(
              (p) => p.id === Array.from(distinctWinnersInHighestRound)[0]
            );
            wbChampion = foundWbChampion || null; // Handle undefined from find
            if (wbChampion) {
              console.log(
                `DE: Determined WB Champion (fallback logic): ${wbChampion.name} from round ${highestWbRoundPlayed}`
              );
            }
          }
        }
      }

      if (!lbChampion) {
        const potentialLbFinalMatches = matchesAfterThisAdvancement.filter(
          (m: Match) => m.bracket === "losers" && m.winner // Typed m
        );
        if (potentialLbFinalMatches.length > 0) {
          const highestLbRoundPlayed = Math.max(
            ...potentialLbFinalMatches.map((m: Match) => m.round) // Typed m
          );
          const finalLbMatchesInHighestRound = potentialLbFinalMatches.filter(
            (m: Match) => m.round === highestLbRoundPlayed // Typed m
          );

          const allHighestRoundLbPlayed = finalLbMatchesInHighestRound.every(
            (m: Match) => m.winner // Typed m
          );
          const noFutureUnplayedLbMatches = !matchesAfterThisAdvancement.some(
            (
              m: Match // Typed m
            ) =>
              m.bracket === "losers" &&
              m.round > highestLbRoundPlayed &&
              !m.winner
          );
          const distinctWinnersInHighestLbRound = new Set(
            finalLbMatchesInHighestRound.map((m: Match) => m.winner!.id) // Typed m
          );

          if (
            allHighestRoundLbPlayed &&
            noFutureUnplayedLbMatches &&
            distinctWinnersInHighestLbRound.size === 1 &&
            finalLbMatchesInHighestRound.length === 1
          ) {
            const foundLbChampion = players.find(
              (p) => p.id === Array.from(distinctWinnersInHighestLbRound)[0]
            );
            lbChampion = foundLbChampion || null; // Handle undefined from find
            if (lbChampion) {
              console.log(
                `DE: Determined LB Champion (fallback logic): ${lbChampion.name} from round ${highestLbRoundPlayed}`
              );
            }
          }
        }
      }

      // --- Check for Grand Finals ---
      // Define currentMatchesIncludingNew here, as it's used for GF check and setActiveBracketForDisplay
      const currentMatchesIncludingNew = matches.concat(newMatchesToAdd);
      const existingGFMatch = currentMatchesIncludingNew.find(
        // Use currentMatchesIncludingNew
        (m: Match) => m.bracket === "grandFinals" // Typed m
      );

      if (wbChampion && lbChampion && !existingGFMatch) {
        console.log(
          `DE: Setting up First Grand Finals! WB Champ: ${wbChampion.name}, LB Champ: ${lbChampion.name}`
        );
        const grandFinalsMatch: Match = {
          id: `match-gf-1`,
          round: 1,
          matchNumber: 1,
          player1: wbChampion,
          player2: lbChampion,
          winner: null,
          bracket: "grandFinals",
          isGrandFinalsReset: false,
        };
        if (!newMatchesToAdd.find((m) => m.id === grandFinalsMatch.id)) {
          newMatchesToAdd = [...newMatchesToAdd, grandFinalsMatch];
          // Update currentMatchesIncludingNew if GF match was added to newMatchesToAdd
          // currentMatchesIncludingNew.push(grandFinalsMatch); // Not strictly necessary if setMatches updates correctly
        }
      }
      // Grand Finals Reset Logic (if first GF match is in newMatchesToAdd and gets a winner immediately - less likely here)
      // This part of GF logic (reset generation) is better handled if firstGFMatch.winner is set via handleSetWinner
      // and then executeAdvanceRound is called again.
      // For now, the existing GF logic from previous snippets that checks firstGFMatch.winner
      // (which would be from the `matches` state after `handleSetWinner`) is more robust.
      // The code below is for the case where the *first* GF match itself is being created.

      // --- Update States (Matches) ---
      if (newMatchesToAdd.length > 0) {
        setMatches((prev) => {
          const prevMatchIds = new Set(prev.map((m) => m.id));
          const trulyNewMatches = newMatchesToAdd.filter(
            (nm) => !prevMatchIds.has(nm.id)
          );
          if (trulyNewMatches.length > 0) {
            return [...prev, ...trulyNewMatches];
          }
          return prev;
        });
      }

      // If a GF match was just added or is pending, switch view
      // Re-evaluate currentMatchesIncludingNew after setMatches might have been called (or use newMatchesToAdd)
      const finalMatchesForDisplayCheck = matches.concat(newMatchesToAdd); // Use the most definitive list
      if (
        finalMatchesForDisplayCheck.some(
          // Use finalMatchesForDisplayCheck
          (m: Match) => m.bracket === "grandFinals" && !m.winner // Typed m
        ) &&
        activeBracketForDisplay !== "grandFinals"
      ) {
        setActiveBracketForDisplay("grandFinals");
      }

      if (
        !advancedWB &&
        !advancedLB &&
        newMatchesToAdd.length === 0 &&
        !finalMatchesForDisplayCheck.some(
          // Use finalMatchesForDisplayCheck
          (m: Match) => m.bracket === "grandFinals" && !m.winner // Typed m
        ) &&
        !tournamentOver
      ) {
        if (
          allWbMatchesThisRoundCompleted &&
          (allLbMatchesThisRoundCompleted || lbMatchesThisRound.length === 0)
        ) {
          console.log(
            "DE: All current round matches seem completed, but no further advancement or GF. Check conditions."
          );
        }
      }
    } // End DE logic
  }; // End executeAdvanceRound

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

  // Define BracketViewButtons as a function component
  const BracketViewButtons = () => {
    if (
      !tournamentType.startsWith("Double Elimination") ||
      tournamentOver ||
      matches.some((m) => m.bracket === "grandFinals")
    ) {
      return null; // Only show for DE and before Grand Finals
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

  // Main return JSX - Restore this full block
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={{ marginBottom: 10, width: "80%", alignSelf: "center" }}>
          <Button title="< Back to Home" onPress={onGoBack} />
        </View>
        <Text style={styles.title}>TournaTrack - {tournamentType}</Text>
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
              // Forcing re-render when these change
              playersVersion: players.map((p) => p.id + p.losses).join("-"), // A string that changes if player losses change
              matchesVersion: matches.map((m) => m.id + m.winner?.id).join("-"), // A string that changes if match winners change
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
}; // End of TournamentScreen component

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f0f0" },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
    marginBottom: 5,
  },
  subTitle: { fontSize: 18, marginBottom: 15, textAlign: "center" },
  bracketInfoText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 4,
  },
  matchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignSelf: "center",
    width: "95%",
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 5,
  },
  playerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  winnerButton: { backgroundColor: "#a0e8a0", borderColor: "#6bc66b" },
  vsText: { fontSize: 14, fontWeight: "bold", marginHorizontal: 10 },
  matchText: { fontSize: 15 },
  winnerText: {
    marginTop: 5,
    textAlign: "center",
    color: "green",
    fontWeight: "bold",
  },
  advanceButtonContainer: {
    width: "80%",
    marginVertical: 20,
    alignItems: "center",
  },
  tournamentWinner: {
    fontSize: 20,
    fontWeight: "bold",
    color: "blue",
    marginVertical: 10,
    textAlign: "center",
  },
  pressableButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  pressableButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  pressableButtonDisabled: {
    backgroundColor: "#cccccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  pressableButtonPressed: { backgroundColor: "#0056b3" },
  infoText: {
    marginVertical: 20,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  playerButtonDisabled: {
    backgroundColor: "#e9ecef",
    borderColor: "#ced4da",
    opacity: 0.7,
  },
  lockedMatchText: {
    fontSize: 10,
    color: "red",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "white",
    padding: 25,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#6c757d",
  },
  modalButtonConfirm: {
    backgroundColor: "#007bff",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default TournamentScreen;
