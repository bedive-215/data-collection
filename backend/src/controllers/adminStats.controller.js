import AdminStatsService from "../services/adminStats.service.js";

class AdminStatsController {

    async getOverview(req, res, next) {
        try {
            const result = await AdminStatsService.getOverviewStats();
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getSurveyByDay(req, res, next) {
        try {
            const { period } = req.query;
            const result = await AdminStatsService.getSurveyStatsByDay(period);
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getDashboard(req, res, next) {
        try {
            const result = await AdminStatsService.getDashboard();
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getTotalUsersAnswered(req, res, next) {
        try {
            const result = await AdminStatsService.getTotalUsersAnsweredSurvey();
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getUsersAnsweredBySurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const result = await AdminStatsService.getUsersAnsweredBySurvey(survey_id);
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    // ─── Full Dashboard ─────────────────────────────────────────
    async getFullDashboard(req, res, next) {
        try {
            const { period } = req.query;
            const result = await AdminStatsService.getFullDashboard(period);
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getResponseTrend(req, res, next) {
        try {
            const { period } = req.query;
            const result = await AdminStatsService.getResponseTrend(period);
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getSurveyStatusDistribution(req, res, next) {
        try {
            const result = await AdminStatsService.getSurveyStatusDistribution();
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getQuestionTypeDistribution(req, res, next) {
        try {
            const result = await AdminStatsService.getQuestionTypeDistribution();
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getRecentResponses(req, res, next) {
        try {
            const { limit } = req.query;
            const result = await AdminStatsService.getRecentResponses(limit ? parseInt(limit) : 10);
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }

    async getQuickStats(req, res, next) {
        try {
            const result = await AdminStatsService.getQuickStats();
            return res.status(200).json({ message: result.message, data: result.data });
        } catch (err) { next(err); }
    }
}

export default new AdminStatsController();
