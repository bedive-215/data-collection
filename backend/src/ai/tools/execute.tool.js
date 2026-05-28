import * as surveyHandler from "./handlers/survey.handler.js";
import * as analyticsHandler from "./handlers/analytics.handler.js";
import * as systemHandler from "./handlers/system.handler.js";
import * as responseHandler from "./handlers/response.handler.js";
import * as notificationHandler from "./handlers/notification.handler.js";

const TOOL_MAP = {
    list_my_surveys: surveyHandler.listMySurveys,
    search_surveys: surveyHandler.searchSurveys,
    get_survey_detail: surveyHandler.getSurveyDetail,
    get_survey_analytics: analyticsHandler.getSurveyAnalytics,
    get_response_trend: analyticsHandler.getResponseTrend,
    get_completion_stats: analyticsHandler.getCompletionStats,
    get_system_overview: systemHandler.getSystemOverview,
    get_my_responses: responseHandler.getResponseDetail,
    get_notifications: notificationHandler.getNotificationList,
    create_survey: surveyHandler.createSurvey,
    add_questions_to_survey: surveyHandler.addQuestions,
};

export async function executeTool(name, args, user) {
    const handler = TOOL_MAP[name];

    if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
    }

    return await handler({
        args,
        user,
    });
}