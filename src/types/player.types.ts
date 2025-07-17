export interface Player {
  id: string;
  name: string;
  seed: number;
  losses: number;
  isEliminated: boolean;
  // Additional fields for better player management
  email?: string;
  phone?: string;
  avatar?: string;
  rating?: number;
  totalMatches: number;
  wins: number;
  winPercentage: number;
  averageScore: number;
  lastActive?: Date;
  isActive: boolean;
}

export interface PlayerStats {
  playerId: string;
  tournamentId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  totalGamesWon: number;
  totalGamesLost: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  currentStreak: number;
  longestStreak: number;
}

export interface CreatePlayerRequest {
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  rating?: number;
}

export interface UpdatePlayerRequest {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  rating?: number;
  isActive?: boolean;
}
