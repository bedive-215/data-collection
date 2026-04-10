import QuestionService from "../services/question.service.js";

class QuestionController {
    async create(req, res, next) {
        try {
            const { survey_id } = req.params;
            const result = await QuestionService.createQuestion(
                survey_id,
                req.body
            );
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getBySurvey(req, res, next) {
        try {
            const { survey_id } = req.params;
            const result = await QuestionService.getQuestionsBySurvey(survey_id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            const { question_id } = req.params;
            const result = await QuestionService.deleteQuestion(question_id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new QuestionController();