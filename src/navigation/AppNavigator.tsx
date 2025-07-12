import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import { TabNavigator } from "./TabNavigator";
import PlayerInputScreen from "../screens/PlayerInputScreen";
import { DoubleElimination8Screen } from "../screens/DoubleElim8Screen";
import { DoubleElim4Screen } from "../screens/DoubleElim4Screen";
import DoubleElim16Screen from "../screens/DoubleElim16Screen";
import { SingleElim4Screen } from "../screens/SingleElim4Screen";
import { SingleElim8Screen } from "../screens/SingleElim8Screen";
import { SingleElim16Screen } from "../screens/SingleElim16Screen";
import PlayerInput4Screen from "../screens/PlayerInput4Screen";
import PlayerInput8Screen from "../screens/PlayerInput8Screen";
import PlayerInput16Screen from "../screens/PlayerInput16Screen";
import PlayerInputSingle4Screen from "../screens/PlayerInputSingle4Screen";
import PlayerInputSingle8Screen from "../screens/PlayerInputSingle8Screen";
import PlayerInputSingle16Screen from "../screens/PlayerInputSingle16Screen";
import { Ionicons } from "@expo/vector-icons";

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
                style={{ marginLeft: 16 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="DoubleElim8"
          component={DoubleElimination8Screen}
          options={{ title: "Double Elimination" }}
        />
        <Stack.Screen
          name="SingleElim8"
          component={SingleElim8Screen}
          options={{ title: "Single Elimination" }}
        />
        <Stack.Screen
          name="SingleElim16"
          component={SingleElim16Screen}
          options={{ title: "Single Elimination" }}
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
                style={{ marginLeft: 16 }}
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
                style={{ marginLeft: 16 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="DoubleElim4"
          component={DoubleElim4Screen}
          options={{ title: "Double Elimination" }}
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
                style={{ marginLeft: 16 }}
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
                style={{ marginLeft: 16 }}
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
                style={{ marginLeft: 16 }}
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
                style={{ marginLeft: 16 }}
                onPress={() => navigation.navigate("MainTabs")}
              />
            ),
          })}
        />
        <Stack.Screen
          name="SingleElim4"
          component={SingleElim4Screen}
          options={{ title: "Single Elimination" }}
        />
        <Stack.Screen
          name="DoubleElim16"
          component={DoubleElim16Screen}
          options={{ title: "Double Elimination" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
