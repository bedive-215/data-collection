// File: src/navigation/RootNavigator.jsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPassword from "../screens/auth/ForgotPassword";

// Bottom Tab Navigator
import BottomTabNavigator from "./BottomTabNavigator";

// ✅ IMPORT THÊM
import UserSurveyScreen from "../screens/home/Surveytakepage";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

      {/* Main App */}
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />

      {/* ✅ THÊM SCREEN Ở ĐÂY */}
      <Stack.Screen 
        name="UserSurvey" 
        component={UserSurveyScreen}
      />

      {/* Legacy */}
      <Stack.Screen 
        name="UserHome" 
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}