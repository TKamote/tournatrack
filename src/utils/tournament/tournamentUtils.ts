import { Match, Player, MatchFormat, BracketType } from "../../types";

// Utility functions
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Tournament creation utils
export const createMatch = (
  id: string,
  round: number,
  matchNumber: number,
  player1: Player | null,
  player2: Player | null,
  bracket: "winners" | "losers" | "grandFinals",
  isGrandFinalsReset: boolean,
  format: MatchFormat
): Match => ({
  id,
  round,
  matchNumber,
  player1,
  player2,
  // Auto-set winner for bye matches
  winner: player1 && !player2 ? player1 : null,
  bracket,
  isGrandFinalsReset,
  format,
  games: [],
});

// Initial match creation for double elimination
export const createDEInitialMatches = (
  players: Player[],
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  const shuffledPlayers = shuffleArray([...players]);

  if (players.length === 6) {
    // 6 players: 4 play matches, 2 get byes to round 2
    const [p1, p2, p3, p4, bye1, bye2] = shuffledPlayers;

    matches.push(
      // First two matches are actual matches
      createMatch("match-wb1-1", 1, 1, p1, p2, "winners", false, format),
      createMatch("match-wb1-2", 1, 2, p3, p4, "winners", false, format)
    );

    // Create "virtual" matches for bye players that auto-advance to R2
    matches.push(
      createMatch("match-wb2-1", 2, 1, bye1, null, "winners", false, format),
      createMatch("match-wb2-2", 2, 2, bye2, null, "winners", false, format)
    );

    console.log("Created DE-6 bracket:", {
      r1Matches: 2,
      byeAdvances: 2,
      players: shuffledPlayers.map((p) => p.name),
    });
  } else if (players.length === 8) {
    // Standard 8 player bracket - 4 first round matches
    for (let i = 0; i < 8; i += 2) {
      matches.push(
        createMatch(
          `match-wb1-${i / 2 + 1}`,
          1,
          i / 2 + 1,
          shuffledPlayers[i],
          shuffledPlayers[i + 1],
          "winners",
          false,
          format
        )
      );
    }
  }

  return matches;
};

// Match advancement utils (from matchAdvancementUtils.ts)

// Double elimination utils (from doubleEliminationUtils.ts)
export const generateDEWinnersBracketNextRound = (
  previousMatches: Match[],
  nextRound: number,
  format: MatchFormat
): Match[] => {
  const winners = previousMatches
    .filter(
      (m) => m.bracket === "winners" && m.round === nextRound - 1 && m.winner
    )
    .map((m) => m.winner!);

  console.log(
    `WB R${nextRound}: Creating matches for ${winners.length} winners`
  );

  const matches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const player1 = winners[i];
    const player2 = i + 1 < winners.length ? winners[i + 1] : null;

    // If only one player and it's WB final, they're WB champion
    if (player1 && !player2 && nextRound === 3) {
      matches.push(
        createMatch(
          `match-wb${nextRound}-1`,
          nextRound,
          1,
          player1,
          null,
          "winners",
          false,
          format
        )
      );
    } else if (player1 && player2) {
      matches.push(
        createMatch(
          `match-wb${nextRound}-${Math.floor(i / 2) + 1}`,
          nextRound,
          Math.floor(i / 2) + 1,
          player1,
          player2,
          "winners",
          false,
          format
        )
      );
    }
  }
  return matches;
};

export const generateDELosersBracketRound1Matches = (
  losers: Player[],
  existingMatchCount: number,
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  console.log(`LB R1: Got ${losers.length} losers from WB R1`);

  if (losers.length === 2) {
    // 6 players case: 2 losers from 2 WB R1 matches
    matches.push(
      createMatch(
        "match-lb1-1",
        1,
        1,
        losers[0],
        losers[1],
        "losers",
        false,
        format
      )
    );
  } else if (losers.length === 4) {
    // 8 players case: 2 matches with 4 losers
    matches.push(
      createMatch(
        "match-lb1-1",
        1,
        1,
        losers[0],
        losers[1],
        "losers",
        false,
        format
      ),
      createMatch(
        "match-lb1-2",
        1,
        2,
        losers[2],
        losers[3],
        "losers",
        false,
        format
      )
    );
  }

  return matches;
};

export const generateDELosersBracketNextRoundMatches = (
  previousMatches: Match[],
  newLosers: Player[],
  nextRound: number,
  format: MatchFormat
): Match[] => {
  const matches: Match[] = [];
  console.log(`LB R${nextRound}: Processing next round`);

  // Get winners from previous LB round
  const lbWinners = previousMatches
    .filter(
      (m) => m.bracket === "losers" && m.round === nextRound - 1 && m.winner
    )
    .map((m) => m.winner!);

  if (nextRound === 2) {
    // LB R2: LB R1 winner vs WB R2 losers
    if (lbWinners.length === 1 && newLosers.length === 2) {
      // 6 players case
      matches.push(
        createMatch(
          "match-lb2-1",
          2,
          1,
          lbWinners[0],
          newLosers[0],
          "losers",
          false,
          format
        ),
        createMatch(
          "match-lb2-2",
          2,
          2,
          newLosers[1],
          null,
          "losers",
          false,
          format
        )
      );
    } else if (lbWinners.length === 2 && newLosers.length === 2) {
      // 8 players case
      matches.push(
        createMatch(
          "match-lb2-1",
          2,
          1,
          lbWinners[0],
          newLosers[0],
          "losers",
          false,
          format
        ),
        createMatch(
          "match-lb2-2",
          2,
          2,
          lbWinners[1],
          newLosers[1],
          "losers",
          false,
          format
        )
      );
    }
  } else if (nextRound === 3) {
    // LB R3: LB R2 winners face each other
    if (lbWinners.length === 2) {
      matches.push(
        createMatch(
          "match-lb3-1",
          3,
          1,
          lbWinners[0],
          lbWinners[1],
          "losers",
          false,
          format
        )
      );
    }
  } else if (nextRound === 4) {
    // LB Final: LB R3 winner vs WB Final loser
    if (lbWinners.length === 1 && newLosers.length === 1) {
      matches.push(
        createMatch(
          "match-lb4-1",
          4,
          1,
          lbWinners[0],
          newLosers[0],
          "losers",
          false,
          format
        )
      );
    }
  }

  return matches;
};

// Update generatePlayers function
export const generatePlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
    losses: 0,
    isEliminated: false, // Add this property
  }));
};

// Add the findNextMatch function export
export const findNextMatch = (
  matches: Match[],
  currentRound: number,
  bracket: BracketType
): Match | undefined => {
  return matches.find(
    (match) =>
      match.round === currentRound && match.bracket === bracket && !match.winner
  );
};
