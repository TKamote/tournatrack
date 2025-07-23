import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Tournament } from "../types/tournament.types";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { TournamentService } from "../utils/tournamentService";

interface ManagerProfile {
  name: string;
  avatar?: string;
  country?: string;
  ageBracket?: string;
  email?: string;
  role?: string;
  tournamentsHosted?: number;
  starRating?: number;
}

interface ManagerContextType {
  manager: ManagerProfile | null;
  tournaments: Tournament[];
  loading: boolean;
  refresh: () => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

interface ManagerProviderProps {
  managerId: string;
  children: ReactNode;
}

export const ManagerProvider: React.FC<ManagerProviderProps> = ({
  managerId,
  children,
}) => {
  const [manager, setManager] = useState<ManagerProfile | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch manager profile
      const userDoc = await getDoc(doc(db, "users", managerId));
      let profile: ManagerProfile = {
        name: "Manager",
        avatar: "M",
        country: "-",
        ageBracket: "-",
        tournamentsHosted: 0,
        starRating: 4.5,
      };
      if (userDoc.exists()) {
        profile = userDoc.data() as ManagerProfile;
      }
      // Fetch tournaments
      const tournaments = await TournamentService.getTournamentsByManager(
        managerId
      );
      profile.tournamentsHosted = tournaments.length;
      setManager(profile);
      setTournaments(tournaments);
    } catch (e) {
      setManager({
        name: "Manager",
        avatar: "M",
        country: "-",
        ageBracket: "-",
        tournamentsHosted: 0,
        starRating: 4.5,
      });
      setTournaments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [managerId]);

  return (
    <ManagerContext.Provider
      value={{ manager, tournaments, loading, refresh: fetchData }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = () => {
  const ctx = useContext(ManagerContext);
  if (!ctx) throw new Error("useManager must be used within a ManagerProvider");
  return ctx;
};
