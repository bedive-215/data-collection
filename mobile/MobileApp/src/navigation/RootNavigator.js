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
import SurveyStudioScreen from '../screens/home/SurveyStudioScreen';
import SurveyAnalyticsScreen from '../screens/home/SurveyAnalyticsScreen';
import PublicSurveyDetailScreen from '../screens/home/PublicSurveyDetailScreen';

// Notifications
import NotificationsScreen from '../screens/home/NotificationsScreen';

// Survey Response
import SurveyResponseScreen from '../screens/home/SurveyResponseScreen';

// Gamification screens
import LeaderboardScreen from '../screens/home/LeaderboardScreen';
import AchievementsScreen from '../screens/home/AchievementsScreen';
import StarWalletScreen from '../screens/home/StarWalletScreen';

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

      {/* ── NEW: Survey Studio (3-tab: Design / Send / Analyze) ── */}
      <Stack.Screen
        name='SurveyStudio'
        component={SurveyStudioScreen}
        options={{ headerShown: false }}
      />

      {/* ── NEW: Analytics full screen ── */}
      <Stack.Screen
        name='SurveyAnalytics'
        component={SurveyAnalyticsScreen}
        options={{ headerShown: false }}
      />

      {/* ── NEW: Public survey detail / preview ── */}
      <Stack.Screen
        name='PublicSurveyDetail'
        component={PublicSurveyDetailScreen}
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

      {/* ─── GAMIFICATION ──────────────────── */}
      <Stack.Screen
        name='Leaderboard'
        component={LeaderboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='Achievements'
        component={AchievementsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='StarWallet'
        component={StarWalletScreen}
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
