// filepath: src/utils/tournamentUtils.ts
import { Player, Match, BracketType } from "../types";

// --- Match Creation Utility ---
// Define createMatch HERE, before it's used by other functions in this file.
export const createMatch = (
  id: string,
  round: number,
  matchNumber: number,
  player1: Player | null,
  player2: Player | null,
  bracket: BracketType,
  isGrandFinalsReset?: boolean
): Match => {
  let winner = null;
  // Automatically assign a winner if one player is present and the other is null (bye)
  if (player1 && !player2) {
    winner = player1;
  } else if (player2 && !player1) {
    winner = player2;
  }

  return {
    id,
    round,
    matchNumber,
    player1,
    player2,
    winner,
    bracket,
    isGrandFinalsReset: isGrandFinalsReset || false,
  };
};

// --- Player Generation ---
export const generatePlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    losses: 0,
  }));
};

// --- Single Elimination (SE) Specific Functions ---
export const createSEInitialMatches = (players: Player[]): Match[] => {
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
        "winners"
      )
    );
  }
  return matches;
};

export const generateSENextRoundMatches = (
  winners: Player[],
  nextRoundNumber: number,
  totalMatchesSoFar: number
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
        matchNumberInRound, // Or use totalMatchesSoFar + i + 1 for global uniqueness
        player1,
        player2,
        "winners"
      )
    );
  }
  return nextRoundMatches;
};

// --- Double Elimination (DE) Specific Functions ---
export const createDoubleEliminationInitialMatches = (
  players: Player[]
): Match[] => {
  if (players.length < 2) return [];

  const aPlayers = players.map((p) => ({
    ...p,
    losses: p.losses !== undefined ? p.losses : 0,
  }));

  const initialWinnersMatches: Match[] = [];
  const numPlayers = aPlayers.length;

  for (let i = 0; i < numPlayers / 2; i++) {
    initialWinnersMatches.push(
      createMatch(
        // Use createMatch
        `match-wb-r1-${i + 1}`,
        1,
        i + 1,
        aPlayers[i * 2],
        aPlayers[i * 2 + 1],
        "winners"
      )
    );
  }
  return initialWinnersMatches;
};

export const generateDEWinnersBracketNextRound = (
  winners: Player[],
  nextRoundNumber: number,
  existingMatchCount: number
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
        "winners"
      )
    );
  }
  return nextRoundWBMatches;
};

export const generateDELosersBracketRound1Matches = (
  wbRound1Losers: Player[],
  existingMatchCount: number
): Match[] => {
  console.log(
    "UTIL: generateDELosersBracketRound1Matches CALLED with losers:", // Log 1
    wbRound1Losers.map((p) => p.name),
    "and existingMatchCount:",
    existingMatchCount
  );

  const newMatches: Match[] = [];
  if (wbRound1Losers.length !== 4) {
    console.warn(
      "UTIL: generateDELosersBracketRound1Matches - EARLY EXIT: Expected 4 losers for 8-player DE, got:", // Log 2
      wbRound1Losers.length,
      "Returning empty array."
    );
    return [];
  }

  console.log(
    "UTIL: generateDELosersBracketRound1Matches - Proceeding to create matches. Losers count is 4."
  ); // Log 3

  let matchNumberOffset = 0;
  newMatches.push(
    createMatch(
      `match-lb1-${existingMatchCount + matchNumberOffset + 1}`,
      1, // LB Round 1
      existingMatchCount + matchNumberOffset + 1,
      wbRound1Losers[0],
      wbRound1Losers[1],
      "losers"
    )
  );
  matchNumberOffset++;
  newMatches.push(
    createMatch(
      `match-lb1-${existingMatchCount + matchNumberOffset + 1}`,
      1, // LB Round 1
      existingMatchCount + matchNumberOffset + 1,
      wbRound1Losers[2],
      wbRound1Losers[3],
      "losers"
    )
  );

  console.log(
    "UTIL: generateDELosersBracketRound1Matches SUCCESSFULLY generated matches:", // Log 4
    newMatches.map((m) => `(${m.player1?.name} vs ${m.player2?.name})`),
    "Returning these matches."
  );
  return newMatches;
};

