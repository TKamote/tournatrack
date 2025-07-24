import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { ManagerStack } from "./ManagerStack";
import { SupporterStack } from "./SupporterStack";
import TermsOfUseScreen from "../screens/TermsOfUseScreen";
import AuthScreen from "../screens/AuthScreen";
import { useUser } from "../context/UserContext";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../utils/firebase";

const Tab = createBottomTabNavigator();

function LogoutScreen({ navigation }: any) {
  useEffect(() => {
    (async () => {
      try {
        await auth.signOut();
      } catch (e) {
        console.warn("Error signing out from Firebase Auth:", e);
      }
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      } as any);
    })();
  }, [navigation]);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1a252f",
      }}
    >
      <ActivityIndicator size="large" color="#e74c3c" />
    </View>
  );
}

export const TabNavigator = () => {
  const { userRole, isLoading } = useUser();

  console.log(
    "TabNavigator - Current userRole:",
    userRole,
    "Loading:",
    isLoading,
    "Should show Manager tab:",
    userRole === "manager"
  );

  // Note: initialRouteName should handle the correct tab selection

  // Show loading screen while role is being determined
  if (isLoading) {
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

  console.log("Rendering Manager tab:", userRole === "manager");

  return (
    <Tab.Navigator
      initialRouteName={userRole === "manager" ? "Manager" : "Supporter"}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Manager") {
            iconName = focused ? "trophy" : "trophy-outline";
          } else if (route.name === "Supporter") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Terms") {
            iconName = focused ? "document-text" : "document-text-outline";
          } else {
            iconName = "log-in-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.textWhite,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: "#1a1a2e",
          borderTopColor: "#16213e",
          borderTopWidth: 1,
          paddingTop: 10,
        },
        headerShown: false,
      })}
    >
      {userRole === "manager" && (
        <Tab.Screen
          name="Manager"
          component={ManagerStack}
          options={{ title: "Manager" }}
        />
      )}
      <Tab.Screen
        name="Supporter"
        component={SupporterStack}
        options={{ title: "Supporter" }}
      />
      <Tab.Screen
        name="Terms"
        component={TermsOfUseScreen}
        options={{ title: "Terms & Privacy" }}
      />
      <Tab.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          title: "Logout",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Sign Out functionality removed - supporters should stay logged in */}
    </Tab.Navigator>
  );
};
