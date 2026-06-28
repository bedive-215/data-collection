import QuestionService from "../services/question.service.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class QuestionController {

    // CREATE ONE QUESTION
    async create(req, res, next) {
        try {
            const { survey_id } = req.params;
            const payload = req.body;

            const result = await QuestionService.createQuestion(
                survey_id,
                payload,
            );

            return res.status(201).json(result);

        } catch (err) {
            next(err);
        }
    }

    // GET ALL QUESTIONS BY SURVEY
    async getQuestionsBySurvey(req, res, next) {
        try {
            const result = await QuestionService.getQuestionsBySurvey(
                req.survey, req.user
            );

            return res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

    // UPDATE QUESTION
    async updateQuestion(req, res, next) {
        try {
            const { question_id } = req.params;
            const payload = req.body;

            const result = await QuestionService.updateQuestion(
                question_id,
                payload,
            );

            return res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

    // DELETE QUESTION
    async deleteQuestion(req, res, next) {
        try {
            const { question_id } = req.params;
            const user = req.user;
            const result = await QuestionService.deleteQuestion(
                question_id,
            );

            return res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

    // REORDER QUESTIONS
    async reorderQuestions(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { questions } = req.body;

            const result = await QuestionService.reorderQuestions(
                survey_id,
                questions,
            );

            return res.status(200).json(result);

        } catch (err) {
            next(err);
        }
    }

    // BULK CREATE QUESTIONS
    async bulkCreateQuestions(req, res, next) {
        try {
            const { survey_id } = req.params;
            const { questions } = req.body;

            if (!questions || !Array.isArray(questions)) {
                throw new AppError(
                    "Questions must be an array",
                    400
                );
            }

            const result = await QuestionService.bulkCreateQuestions(
                survey_id,
                questions,
            );

            return res.status(201).json(result);

        } catch (err) {
            next(err);
        }
    }
}

export default new QuestionController();