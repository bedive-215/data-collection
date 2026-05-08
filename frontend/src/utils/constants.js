

export const ROUTERS = {
  USER: {
    HOME: "/user/home",
    DASHBOARD: "/user/dashboard",
    PROFILE: "/user/profile",

    SURVEY_TAKE: "/user/survey/:surveyId",

    SURVEYS: "/user/surveys",

    // MY SURVEYS
    MY_SURVEYS: "/user/my-surveys",

    // DETAIL
    MY_SURVEY_DETAIL:
      "/user/my-surveys/:surveyId",
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    SURVEYS: "/admin/surveys",
    SURVEY_DETAIL:
      "/admin/surveys/:surveyId",
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
