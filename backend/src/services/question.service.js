import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class QuestionService {
    constructor() {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Survey = models.Survey;
    }

    async createQuestion(survey_id, payload) {
        const { content, type, required, order_index, options } = payload;

        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!content) throw new AppError("Content is required", 400);

        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) throw new AppError("Survey not found", 404);

        // validate options
        if (type !== "TEXT" && (!options || options.length === 0)) {
            throw new AppError("Options are required for choice questions", 400);
        }

        const question = await this.Question.create({
            survey_id,
            content,
            type,
            required,
            order_index
        });

        let createdOptions = [];

        if (type !== "TEXT") {
            createdOptions = await Promise.all(
                options.map(opt =>
                    this.QuestionOption.create({
                        question_id: question.id,
                        content: opt
                    })
                )
            );
        }

        return {
            message: "Created question successfully",
            question: {
                ...question.toJSON(),
                options: createdOptions
            }
        };
    }

    async getQuestionsBySurvey(survey_id) {
        if (!survey_id) throw new AppError("Survey id is required", 400);

        const questions = await this.Question.findAll({
            where: { survey_id },
            include: [
                {
                    model: this.QuestionOption,
                    as: "options"
                }
            ],
            order: [["order_index", "ASC"]]
        });

        return {
            message: "Get questions successfully",
            count: questions.length,
            questions
        };
    }

    async deleteQuestion(question_id) {
        if (!question_id) throw new AppError("Question id is required", 400);

        const question = await this.Question.findByPk(question_id);

        if (!question) throw new AppError("Question not found", 404);

        await question.destroy();

        return {
            message: "Deleted question successfully"
        };
    }
}

export default new QuestionService();