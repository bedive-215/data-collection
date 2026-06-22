
// src/AppRouter.jsx
import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";
import HomeLayout from "@/layouts/HomeLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Admin pages
import DashboardAdmin from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminSurveyStudio from "@/pages/admin/SurveyStudio";
import SurveyPage from "@/pages/admin/SurveyPage";
import QuestionPage from "@/pages/admin/QuestionPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import AdminProfile from "@/pages/admin/Profile";
import AdminNotificationsPage from "@/pages/admin/NotificationsPage";

// User pages
import Home from "@/pages/user/Home";
import DashboardSuser from "@/pages/user/Dashboard";
import Profile from "@/pages/user/Profile";
import SurveyTakePage from "@/pages/user/SurveyTakePage";
import SurveysPage from "@/pages/user/SurveysPage";
import GenderSetup from "@/pages/user/GenderSetup";
import GenderGuard from "@/components/common/GenderGuard";

import MySurveyQuestionPage from "@/pages/user/MySurveyQuestionsPage";
import SurveyResponsePage from "@/pages/user/SurveyResponsePage";
import MyResponsePage from "@/pages/user/MyResponsePage";
import UserAnalyticsPage from "@/pages/user/AnalyticsPage";
import NotificationsPage from "@/pages/user/NotificationsPage";
import SurveyStudio from "@/pages/user/SurveyStudio";
import GamificationHubPage from "@/pages/user/GamificationHubPage";
import InvitedSurveyPage from "@/pages/user/InvitedSurveyPage";

// ANALYSIS
import AnalysisHubPage from "@/pages/user/AnalysisHubPage";
import StatisticalAnalysisPage from "@/pages/user/StatisticalAnalysisPage";
import AIAnalysisPage from "@/pages/user/AIAnalysisPage";

// SURVEY PAGES (separated by concern)
import BrowseSurveysPage from "@/pages/user/BrowseSurveysPage";
import MySurveysPage from "@/pages/user/MySurveysPage";

// Errors
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

// Constants
import { ROUTERS } from "@/utils/constants";
const routeConfig = [
  // PUBLIC
  {
    path: ROUTERS.PUBLIC.LOGIN,
    element: Login,
    layout: AuthLayout,
  },
  {
    path: ROUTERS.PUBLIC.REGISTER,
    element: Register,
    layout: AuthLayout,
  },
  {
    path:
      ROUTERS.PUBLIC.FORGOT_PASSWORD,
    element: ForgotPassword,
    layout: AuthLayout,
  },

  // USER
  {
    path: ROUTERS.USER.HOME,
    element: Home,
    layout: HomeLayout,
  },
  {
    path: ROUTERS.USER.GENDER_SETUP,
    element: GenderSetup,
    layout: HomeLayout,
  },
  {
    path: ROUTERS.USER.DASHBOARD,
    element: DashboardSuser,
    layout: UserLayout,
    guard: GenderGuard,
  },
  {
    path: ROUTERS.USER.PROFILE,
    element: Profile,
    layout: HomeLayout,
    guard: GenderGuard,
  },
{
  path: ROUTERS.USER.SURVEY_TAKE,
    element: SurveyTakePage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path: "/user/survey/:surveyId/invited",
    element: InvitedSurveyPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path: ROUTERS.USER.SURVEY_RESPONSE,
    element: SurveyResponsePage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path: ROUTERS.USER.MY_RESPONSE,
    element: MyResponsePage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
{
  path: ROUTERS.USER.SURVEYS,
  element: BrowseSurveysPage,
  layout: HomeLayout,
  guard: GenderGuard,
},
{
  path: ROUTERS.USER.MY_SURVEYS,
  element: MySurveysPage,
  layout: HomeLayout,
  guard: GenderGuard,
},

  {
    path:
      ROUTERS.USER.MY_SURVEY_DETAIL,
    element: MySurveyQuestionPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path:
      "/user/my-surveys/:surveyId/studio",
    element: SurveyStudio,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path:
      "/user/surveys/:surveyId/analytics",
    element: UserAnalyticsPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },

  // ── ANALYSIS (separate from survey) ─────────────────────────────
  {
    path: ROUTERS.USER.ANALYSIS_HUB,
    element: AnalysisHubPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path: ROUTERS.USER.ANALYSIS_STATISTICAL,
    element: StatisticalAnalysisPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path: ROUTERS.USER.ANALYSIS_AI,
    element: AIAnalysisPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },

  {
    path: ROUTERS.USER.NOTIFICATIONS,
    element: NotificationsPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },
  {
    path: ROUTERS.USER.REWARDS,
    element: GamificationHubPage,
    layout: HomeLayout,
    guard: GenderGuard,
  },

  // ADMIN
  {
    path:
      ROUTERS.ADMIN.DASHBOARD,
    element: DashboardAdmin,
    layout: AdminLayout,
  },
  {
    path: ROUTERS.ADMIN.USERS,
    element: AdminUsers,
    layout: AdminLayout,
  },
  {
    path:
      ROUTERS.ADMIN.SURVEYS,
    element: SurveyPage,
    layout: AdminLayout,
  },
  {
    path:
      "/admin/surveys/:surveyId/studio",
    element: AdminSurveyStudio,
    layout: AdminLayout,
  },
  {
    path:
      ROUTERS.ADMIN.SURVEY_DETAIL,
    element: QuestionPage,
    layout: AdminLayout,
  },
  {
    path:
      "/admin/surveys/:surveyId/analytics",
    element: AnalyticsPage,
    layout: AdminLayout,
  },
  {
    path: "/admin/profile",
    element: AdminProfile,
    layout: AdminLayout,
  },
  {
    path: "/admin/notifications",
    element: AdminNotificationsPage,
    layout: AdminLayout,
  },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Page = route.element;

        const Wrapped = route.layout
        ? () => (
            <route.layout>
              {route.guard ? (
                <route.guard>
                  <Page />
                </route.guard>
              ) : (
                <Page />
              )}
            </route.layout>
          )
        : route.guard
        ? () => (
            <route.guard>
              <Page />
            </route.guard>
          )
        : Page;

        return (
          <Route
            key={route.path}
            path={route.path}
            element={<Wrapped />}
          />
        );
      })}

      {/* Default redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={ROUTERS.PUBLIC.LOGIN}
            replace
          />
        }
      />

      {/* Forbidden */}
      <Route
        path={
          ROUTERS.PRIVATE.FORBIDDEN
        }
        element={<Forbidden />}
      />

      {/* 404 */}
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
};

export default AppRouter;
