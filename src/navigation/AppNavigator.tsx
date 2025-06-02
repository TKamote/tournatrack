import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import PlayerInputScreen from "../screens/PlayerInputScreen";
import TournamentScreen from "../screens/TournamentScreen";
import { RootStackParamList } from "../types"; // Your RootStackParamList definition

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Setup Tournament" }}
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
            // Dynamic title based on tournament params
            title: `${route.params.tournamentType} - ${route.params.numPlayers} Players`,
            // You might want to hide the back button or customize it
            // headerBackVisible: false,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
