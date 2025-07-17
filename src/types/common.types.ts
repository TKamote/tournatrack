// Common types used throughout the application

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastActive: Date;
}

export type UserRole = "admin" | "manager" | "player" | "spectator";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchFilters {
  query?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  manager?: string;
  isPublic?: boolean;
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

export type NotificationType =
  | "tournament_started"
  | "match_scheduled"
  | "match_completed"
  | "tournament_completed"
  | "player_eliminated"
  | "general";

export interface AppSettings {
  theme: "light" | "dark" | "auto";
  notifications: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  language: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}

// Real-time types
export interface RealtimeUpdate {
  type: "match_update" | "tournament_update" | "player_update";
  data: any;
  timestamp: Date;
}

// Analytics types
export interface TournamentAnalytics {
  tournamentId: string;
  totalMatches: number;
  completedMatches: number;
  averageMatchDuration: number;
  totalPlayers: number;
  activePlayers: number;
  eliminatedPlayers: number;
  mostActivePlayer?: string;
  longestMatch?: string;
  shortestMatch?: string;
}
