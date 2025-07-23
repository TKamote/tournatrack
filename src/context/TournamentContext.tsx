import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Tournament } from "../types";
import { TournamentService } from "../utils/tournamentService";

interface TournamentContextType {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  refreshTournaments: () => Promise<void>;
  getTournamentById: (id: string) => Tournament | null;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

export const TournamentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Centralized function to fetch all tournaments from Firebase with caching
  const fetchTournaments = async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch;

    // Only fetch if it's been more than 5 seconds since last fetch
    if (timeSinceLastFetch < 5000) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const publicTournaments = await TournamentService.getPublicTournaments();
      setTournaments(publicTournaments);
      setLastFetch(now);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tournaments"
      );
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchTournaments();
  }, []);

  // Real-time updates every 15 seconds (further optimized)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTournaments();
    }, 15000); // 15 seconds for better efficiency

    return () => clearInterval(interval);
  }, []);

  // Function to get a specific tournament by ID
  const getTournamentById = (id: string): Tournament | null => {
    return tournaments.find((t) => t.id === id) || null;
  };

  // Manual refresh function
  const refreshTournaments = async () => {
    await fetchTournaments();
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        loading,
        error,
        refreshTournaments,
        getTournamentById,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error(
      "useTournamentContext must be used within a TournamentProvider"
    );
  }
  return context;
};
