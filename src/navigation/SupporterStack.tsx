import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import TournamentsDashboard from "../screens/TournamentsDashboard";
import TournamentDetailsScreen from "../screens/tournamentDetails/TournamentDetailsScreen";
import ManagerProfileScreen from "../screens/ManagerProfileScreen";
import { Tournament } from "../types";

type SupporterStackParamList = {
  TournamentsDashboard: undefined;
  TournamentDetails: {
    tournament: Tournament;
  };
  ManagerProfile: {
    managerId: string;
  };
};

const Stack = createNativeStackNavigator<SupporterStackParamList>();

export const SupporterStack = () => {
  return (
    <Stack.Navigator initialRouteName="TournamentsDashboard">
      <Stack.Screen
        name="TournamentsDashboard"
        component={TournamentsDashboard}
        options={({ navigation }) => ({
          title: "Tournaments Dashboard",
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="TournamentDetails"
        component={TournamentDetailsScreen}
      />
      <Stack.Screen
        name="ManagerProfile"
        component={ManagerProfileScreen}
        options={{
          title: "Manager Profile",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
