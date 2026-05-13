// File: src/navigation/RootNavigator.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPassword from '../screens/auth/ForgotPassword';

// Bottom Tab Navigator
import BottomTabNavigator from './BottomTabNavigator';

// Survey screens
import UserSurveyScreen from '../screens/home/Surveytakepage';
import MySurveyDetailScreen from '../screens/home/Mysurveysscreen';
import QuestionScreen from '../screens/home/Questionscreen';

// Notifications
import NotificationsScreen from '../screens/home/NotificationsScreen';

// Survey Response
import SurveyResponseScreen from '../screens/home/SurveyResponseScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName='Login'
      screenOptions={{ headerShown: false }}
    >
      {/* ─── AUTH ───────────────────────────── */}
      <Stack.Screen name='Login' component={LoginScreen} />
      <Stack.Screen name='Register' component={RegisterScreen} />
      <Stack.Screen name='ForgotPassword' component={ForgotPassword} />

      {/* ─── MAIN APP ───────────────────────── */}
      <Stack.Screen name='MainApp' component={BottomTabNavigator} />

      {/* ─── SURVEY ─────────────────────────── */}
      <Stack.Screen
        name='SurveyTake'
        component={UserSurveyScreen}
      />

      <Stack.Screen
        name='MySurveyDetail'
        component={MySurveyDetailScreen}
      />

      <Stack.Screen
        name='QuestionScreen'
        component={QuestionScreen}
        options={{ headerShown: false }}
      />

      {/* ─── NOTIFICATIONS ──────────────────── */}
      <Stack.Screen
        name='Notifications'
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />

      {/* ─── SURVEY RESPONSE ───────────────── */}
      <Stack.Screen
        name='SurveyResponse'
        component={SurveyResponseScreen}
        options={{ headerShown: false }}
      />

      {/* ─── LEGACY ──────────────────────────── */}
      <Stack.Screen
        name='UserHome'
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
