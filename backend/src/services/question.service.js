import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { withTransaction } from "../utils/transaction.js";
import { getSurveyStatus } from "../domain/survey.domain.js";
import { prepareQuestionData, validateSettingsByType, validateOptions } from "../helpers/question.helper.js";


class QuestionService {
    constructor() {
        const { Question, QuestionOption: Option, Survey, User } = models;
        Object.assign(this, { Question, Option, Survey, User });
    }

    async createQuestion(survey_id, payload) {
        const { questionRow, cleanedOptions } = prepareQuestionData(survey_id, payload);

        return withTransaction(models.sequelize, null, async (transaction) => {
            const question = await this.Question.create(questionRow, { transaction });

            const createdOptions = cleanedOptions.length
                ? await this.Option.bulkCreate(
                    cleanedOptions.map(opt => ({ ...opt, question_id: question.id })),
                    { transaction }
                )
                : [];

            return {
                message: "Created question successfully",
                question: { ...question.toJSON(), options: createdOptions },
            };
        });
    }

    async updateQuestion(question_id, payload) {
        const question = await this.Question.findByPk(question_id, {
            include: { model: this.Survey, as: "survey" },
        });
        if (!question) throw new AppError("Question not found", 404);

        const {
            content, type, required, order_index, settings, options,
            description, placeholder, section_id, media_url, media_type,
            condition, hidden_from_analytics, next_question_id, next_section_id,
        } = payload;

        return withTransaction(models.sequelize, null, async (transaction) => {
            if (content !== undefined)              question.content = content.trim();
            if (description !== undefined)          question.description = description || null;
            if (placeholder !== undefined)          question.placeholder = placeholder || null;
            if (section_id !== undefined)           question.section_id = section_id || null;
            if (media_url !== undefined)            question.media_url = media_url || null;
            if (media_type !== undefined)           question.media_type = media_type || null;
            if (condition !== undefined)            question.condition = condition || null;
            if (hidden_from_analytics !== undefined) question.hidden_from_analytics = hidden_from_analytics;
            if (next_question_id !== undefined)     question.next_question_id = next_question_id || null;
            if (next_section_id !== undefined)      question.next_section_id = next_section_id || null;
            if (required !== undefined)             question.required = required;
            if (order_index !== undefined)          question.order_index = order_index;
            if (type !== undefined)                 question.type = type;
            if (type !== undefined || settings !== undefined)
                question.settings = validateSettingsByType(type || question.type, settings);

            await question.save({ transaction });

            if (type !== undefined || options !== undefined) {
                const cleanedOptions = validateOptions(type || question.type, options);
                await this.Option.destroy({ where: { question_id: question.id }, transaction });
                if (cleanedOptions.length) {
                    await this.Option.bulkCreate(
                        cleanedOptions.map(opt => ({ ...opt, question_id: question.id })),
                        { transaction }
                    );
                }
            }

            return {
                message: "Updated question successfully",
                question: { ...question.toJSON(), survey_id: question.survey_id },
            };
        });
    }

    async deleteQuestion(question_id) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);
        await question.destroy();
        return { message: "Deleted question successfully" };
    }

    async bulkCreateQuestions(survey_id, questionsPayload) {
        if (!Array.isArray(questionsPayload) || !questionsPayload.length) {
            throw new AppError("Questions payload must be a non-empty array", 400);
        }

        return withTransaction(models.sequelize, null, async (transaction) => {
            const questionRows = [];
            const optionRows = [];

            questionsPayload.forEach((q, index) => {
                const { questionRow, cleanedOptions } = prepareQuestionData(survey_id, q, index);
                questionRows.push(questionRow);
                cleanedOptions.forEach((opt, optIndex) => optionRows.push({
                    ...opt,
                    image_url: opt.image_url || null,
                    media_type: opt.media_type || null,
                    order_index: opt.order_index ?? optIndex,
                    question_id: questionRow.id,
                }));
            });

            const createdQuestions = await this.Question.bulkCreate(questionRows, { transaction, returning: true });
            if (optionRows.length) await this.Option.bulkCreate(optionRows, { transaction });

            return {
                message: "Bulk create questions successfully",
                total: createdQuestions.length,
                questions: createdQuestions,
            };
        });
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    async getQuestionsBySurvey(survey) {
        const status = getSurveyStatus(survey);
        if (status !== "ACTIVE") throw new AppError(`Survey is ${status}`, 403);

        const questions = await this.Question.findAll({
            where: { survey_id: survey.id },
            include: [{
                model: this.Option,
                as: "options",
                attributes: ["id", "label", "value", "order_index", "is_other", "image_url", "media_type"],
            }],
            order: [["section_id", "ASC"], ["order_index", "ASC"]],
        });

        return {
            message: "Get questions successfully",
            count: questions.length,
            questions: questions.map(q => ({
                id: q.id,
                section_id: q.section_id,
                content: q.content,
                description: q.description,
                placeholder: q.placeholder,
                type: q.type,
                required: q.required,
                order_index: q.order_index,
                settings: q.settings,
                media_url: q.media_url,
                media_type: q.media_type,
                condition: q.condition,
                hidden_from_analytics: q.hidden_from_analytics,
                next_question_id: q.next_question_id,
                next_section_id: q.next_section_id,
                options: (q.options || [])
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(({ id, label, value, order_index, is_other, image_url, media_type }) =>
                        ({ id, label, value, order_index, is_other, image_url, media_type })
                    ),
            })),
        };
    }

    async reorderQuestions(survey_id, questions) {
        return withTransaction(models.sequelize, null, async (transaction) => {
            await Promise.all(
                questions.map(q =>
                    this.Question.update(
                        { order_index: q.order_index },
                        { where: { id: q.id, survey_id }, transaction }
                    )
                )
            );
            return { message: "Reordered successfully" };
        });
    }
}

export default new QuestionService();