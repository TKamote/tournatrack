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

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { userRole } = useUser();

  console.log("TabNavigator - Current userRole:", userRole);

  return (
    <Tab.Navigator
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
        name="Auth"
        component={AuthScreen}
        options={{
          title: "Sign In",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