export const generateDELosersBracketNextRoundMatches = (
  advancingLBPlayers: Player[],
  droppingWBPlayers: Player[],
  nextLBRoundNumber: number,
  numPlayersInTournament: number,
  existingMatchCount: number
): Match[] => {
  const newMatches: Match[] = [];
  if (numPlayersInTournament !== 8) {
    console.warn(
      "generateDELosersBracketNextRoundMatches currently only supports 8-player DE."
    );
    return [];
  }

  console.log(
    `UTIL: generateDELosersBracketNextRoundMatches CALLED for LB R${nextLBRoundNumber}. Advancing LB: ${advancingLBPlayers.map(
      (p) => p.name
    )}. Dropping WB: ${droppingWBPlayers.map((p) => p.name)}`
  );

  let matchNumberOffset = 0; // If you have a global match counter or need to offset within a round

  if (nextLBRoundNumber === 2) {
    if (advancingLBPlayers.length !== 2 || droppingWBPlayers.length !== 2) {
      console.warn(
        `UTIL: Incorrect player count for LB R${nextLBRoundNumber}. Expected 2 LB winners and 2 WB losers. Got ${advancingLBPlayers.length} LB, ${droppingWBPlayers.length} WB.`
      );
      return [];
    }
    // Example pairing: Advancing[0] vs Dropping[0], Advancing[1] vs Dropping[1]
    // You might want a more sophisticated seeding/pairing logic here based on original seeds or previous match IDs.
    newMatches.push({
      id: `match-lb${nextLBRoundNumber}-${
        existingMatchCount + matchNumberOffset + 1
      }`,
      round: nextLBRoundNumber,
      matchNumber: matchNumberOffset + 1, // Ensure match numbers are unique within the round
      player1: advancingLBPlayers[0],
      player2: droppingWBPlayers[0],
      winner: null,
      bracket: "losers",
      isGrandFinalsReset: false,
    });
    newMatches.push({
      id: `match-lb${nextLBRoundNumber}-${
        existingMatchCount + matchNumberOffset + 2
      }`,
      round: nextLBRoundNumber,
      matchNumber: matchNumberOffset + 2,
      player1: advancingLBPlayers[1],
      player2: droppingWBPlayers[1],
      winner: null,
      bracket: "losers",
      isGrandFinalsReset: false,
    });
  } else if (nextLBRoundNumber === 3) {
    if (advancingLBPlayers.length !== 2 || droppingWBPlayers.length !== 0) {
      console.warn(
        `UTIL: Incorrect player count for LB R${nextLBRoundNumber}. Expected 2 LB winners and 0 WB losers. Got ${advancingLBPlayers.length} LB, ${droppingWBPlayers.length} WB.`
      );
      return [];
    }
    newMatches.push({
      id: `match-lb${nextLBRoundNumber}-${
        existingMatchCount + matchNumberOffset + 1
      }`,
      round: nextLBRoundNumber,
      matchNumber: matchNumberOffset + 1,
      player1: advancingLBPlayers[0],
      player2: advancingLBPlayers[1],
      winner: null,
      bracket: "losers",
      isGrandFinalsReset: false,
    });
  } else if (nextLBRoundNumber === 4) {
    if (advancingLBPlayers.length !== 1 || droppingWBPlayers.length !== 1) {
      console.warn(
        `UTIL: Incorrect player count for LB R${nextLBRoundNumber}. Expected 1 LB winner and 1 WB loser. Got ${advancingLBPlayers.length} LB, ${droppingWBPlayers.length} WB.`
      );
      return [];
    }
    newMatches.push({
      id: `match-lb${nextLBRoundNumber}-${
        existingMatchCount + matchNumberOffset + 1
      }`,
      round: nextLBRoundNumber,
      matchNumber: matchNumberOffset + 1,
      player1: advancingLBPlayers[0],
      player2: droppingWBPlayers[0],
      winner: null,
      bracket: "losers",
      isGrandFinalsReset: false,
    });
  } else {
    console.warn(
      `UTIL: generateDELosersBracketNextRoundMatches: Unsupported LB round ${nextLBRoundNumber} for 8-player DE or logic not implemented.`
    );
    return [];
  }

  console.log(
    `UTIL: generateDELosersBracketNextRoundMatches for LB R${nextLBRoundNumber} generated matches:`,
    newMatches.map(
      (m) => `(${m.player1?.name} vs ${m.player2?.name}) ID: ${m.id}`
    )
  );
  return newMatches;
};

// More DE functions will be added here for Losers' Bracket and Grand Finals
