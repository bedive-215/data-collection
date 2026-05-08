// File: src/navigation/RootNavigator.jsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Auth
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPassword from "../screens/auth/ForgotPassword";

// Bottom Tab Navigator
import BottomTabNavigator from "./BottomTabNavigator";

// Survey screens
import UserSurveyScreen from "../screens/home/Surveytakepage";
import MySurveyDetailScreen from "../screens/home/Mysurveysscreen";

// ✅ Question Screen (THÊM MỚI)
import QuestionScreen from "../screens/home/Questionscreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      {/* ─── AUTH ───────────────────────────── */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

      {/* ─── MAIN APP ───────────────────────── */}
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />

      {/* ─── SURVEY ─────────────────────────── */}
      <Stack.Screen
        name="SurveyTake"
        component={UserSurveyScreen}
      />

      <Stack.Screen
        name="MySurveyDetail"
        component={MySurveyDetailScreen}
      />

      {/* ─── QUESTION SCREEN (THÊM MỚI) ─────── */}
      <Stack.Screen
        name="QuestionScreen"
        component={QuestionScreen}
        options={{ headerShown: false }}
      />

      {/* ─── LEGACY ──────────────────────────── */}
      <Stack.Screen
        name="UserHome"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}