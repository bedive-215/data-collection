import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { withTransaction } from "../utils/transaction.js";

import eventBus from "../events/eventBus.js";
import { RESPONSE_EVENTS } from "../events/response/response.event.js";

import { mapAnswerToResponse, buildAnswerRecords, buildMaps, getAnswersWithMap } from "../mappers/response.mapper.js";

class ResponseService {
    constructor() {
        const { Response, Answer, Question, QuestionOption, Survey, User, sequelize } = models;
        Object.assign(this, { Response, Answer, Question, QuestionOption, Survey, User, sequelize });
    }

    async startSurvey(user_id, survey_id) {
        if (!survey_id) throw new AppError("Survey id is required", 400);

        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) throw new AppError("Survey not found", 404);

        if (survey.max_responses) {
            const completedCount = await this.Response.count({ where: { survey_id, status: "COMPLETED" } });
            if (completedCount >= survey.max_responses) throw new AppError("Survey has reached maximum responses", 400);
        }

        let response = await this.Response.findOne({ where: { survey_id, user_id, submitted_at: null } });
        const isNew = !response;
        if (isNew) response = await this.Response.create({ survey_id, user_id, started_at: new Date() });

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
            },
        };
    }

    async submitSurvey(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers?.length) throw new AppError("Answers are required", 400);

        const questionIds = answers.map(a => a.question_id);
        if (new Set(questionIds).size !== questionIds.length) throw new AppError("Duplicate question", 400);

        await withTransaction(this.sequelize, null, async (transaction) => {
            const response = await this.Response.findOne({
                where: { user_id, survey_id, submitted_at: null },
                transaction,
            });
            if (!response) throw new AppError("Bạn chưa bắt đầu khảo sát. Vui lòng mở trang khảo sát trước khi nộp bài.", 400);

            const { questionMap, optionMap } = await buildMaps.call(this, answers, survey_id, transaction);
            const answerRecords = await buildAnswerRecords(response.id, answers, questionMap, optionMap);

            await this.Answer.bulkCreate(answerRecords, { transaction });
            await response.update({ submitted_at: new Date(), status: "COMPLETED" }, { transaction });
        });

        // Lấy response sau commit để dùng cho gamification
        const response = await this.Response.findOne({ where: { user_id, survey_id }, order: [["created_at", "DESC"]] });
        const survey = await this.Survey.findByPk(survey_id);
        const isCreator = survey.created_by === user_id;

        eventBus.emit(RESPONSE_EVENTS.SUBMITTED, {
            userId: user_id,
            surveyId: survey_id,
            responseId: response.id,
            isCreator,
            survey,
        });

        return {
            message: "Submit survey successfully",
            response_id: response.id,
        };
    }

    async autoSave(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers?.length) throw new AppError("Answers are required", 400);

        return withTransaction(this.sequelize, null, async (transaction) => {
            const response = await this.Response.findOne({
                where: { user_id, survey_id, submitted_at: null },
                transaction,
            });
            if (!response) throw new AppError("Bạn chưa bắt đầu khảo sát. Vui lòng mở trang khảo sát trước khi nộp bài.", 400);

            const { questionMap, optionMap } = await buildMaps.call(this, answers, survey_id, transaction);

            await this.Answer.destroy({
                where: { response_id: response.id, question_id: { [models.Sequelize.Op.in]: answers.map(a => a.question_id) } },
                transaction,
            });

            const answerRecords = await buildAnswerRecords(response.id, answers, questionMap, optionMap);
            await this.Answer.bulkCreate(answerRecords, { transaction });

            return { message: "Progress saved", response_id: response.id, saved_count: answers.length };
        });
    }

    async updateResponse(user_id, survey_id, answers) {
        if (!answers?.length) throw new AppError("Answers required", 400);

        return withTransaction(this.sequelize, null, async (transaction) => {
            const response = await this.Response.findOne({ where: { user_id, survey_id }, transaction });
            if (!response) throw new AppError("Response not found", 404);

            const { questionMap, optionMap } = await buildMaps.call(this, answers, survey_id, transaction);

            await this.Answer.destroy({ where: { response_id: response.id }, transaction });

            const answerRecords = await buildAnswerRecords(response.id, answers, questionMap, optionMap);
            await this.Answer.bulkCreate(answerRecords, { transaction });

            return { message: "Update response successfully" };
        });
    }

    async getAllResponsesByUserId(user_id) {
        const responses = await this.Response.findAll({
            where: { user_id },
            include: [{ model: this.Survey, as: "survey", attributes: ["title", "description"] }],
            order: [["created_at", "DESC"]],
        });
        return { message: "Get responses successfully", count: responses.length, data: responses };
    }

    async getSurveySubmitByUserId(user_id, survey_id) {
        if (!survey_id) throw new AppError("Survey id is required", 400);

        const response = await this.Response.findOne({ where: { user_id, survey_id } });
        if (!response) throw new AppError("Response not found", 404);

        const { answers, optionMap } = await getAnswersWithMap.call(this, response.id);

        return {
            message: "Get survey response successfully",
            data: {
                response_id: response.id,
                survey_id,
                submitted_at: response.submitted_at,
                answers: mapAnswerToResponse(answers, optionMap),
            },
        };
    }

    async getAllAnswerByResponseId(user, response_id) {
        if (!response_id) throw new AppError("Response id is required", 400);

        const response = await this.Response.findByPk(response_id);
        if (!response) throw new AppError("Response not found", 404);
        if (response.user_id !== user.id && user.role !== "ADMIN") throw new AppError("Forbidden", 403);

        const { answers, optionMap } = await getAnswersWithMap.call(this, response_id);

        return {
            message: "Get answers successfully",
            data: { response_id, answers: mapAnswerToResponse(answers, optionMap) },
        };
    }

    async deleteResponse(user_id, response_id) {
        if (!response_id) throw new AppError("Response id is required", 400);

        const response = await this.Response.findByPk(response_id);
        if (!response) throw new AppError("Response not found", 404);
        if (response.user_id !== user_id) throw new AppError("Forbidden", 403);

        await response.destroy();
        return { message: "Delete response successfully" };
    }
}

export default new ResponseService();