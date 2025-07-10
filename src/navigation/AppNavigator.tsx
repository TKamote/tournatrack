import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import HomeScreen from "../screens/HomeScreen";
import PlayerInputScreen from "../screens/PlayerInputScreen";
import { DoubleElimination8Screen } from "../screens/tournaments/DoubleElim8Screen";
import { DoubleElim6Screen } from "../screens/tournaments/DoubleElim6Screen";
import DoubleElim7Screen from "../screens/tournaments/DoubleElim7Screen";
import { SingleElim8Screen } from "../screens/tournaments/SingleElim8Screen";
import { SingleElim16Screen } from "../screens/tournaments/SingleElim16Screen";
import PlayerInput6Screen from "../screens/PlayerInput6Screen";
import PlayerInput7Screen from "../screens/PlayerInput7Screen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PlayerInput"
          component={PlayerInputScreen}
          options={{ title: "Enter Players" }}
        />
        <Stack.Screen
          name="DoubleElim8"
          component={DoubleElimination8Screen}
          options={{ title: "Double Elimination - 8 Players" }}
        />
        <Stack.Screen
          name="SingleElim8"
          component={SingleElim8Screen}
          options={{ title: "Single Elimination - 8 Players" }}
        />
        <Stack.Screen
          name="SingleElim16"
          component={SingleElim16Screen}
          options={{ title: "Single Elimination - 16 Players" }}
        />
        <Stack.Screen
          name="PlayerInput6"
          component={PlayerInput6Screen}
          options={{ title: "DE-6 Setup" }}
        />
        <Stack.Screen
          name="DoubleElim6"
          component={DoubleElim6Screen}
          options={{ title: "Double Elimination - 6 Players" }}
        />
        <Stack.Screen
          name="PlayerInput7"
          component={PlayerInput7Screen}
          options={{ title: "DE-7 Setup" }}
        />
        <Stack.Screen
          name="DoubleElim7"
          component={DoubleElim7Screen}
          options={{ title: "Double Elimination - 7 Players" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
