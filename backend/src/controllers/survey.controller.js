// controllers/survey.controller.js
import SurveyService from "../services/survey.service.js";

class SurveyController {

    // Create survey
   async createSurvey(req, res, next) {
    try {
        const user = req.user;

        const result = await SurveyService.createSurvey(user, req.body);

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
            const { access_token } = req.query;
            const { survey_id } = req.params;
            const user = req.user;
            const result = await SurveyService.getSurveyById(user, survey_id, access_token);

            return res.status(200).json({
                message: result.message,
                data: result.survey,
                role: result.role
            });
        } catch (err) {
            next(err);
        }
    }

    // Get surveys my survey (created by user)
    async getMySurveys(req, res, next) {
        try {
            const user = req.user;
            const { page, limit } = req.query;

            const result = await SurveyService.getMySurveys(user, page, limit);

            return res.status(200).json({
                message: result.message,
                count: result.count,
                data: result.surveys
            });
        } catch (err) {
            next(err);
        }
    }

    // Get surveys by user id (for admin)
    async getSurveyByUserId(req, res, next) {
        try {
            const { id } = req.params;
            const { page, limit } = req.query;

            const result = await SurveyService.getSurveyByUserId(id, page, limit);

            return res.status(200).json({
                message: result.message,
                count: result.count,
                data: result.surveys
            });
        } catch (err) {
            next(err);
        }
    }

    // Get all surveys (admin)
    async getAllSurvey(req, res, next) {
        try {
            const { page, limit } = req.query;
            const result = await SurveyService.getAllSurvey(page, limit);

            return res.status(200).json({
                message: result.message,
                count: result.count,
                surveys: result.surveys,
                page: result.page,
                totalPages: result.totalPages
            });
        } catch (err) {
            next(err);
        }
    }

    // Get survey public
    async getSurveyPublic(req, res, next) {
        try {
            const result = await SurveyService.getSurveyPublic();
            return res.status(200).json({
                message: result.message,
                count: result.count,
                data: result.surveys
            });
        } catch (err) {
            next(err);
        }
    }

    // update survey (owner, editor, admin)
    async updateSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user = req.user;
            const result = await SurveyService.updateSurvey(user, survey_id, req.body);

            return res.status(200).json({
                message: result.message,
                data: result.survey
            });
        } catch (err) {
            next(err);
        }
    }

    // delete survey (owner, admin)
    async deleteSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user = req.user;
            const result = await SurveyService.deleteSurveyById(survey_id, user);

            return res.status(200).json({
                message: result.message
            });
        } catch (err) {
            next(err);
        }
    }

    // close survey (owner, admin)
    async closeSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user = req.user;
            const result = await SurveyService.closeSurvey(survey_id, user);
            return res.status(200).json({
                message: result.message
            });
        } catch (err) {
            next(err);
        }
    }

    async publicSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user = req.user;
            const result = await SurveyService.publicSurvey(survey_id, user);
            return res.status(200).json({
                message: result.message,
                data: result.survey
            });
        } catch (err) {
            next(err);
        }
    }

    async shareLink(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user = req.user;
            const result = await SurveyService.shareLink(survey_id, user);
            return res.status(200).json({
                message: result.message,
                url: result.url
            });
        } catch (err) {
            next(err);
        }
    }

    async inviteSurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { email } = req.body;
            const user = req.user;
            const result = await SurveyService.inviteSurvey(survey_id, email, user);
            return res.status(200).json({
                message: result.message
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new SurveyController();