import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { Op } from "sequelize";

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
            // check duplicate
            const existing = await this.Response.findOne({
                where: { user_id, survey_id },
                transaction
            });

            if (existing) {
                throw new AppError("You already submitted this survey!", 400);
            }

            // validate duplicate question
            const questionIds = answers.map(a => a.question_id);
            if (new Set(questionIds).size !== questionIds.length) {
                throw new AppError("Duplicate question in answers", 400);
            }

            // get questions 
            const questions = await this.Question.findAll({
                where: {
                    id: questionIds,
                    survey_id
                },
                transaction
            });

            if (questions.length !== questionIds.length) {
                throw new AppError("Invalid questions", 400);
            }

            const questionMap = {};
            questions.forEach(q => {
                questionMap[q.id] = q;
            });

            // preload options
            const optionIds = answers
                .filter(a => a.option_id)
                .map(a => a.option_id);

            const options = await this.QuestionOption.findAll({
                where: {
                    id: optionIds
                },
                transaction
            });

            const optionMap = {};
            options.forEach(o => {
                optionMap[o.id] = o;
            });

            // create response
            let response;
            try {
                response = await this.Response.create({
                    survey_id,
                    user_id: user_id || null
                }, { transaction });
            } catch (err) {
                if (err.name === "SequelizeUniqueConstraintError") {
                    throw new AppError("You already submitted this survey!", 400);
                }
                throw err;
            }

            // build answers
            const answerRecords = [];

            for (const ans of answers) {
                const question = questionMap[ans.question_id];

                if (!question) {
                    throw new AppError("Invalid question", 400);
                }

                // TEXT
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

                // CHOICE
                else {
                    if (!ans.option_id) {
                        throw new AppError("Option is required", 400);
                    }

                    const option = optionMap[ans.option_id];

                    if (!option || option.question_id !== question.id) {
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
            where: { user_id, survey_id },
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
                            attributes: ["id", "content"],
                            required: false
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
            submitted_at: r.createdAt,
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

        return {
            response_id: response.id,
            survey: response.survey,
            submitted_at: response.createdAt,
            answers: response.answers.map(a => ({
                question: a.question.content,
                type: a.question.type,
                answer: a.answer_text || a.option?.content
            }))
        };
    }

    async deleteResponse(user_id, response_id) {
        if (!response_id) {
            throw new AppError("Response id is required", 400);
        }

        if (!user_id) {
            throw new AppError("User id is required", 400);
        }

        const response = await this.Response.findByPk(response_id);

        if (!response) {
            throw new AppError("Response not found", 404);
        }

        await this.Response.destroy({
            where: { id: response_id }
        });

        return {
            message: "Delete response successfully"
        };
    }

    async updateResponse(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers || answers.length === 0) {
            throw new AppError("Answers are required", 400);
        }

        const transaction = await this.sequelize.transaction();

        try {
            const response = await this.Response.findOne({
                where: { user_id, survey_id },
                transaction
            });

            if (!response) {
                throw new AppError("Response not found", 404);
            }
            const questionIds = answers.map(a => a.question_id);
            if (new Set(questionIds).size !== questionIds.length) {
                throw new AppError("Duplicate question", 400);
            }
            const questions = await this.Question.findAll({
                where: { id: questionIds, survey_id },
                transaction
            });

            if (questions.length !== questionIds.length) {
                throw new AppError("Invalid questions", 400);
            }

            const questionMap = {};
            questions.forEach(q => (questionMap[q.id] = q));

            const optionIds = answers
                .filter(a => a.option_id)
                .map(a => a.option_id);

            const options = await this.QuestionOption.findAll({
                where: { id: optionIds },
                transaction
            });

            const optionMap = {};
            options.forEach(o => (optionMap[o.id] = o));

            await this.Answer.destroy({
                where: { response_id: response.id },
                transaction
            });

            const answerRecords = [];

            for (const ans of answers) {
                const question = questionMap[ans.question_id];

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
                } else {
                    if (!ans.option_id) {
                        throw new AppError("Option required", 400);
                    }

                    const option = optionMap[ans.option_id];
                    if (!option || option.question_id !== question.id) {
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

            await this.Answer.bulkCreate(answerRecords, { transaction });

            await transaction.commit();

            return {
                message: "Update response successfully"
            };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getAllResponsesByUserId(user_id) {
        if (!user_id) {
            throw new AppError("User id is required", 400);
        }
        const responses = await this.Response.findAll({
            where: { user_id },
            attributes: ["id", "survey_id", "user_id", "created_at"],
            include: [
                {
                    model: this.Survey,
                    as: "survey",
                    attributes: ["title", "description", "created_at"]
                }
            ],
            order: [["created_at", "DESC"]]
        });
        return {
            message: "Get responses successfully",
            count: responses.length,
            data: responses
        };
    }
}

export default new ResponseService();