# TournaTrack Type System

This directory contains all TypeScript interfaces and types for the TournaTrack tournament management application.

## Overview

The type system is designed to be comprehensive, type-safe, and ready for real data integration with Firestore. All types are exported through the main `index.ts` file for easy importing.

## Core Types

### Tournament Types (`tournament.types.ts`)

- `Tournament` - Complete tournament data structure
- `TournamentSummary` - Lightweight tournament info for lists
- `TournamentResults` - Final tournament results
- `TournamentStats` - Tournament statistics and analytics
- `TournamentStatus` - Tournament lifecycle states
- `CreateTournamentRequest` / `UpdateTournamentRequest` - API request types

### Player Types (`player.types.ts`)

- `Player` - Complete player data structure
- `PlayerStats` - Player performance statistics
- `CreatePlayerRequest` / `UpdatePlayerRequest` - API request types

### Match Types (`match.types.ts`)

- `Match` - Complete match data structure
- `Game` - Individual game within a match
- `MatchFormat` - Match scoring format
- `MatchStatus` - Match lifecycle states
- `MatchResult` - Completed match results
- `CreateMatchRequest` / `UpdateMatchRequest` - API request types

### Bracket Types (`bracket.types.ts`)

- `BracketType` - Tournament bracket types
- `TournamentType` / `TournamentFormat` - Tournament format types
- `TournamentConfiguration` - Predefined tournament configurations
- `TOURNAMENT_CONFIGURATIONS` - Configuration constants

### Common Types (`common.types.ts`)

- `User` / `UserRole` - User management
- `ApiResponse` / `PaginatedResponse` - API response patterns
- `Notification` / `NotificationType` - Notification system
- `AppSettings` - Application settings
- `FormState` / `ValidationError` - Form handling
- `RealtimeUpdate` - Real-time updates
- `TournamentAnalytics` - Analytics data

### Navigation Types (`navigation.types.ts`)

- `RootStackParamList` - Navigation parameter types
- Screen-specific parameter interfaces

## Usage Examples

```typescript
import { Tournament, Player, Match, User } from "../types";

// Creating a new tournament
const newTournament: CreateTournamentRequest = {
  name: "Spring Championship",
  type: "Double Elimination",
  maxPlayers: 8,
  format: { type: "raceTo", gamesNeededToWin: 3, label: "Race to 3" },
  isPublic: true,
  description: "Annual spring tournament",
};

// Working with players
const player: Player = {
  id: "player-1",
  name: "Alice Johnson",
  seed: 1,
  losses: 0,
  isEliminated: false,
  totalMatches: 5,
  wins: 4,
  winPercentage: 0.8,
  averageScore: 3.2,
  isActive: true,
};

// Handling matches
const match: Match = {
  id: "match-1",
  round: 1,
  matchNumber: 1,
  player1: player1,
  player2: player2,
  winner: null,
  bracket: "winners",
  isGrandFinalsReset: false,
  format: { type: "raceTo", gamesNeededToWin: 3, label: "Race to 3" },
  games: [],
  status: "scheduled",
  isLive: false,
  lastUpdated: new Date(),
  createdBy: "manager-1",
};
```

## Type Safety Benefits

1. **Compile-time validation** - Catch errors before runtime
2. **IntelliSense support** - Better IDE autocomplete
3. **Refactoring safety** - Changes propagate automatically
4. **Documentation** - Types serve as living documentation
5. **API consistency** - Ensures data structure consistency

## Firestore Integration

These types are designed to work seamlessly with Firestore:

- All dates use `Date` objects (Firestore Timestamp compatible)
- IDs are strings (Firestore document IDs)
- Optional fields use `?` for Firestore optional properties
- Arrays and nested objects are properly typed

## Future Enhancements

- Add validation schemas (Zod/Joi)
- Add serialization/deserialization utilities
- Add type guards for runtime type checking
- Add migration utilities for schema evolution
