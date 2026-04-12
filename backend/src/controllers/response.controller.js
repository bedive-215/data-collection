import ResponseService from "../services/response.service.js";

class ResponseController {
    async submit(req, res, next) {
        try {
            const { survey_id } = req.params;
            const user_id = req.user?.id || null;

            const result = await ResponseService.submitSurvey(
                user_id,
                survey_id,
                req.body.answers
            );

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getMySubmission(req, res, next) {
        try {
            const userId = req.user.id;
            const { survey_id } = req.params;

            const result = await ResponseService.getSurveySubmitByUserId(
                userId,
                survey_id
            );

            return res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getUserSubmit(req, res, next) {
        try {
            const { survey_id } = req.params;
            const id = req.user.id;
            const result = await ResponseService.getSurveySubmitByUserId(id, survey_id);
            return res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getAllMyResponse (req, res, next) {
        try {
            const id = req.user.id;
            const result = await ResponseService.getResponseByUserId(id);
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAllUserResponse (req, res, next) {
        try {
            const {id} = req.params;
            const result = await ResponseService.getResponseByUserId(id);
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAllAnswerByResponseId (req, res, next) {
        try {
            const {response_id} = req.params;
            const result = await ResponseService.getAllAnswerByResponseId(response_id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new ResponseController();