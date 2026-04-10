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
}

export default new ResponseController();