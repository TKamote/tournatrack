import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import HomeScreen from "../screens/HomeScreen";
import PlayerInputScreen from "../screens/PlayerInputScreen";
import { DoubleElimination8Screen } from "../screens/tournaments/DoubleElim8Screen";
import { DoubleElim4Screen } from "../screens/tournaments/DoubleElim4Screen";
import DoubleElim16Screen from "../screens/tournaments/DoubleElim16Screen";
import { SingleElim4Screen } from "../screens/tournaments/SingleElim4Screen";
import { SingleElim8Screen } from "../screens/tournaments/SingleElim8Screen";
import { SingleElim16Screen } from "../screens/tournaments/SingleElim16Screen";
import PlayerInput4Screen from "../screens/PlayerInput4Screen";
import PlayerInput8Screen from "../screens/PlayerInput8Screen";
import PlayerInput16Screen from "../screens/PlayerInput16Screen";
import PlayerInputSingle4Screen from "../screens/PlayerInputSingle4Screen";
import PlayerInputSingle8Screen from "../screens/PlayerInputSingle8Screen";
import PlayerInputSingle16Screen from "../screens/PlayerInputSingle16Screen";

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
          name="PlayerInput4"
          component={PlayerInput4Screen}
          options={{ title: "DE-4 Setup" }}
        />
        <Stack.Screen
          name="PlayerInput8"
          component={PlayerInput8Screen}
          options={{ title: "DE-8 Setup" }}
        />
        <Stack.Screen
          name="DoubleElim4"
          component={DoubleElim4Screen}
          options={{ title: "Double Elimination - 4 Players" }}
        />
        <Stack.Screen
          name="PlayerInput16"
          component={PlayerInput16Screen}
          options={{ title: "DE-16 Setup" }}
        />
        <Stack.Screen
          name="PlayerInputSingle4"
          component={PlayerInputSingle4Screen}
          options={{ title: "SE-4 Setup" }}
        />
        <Stack.Screen
          name="PlayerInputSingle8"
          component={PlayerInputSingle8Screen}
          options={{ title: "SE-8 Setup" }}
        />
        <Stack.Screen
          name="PlayerInputSingle16"
          component={PlayerInputSingle16Screen}
          options={{ title: "SE-16 Setup" }}
        />
        <Stack.Screen
          name="SingleElim4"
          component={SingleElim4Screen}
          options={{ title: "Single Elimination - 4 Players" }}
        />
        <Stack.Screen
          name="DoubleElim16"
          component={DoubleElim16Screen}
          options={{ title: "Double Elimination - 16 Players" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
