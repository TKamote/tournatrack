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
  const shuffledPlayers = shuffleArray(players);

  if (players.length === 6) {
    // Handle 6 players: 2 actual matches + 2 bye matches in Round 1
    const [p1, p2, p3, p4, p5, p6] = shuffledPlayers;

    matches.push(
      // First bye match
      createMatch(
        "match-wb1-1",
        1,
        1,
        p1, // Player 1 gets a bye
        null,
        "winners",
        false,
        format
      ),
      // Second bye match
      createMatch(
        "match-wb1-2",
        1,
        2,
        p2, // Player 2 gets a bye
        null,
        "winners",
        false,
        format
      ),
      // First actual match
      createMatch(
        "match-wb1-3",
        1,
        3,
        p3, // Player 3
        p6, // Player 6
        "winners",
        false,
        format
      ),
      // Second actual match
      createMatch(
        "match-wb1-4",
        1,
        4,
        p4, // Player 4
        p5, // Player 5
        "winners",
        false,
        format
      )
    );
  } else if (players.length === 8) {
    // Handle 8 players: 4 actual matches in Round 1
    for (let i = 0; i < 4; i++) {
      matches.push(
        createMatch(
          `match-wb1-${i + 1}`,
          1,
          i + 1,
          shuffledPlayers[i * 2],
          shuffledPlayers[i * 2 + 1],
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
  const lbWinners = previousMatches
    .filter(
      (m) => m.bracket === "losers" && m.round === nextRound - 1 && m.winner
    )
    .map((m) => m.winner!);

  const matches: Match[] = [];

  if (nextRound === 2) {
    // 6-player case: 1 LB winner + 2 new losers = only 1 match possible
    if (lbWinners.length === 1 && newLosers.length === 2) {
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
        )
      );
      // The second new loser (newLosers[1]) waits for LB R3
    }
    // 8-player case: 2 LB winners + 2 new losers = 2 matches
    else if (lbWinners.length === 2 && newLosers.length === 2) {
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
    // LB R3: LB R2 winners + waiting players
    if (lbWinners.length === 1 && newLosers.length >= 1) {
      // 6-player case: LB R2 winner vs waiting player from LB R2 + new loser
      matches.push(
        createMatch(
          "match-lb3-1",
          3,
          1,
          lbWinners[0],
          newLosers[0], // This could be the waiting player or new loser
          "losers",
          false,
          format
        )
      );
    } else if (lbWinners.length === 2) {
      // 8-player case: LB R2 winners face each other
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
  }

  if (matches.length > 0) {
    console.log(`LB R${nextRound}: Created ${matches.length} matches`);
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

// New function to handle match creation for a given round
export const createMatchesForRound = (
  round: number,
  currentWinnersMatches: Match[],
  receivedMatchFormat: MatchFormat
): Match[] => {
  let newMatches: Match[] = [];

  // Winners bracket: just generate normally
  newMatches = generateDEWinnersBracketNextRound(
    currentWinnersMatches,
    round,
    receivedMatchFormat
  );

  if (round === 1) {
    // Get losers from Winners Bracket Round 1
    const actualMatchLosers = currentWinnersMatches
      .filter((m) => m.player1 && m.player2 && m.winner)
      .map((m) => (m.player1!.id === m.winner!.id ? m.player2! : m.player1!));

    console.log(`LB R1: Got ${actualMatchLosers.length} losers from WB R1`);

    // Create Losers Bracket Round 1 matches dynamically
    const losersNextRound: Match[] = [];
    for (let i = 0; i < Math.floor(actualMatchLosers.length / 2); i++) {
      losersNextRound.push(
        createMatch(
          `match-lb1-${i + 1}`,
          1,
          i + 1,
          actualMatchLosers[i * 2],
          actualMatchLosers[i * 2 + 1],
          "losers",
          false,
          receivedMatchFormat
        )
      );
    }

    // If there’s an odd number of losers, the last player gets a bye
    if (actualMatchLosers.length % 2 === 1) {
      losersNextRound.push(
        createMatch(
          `match-lb1-${losersNextRound.length + 1}`,
          1,
          losersNextRound.length + 1,
          actualMatchLosers[actualMatchLosers.length - 1],
          null, // Bye match
          "losers",
          false,
          receivedMatchFormat
        )
      );
    }

    newMatches = [...newMatches, ...losersNextRound];
  }

  return newMatches;
};

export const generateGrandFinalsMatch = (
  allMatches: Match[],
  currentRound: number,
  currentLosersRound: number,
  format: MatchFormat
): Match[] => {
  // Find Winners Bracket Champion
  const wbChampion = allMatches.find(
    (m) => m.bracket === "winners" && m.round === currentRound && m.winner
  )?.winner;

  // Find Losers Bracket Champion
  const lbChampion = allMatches.find(
    (m) => m.bracket === "losers" && m.round === currentLosersRound && m.winner
  )?.winner;

  if (wbChampion && lbChampion) {
    console.log(
      `Creating Grand Finals: ${wbChampion.name} vs ${lbChampion.name}`
    );

    return [
      createMatch(
        "match-gf-1",
        currentRound + 1,
        1,
        wbChampion,
        lbChampion,
        "grandFinals",
        false,
        format
      ),
    ];
  }

  return [];
};

export const generateGrandFinalsReset = (
  grandFinalsMatch: Match,
  format: MatchFormat
): Match[] => {
  // If LB Champion won the first Grand Finals match, create reset match
  if (
    grandFinalsMatch.winner &&
    grandFinalsMatch.player2?.id === grandFinalsMatch.winner.id
  ) {
    console.log(
      `Grand Finals Reset: ${grandFinalsMatch.winner.name} forces reset!`
    );

    return [
      createMatch(
        "match-gf-2",
        grandFinalsMatch.round,
        2,
        grandFinalsMatch.player1!, // Original WB Champion
        grandFinalsMatch.winner, // LB Champion who won GF1
        "grandFinals",
        true, // This is the reset match
        format
      ),
    ];
  }

  return [];
};
