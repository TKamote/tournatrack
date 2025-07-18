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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<UserRole>("supporter");

  // Load user role from storage on app start
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem("userRole");
        if (storedRole === "manager" || storedRole === "supporter") {
          setUserRole(storedRole);
        }
      } catch (error) {
        console.error("Error loading user role:", error);
      }
    };
    loadUserRole();
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

  return (
    <UserContext.Provider
      value={{ userRole, setUserRole: setUserRoleWithStorage }}
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
