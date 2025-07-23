import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import { TabNavigator } from "./TabNavigator";
import AuthScreen from "../screens/AuthScreen";
import { UserProvider } from "../context/UserContext";
import { TournamentProvider } from "../context/TournamentContext";
import { auth } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Show loading screen while checking authentication
  if (isAuthenticated === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a252f",
        }}
      >
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <UserProvider>
      <TournamentProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={isAuthenticated ? "MainTabs" : "Auth"}
          >
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </TournamentProvider>
    </UserProvider>
  );
};
