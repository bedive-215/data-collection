import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class ResponseService {
    constructor() {
        this.Response = models.Response;
        this.Answer = models.Answer;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Survey = models.Survey;
        this.sequelize = models.sequelize;
    }

    async submitSurvey(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers || answers.length === 0) {
            throw new AppError("Answers are required", 400);
        }

        const transaction = await this.sequelize.transaction();

        try {
            // 1. create response
            const response = await this.Response.create({
                survey_id,
                user_id: user_id || null
            }, { transaction });

            // 2. validate questions
            const questionIds = answers.map(a => a.question_id);

            const questions = await this.Question.findAll({
                where: { id: questionIds }
            });

            const questionMap = {};
            questions.forEach(q => {
                questionMap[q.id] = q;
            });

            // 3. create answers
            const answerRecords = [];

            for (const ans of answers) {
                const question = questionMap[ans.question_id];

                if (!question) {
                    throw new AppError("Invalid question", 400);
                }

                // TEXT question
                if (question.type === "TEXT") {
                    if (!ans.answer_text) {
                        throw new AppError("Answer text required", 400);
                    }

                    answerRecords.push({
                        response_id: response.id,
                        question_id: question.id,
                        answer_text: ans.answer_text,
                        option_id: null
                    });
                }

                // CHOICE question
                else {
                    if (!ans.option_id) {
                        throw new AppError("Option is required", 400);
                    }

                    // check option belongs to question
                    const option = await this.QuestionOption.findOne({
                        where: {
                            id: ans.option_id,
                            question_id: question.id
                        }
                    });

                    if (!option) {
                        throw new AppError("Invalid option", 400);
                    }

                    answerRecords.push({
                        response_id: response.id,
                        question_id: question.id,
                        option_id: option.id,
                        answer_text: null
                    });
                }
            }

            // bulk insert
            await this.Answer.bulkCreate(answerRecords, { transaction });

            await transaction.commit();

            return {
                message: "Submit survey successfully",
                response_id: response.id
            };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getSurveySubmitByUserId(user_id, survey_id) {
        const responses = await this.Response.findAll({
            where: {
                user_id,
                survey_id
            },
            include: [
                {
                    model: this.Answer,
                    as: "answers",
                    include: [
                        {
                            model: this.Question,
                            as: "question",
                            attributes: ["id", "content", "type", "order_index"]
                        },
                        {
                            model: this.QuestionOption,
                            as: "option",
                            attributes: ["id", "content"]
                        }
                    ]
                }
            ],
            order: [
                [{ model: this.Answer, as: "answers" }, { model: this.Question, as: "question" }, "order_index", "ASC"]
            ]
        });

        const result = responses.map(r => ({
            response_id: r.id,
            submitted_at: r.created_at,
            answers: r.answers.map(a => ({
                question_id: a.question.id,
                question: a.question.content,
                type: a.question.type,
                answer: a.answer_text || a.option?.content
            }))
        }));

        return {
            message: "Get user answers successfully",
            count: result.length,
            data: result
        };
    }

    async getResponseByUserId(user_id) {
        const responses = await this.Response.findAll({
            where: { user_id },
            order: [["created_at", "ASC"]]
        });

        return {
            message: "Get user responses successfully",
            count: responses.length,
            data: responses
        }
    }

    async getAllAnswerByResponseId(response_id) {
        const response = await this.Response.findOne({
            where: { id: response_id },
            include: [
                {
                    model: this.Survey,
                    as: "survey",
                    attributes: ["id", "title", "description"]
                },
                {
                    model: this.Answer,
                    as: "answers",
                    include: [
                        {
                            model: this.Question,
                            as: "question",
                            attributes: ["id", "content", "type", "order_index"]
                        },
                        {
                            model: this.QuestionOption,
                            as: "option",
                            attributes: ["id", "content"],
                            required: false
                        }
                    ]
                }
            ]
        });

        if (!response) throw new AppError("Response not found", 404);

        return response;
    }
}

export default new ResponseService();