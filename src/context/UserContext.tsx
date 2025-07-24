import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = "manager" | "supporter";

interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userId: string;
  setUserId: (id: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<UserRole>("supporter");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Load user info from storage on app start
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        const storedId = await AsyncStorage.getItem("userId");
        const storedName = await AsyncStorage.getItem("userName");
        if (storedRole === "manager" || storedRole === "supporter") {
          setUserRole(storedRole);
        }
        if (storedId) setUserId(storedId);
        if (storedName) setUserName(storedName);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user info:", error);
        setIsLoading(false);
      }
    };
    loadUserInfo();
  }, []);

  const setUserRoleWithStorage = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem("userRole", role);
      setUserRole(role);
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
