import { Op, fn, col, literal } from "sequelize";
import { AppError } from "../middlewares/handleException.middlware.js";

class SurveyAnalyticsService {
    constructor({ Question, QuestionOption, Answer, Response }) {
        this.Question = Question;
        this.QuestionOption = QuestionOption;
        this.Answer = Answer;
        this.Response = Response;
    }

    async getQuestionAnalytics(question_id) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const totalResponses = await this.Answer.count({
            where: { question_id }
        });

        if (["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.type)) {

            const options = await this.QuestionOption.findAll({
                where: { question_id },
                attributes: [
                    "id",
                    "label",
                    [
                        fn("COUNT", col("Answers.id")),
                        "count"
                    ]
                ],
                include: [
                    {
                        model: this.Answer,
                        attributes: []
                    }
                ],
                group: ["QuestionOption.id"]
            });

            const result = options.map(opt => {
                const count = parseInt(opt.get("count")) || 0;
                return {
                    option_id: opt.id,
                    label: opt.label,
                    count,
                    percent: totalResponses
                        ? ((count / totalResponses) * 100).toFixed(2)
                        : 0
                };
            });

            return {
                question_id,
                type: question.type,
                total_responses: totalResponses,
                options: result
            };
        }

        if (question.type === "RATING") {
            const stats = await this.Answer.findOne({
                where: { question_id },
                attributes: [
                    [fn("AVG", col("value")), "avg"],
                    [fn("MIN", col("value")), "min"],
                    [fn("MAX", col("value")), "max"]
                ]
            });

            return {
                question_id,
                type: "RATING",
                total_responses: totalResponses,
                avg: parseFloat(stats.get("avg")) || 0,
                min: parseInt(stats.get("min")) || 0,
                max: parseInt(stats.get("max")) || 0
            };
        }

        if (question.type === "TEXT") {
            const answers = await this.Answer.findAll({
                where: { question_id },
                attributes: ["text_value"],
                limit: 50
            });

            return {
                question_id,
                type: "TEXT",
                total_responses: totalResponses,
                answers: answers.map(a => a.text_value)
            };
        }

        throw new AppError("Unsupported question type", 400);
    }

    async getSurveyAnalytics(survey_id) {
        const questions = await this.Question.findAll({
            where: { survey_id }
        });

        if (!questions.length) {
            throw new AppError("No questions found", 404);
        }

        const totalResponses = await this.Response.count({
            where: { survey_id }
        });

        const analytics = [];

        for (const q of questions) {
            const data = await this.getQuestionAnalytics(q.id);
            analytics.push(data);
        }

        return {
            survey_id,
            total_responses: totalResponses,
            questions: analytics
        };
    }
}

export default SurveyAnalyticsService;