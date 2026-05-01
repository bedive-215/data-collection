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
        this.User = models.User;
    }

    // ===================== MAPPER =====================
    _mapAnswerToResponse(answers, optionMap = {}) {
        return answers.map(a => {
            let answerValue = null;

            if (a.answer_text) {
                answerValue = a.answer_text;
            } else if (a.answer_number !== null && a.answer_number !== undefined) {
                answerValue = a.answer_number;
            } else if (a.option) {
                answerValue = a.option.content;
            } else if (a.selected_options) {
                answerValue = a.selected_options.map(id => optionMap[id] || id);
            }

            return {
                question_id: a.question.id,
                question: a.question.content,
                type: a.question.type,
                answer: answerValue
            };
        });
    }

    async _checkOwnership(response, user) {
        if (response.user_id !== user.id && user.role !== "ADMIN") {
            throw new AppError("Forbidden", 403);
        }
    }

    // ===================== SUBMIT =====================
    async submitSurvey(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers?.length) throw new AppError("Answers are required", 400);

        const transaction = await this.sequelize.transaction();

        try {
            const existing = await this.Response.findOne({
                where: { user_id, survey_id },
                transaction
            });

            if (existing) throw new AppError("Already submitted", 400);

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

            const questionMap = Object.fromEntries(
                questions.map(q => [q.id, q])
            );

            // preload options
            const optionIds = answers.flatMap(a =>
                a.option_id ? [a.option_id] : a.option_ids || []
            );

            const options = await this.QuestionOption.findAll({
                where: { id: optionIds },
                transaction
            });

            const optionMap = Object.fromEntries(
                options.map(o => [o.id, o])
            );

            const response = await this.Response.create({
                survey_id,
                user_id,
                submitted_at: new Date()
            }, { transaction });

            const answerRecords = [];

            for (const ans of answers) {
                const q = questionMap[ans.question_id];
                if (!q) throw new AppError("Invalid question", 400);

                // TEXT
                if (["TEXT", "PARAGRAPH", "EMAIL"].includes(q.type)) {
                    answerRecords.push({
                        response_id: response.id,
                        question_id: q.id,
                        answer_text: ans.answer_text
                    });
                }

                // NUMBER
                else if (["NUMBER", "RATING"].includes(q.type)) {
                    answerRecords.push({
                        response_id: response.id,
                        question_id: q.id,
                        answer_number: Number(ans.answer_text)
                    });
                }

                // SINGLE
                else if (["SINGLE_CHOICE", "DROPDOWN"].includes(q.type)) {
                    const option = optionMap[ans.option_id];
                    if (!option || option.question_id !== q.id) {
                        throw new AppError("Invalid option", 400);
                    }

                    answerRecords.push({
                        response_id: response.id,
                        question_id: q.id,
                        option_id: option.id
                    });
                }

                // MULTIPLE
                else if (q.type === "MULTIPLE_CHOICE") {
                    if (!Array.isArray(ans.option_ids) || !ans.option_ids.length) {
                        throw new AppError("Options required", 400);
                    }

                    ans.option_ids.forEach(id => {
                        const option = optionMap[id];
                        if (!option || option.question_id !== q.id) {
                            throw new AppError("Invalid option", 400);
                        }
                    });

                    answerRecords.push({
                        response_id: response.id,
                        question_id: q.id,
                        selected_options: ans.option_ids
                    });
                }

                else {
                    throw new AppError("Unsupported type", 400);
                }
            }

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
                            attributes: ["id", "label"],
                            required: false
                        }
                    ]
                }
            ],
            order: [
                [{ model: this.Answer, as: "answers" },
                 { model: this.Question, as: "question" },
                 "order_index", "ASC"]
            ]
        });

        const optionIds = responses.flatMap(r =>
            r.answers.flatMap(a => a.selected_options || [])
        );

        const options = await this.QuestionOption.findAll({
            where: { id: optionIds }
        });

        const optionMap = Object.fromEntries(
            options.map(o => [o.id, o.content])
        );

        const result = responses.map(r => ({
            response_id: r.id,
            submitted_at: r.submitted_at,
            answers: this._mapAnswerToResponse(r.answers, optionMap)
        }));

        // console.log("Option Map:", optionMap);
        // console.log("Mapped Answers:", result.flatMap(r => r.answers));

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
                            attributes: ["id", "label"],
                            required: false
                        }
                    ]
                }
            ]
        });

        if (!response) throw new AppError("Response not found", 404);

        const optionIds = response.answers.flatMap(a => a.selected_options || []);

        const options = await this.QuestionOption.findAll({
            where: { id: optionIds }
        });

        const optionMap = Object.fromEntries(
            options.map(o => [o.id, o.content])
        );

        return {
            response_id: response.id,
            survey: response.survey,
            submitted_at: response.submitted_at,
            answers: this._mapAnswerToResponse(response.answers, optionMap)
        };
    }

    async deleteResponse(user_id, response_id) {
        const response = await this.Response.findOne({
            where: { id: response_id, user_id }
        });

        if (!response) throw new AppError("Response not found", 404);

        const user = await this.User.findByPk(user_id);

        if (!user) throw new AppError("User not found", 404);

        this._checkOwnership(response, user);

        await this.Response.destroy({
            where: { id: response_id }
        });

        return { message: "Delete response successfully" };
    }

    async updateResponse(user_id, survey_id, answers) {
        if (!answers?.length) throw new AppError("Answers required", 400);

        const transaction = await this.sequelize.transaction();

        try {
            const response = await this.Response.findOne({
                where: { user_id, survey_id },
                transaction
            });

            if (!response) throw new AppError("Response not found", 404);
            
            const user = await this.User.findByPk(user_id);

            if (!user) throw new AppError("User not found", 404);

            this._checkOwnership(response, user);

            await this.Answer.destroy({
                where: { response_id: response.id },
                transaction
            });

            await this.submitSurvey(user_id, survey_id, answers);

            await transaction.commit();

            return { message: "Update response successfully" };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getAllResponsesByUserId(user_id) {
        const responses = await this.Response.findAll({
            where: { user_id },
            include: [
                {
                    model: this.Survey,
                    as: "survey",
                    attributes: ["title", "description"]
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