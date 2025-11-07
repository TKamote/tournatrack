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
  status: "scheduled",
  isLive: false,
  lastUpdated: new Date(),
  createdBy: "system",
});

export const createPlayer = (
  id: string,
  name: string,
  seed: number
): Player => ({
  id,
  name,
  seed,
  losses: 0,
  isEliminated: false,
  totalMatches: 0,
  wins: 0,
  winPercentage: 0,
  averageScore: 0,
  isActive: true,
});

export const createPlayers = (names: string[]): Player[] => {
  return Array.from({ length: names.length }, (_, i) => ({
    id: `player-${i}`,
    name: names[i],
    seed: i + 1,
    losses: 0,
    isEliminated: false,
    totalMatches: 0,
    wins: 0,
    winPercentage: 0,
    averageScore: 0,
    isActive: true,
  }));
};

// Player generation
export const generatePlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    seed: i + 1,
    losses: 0, // Start with 0 losses (L0)
    isEliminated: false,
    totalMatches: 0,
    wins: 0,
    winPercentage: 0,
    averageScore: 0,
    isActive: true,
  }));
};

// Initial match creation for double elimination
export const createDEInitialMatches = (
  players: Player[],
  format: MatchFormat,
  shuffle: boolean = false
): Match[] => {
  const matches: Match[] = [];
  const playersToUse = shuffle ? shuffleArray(players) : players;

  if (playersToUse.length === 4) {
    // Handle 4 players: 2 actual matches in Round 1
    // Ordered seeding: 1 vs 4, 2 vs 3
    if (!shuffle) {
      matches.push(
        createMatch(
          `match-wb1-1`,
          1,
          1,
          playersToUse[0],
          playersToUse[3],
          "winners",
          false,
          format
        ),
        createMatch(
          `match-wb1-2`,
          1,
          2,
          playersToUse[1],
          playersToUse[2],
          "winners",
          false,
          format
        )
      );
    } else {
      for (let i = 0; i < 4; i += 2) {
        matches.push(
          createMatch(
            `match-wb1-${i / 2 + 1}`,
            1,
            i / 2 + 1,
            playersToUse[i],
            playersToUse[i + 1],
            "winners",
            false,
            format
          )
        );
      }
    }
  } else if (playersToUse.length === 8) {
    // Handle 8 players: 4 actual matches in Round 1
    // Ordered seeding: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5
    if (!shuffle) {
      for (let i = 0; i < 4; i++) {
        const player1Index = i;
        const player2Index = 7 - i;
        matches.push(
          createMatch(
            `match-wb1-${i + 1}`,
            1,
            i + 1,
            playersToUse[player1Index],
            playersToUse[player2Index],
            "winners",
            false,
            format
          )
        );
      }
    } else {
      for (let i = 0; i < 4; i++) {
        matches.push(
          createMatch(
            `match-wb1-${i + 1}`,
            1,
            i + 1,
            playersToUse[i * 2],
            playersToUse[i * 2 + 1],
            "winners",
            false,
            format
          )
        );
      }
    }
  } else if (playersToUse.length === 16) {
    // Handle 16 players: 8 actual matches in Round 1
    // Ordered seeding: 1 vs 16, 2 vs 15, 3 vs 14, 4 vs 13, 5 vs 12, 6 vs 11, 7 vs 10, 8 vs 9
    if (!shuffle) {
      for (let i = 0; i < 8; i++) {
        const player1Index = i;
        const player2Index = 15 - i;
        matches.push(
          createMatch(
            `match-wb1-${i + 1}`,
            1,
            i + 1,
            playersToUse[player1Index],
            playersToUse[player2Index],
            "winners",
            false,
            format
          )
        );
      }
    } else {
      for (let i = 0; i < 8; i++) {
        matches.push(
          createMatch(
            `match-wb1-${i + 1}`,
            1,
            i + 1,
            playersToUse[i * 2],
            playersToUse[i * 2 + 1],
            "winners",
            false,
            format
          )
        );
      }
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
