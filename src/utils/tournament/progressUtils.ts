import { Tournament, Match } from "../../types";

// Calculate total required matches based on tournament type and player count
export const getTotalRequiredMatches = (
  tournamentType: string,
  maxPlayers?: number
): number => {
  // Handle different tournament type formats
  if (
    tournamentType.includes("Single Elimination") ||
    tournamentType === "Single Elimination"
  ) {
    if (maxPlayers === 4 || tournamentType.includes("4")) return 3; // 4 players = 3 matches
    if (maxPlayers === 8 || tournamentType.includes("8")) return 7; // 8 players = 7 matches
    if (maxPlayers === 16 || tournamentType.includes("16")) return 15; // 16 players = 15 matches
  }
  if (
    tournamentType.includes("Double Elimination") ||
    tournamentType === "Double Elimination"
  ) {
    if (maxPlayers === 4 || tournamentType.includes("4")) return 7; // 4 players = 7 matches
    if (maxPlayers === 8 || tournamentType.includes("8")) return 15; // 8 players = 15 matches
    if (maxPlayers === 16 || tournamentType.includes("16")) return 31; // 16 players = 31 matches
  }
  return 3; // Default fallback
};

// Calculate tournament progress percentage
export const calculateTournamentProgress = (tournament: Tournament): number => {
  const totalRequiredMatches = getTotalRequiredMatches(
    tournament.type,
    tournament.maxPlayers
  );
  const completedMatches = tournament.matches.filter(
    (match: Match) => match.winner
  ).length;

  // Cap progress at 100% even if completed matches exceed total
  const progressPercentage = Math.min(
    (completedMatches / totalRequiredMatches) * 100,
    100
  );
  return Math.round(progressPercentage);
};

// Get tournament completion info - ONLY when tournament is 100% complete
export const getTournamentCompletionInfo = (tournament: Tournament) => {
  if (!tournament.matches || tournament.matches.length === 0) return null;

  // Check if tournament status is completed
  if (tournament.status === "completed") {
    // Find the final match - prioritize Grand Finals reset matches, then highest round
    const completedMatches = tournament.matches.filter(
      (match: Match) => match.winner
    );

    // First, look for Grand Finals reset matches (these are the true final matches)
    const grandFinalsResetMatch = completedMatches.find(
      (match: Match) =>
        match.bracket === "grandFinals" && match.isGrandFinalsReset === true
    );

    // If no reset match, look for regular Grand Finals
    const grandFinalsMatch = completedMatches.find(
      (match: Match) =>
        match.bracket === "grandFinals" && match.isGrandFinalsReset !== true
    );

    // Fallback to highest round match
    const highestRoundMatch = completedMatches.sort(
      (a: Match, b: Match) => b.round - a.round
    )[0];

    const finalMatch =
      grandFinalsResetMatch || grandFinalsMatch || highestRoundMatch;

    if (finalMatch && finalMatch.winner) {
      const winner = finalMatch.winner;
      const runnerUp =
        finalMatch.player1?.id === winner.id
          ? finalMatch.player2
          : finalMatch.player1;

      // Calculate scores from final match games
      const winnerScore =
        finalMatch.games?.filter((g) => g.winner?.id === winner.id).length || 0;
      const runnerUpScore = runnerUp
        ? finalMatch.games?.filter((g) => g.winner?.id === runnerUp.id)
            .length || 0
        : 0;

      // Clean player names by removing loss suffixes (L0, L1, L2)
      const cleanChampionName = winner.name.replace(/ L[0-2]$/, "");
      const cleanRunnerUpName =
        runnerUp?.name.replace(/ L[0-2]$/, "") || "Unknown";

      return {
        champion: cleanChampionName,
        runnerUp: cleanRunnerUpName,
        championScore: winnerScore,
        runnerUpScore: runnerUpScore,
        isCompleted: true,
      };
    }
  }

  return null;
};

// Get live match info with prioritization
export const getLiveMatchInfo = (tournament: Tournament) => {
  if (!tournament.matches || tournament.matches.length === 0) return null;

  // PRIORITIZE: First check for current active matches (not completed)
  const activeMatches = tournament.matches.filter(
    (match: Match) => !match.winner && match.player1 && match.player2
  );

  if (activeMatches.length > 0) {
    // Sort active matches by most recent activity (games played)
    const currentMatch = activeMatches.sort((a: Match, b: Match) => {
      const aGames = a.games?.length || 0;
      const bGames = b.games?.length || 0;
      if (aGames !== bGames) return bGames - aGames; // More games = more recent
      if (a.round !== b.round) return b.round - a.round; // Higher round first
      return b.matchNumber - a.matchNumber; // Higher match number first
    })[0];

    const games = currentMatch.games || [];
    const player1Score = games.filter(
      (g) => g.winner?.id === currentMatch.player1?.id
    ).length;
    const player2Score = games.filter(
      (g) => g.winner?.id === currentMatch.player2?.id
    ).length;

    // Calculate match intensity
    const totalGames = games.length;
    const gamesNeeded = currentMatch.format?.gamesNeededToWin || 3;
    const isMatchPoint =
      player1Score === gamesNeeded - 1 || player2Score === gamesNeeded - 1;
    const isCloseMatch = Math.abs(player1Score - player2Score) <= 1;

    return {
      player1: currentMatch.player1?.name || "Player 1",
      player2: currentMatch.player2?.name || "Player 2",
      score1: player1Score,
      score2: player2Score,
      round: currentMatch.round,
      totalGames,
      gamesNeeded,
      isMatchPoint,
      isCloseMatch,
      matchFormat: currentMatch.format?.label || "Best of 3",
      isCompleted: false,
    };
  }

  // FALLBACK: Find the most recent completed match (for round transitions)
  const completedMatches = tournament.matches.filter(
    (match: Match) => match.winner
  );

  if (completedMatches.length > 0) {
    // Sort completed matches by most recent completion (based on games played)
    const mostRecentCompleted = completedMatches.sort((a: Match, b: Match) => {
      const aGames = a.games?.length || 0;
      const bGames = b.games?.length || 0;
      if (aGames !== bGames) return bGames - aGames; // More games = more recent
      if (a.round !== b.round) return b.round - a.round; // Higher round first
      return b.matchNumber - a.matchNumber; // Higher match number first
    })[0];

    if (mostRecentCompleted) {
      const winnerScore =
        mostRecentCompleted.games?.filter(
          (g) => g.winner?.id === mostRecentCompleted.winner?.id
        ).length || 0;
      const loserScore =
        mostRecentCompleted.games?.filter(
          (g) => g.winner?.id !== mostRecentCompleted.winner?.id
        ).length || 0;

      return {
        round: mostRecentCompleted.round,
        player1: mostRecentCompleted.player1?.name || "Player 1",
        player2: mostRecentCompleted.player2?.name || "Player 2",
        score1: winnerScore,
        score2: loserScore,
        totalGames: mostRecentCompleted.games?.length || 0,
        gamesNeeded: mostRecentCompleted.format?.gamesNeededToWin || 3,
        isMatchPoint: false,
        isCloseMatch: false,
        matchFormat: mostRecentCompleted.format?.label || "Best of 3",
        isCompleted: true,
        winner: mostRecentCompleted.winner?.name,
        isTransitionMatch: true, // Flag to indicate this is shown during transition
      };
    }
  }

  return null;
};
