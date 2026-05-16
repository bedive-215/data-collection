import { Router } from "express";
import surveyAnalyticController from "../controllers/surveyAnalytic.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { createOptionParams } from "../validates/createOptionParams.validate.js";
import { crossTabParams } from "../validates/crossTabParams.validate.js";
import { trendParams } from "../validates/trendParams.validate.js";
import { paginationParams } from "../validates/paginationParams.validate.js";

const route = Router();

// ─────────────────────────────────────────────────────────────
// Question-level
// GET /api/analytics/questions/:question_id/survey/:survey_id
// ─────────────────────────────────────────────────────────────
route.get(
    "/questions/:question_id/survey/:survey_id",
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getQuestionAnalytics
);

// ─────────────────────────────────────────────────────────────
// Survey-level — full question analytics
// GET /api/analytics/surveys/:survey_id/analytics
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id",
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getSurveyAnalytics
);

// ─────────────────────────────────────────────────────────────
// Dashboard — overview tổng hợp
// GET /api/analytics/surveys/:survey_id/dashboard
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/dashboard",
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getDashboard
);

// ─────────────────────────────────────────────────────────────
// Completion stats — tỷ lệ hoàn thành + drop-off
// GET /api/analytics/surveys/:survey_id/completion
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/completion",
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getCompletionStats
);

// ─────────────────────────────────────────────────────────────
// Response trend — biểu đồ theo thời gian
// GET /api/analytics/surveys/:survey_id/trend?group_by=day|week|month
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/trend",
    validate(trendParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getResponseTrend
);

// ─────────────────────────────────────────────────────────────
// Individual responses — xem từng response (có pagination)
// GET /api/analytics/surveys/:survey_id/responses?page=1&limit=20
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/responses",
    validate(paginationParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getIndividualResponses
);

// ─────────────────────────────────────────────────────────────
// Cross-tabulation — tương quan giữa 2 câu hỏi
// GET /api/analytics/surveys/:survey_id/crosstab?question_a=uuid&question_b=uuid
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/crosstab",
    validate(crossTabParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getCrossTab
);

// ─────────────────────────────────────────────────────────────
// Date Heatmap — GitHub-style activity calendar
// GET /api/analytics/surveys/:survey_id/heatmap
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/heatmap",
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getDateHeatmap
);

// ─────────────────────────────────────────────────────────────
// Filtered Responses — search + status filter
// GET /api/analytics/surveys/:survey_id/responses/filtered?search_query=&status=
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/responses/filtered",
    validate(paginationParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getFilteredResponses
);

// ─────────────────────────────────────────────────────────────
// Export CSV — full survey data
// GET /api/analytics/surveys/:survey_id/export
// ─────────────────────────────────────────────────────────────
route.get(
    "/surveys/:survey_id/export",
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.exportCSV
);

export default route;