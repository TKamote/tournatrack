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

// Player generation
export const generatePlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
    losses: 0, // Start with 0 losses (L0)
    isEliminated: false,
  }));
};

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

// Winners Bracket advancement
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

// Losers Bracket advancement
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
    if (lbWinners.length === 2) {
      // LB R2 winners face each other (both 6-player and 8-player)
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
    } else if (lbWinners.length === 1 && newLosers.length === 1) {
      // Special case: only 1 LB R2 winner + 1 new loser (6-player edge case)
      matches.push(
        createMatch(
          "match-lb3-1",
          3,
          1,
          lbWinners[0],
          newLosers[0],
          "losers",
          false,
          format
        )
      );
    }
  } else if (nextRound === 4) {
    // LB R4: 8-player Double Elimination only
    // LB R3 winner vs loser from Winners Bracket Final (WB R3)
    if (lbWinners.length === 1 && newLosers.length === 1) {
      matches.push(
        createMatch(
          "match-lb4-1",
          4,
          1,
          lbWinners[0], // LB R3 winner
          newLosers[0], // Loser from WB R3 (Winners Bracket Final)
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

// Grand Finals functions
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

// Add this function at the end of your tournamentUtils.ts file
export const getPlayerDisplayName = (player: Player): string => {
  return `${player.name.replace(/ L[0-2]$/, "")} L${player.losses}`;
};
