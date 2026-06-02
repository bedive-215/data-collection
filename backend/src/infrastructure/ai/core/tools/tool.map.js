import * as survey from "#ai/tools/handlers/survey.handler.js";
import * as analytics from "#ai/tools/handlers/analytics.handler.js";
import * as system from "#ai/tools/handlers/system.handler.js";
import * as notification from "#ai/tools/handlers/notification.handler.js";
import * as response from "#ai/tools/handlers/response.handler.js";

export const TOOL_MAP = {
  list_my_surveys: survey.listMySurveys,
  search_surveys: survey.searchSurveys,
  get_survey_detail: survey.getSurveyDetail,
  create_survey: survey.createSurvey,

  get_survey_analytics: analytics.getSurveyAnalytics,
  get_response_trend: analytics.getResponseTrend,
  get_completion_stats: analytics.getCompletionStats,

  get_system_overview: system.getSystemOverview,
  get_my_responses: response.getResponseDetail,

  get_notifications: notification.getNotificationList,
};