// filepath: src/utils/tournamentUtils.ts
import { Player, Match, BracketType, MatchFormat } from "../types";

// --- Match Creation Utility ---
// Define createMatch HERE, before it's used by other functions in this file.
export const createMatch = (
  id: string,
  round: number,
  matchNumber: number,
  player1: Player | null,
  player2: Player | null,
  bracket: BracketType,
  isGrandFinalsReset: boolean,
  format: MatchFormat
): Match => {
  return {
    id,
    round,
    matchNumber,
    player1,
    player2,
    winner: player2 === null ? player1 : null, // Handle byes
    bracket,
    isGrandFinalsReset,
    format,
    games: [],
  };
};

// Add after imports, before other functions
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Player Generation ---
export const generatePlayers = (count: number): Player[] => {
  // First create unshuffled players
  const unshuffledPlayers = Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    losses: 0,
    seed: i + 1, // Initial sequential seeding
  }));

  // Shuffle the players
  const shuffledPlayers = shuffleArray(unshuffledPlayers);

  // Reassign seeds based on new random order
  return shuffledPlayers.map((player, index) => ({
    ...player,
    seed: index + 1,
  }));
};

// --- Single Elimination (SE) Specific Functions ---
export const createSEInitialMatches = (
  players: Player[],
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  const numPlayers = players.length;
  if (numPlayers < 2) return [];

  for (let i = 0; i < numPlayers / 2; i++) {
    matches.push(
      createMatch(
        // Use createMatch
        `match-se-r1-${i + 1}`,
        1,
        i + 1,
        players[i * 2],
        players[i * 2 + 1],
        "winners",
        false,
        format // Pass the format
      )
    );
  }
  return matches;
};

export const generateSENextRoundMatches = (
  winners: Player[],
  nextRoundNumber: number,
  totalMatchesSoFar: number,
  format: MatchFormat = { bestOf: 1, gamesNeededToWin: 1 }
): Match[] => {
  const nextRoundMatches: Match[] = [];
  if (winners.length < 2) return [];

  for (let i = 0; i < winners.length / 2; i++) {
    const player1 = winners[i * 2];
    const player2 = winners[i * 2 + 1];
    // Match number should ideally be unique within its round/bracket or globally
    const matchNumberInRound = i + 1;
    const matchId = `match-se-r${nextRoundNumber}-${matchNumberInRound}`;

    nextRoundMatches.push(
      createMatch(
        // Use createMatch
        matchId,
        nextRoundNumber,
        matchNumberInRound,
        player1,
        player2,
        "winners",
        false,
        format // Add format parameter here
      )
    );
  }
  return nextRoundMatches;
};

