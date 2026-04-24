import AdminStatsService from "../services/adminStats.service.js";

class AdminStatsController {

    // Tổng quan hệ thống
    async getOverview(req, res, next) {
        try {
            const result = await AdminStatsService.getOverviewStats();

            return res.status(200).json({
                message: result.message,
                data: result.data
            });
        } catch (err) {
            next(err);
        }
    }

    // Thống kê survey theo ngày
    async getSurveyByDay(req, res, next) {
        try {
            const result = await AdminStatsService.getSurveyStatsByDay();

            return res.status(200).json({
                message: result.message,
                data: result.data
            });
        } catch (err) {
            next(err);
        }
    }

    // Dashboard tổng hợp
    async getDashboard(req, res, next) {
        try {
            const result = await AdminStatsService.getDashboard();

            return res.status(200).json({
                message: result.message,
                data: result.data
            });
        } catch (err) {
            next(err);
        }
    }

    // Tổng số user đã làm survey (global)
    async getTotalUsersAnswered(req, res, next) {
        try {
            const result = await AdminStatsService.getTotalUsersAnsweredSurvey();

            return res.status(200).json({
                message: result.message,
                data: result.data
            });
        } catch (err) {
            next(err);
        }
    }

    // Số user đã làm theo từng survey
    async getUsersAnsweredBySurvey(req, res, next) {
        try {
            const { survey_id } = req.params;

            const result = await AdminStatsService.getUsersAnsweredBySurvey(survey_id);

            return res.status(200).json({
                message: result.message,
                data: result.data
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AdminStatsController();