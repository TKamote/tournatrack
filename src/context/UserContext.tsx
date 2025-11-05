import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

type UserRole = "manager";

interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userId: string;
  setUserId: (id: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<UserRole>("manager");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user role from Firestore
  const fetchUserRoleFromFirestore = useCallback(async (uid: string) => {
      try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Always return manager - supporter role removed
        return "manager" as UserRole;
      }
      return "manager" as UserRole;
      } catch (error) {
      // Error fetching role - default to manager
      return "manager" as UserRole;
    }
  }, []);

  // Sync user data from Firebase Auth and Firestore
  const syncUserData = useCallback(
    async (firebaseUser: User | null) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        const uid = firebaseUser.uid;
        const email = firebaseUser.email || "";
        const name = email.split("@")[0] || "User";

        // Fetch role from Firestore
        const role = await fetchUserRoleFromFirestore(uid);

        // Update state
        setUserId(uid);
        setUserName(name);
        setUserRole(role);

        // Persist to AsyncStorage
        try {
          await AsyncStorage.multiSet([
            ["userId", uid],
            ["userName", name],
            ["userRole", role],
          ]);
        } catch (error) {
          console.error("Error saving user info to AsyncStorage:", error);
        }
      } else {
        // User signed out
        setIsAuthenticated(false);
        setUserId("");
        setUserName("");
        setUserRole("manager");

        // Clear AsyncStorage
        try {
          await AsyncStorage.multiRemove(["userId", "userName", "userRole"]);
        } catch (error) {
          console.error("Error clearing user info from AsyncStorage:", error);
        }
      }
      setIsLoading(false);
    },
    [fetchUserRoleFromFirestore]
  );

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await syncUserData(firebaseUser);
    });

    return () => unsubscribe();
  }, [syncUserData]);

  const setUserRoleWithStorage = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem("userRole", role);
      setUserRole(role);
      
      // Also update Firestore if user is authenticated
      if (userId && isAuthenticated) {
        try {
          const userDocRef = doc(db, "users", userId);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            await setDoc(userDocRef, { role }, { merge: true });
          }
        } catch (error) {
          console.error("Error updating user role in Firestore:", error);
        }
      }
    } catch (error) {
      console.error("Error saving user role:", error);
      setUserRole(role);
    }
  };

  const setUserIdWithStorage = async (id: string) => {
    try {
      await AsyncStorage.setItem("userId", id);
      setUserId(id);
    } catch (error) {
      console.error("Error saving userId:", error);
      setUserId(id);
    }
  };

  const setUserNameWithStorage = async (name: string) => {
    try {
      await AsyncStorage.setItem("userName", name);
      setUserName(name);
      
      // Also update Firestore if user is authenticated
      if (userId && isAuthenticated) {
        try {
          const userDocRef = doc(db, "users", userId);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            await setDoc(userDocRef, { name }, { merge: true });
          }
        } catch (error) {
          console.error("Error updating user name in Firestore:", error);
        }
      }
    } catch (error) {
      console.error("Error saving userName:", error);
      setUserName(name);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userRole,
        setUserRole: setUserRoleWithStorage,
        userId,
        setUserId: setUserIdWithStorage,
        userName,
        setUserName: setUserNameWithStorage,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