// --- Double Elimination (DE) Specific Functions ---
export const createDoubleEliminationInitialMatches = (
  players: Player[],
  format: MatchFormat
): Match[] => {
  const numActualPlayers = players.length;
  const matches: Match[] = [];

  if (numActualPlayers < 2) {
    // DE typically needs at least 3-4 players to be meaningful, but 2 is the absolute minimum for a match.
    // Adjust as per your tournament rules. For now, allowing 2.
    console.warn(
      "DE Initial Matches: Fewer than 2 players. Generated empty matches."
    );
    return [];
  }

  let bracketSize: number;
  if (numActualPlayers <= 8) {
    bracketSize = 8;
  } else if (numActualPlayers <= 16) {
    bracketSize = 16;
  } else {
    console.error(
      `DE Initial Matches: Unsupported number of players (${numActualPlayers}). Max 16 supported by current logic.`
    );
    return [];
  }

  console.log(
    `DE Initial Matches: numActualPlayers=${numActualPlayers}, determined bracketSize=${bracketSize}`
  );

  if (bracketSize === 8) {
    // Standard 8-player bracket seeding: (1v8, 4v5, 3v6, 2v7)
    // These are seed numbers.
    const pairings = [
      { p1Seed: 1, p2Seed: 8, matchNum: 1 },
      { p1Seed: 4, p2Seed: 5, matchNum: 2 },
      { p1Seed: 3, p2Seed: 6, matchNum: 3 },
      { p1Seed: 2, p2Seed: 7, matchNum: 4 },
    ];

    pairings.forEach((p) => {
      matches.push(
        createMatch(
          `match-wb1-${p.matchNum}`,
          1,
          p.matchNum,
          getPlayerBySeed(p.p1Seed, players, numActualPlayers),
          getPlayerBySeed(p.p2Seed, players, numActualPlayers),
          "winners",
          false,
          format // Pass the format
        )
      );
    });
  } else if (bracketSize === 16) {
    // Standard 16-player bracket seeding:
    // (1v16, 8v9, 5v12, 4v13, 3v14, 6v11, 7v10, 2v15)
    const pairings = [
      { p1Seed: 1, p2Seed: 16, matchNum: 1 },
      { p1Seed: 8, p2Seed: 9, matchNum: 2 },
      { p1Seed: 5, p2Seed: 12, matchNum: 3 },
      { p1Seed: 4, p2Seed: 13, matchNum: 4 },
      { p1Seed: 3, p2Seed: 14, matchNum: 5 },
      { p1Seed: 6, p2Seed: 11, matchNum: 6 },
      { p1Seed: 7, p2Seed: 10, matchNum: 7 },
      { p1Seed: 2, p2Seed: 15, matchNum: 8 },
    ];

    pairings.forEach((p) => {
      matches.push(
        createMatch(
          `match-wb1-${p.matchNum}`,
          1,
          p.matchNum,
          getPlayerBySeed(p.p1Seed, players, numActualPlayers),
          getPlayerBySeed(p.p2Seed, players, numActualPlayers),
          "winners",
          false,
          format // Pass the format
        )
      );
    });
  }

  return matches;
};

export const generateDEWinnersBracketNextRound = (
  winners: Player[],
  nextRoundNumber: number,
  existingMatchCount: number,
  format: MatchFormat = { bestOf: 1, gamesNeededToWin: 1 }
): Match[] => {
  const nextRoundWBMatches: Match[] = [];
  if (winners.length < 2) return [];

  for (let i = 0; i < winners.length / 2; i++) {
    const player1 = winners[i * 2];
    const player2 = winners[i * 2 + 1];
    const matchNumberInRound = i + 1;
    const matchId = `match-wb-r${nextRoundNumber}-${matchNumberInRound}`; // Or use existingMatchCount for global ID part

    nextRoundWBMatches.push(
      createMatch(
        // Use createMatch
        matchId,
        nextRoundNumber,
        matchNumberInRound, // Or existingMatchCount + i + 1
        player1,
        player2,
        "winners",
        false,
        format // Add format parameter here
      )
    );
  }
  return nextRoundWBMatches;
};

