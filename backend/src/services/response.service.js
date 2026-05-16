import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import notificationService from "./notification.service.js";

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
            const type = a.question?.type || a.type;
            let answerValue = null;

            if (["TEXT", "PARAGRAPH", "EMAIL"].includes(type)) {
                answerValue = a.answer_text;
            }

            else if (["NUMBER", "RATING", "LINEAR_SCALE"].includes(type)) {
                answerValue = a.answer_number;
            }

            else if (["SINGLE_CHOICE", "DROPDOWN"].includes(type)) {
                answerValue = a.option_id
                    ? optionMap[a.option_id] || a.option?.label || a.option_id
                    : null;
            }

            else if (type === "MULTIPLE_CHOICE") {
                const ids = typeof a.selected_options === "string"
                    ? JSON.parse(a.selected_options)
                    : (a.selected_options || []);
                answerValue = ids
                    .map(id => optionMap[id] || id)
                    .filter(Boolean);
            }

            else if (type === "DATE") {
                answerValue = a.answer_date
                    ? new Date(a.answer_date).toISOString().split("T")[0]
                    : null;
            }

            else if (type === "TIME") {
                answerValue = a.answer_text || null;
            }

            else if (type === "FILE_UPLOAD") {
                answerValue = a.answer_text || null; // URL stored in answer_text
            }

            return {
                question_id: a.question?.id || a.question_id,
                question: a.question?.content,
                type,
                answer: answerValue
            };
        });
    }

    async _buildAnswerRecords(response_id, answers, questionMap, optionMap) {
        const records = [];

        for (const ans of answers) {
            const q = questionMap[ans.question_id];
            if (!q) throw new AppError("Invalid question", 400);

            if (["TEXT", "PARAGRAPH", "EMAIL", "TIME", "FILE_UPLOAD"].includes(q.type)) {
                records.push({
                    response_id,
                    question_id: q.id,
                    answer_text: ans.answer_text
                });
            }

            else if (["NUMBER", "RATING", "LINEAR_SCALE"].includes(q.type)) {
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
                throw new AppError(`Unsupported question type: ${q.type}`, 400);
            }
        }

        return records;
    }

    async startSurvey(user_id, survey_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required", 400);
        }

        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        // Kiểm tra max_responses
        if (survey.max_responses) {
            const completedCount = await this.Response.count({
                where: { survey_id, status: "COMPLETED" }
            });
            if (completedCount >= survey.max_responses) {
                throw new AppError("Survey has reached maximum responses", 400);
            }
        }

        // Tìm response IN_PROGRESS cũ (để resume)
        let response = await this.Response.findOne({
            where: {
                survey_id,
                user_id,
                submitted_at: null
            }
        });

        const isNew = !response;

        if (!response) {
            response = await this.Response.create({
                survey_id,
                user_id,
                started_at: new Date()
            });
        }

        // Lấy survey settings để trả về cho frontend
        return {
            message: isNew ? "Survey started" : "Survey resumed",
            response_id: response.id,
            started_at: response.started_at || response.created_at,
            survey_settings: {
                is_anonymous: survey.is_anonymous ?? false,
                randomize_questions: survey.randomize_questions ?? false,
                randomize_options: survey.randomize_options ?? false,
                time_limit_seconds: survey.time_limit_seconds ?? null,
                show_progress_bar: survey.show_progress_bar ?? true,
                allow_back: survey.allow_back ?? true,
                one_question_per_page: survey.one_question_per_page ?? true,
                thank_you_message: survey.thank_you_message ?? null,
                logo_url: survey.logo_url ?? null,
                background_url: survey.background_url ?? null,
                accent_color: survey.accent_color ?? "#6366f1",
            }
        };
    }

    async submitSurvey(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers?.length) throw new AppError("Answers are required", 400);

        const transaction = await this.sequelize.transaction();

        try {
            const response = await this.Response.findOne({
                where: {
                    user_id,
                    survey_id,
                    submitted_at: null
                },
                transaction
            });

            if (!response) {
                throw new AppError(
                    "Bạn chưa bắt đầu khảo sát. Vui lòng mở trang khảo sát trước khi nộp bài.",
                    400
                );
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

            const answerRecords = await this._buildAnswerRecords(
                response.id,
                answers,
                questionMap,
                optionMap
            );

            await this.Answer.bulkCreate(answerRecords, { transaction });

            await response.update({
                submitted_at: new Date(),
                status: "COMPLETED"
            }, { transaction });

            await transaction.commit();

            // Send notification to survey owner
            const survey = await this.Survey.findByPk(survey_id);
            const responder = await this.User.findByPk(user_id);
            await notificationService.notifySurveyResponse({
                survey,
                responder,
                responseId: response.id
            });

            // Emit real-time update to admins watching this survey
            if (global.emitToSurveyAdmins) {
                const responseCount = await this.Response.count({ where: { survey_id, status: "COMPLETED" } });
                global.emitToSurveyAdmins(survey_id, "survey:new-response", {
                    survey_id,
                    response_id: response.id,
                    total_responses: responseCount,
                    submitted_at: new Date(),
                });
            }

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
            const response = await this.Response.findOne({
                where: { user_id, survey_id },
                transaction
            });

            if (!response) throw new AppError("Response not found", 404);

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

    async getSurveySubmitByUserId(user_id, survey_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required", 400);
        }

        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        const response = await this.Response.findOne({
            where: {
                user_id,
                survey_id
            }
        });

        if (!response) {
            throw new AppError("Response not found", 404);
        }

        const answers = await this.Answer.findAll({
            where: { response_id: response.id },
            include: [
                {
                    model: this.Question,
                    as: "question",
                    attributes: ["id", "content", "type"]
                },
                {
                    model: this.QuestionOption,
                    as: "option",
                    attributes: ["id", "label"]
                }
            ]
        });

        const optionIds = answers.flatMap(a =>
            a.option_id ? [a.option_id] : a.selected_options || []
        );

        const options = await this.QuestionOption.findAll({
            where: { id: optionIds }
        });

        const optionMap = Object.fromEntries(
            options.map(o => [o.id, o.label])
        );

        const mappedAnswers = this._mapAnswerToResponse(answers, optionMap);

        return {
            message: "Get survey response successfully",
            data: {
                response_id: response.id,
                survey_id,
                submitted_at: response.submitted_at,
                answers: mappedAnswers
            }
        };
    }

    async getAllAnswerByResponseId(user, response_id) {
        if (!response_id) {
            throw new AppError("Response id is required", 400);
        }

        const response = await this.Response.findByPk(response_id);

        if (!response) {
            throw new AppError("Response not found", 404);
        }

        if (response.user_id !== user.id && user.role !== "ADMIN") {
            throw new AppError("Forbidden", 403);
        }

        const answers = await this.Answer.findAll({
            where: { response_id },
            include: [
                {
                    model: this.Question,
                    as: "question",
                    attributes: ["id", "content", "type"]
                },
                {
                    model: this.QuestionOption,
                    as: "option",
                    attributes: ["id", "label"]
                }
            ]
        });

        const optionIds = answers.flatMap(a =>
            a.option_id ? [a.option_id] : a.selected_options || []
        );

        const options = await this.QuestionOption.findAll({
            where: { id: optionIds }
        });

        const optionMap = Object.fromEntries(
            options.map(o => [o.id, o.label])
        );

        const mappedAnswers = this._mapAnswerToResponse(answers, optionMap);

        return {
            message: "Get answers successfully",
            data: {
                response_id,
                answers: mappedAnswers
            }
        };
    }

    async deleteResponse(user_id, response_id) {
        if (!response_id) {
            throw new AppError("Response id is required", 400);
        }

        const response = await this.Response.findByPk(response_id);

        if (!response) {
            throw new AppError("Response not found", 404);
        }

        if (response.user_id !== user_id) {
            throw new AppError("Forbidden", 403);
        }

        response.destroy();

        return {
            message: "Delete response successfull"
        }
    }

    // Auto-save: upsert answers without marking as completed
    async autoSave(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers?.length) throw new AppError("Answers are required", 400);

        const transaction = await this.sequelize.transaction();

        try {
            // Tìm response IN_PROGRESS
            const response = await this.Response.findOne({
                where: { user_id, survey_id, submitted_at: null },
                transaction
            });

            if (!response) {
                throw new AppError(
                    "Bạn chưa bắt đầu khảo sát. Vui lòng mở trang khảo sát trước khi nộp bài.",
                    400
                );
            }

            const questionIds = answers.map(a => a.question_id);

            const questions = await this.Question.findAll({
                where: { id: questionIds, survey_id },
                transaction
            });

            const questionMap = Object.fromEntries(questions.map(q => [q.id, q]));

            const optionIds = answers.flatMap(a =>
                a.option_id ? [a.option_id] : a.option_ids || []
            );

            const options = await this.QuestionOption.findAll({
                where: { id: optionIds },
                transaction
            });

            const optionMap = Object.fromEntries(options.map(o => [o.id, o]));

            // Xoá answers cũ cho các question_id này (upsert)
            await this.Answer.destroy({
                where: {
                    response_id: response.id,
                    question_id: { [models.Sequelize.Op.in]: questionIds }
                },
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

            return {
                message: "Progress saved",
                response_id: response.id,
                saved_count: answers.length,
            };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

export default new ResponseService();