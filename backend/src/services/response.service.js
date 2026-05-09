import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class ResponseService {
    constructor() {
        this.Response = models.Response;
        this.Answer = models.Answer;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Survey = models.Survey;
        this.SurveyParticipant = models.SurveyParticipant;
        this.sequelize = models.sequelize;
        this.User = models.User;
    }

    _mapAnswerToResponse(answers, optionMap = {}) {
        return answers.map(a => {
            const type = a.question.type;
            let answerValue = null;

            if (["TEXT", "PARAGRAPH", "EMAIL"].includes(type)) {
                answerValue = a.answer_text;
            }

            else if (["NUMBER", "RATING"].includes(type)) {
                answerValue = a.answer_number;
            }

            else if (["SINGLE_CHOICE", "DROPDOWN"].includes(type)) {
                answerValue = a.option_id
                    ? optionMap[a.option_id] || a.option?.label || a.option_id
                    : null;
            }

            else if (type === "MULTIPLE_CHOICE") {
                answerValue = (a.selected_options || [])
                    .map(id => optionMap[id] || id)
                    .filter(Boolean);
            }

            else if (type === "DATE") {
                answerValue = a.answer_date
                    ? new Date(a.answer_date).toISOString().split("T")[0]
                    : null;
            }

            return {
                question_id: a.question.id,
                question: a.question.content,
                type,
                answer: answerValue
            };
        });
    }

    async _checkOwnership(response, user) {
        if (response.user_id !== user.id && user.role !== "ADMIN") {
            throw new AppError("Forbidden", 403);
        }
    }

    async _checkSubmitPermission(user_id, survey_id, transaction) {
        const survey = await this.Survey.findByPk(survey_id, { transaction });

        if (!survey) throw new AppError("Survey not found", 404);

        // public survey thì ai cũng submit được
        if (survey.is_public) return;

        const participant = await this.SurveyParticipant.findOne({
            where: { user_id, survey_id },
            transaction
        });

        if (!participant) {
            throw new AppError("You are not allowed to access this survey", 403);
        }

        if (!["respondent", "editor"].includes(participant.role)) {
            throw new AppError("You are not allowed to submit", 403);
        }
    }

    async _buildAnswerRecords(response_id, answers, questionMap, optionMap) {
        const records = [];

        for (const ans of answers) {
            const q = questionMap[ans.question_id];
            if (!q) throw new AppError("Invalid question", 400);

            if (["TEXT", "PARAGRAPH", "EMAIL"].includes(q.type)) {
                records.push({
                    response_id,
                    question_id: q.id,
                    answer_text: ans.answer_text
                });
            }

            else if (["NUMBER", "RATING"].includes(q.type)) {
                const value = ans.answer_number ?? ans.answer_text;

                if (value === undefined || value === null || isNaN(value)) {
                    throw new AppError("Invalid number answer", 400);
                }

                records.push({
                    response_id,
                    question_id: q.id,
                    answer_number: Number(value)
                });
            }

            else if (["SINGLE_CHOICE", "DROPDOWN"].includes(q.type)) {
                const option = optionMap[ans.option_id];
                if (!option || option.question_id !== q.id) {
                    throw new AppError("Invalid option", 400);
                }

                records.push({
                    response_id,
                    question_id: q.id,
                    option_id: option.id
                });
            }

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

                records.push({
                    response_id,
                    question_id: q.id,
                    selected_options: ans.option_ids
                });
            }

            else if (q.type === "DATE") {
                const dateValue = new Date(ans.answer_text);
                if (isNaN(dateValue.getTime())) {
                    throw new AppError("Invalid date answer", 400);
                }

                records.push({
                    response_id,
                    question_id: q.id,
                    answer_date: dateValue
                });
            }

            else {
                throw new AppError("Unsupported type", 400);
            }
        }

        return records;
    }

    async submitSurvey(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers?.length) throw new AppError("Answers are required", 400);

        const transaction = await this.sequelize.transaction();

        try {
            await this._checkSubmitPermission(user_id, survey_id, transaction);

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

            const answerRecords = await this._buildAnswerRecords(
                response.id,
                answers,
                questionMap,
                optionMap
            );

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

    async updateResponse(user_id, survey_id, answers) {
        if (!answers?.length) throw new AppError("Answers required", 400);

        const transaction = await this.sequelize.transaction();

        try {
            await this._checkSubmitPermission(user_id, survey_id, transaction);

            const response = await this.Response.findOne({
                where: { user_id, survey_id },
                transaction
            });

            if (!response) throw new AppError("Response not found", 404);

            const user = await this.User.findByPk(user_id);
            if (!user) throw new AppError("User not found", 404);

            this._checkOwnership(response, user);

            const questionIds = answers.map(a => a.question_id);

            const questions = await this.Question.findAll({
                where: { id: questionIds, survey_id },
                transaction
            });

            const questionMap = Object.fromEntries(
                questions.map(q => [q.id, q])
            );

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

            await this.Answer.destroy({
                where: { response_id: response.id },
                transaction
            });

            const answerRecords = await this._buildAnswerRecords(
                response.id,
                answers,
                questionMap,
                optionMap
            );

            await this.Answer.bulkCreate(answerRecords, { transaction });

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