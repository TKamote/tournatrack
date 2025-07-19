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
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<UserRole>("supporter");
  const [isLoading, setIsLoading] = useState(true);

  // Load user role from storage on app start
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        if (storedRole === "manager" || storedRole === "supporter") {
          setUserRole(storedRole);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user role:", error);
        setIsLoading(false);
      }
    };
    loadUserRole();
  }, []);

  const setUserRoleWithStorage = async (role: UserRole) => {
    try {
      console.log("UserContext: Setting role to:", role);
      await AsyncStorage.setItem("userRole", role);
      setUserRole(role);
      console.log("UserContext: Role set successfully");
    } catch (error) {
      console.error("Error saving user role:", error);
      setUserRole(role);
    }
  };

  return (
    <UserContext.Provider
      value={{ userRole, setUserRole: setUserRoleWithStorage, isLoading }}
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
