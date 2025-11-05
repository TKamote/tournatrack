import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Tournament } from "../types/tournament.types";

const TOURNAMENTS_COLLECTION = "tournaments";

export class TournamentService {
  // Save a new tournament
  static async saveTournament(tournament: Tournament): Promise<void> {
    try {
      const tournamentData = {
        ...tournament,
        createdAt: tournament.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, TOURNAMENTS_COLLECTION, tournament.id),
        tournamentData
      );

      // Tournament saved successfully
    } catch (error) {
      console.error("❌ Save error:", error);
      throw error;
    }
  }

  // Get a single tournament by ID
  static async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        } as Tournament;
      }
      return null;
    } catch (error) {
      console.error("Error getting tournament:", error);
      throw error;
    }
  }

  // Get all tournaments for a manager
  static async getTournamentsByManager(
    managerId: string
  ): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, TOURNAMENTS_COLLECTION),
        where("managerId", "==", managerId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const tournaments: Tournament[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tournaments.push({
          ...data,
          id: doc.id,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        } as Tournament);
      });

      return tournaments;
    } catch (error) {
      console.error("Error getting tournaments by manager:", error);
      throw error;
    }
  }

  // Get all public tournaments
  static async getPublicTournaments(): Promise<Tournament[]> {
    try {
      // First try with ordering, if it fails, fall back to simple query
      try {
        const q = query(
          collection(db, TOURNAMENTS_COLLECTION),
          where("isPublic", "==", true),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tournaments: Tournament[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          tournaments.push({
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          } as Tournament);
        });

        return tournaments;
      } catch (indexError) {
        // Fallback: get all tournaments and filter/sort in memory
        const q = query(collection(db, TOURNAMENTS_COLLECTION));
        const querySnapshot = await getDocs(q);
        const tournaments: Tournament[] = [];


        querySnapshot.forEach((doc) => {
          const data = doc.data();

          if (data.isPublic === true) {
            tournaments.push({
              ...data,
              id: doc.id,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
            } as Tournament);
          }
        });

        // Sort by createdAt descending
        return tournaments.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      }
    } catch (error) {
      console.error("Error getting public tournaments:", error);
      return []; // Return empty array instead of throwing
    }
  }

  // Update tournament matches
  static async updateTournamentMatches(
    tournamentId: string,
    matches: any[]
  ): Promise<void> {
    try {
      const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
      await updateDoc(docRef, {
        matches,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating tournament matches:", error);
      throw error;
    }
  }

  // Update tournament status
  static async updateTournamentStatus(
    tournamentId: string,
    status: string
  ): Promise<void> {
    try {
      const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating tournament status:", error);
      throw error;
    }
  }

  // Delete tournament
  static async deleteTournament(tournamentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TOURNAMENTS_COLLECTION, tournamentId));
    } catch (error) {
      console.error("Error deleting tournament:", error);
      throw error;
    }
  }

  // Listen to real-time updates for a tournament
  static subscribeToTournament(
    tournamentId: string,
    callback: (tournament: Tournament | null) => void
  ) {
    const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);

    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const tournament = {
          ...data,
          id: doc.id,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        } as Tournament;
        callback(tournament);
      } else {
        callback(null);
      }
    });
  }

  // Listen to real-time updates for manager's tournaments
  static subscribeToManagerTournaments(
    managerId: string,
    callback: (tournaments: Tournament[]) => void
  ) {
    const q = query(
      collection(db, TOURNAMENTS_COLLECTION),
      where("managerId", "==", managerId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const tournaments: Tournament[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tournaments.push({
          ...data,
          id: doc.id,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        } as Tournament);
      });
      callback(tournaments);
    });
  }
}
