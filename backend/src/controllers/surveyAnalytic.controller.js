import { AppError } from "../middlewares/handleException.middlware.js";
import SurveyAnalyticsService from "../services/surveyAnalytic.service.js";
import models from "../models/index.js";

const parseFilters = (query) => {
    const filters = {};
    if (query.date_from) filters.date_from = query.date_from;
    if (query.date_to)   filters.date_to   = query.date_to;
    if (query.status)    filters.status    = query.status;
    if (query.search_query) filters.search_query = query.search_query;
    if (query.response_ids) {
        filters.response_ids = query.response_ids.split(",").map((id) => id.trim());
    }
    return filters;
};

const parsePagination = (query, defaultLimit = 20) => ({
    page: Math.max(1, parseInt(query.page) || 1),
    limit: Math.min(100, parseInt(query.limit) || defaultLimit),
});

class SurveyAnalyticController {

    // GET /api/analytics/surveys/:survey_id/dashboard
    // High-level overview: completion + trend + all question analytics
    async getDashboard(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);

            const data = await SurveyAnalyticsService.getDashboard(survey_id, filters);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    // GET /api/analytics/surveys/:survey_id
    // Full per-question analytics for the whole survey
    async getSurveyAnalytics(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);

            const data = await SurveyAnalyticsService.getSurveyAnalytics(survey_id, filters);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    };

    // GET /api/analytics/surveys/:survey_id/completion
    // Completion rate, avg time, drop-off per question
    async getCompletionStats(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);

            const data = await SurveyAnalyticsService.getCompletionStats(survey_id, filters);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    };

    // GET /api/analytics/surveys/:survey_id/trend?group_by=day|week|month
    // Response count over time
    async getResponseTrend(req, res, next) {
        try {
            const { survey_id } = req.params;
            const groupBy = req.query.group_by || "day";
            const filters = parseFilters(req.query);

            const data = await SurveyAnalyticsService.getResponseTrend(survey_id, groupBy, filters);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    };

    // GET /api/analytics/surveys/:survey_id/responses
    // Individual respondent-level export with pagination
    // ?page=1&limit=20&date_from=...&date_to=...
    async getIndividualResponses(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);
            const pagination = parsePagination(req.query, 20);

            const data = await SurveyAnalyticsService.getIndividualResponses(survey_id, filters, pagination);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    };

    // GET /api/analytics/questions/:question_id
    // Analytics for a single question
    // ?survey_id=...&date_from=...&date_to=...&page=1&limit=50
    async getQuestionAnalytics(req, res, next) {
        try {
            const { question_id } = req.params;
            const filters = parseFilters(req.query);
    
            // survey_id is needed to scope answers to filtered responses
            if (req.query.survey_id) filters.survey_id = req.query.survey_id;
    
            // TEXT / PARAGRAPH pagination
            const textOpts = parsePagination(req.query, 50);
    
            const data = await SurveyAnalyticsService.getQuestionAnalytics(question_id, filters, textOpts);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    };
    
    // GET /api/analytics/surveys/:survey_id/crosstab
    //   ?question_a=<uuid>&question_b=<uuid>&date_from=...&date_to=...
    // Cross-tabulation between two choice questions
    async getCrossTab(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { question_a, question_b } = req.query;

            if (!question_a || !question_b) {
                throw new AppError("query params question_a and question_b are required", 400);
            }

            const filters = parseFilters(req.query);

            const data = await SurveyAnalyticsService.getCrossTab(
                survey_id,
                question_a,
                question_b,
                filters
            );
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    };

    // GET /api/analytics/surveys/:survey_id/heatmap
    // GitHub-style activity heatmap
    async getDateHeatmap(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);
            const data = await SurveyAnalyticsService.getDateHeatmap(survey_id, filters);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    // GET /api/analytics/surveys/:survey_id/responses/filtered
    // Individual responses with search + status filter
    async getFilteredResponses(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);
            const pagination = parsePagination(req.query, 20);
            const data = await SurveyAnalyticsService.getFilteredResponses(survey_id, filters, pagination);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    }

    // GET /api/analytics/surveys/:survey_id/export
    // Full data export as CSV
    async exportCSV(req, res, next) {
        try {
            const { survey_id } = req.params;
            const filters = parseFilters(req.query);
            const { csv, filename } = await SurveyAnalyticsService.exportCSV(survey_id, filters);

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            return res.status(200).send(csv);
        } catch (err) {
            next(err);
        }
    }
};

export default new SurveyAnalyticController();