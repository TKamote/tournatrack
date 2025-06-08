export interface Player {
  id: string;
  name: string;
  seed: number;
  losses: number;
  isEliminated: boolean; // Add this property
}