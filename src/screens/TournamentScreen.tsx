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
  Button, // Import Button
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Player, Match, BracketType, TournamentType } from "../types"; // Add TournamentType to import
import {
  generatePlayers as generateDefaultPlayers,
  createSEInitialMatches,
  generateSENextRoundMatches,
  createDoubleEliminationInitialMatches,
  generateDEWinnersBracketNextRound,
  generateDELosersBracketRound1Matches,
  generateDELosersBracketNextRoundMatches,
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
  const [hasInitialized, setHasInitialized] = useState(false); // New state

  // Effect 1: Reset hasInitialized if core tournament definition props change
  useEffect(() => {
    console.log(
      "TournamentScreen: Core props changed (numPlayers, tournamentType, or receivedPlayerNames). Resetting hasInitialized."
    );
    setHasInitialized(false);
    // Clear out old players and matches to ensure a fresh start for the new tournament config
    setPlayers([]);
    setMatches([]);
  }, [numPlayers, tournamentType, receivedPlayerNames]);

  // Effect 2: Initialize players array
  useEffect(() => {
    if (
      !hasInitialized &&
      receivedPlayerNames &&
      receivedPlayerNames.length === numPlayers &&
      numPlayers > 0
    ) {
      console.log(
        "TournamentScreen: Effect 2 - Initializing players array from names."
      );
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
      console.warn(
        "TournamentScreen: Effect 2 - Player names not received correctly or count mismatch. Generating default players."
      );
      setPlayers(generateDefaultPlayers(numPlayers));
    }
    // This effect depends on hasInitialized to ensure it only runs once for a given tournament setup.
    // It also depends on receivedPlayerNames and numPlayers to react to new tournament configurations.
  }, [receivedPlayerNames, numPlayers, hasInitialized]);

  // Effect 3: Generate initial matches
  useEffect(() => {
    // Only run if players are populated and we haven't fully initialized matches yet for this tournament instance.
    if (players.length > 0 && !hasInitialized) {
      console.log(
        `TournamentScreen: Effect 3 - Generating INITIAL matches for ${tournamentType} with ${players.length} players.`
      );
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
        setHasInitialized(true); // Mark as fully initialized
        console.log(
          "TournamentScreen: Effect 3 - Initial setup complete. hasInitialized set to true."
        );
      } else if (players.length > 0) {
        // Only warn if players were there but no matches generated
        console.warn(
          "TournamentScreen: Effect 3 - No initial matches were generated despite having players. Check create...InitialMatches functions."
        );
      }
    }
    // This effect depends on the players array (to get the actual players for match generation)
    // and tournamentType (if it could change and require new matches).
    // hasInitialized ensures it only generates *initial* matches once.
  }, [players, tournamentType, hasInitialized]);

  // isMatchLocked is now a function that determines lock status dynamically
  const isMatchLocked = useCallback(
    (match: Match): boolean => {
      if (tournamentOver) return true;

      if (match.bracket === "winners" && match.round < currentWinnersRound) {
        return true;
      }
      if (match.bracket === "losers" && match.round < currentLosersRound) {
        return true;
      }
      if (match.bracket === "grandFinals" && overallWinner) return true;

      return false;
    },
    [tournamentOver, currentWinnersRound, currentLosersRound, overallWinner]
  );

  const handleSetWinner = useCallback(
    (matchId: string, newWinningPlayer: Player) => {
      // ***** ADD THIS LOG AS THE VERY FIRST LINE *****
      console.log(
        `handleSetWinner CALLED - Match ID: ${matchId}, Player: ${newWinningPlayer.name}`
      );
      // *****

      const targetMatchIndex = matches.findIndex((m) => m.id === matchId);
      if (targetMatchIndex === -1) {
        console.error(`Match with ID ${matchId} not found.`);
        return;
      }
      const targetMatch = { ...matches[targetMatchIndex] };

      // Use the isMatchLocked function
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

      if (oldWinner && oldWinner.id === newWinningPlayer.id) {
        console.log(
          `Player ${newWinningPlayer.name} is already the winner of match ${matchId}. No change.`
        );
        return;
      }

      let newLoserOfMatch: Player | null = null;
      if (player1 && player2) {
        newLoserOfMatch =
          player1.id === newWinningPlayer.id ? player2 : player1;
      }

      let finalPlayers = [...players];
      let finalMatches = [...matches];
      let finalWbRound1Losers = [...wbRound1Losers];

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
          targetMatch.round === 1
          // Removed numPlayers === 8 check here, as bye logic handles different player counts
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

      finalMatches = finalMatches.map((m) =>
        m.id === targetMatch.id ? { ...m, winner: newWinningPlayer } : m
      );

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
            if (targetMatch.round === 1) {
              const alreadyExists = finalWbRound1Losers.some(
                (l) => l.id === newLoserOfMatch.id
              );
              if (!alreadyExists) {
                finalWbRound1Losers = [
                  ...finalWbRound1Losers,
                  { ...newLoserOfMatch },
                ];
                console.log(
                  "HANDLE_SET_WINNER: Added to wbRound1Losers:",
                  newLoserOfMatch.name,
                  "Current list:",
                  finalWbRound1Losers.map((p) => p.name)
                );
              }
              const expectedNumberOfWBR1Losers = Math.max(0, numPlayers - 4);
              if (
                finalWbRound1Losers.length === expectedNumberOfWBR1Losers &&
                expectedNumberOfWBR1Losers > 0
              ) {
                console.log(
                  `HANDLE_SET_WINNER: All ${expectedNumberOfWBR1Losers} WB R1 Losers collected for LB R1 generation:`,
                  finalWbRound1Losers.map((p) => p.name + `(${p.id})`)
                );
                const matchesWithoutExistingUnplayedLBR1 = finalMatches.filter(
                  (m) => !(m.bracket === "losers" && m.round === 1 && !m.winner)
                );
                const newLBM = generateDELosersBracketRound1Matches(
                  [...finalWbRound1Losers],
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
                  finalWbRound1Losers = [];
                  console.log(
                    "HANDLE_SET_WINNER: wbRound1Losers cleared after LB R1 generation."
                  );
                } else if (expectedNumberOfWBR1Losers > 0) {
                  console.log(
                    "HANDLE_SET_WINNER: POST-CALL - generateDELosersBracketRound1Matches returned no matches. wbRound1Losers at this point:",
                    finalWbRound1Losers.map((p) => p.name)
                  );
                }
              } else if (
                expectedNumberOfWBR1Losers === 0 &&
                finalWbRound1Losers.length === 0
              ) {
                console.log(
                  "HANDLE_SET_WINNER: No WB R1 losers expected, so no LB R1 matches from WB R1 losers."
                );
                finalWbRound1Losers = [];
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
      setPlayers(finalPlayers);
      setMatches(finalMatches);
      setWbRound1Losers(finalWbRound1Losers);
    },
    [
      matches,
      players,
      tournamentType,
      numPlayers,
      wbRound1Losers,
      isMatchLocked, // Now this is the function
      currentWinnersRound, // Added as isMatchLocked depends on them
      currentLosersRound, // Added
      overallWinner, // Added
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
          currentWinnersRound === 3 && // WB R3 should be done
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
      const matchesAfterThisAdvancement = matches.concat(newMatchesToAdd); // Contains current matches + new WB/LB matches

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
      const currentMatchesState = matches; // Snapshot of matches state before new ones are added by this call
      const grandFinalsMatchesInState = currentMatchesState.filter(
        (m: Match) => m.bracket === "grandFinals"
      );
      const firstGFMatchFromState = grandFinalsMatchesInState.find(
        (m: Match) => !m.isGrandFinalsReset
      );
      const resetGFMatchFromState = grandFinalsMatchesInState.find(
        (m: Match) => m.isGrandFinalsReset === true
      );

      // 1. Check if a Grand Finals match (first or reset) has just been completed
      if (
        firstGFMatchFromState &&
        firstGFMatchFromState.winner &&
        !tournamentOver
      ) {
        const wbPlayerInGF = firstGFMatchFromState.player1;
        const lbPlayerInGF = firstGFMatchFromState.player2;

        if (
          wbPlayerInGF &&
          firstGFMatchFromState.winner.id === wbPlayerInGF.id
        ) {
          // WB Player won the first GF match
          console.log(
            `DE: WB Player ${wbPlayerInGF.name} won first Grand Finals. Tournament Over.`
          );
          setOverallWinner(firstGFMatchFromState.winner);
          setTournamentOver(true);
          newMatchesToAdd = [];
        } else if (
          lbPlayerInGF &&
          firstGFMatchFromState.winner.id === lbPlayerInGF.id
        ) {
          // LB Player won the first GF match
          if (
            !resetGFMatchFromState &&
            !newMatchesToAdd.some((m) => m.id === `match-gf-2-reset`)
          ) {
            // And reset not already created or in queue
            console.log(
              "DE: Grand Finals Reset! LB Player won the first match. Setting up reset match."
            );
            const gfResetMatch: Match = {
              id: `match-gf-2-reset`,
              round: (firstGFMatchFromState.round || 1) + 1,
              matchNumber: 1,
              player1: wbPlayerInGF, // Should be the WB champion
              player2: lbPlayerInGF, // Should be the LB champion
              winner: null,
              bracket: "grandFinals",
              isGrandFinalsReset: true,
            };
            if (!newMatchesToAdd.find((m) => m.id === gfResetMatch.id)) {
              newMatchesToAdd.push(gfResetMatch);
            }
          } else if (resetGFMatchFromState && !resetGFMatchFromState.winner) {
            console.log("DE: Grand Finals reset match is pending.");
          }
        }
      }

      if (
        resetGFMatchFromState &&
        resetGFMatchFromState.winner &&
        !tournamentOver
      ) {
        console.log(
          `DE: Reset Grand Finals winner: ${resetGFMatchFromState.winner.name}. Tournament Over.`
        );
        setOverallWinner(resetGFMatchFromState.winner);
        setTournamentOver(true);
        newMatchesToAdd = [];
      }

      // Define a variable that reflects all matches in state + all matches added to newMatchesToAdd SO FAR.
      // This includes new WB/LB matches AND potentially a GF reset match from section 1.
      const allMatchesIncludingNewAdditionsSoFar =
        matches.concat(newMatchesToAdd);

      // 2. If no GF match exists yet, try to create the first one if champions are ready
      const firstGFMatchStillMissing =
        !allMatchesIncludingNewAdditionsSoFar.find(
          // Use the correctly defined variable
          (m: Match) => m.bracket === "grandFinals" && !m.isGrandFinalsReset
        );

      if (
        wbChampion &&
        lbChampion &&
        firstGFMatchStillMissing &&
        !tournamentOver // Only create if tournament isn't already over
      ) {
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
        // Check against newMatchesToAdd directly to prevent adding it if it was somehow already there
        if (!newMatchesToAdd.find((m) => m.id === grandFinalsMatch.id)) {
          newMatchesToAdd.push(grandFinalsMatch);
        }
      }

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

    // ADD THIS LOG:
    console.log(
      `Render Match ${item.id} (R${item.round} ${item.bracket}): P1: ${
        player1?.name
      }, P2: ${player2?.name}, Locked: ${matchIsEffectivelyLocked}, Winner: ${
        item.winner?.name
      }, P1_exists: ${!!item.player1}, P2_exists: ${!!item.player2}`
    );

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

  // --- PASTE YOUR FULL executeAdvanceRound, allCurrentRoundMatchesCompleted, displayTitle, matchesForDisplay, BracketViewButtons HERE ---
  // --- from your provided code to ensure they are complete ---
  // For brevity, I'm not re-pasting them, but they are essential.
  // Ensure the `Button` component is imported if BracketViewButtons uses it.

  // Main return JSX
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>&lt; Home</Text>
          </TouchableOpacity>
          {/* <Text style={styles.title}>{displayTitle()}</Text> */}
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
                  onPress={executeAdvanceRound} // Ensure executeAdvanceRound is defined
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
    // Renamed from title to avoid conflict if displayTitle was also 'title'
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
    // Added
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 1,
  },
  bracketInfoText: {
    // Added
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  playerRow: {
    // Added
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerButton: {
    // Added
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
    // Added
    fontSize: 14,
  },
  playerButtonDisabled: {
    // Added
    backgroundColor: "#e9ecef",
  },
  winnerButton: {
    // Added
    backgroundColor: "#d4edda", // Light green
    borderColor: "#c3e6cb",
  },
  vsText: {
    // Added
    marginHorizontal: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
  matchText: {
    // Added (generic text for match details)
    fontSize: 14,
  },
  winnerText: {
    // Added
    marginTop: 5,
    fontSize: 13,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
  },
  lockedMatchText: {
    // Added
    fontSize: 10,
    color: "red",
    textAlign: "center",
    marginTop: 3,
  },
  advanceButtonContainer: {
    // Added
    marginVertical: 15,
    alignItems: "center",
  },
  pressableButton: {
    // Added
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    elevation: 2,
  },
  pressableButtonDisabled: {
    // Added
    backgroundColor: "#6c757d",
  },
  pressableButtonPressed: {
    // Added
    backgroundColor: "#0056b3",
  },
  pressableButtonText: {
    // Added
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
