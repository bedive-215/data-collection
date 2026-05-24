/** Brand name & tagline (navbar, document title) */
export const APP_BRAND = {
  name: "EchoForm",
  tagline: "Ask. Listen. Improve.",
};

export const ROUTERS = {
  USER: {
    HOME: "/user/home",
    DASHBOARD: "/user/dashboard",
    PROFILE: "/user/profile",
    NOTIFICATIONS: "/user/notifications",
    GENDER_SETUP: "/user/gender-setup",

    SURVEY_TAKE: "/user/survey/:surveyId",
    SURVEY_RESPONSE: "/user/survey/:surveyId/response",

    SURVEYS: "/user/surveys",

    // MY SURVEYS
    MY_SURVEYS: "/user/my-surveys",

    // DETAIL
    MY_SURVEY_DETAIL:
      "/user/my-surveys/:surveyId",

    // ANALYSIS HUB
    ANALYSIS_HUB: "/user/analysis",
    ANALYSIS_STATISTICAL: "/user/analysis/:surveyId/statistical",
    ANALYSIS_AI: "/user/analysis/:surveyId/ai",
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    SURVEYS: "/admin/surveys",
    SURVEY_DETAIL:
      "/admin/surveys/:surveyId",
    ANALYTICS: "/admin/surveys/:surveyId/analytics",
    NOTIFICATIONS: "/admin/notifications",
  },

  PUBLIC: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD:
      "/forgot-password",
    NOT_FOUND: "/404",
  },

  PRIVATE: {
    FORBIDDEN: "/403",
  },
};
