import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import { TabNavigator } from "./TabNavigator";
import PlayerInputScreen from "../screens/playerInput/PlayerInputScreen";
import { DoubleElimination8Screen } from "../screens/tournamentType/DoubleElim8Screen";
import { DoubleElim4Screen } from "../screens/tournamentType/DoubleElim4Screen";
import DoubleElim16Screen from "../screens/tournamentType/DoubleElim16Screen";
import { SingleElim4Screen } from "../screens/tournamentType/SingleElim4Screen";
import { SingleElim8Screen } from "../screens/tournamentType/SingleElim8Screen";
import { SingleElim16Screen } from "../screens/tournamentType/SingleElim16Screen";
import PlayerInput4Screen from "../screens/playerInput/PlayerInput4Screen";
import PlayerInput8Screen from "../screens/playerInput/PlayerInput8Screen";
import PlayerInput16Screen from "../screens/playerInput/PlayerInput16Screen";
import PlayerInputSingle4Screen from "../screens/playerInput/PlayerInputSingle4Screen";
import PlayerInputSingle8Screen from "../screens/playerInput/PlayerInputSingle8Screen";
import PlayerInputSingle16Screen from "../screens/playerInput/PlayerInputSingle16Screen";
import { Ionicons } from "@expo/vector-icons";
import AuthScreen from "../screens/AuthScreen";
import TournamentsDashboard from "../screens/TournamentsDashboard";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MainTabs">
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: "Sign In / Sign Up" }}
        />
        <Stack.Screen
          name="PlayerInput"
          component={PlayerInputScreen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="DoubleElim8"
          component={DoubleElimination8Screen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerRight: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginRight: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="SingleElim8"
          component={SingleElim8Screen}
          options={({ navigation }) => ({
            title: "Single Elimination",
            headerBackTitleVisible: false,
            headerRight: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginRight: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="SingleElim16"
          component={SingleElim16Screen}
          options={({ navigation }) => ({
            title: "Single Elimination",
            headerBackTitleVisible: false,
            headerRight: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginRight: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="PlayerInput4"
          component={PlayerInput4Screen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="PlayerInput8"
          component={PlayerInput8Screen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="DoubleElim4"
          component={DoubleElim4Screen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerRight: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginRight: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="PlayerInput16"
          component={PlayerInput16Screen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="PlayerInputSingle4"
          component={PlayerInputSingle4Screen}
          options={({ navigation }) => ({
            title: "Single Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="PlayerInputSingle8"
          component={PlayerInputSingle8Screen}
          options={({ navigation }) => ({
            title: "Single Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="PlayerInputSingle16"
          component={PlayerInputSingle16Screen}
          options={({ navigation }) => ({
            title: "Single Elimination",
            headerBackTitleVisible: false,
            headerLeft: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginLeft: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="SingleElim4"
          component={SingleElim4Screen}
          options={({ navigation }) => ({
            title: "Single Elimination",
            headerBackTitleVisible: false,
            headerRight: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginRight: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="DoubleElim16"
          component={DoubleElim16Screen}
          options={({ navigation }) => ({
            title: "Double Elimination",
            headerBackTitleVisible: false,
            headerRight: () => (
              <Ionicons
                name="home"
                size={24}
                color="#3498db"
                style={{ marginRight: 20 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="TournamentsDashboard"
          component={TournamentsDashboard}
          options={({ navigation }) => ({
            title: "Tournaments Dashboard",
            headerBackTitleVisible: false,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
