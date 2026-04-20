// controllers/survey.controller.js
import SurveyService from "../services/survey.service.js";

class SurveyController {

    // Create survey
    async createSurvey(req, res, next) {
        try {
            const userId = req.user.id;
            const { title, description } = req.body;

            const result = await SurveyService.createSurvey(
                userId,
                title,
                description
            );

            return res.status(201).json({
                message: result.message,
                data: result.survey
            });
        } catch (err) {
            next(err);
        }
    }

    // Get survey by id
    async getSurveyById(req, res, next) {
        try {
            const { survey_id } = req.params;

            const result = await SurveyService.getSurveyById(survey_id);

            return res.status(200).json({
                message: result.message,
                data: result.survey
            });
        } catch (err) {
            next(err);
        }
    }

    // Get surveys by user
    async getSurveyByUserId(req, res, next) {
        try {
            const userId = req.user.id;

            const result = await SurveyService.getSurveyByUserId(userId);

            return res.status(200).json({
                message: result.message,
                count: result.count,
                data: result.surveys
            });
        } catch (err) {
            next(err);
        }
    }

    // Delete survey
    async deleteSurveyById(req, res, next) {
        try {
            const { survey_id } = req.params;
            const userId = req.user.id;

            const result = await SurveyService.deleteSurvey(
                survey_id,
                userId
            );

            return res.status(200).json({
                message: result.message
            });
        } catch (err) {
            next(err);
        }
    }

    // Get all surveys (admin)
    async getAllSurvey(req, res, next) {
        try {
            const result = await SurveyService.getAllSurvey();

            return res.status(200).json({
                message: result.message,
                count: result.count,
                data: result.surveys
            });
        } catch (err) {
            next(err);
        }
    }

    // Update survey
    async updateSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const userId = req.user.id;
            const payload = req.body;

            const result = await SurveyService.updateSurvey(
                survey_id,
                userId,
                payload
            );
            return res.status(200).json({
                message: result.message,
                data: result.survey
            });
        } catch (err) {
            next(err);
        }
    }

}

export default new SurveyController();