import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation.types";
import HomeScreen from "../screens/HomeScreen";
import PlayerInputScreen from "../screens/PlayerInputScreen";
import { TournamentScreen } from "../screens/TournamentScreen";

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
          name="Tournament"
          component={TournamentScreen}
          options={({ route }) => ({
            title: `${route.params.tournamentType} - ${route.params.numPlayers} Players`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