export const generateDELosersBracketRound1Matches = (
  wbRound1Losers: Player[],
  existingMatchCount: number,
  format: MatchFormat = { bestOf: 1, gamesNeededToWin: 1 }
): Match[] => {
  const numLosers = wbRound1Losers.length;
  const matches: Match[] = [];
  let matchIdCounter = existingMatchCount;

  console.log(
    `UTIL: generateDELosersBracketRound1Matches called with ${numLosers} losers.`
  );

  if (numLosers === 0) {
    return []; // No losers, no LB R1 matches from WB R1.
  } else if (numLosers === 1) {
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-lb1-${matchIdCounter}`,
        1,
        1,
        wbRound1Losers[0],
        null,
        "losers",
        false,
        format
      )
    );
  } else if (numLosers === 2) {
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-lb1-${matchIdCounter}`,
        1,
        1,
        wbRound1Losers[0],
        wbRound1Losers[1],
        "losers",
        false,
        format
      )
    );
  } else if (numLosers === 3) {
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-lb1-${matchIdCounter}`,
        1,
        1,
        wbRound1Losers[0],
        wbRound1Losers[1],
        "losers",
        false,
        format
      )
    );
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-lb1-${matchIdCounter}`,
        1,
        2,
        wbRound1Losers[2],
        null,
        "losers",
        false,
        format
      )
    );
  } else if (numLosers === 4) {
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-lb1-${matchIdCounter}`,
        1,
        1,
        wbRound1Losers[0],
        wbRound1Losers[3],
        "losers",
        false,
        format
      )
    );
    matchIdCounter++;
    matches.push(
      createMatch(
        `match-lb1-${matchIdCounter}`,
        1,
        2,
        wbRound1Losers[1],
        wbRound1Losers[2],
        "losers",
        false,
        format
      )
    );
  }

  return matches;
};

export const generateDELosersBracketNextRoundMatches = (
  advancingLBPlayers: Player[],
  droppingWBPlayers: Player[],
  nextLBRoundNumber: number,
  numActualPlayers: number,
  existingMatchCount: number,
  format: MatchFormat = { bestOf: 1, gamesNeededToWin: 1 }
): Match[] => {
  const newMatches: Match[] = [];
  console.log(
    `UTIL: generateDELosersBracketNextRoundMatches CALLED for LB R${nextLBRoundNumber}. ActualPlayers: ${numActualPlayers}. Advancing LB: ${advancingLBPlayers.map(
      (p) => p?.name || "BYE"
    )}. Dropping WB: ${droppingWBPlayers.map((p) => p?.name || "N/A")}`
  );

  let matchNumberOffset = 0;
  let bracketSize: number;

  if (numActualPlayers <= 8) {
    bracketSize = 8;
  } else if (numActualPlayers <= 16) {
    bracketSize = 16;
    console.warn(
      "generateDELosersBracketNextRoundMatches: 16-player bracket logic not yet fully implemented for LB next rounds."
    );
    // For now, let's return empty for 16p until fully fleshed out to avoid errors.
    // You'll need to build this out similar to the 8-player bracket logic below.
    return [];
  } else {
    console.error(
      "generateDELosersBracketNextRoundMatches: Unsupported number of actual players:",
      numActualPlayers
    );
    return [];
  }

  if (bracketSize === 8) {
    if (nextLBRoundNumber === 2) {
      // LB R2
      // 8 Players: 2 LB R1 winners, 2 WB R2 losers -> 2 matches
      // 6 Players: 1 LB R1 winner, 2 WB R2 losers -> 1 match, 1 WB R2 loser gets a bye to LB R3
      if (numActualPlayers === 8) {
        if (advancingLBPlayers.length === 2 && droppingWBPlayers.length === 2) {
          newMatches.push(
            createMatch(
              `match-lb${nextLBRoundNumber}-${existingMatchCount + 1}`,
              nextLBRoundNumber,
              1,
              advancingLBPlayers[0],
              droppingWBPlayers[0],
              "losers",
              false,
              format
            )
          );
          newMatches.push(
            createMatch(
              `match-lb${nextLBRoundNumber}-${existingMatchCount + 2}`,
              nextLBRoundNumber,
              2,
              advancingLBPlayers[1],
              droppingWBPlayers[1],
              "losers",
              false,
              format
            )
          );
        } else {
          console.warn(
            `UTIL: LB R${nextLBRoundNumber} (8P): Incorrect player counts. AdvLB: ${advancingLBPlayers.length}, DropWB: ${droppingWBPlayers.length}`
          );
        }
      } else if (numActualPlayers === 6) {
        if (advancingLBPlayers.length === 1 && droppingWBPlayers.length === 2) {
          // LB R1 winner plays one of the WB R2 losers. The other WB R2 loser gets a bye.
          // (Seeding of who plays vs who gets bye can be more specific if needed)
          newMatches.push(
            createMatch(
              `match-lb${nextLBRoundNumber}-${existingMatchCount + 1}`,
              nextLBRoundNumber,
              1,
              advancingLBPlayers[0],
              droppingWBPlayers[0],
              "losers",
              false,
              format
            )
          );
          // The second droppingWBPlayer gets a bye to the next applicable LB round.
          // This "bye" player needs to be correctly collected by executeAdvanceRound for the next LB round.
          // For simplicity in match generation, we can create a "bye match" for them.
          newMatches.push(
            createMatch(
              `match-lb${nextLBRoundNumber}-${existingMatchCount + 2}`,
              nextLBRoundNumber,
              2,
              droppingWBPlayers[1],
              null,
              "losers",
              false,
              format
            )
          );
        } else {
          console.warn(
            `UTIL: LB R${nextLBRoundNumber} (6P): Incorrect player counts. AdvLB: ${advancingLBPlayers.length}, DropWB: ${droppingWBPlayers.length}`
          );
        }
      }
    } else if (nextLBRoundNumber === 3) {
      // LB R3
      // 8 Players: 2 LB R2 winners -> 1 match
      // 6 Players: 1 LB R2 winner (from match), 1 LB R2 winner (bye from WB R2 loser) -> 1 match
      if (numActualPlayers === 8) {
        if (advancingLBPlayers.length === 2 && droppingWBPlayers.length === 0) {
          newMatches.push(
            createMatch(
              `match-lb${nextLBRoundNumber}-${existingMatchCount + 1}`,
              nextLBRoundNumber,
              1,
              advancingLBPlayers[0],
              advancingLBPlayers[1],
              "losers",
              false,
              format
            )
          );
        } else {
          console.warn(
            `UTIL: LB R${nextLBRoundNumber} (8P): Incorrect player counts. AdvLB: ${advancingLBPlayers.length}, DropWB: ${droppingWBPlayers.length}`
          );
        }
      } else if (numActualPlayers === 6) {
        // After LB R2 for 6 players: one match winner, one player who got a bye.
        if (advancingLBPlayers.length === 2 && droppingWBPlayers.length === 0) {
          newMatches.push(
            createMatch(
              `match-lb${nextLBRoundNumber}-${existingMatchCount + 1}`,
              nextLBRoundNumber,
              1,
              advancingLBPlayers[0],
              advancingLBPlayers[1],
              "losers",
              false,
              format
            )
          );
        } else {
          console.warn(
            `UTIL: LB R${nextLBRoundNumber} (6P): Incorrect player counts. AdvLB: ${advancingLBPlayers.length}, DropWB: ${droppingWBPlayers.length}`
          );
        }
      }
    } else if (nextLBRoundNumber === 4) {
      // LB R4 (LB Final)
      // 8 Players: 1 LB R3 winner, 1 WB R3 (WB Final) loser -> 1 match
      // 6 Players: 1 LB R3 winner, 1 WB R3 (WB Final) loser -> 1 match
      if (advancingLBPlayers.length === 1 && droppingWBPlayers.length === 1) {
        newMatches.push(
          createMatch(
            `match-lb${nextLBRoundNumber}-${existingMatchCount + 1}`,
            nextLBRoundNumber,
            1,
            advancingLBPlayers[0],
            droppingWBPlayers[0],
            "losers",
            false,
            format
          )
        );
      } else {
        console.warn(
          `UTIL: LB R${nextLBRoundNumber} (6P/8P): Incorrect player counts. AdvLB: ${advancingLBPlayers.length}, DropWB: ${droppingWBPlayers.length}`
        );
      }
    } else {
      console.warn(
        `UTIL: generateDELosersBracketNextRoundMatches: Unsupported LB round ${nextLBRoundNumber} for 8-player bracket structure.`
      );
    }
  }

  if (newMatches.length > 0) {
    console.log(
      `UTIL: generateDELosersBracketNextRoundMatches for LB R${nextLBRoundNumber} (actual players: ${numActualPlayers}) generated matches:`,
      newMatches.map(
        (m) =>
          `(${m.player1?.name || "BYE"} vs ${m.player2?.name || "BYE"}) ID: ${
            m.id
          }`
      )
    );
  } else {
    console.log(
      `UTIL: generateDELosersBracketNextRoundMatches for LB R${nextLBRoundNumber} (actual players: ${numActualPlayers}) generated NO matches for this specific scenario.`
    );
  }
  return newMatches;
};

// More DE functions will be added here for Losers' Bracket and Grand Finals

// Helper function to get player by seed (1-indexed seed)
// This function should be defined before createDoubleEliminationInitialMatches or be a local helper.
const getPlayerBySeed = (
  seed: number,
  playersList: Player[],
  totalPlayersInTournament: number
): Player | null => {
  if (seed <= 0) return null; // Invalid seed
  if (seed > totalPlayersInTournament) {
    return null; // This seed number is a bye because we don't have that many players
  }
  return playersList[seed - 1]; // 0-indexed access for playersList
};
