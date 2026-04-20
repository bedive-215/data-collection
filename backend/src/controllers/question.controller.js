import QuestionService from "../services/question.service.js";

class QuestionController {

    async create(req, res, next) {
        try {
            const { survey_id } = req.params;
            const payload = req.body;

            const result = await QuestionService.createQuestion(
                survey_id,
                payload
            );

            return res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async createQuestions(req, res, next) {
        try {
            const { survey_id } = req.params;
            const payload = req.body;

            const result = await QuestionService.createQuestions(
                survey_id,
                payload
            );

            return res.status(201).json({
                message: result.message,
                data: result.question
            });
        } catch (err) {
            next(err);
        }
    }


    async getQuestionsBySurvey(req, res, next) {
        try {
            const { survey_id } = req.params;

            const result = await QuestionService.getQuestionsBySurvey(
                survey_id
            );

            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async updateQuestion(req, res, next) {
        try {
            const { question_id } = req.params;
            const payload = req.body;

            const result = await QuestionService.updateQuestion(
                question_id,
                payload
            );

            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async deleteQuestion(req, res, next) {
        try {
            const { question_id } = req.params;

            const result = await QuestionService.deleteQuestion(
                question_id
            );

            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async reorderQuestions(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { questions } = req.body;

            const result = await QuestionService.reorderQuestions(
                survey_id,
                questions
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async bulkUpdateQuestions(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { questions } = req.body;

            const result = await QuestionService.bulkUpdateQuestions(
                survey_id,
                questions
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new QuestionController();