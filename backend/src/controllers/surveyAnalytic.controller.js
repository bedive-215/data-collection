import SurveyAnalyticsService from "../services/surveyAnalytic.service.js";

class SurveyAnalyticsController {
    async getQuestionAnalytics(req, res, next) {
        try {
            const { question_id } = req.params;
            const result = await SurveyAnalyticsService.getQuestionAnalytics(question_id);
            return res.json(result);
        } catch (err) {
            next(err)
        }
    }

    async getSurveyAnalytics (req, res, next) {
        try {
            const { survey_id } = req.params;
        
            const result = await SurveyAnalyticsService.getSurveyAnalytics(survey_id);
        
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new SurveyAnalyticsController();