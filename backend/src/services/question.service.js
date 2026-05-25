import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import crypto from "crypto";
import { getSurveyStatus } from "../domain/survey.domain.js";

class QuestionService {
    constructor() {
        this.Question = models.Question;
        this.Option = models.QuestionOption;
        this.Survey = models.Survey;
        this.User = models.User;
    }

    _isChoiceType(type) {
        return ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(type);
    }

    _validateQuestionInput({ content, type }) {

        const validTypes = [
            "TEXT",
            "PARAGRAPH",
            "EMAIL",
            "DATE",
            "NUMBER",
            "RATING",
            "SINGLE_CHOICE",
            "MULTIPLE_CHOICE",
            "DROPDOWN",
            "LINEAR_SCALE",
            "TIME",
            "FILE_UPLOAD",
            "MATRIX"
        ];

        if (!content || !content.trim()) {
            throw new AppError("Content is required", 400);
        }

        if (!type) {
            throw new AppError("Type is required", 400);
        }

        if (!validTypes.includes(type)) {
            throw new AppError("Invalid question type", 400);
        }
    }

    _validateOptions(type, options) {
        if (!this._isChoiceType(type)) return [];

        if (!Array.isArray(options) || options.length < 2) {
            throw new AppError("At least 2 options are required", 400);
        }

        const cleaned = options
            .map(opt => ({
                label: opt.label?.trim(),
                value: opt.value?.trim(),
                order_index: opt.order_index ?? 0,
                is_other: opt.is_other || false,
                image_url: opt.image_url || null,
                media_type: opt.media_type || null,
            }))
            .filter(opt => opt.label && opt.value);

        if (cleaned.length < 2) {
            throw new AppError("Options must be valid", 400);
        }

        // remove duplicate value
        const uniqueMap = new Map();
        cleaned.forEach(opt => {
            if (!uniqueMap.has(opt.value)) {
                uniqueMap.set(opt.value, opt);
            }
        });

        return [...uniqueMap.values()];
    }

    _validateSettingsByType(type, settings) {
        switch (type) {
            case "TEXT":
            case "PARAGRAPH":
                if (settings) {
                    const { min_chars, max_chars } = settings;
                    if (min_chars !== undefined && (typeof min_chars !== "number" || min_chars < 0)) {
                        throw new AppError("min_chars must be a non-negative number", 400);
                    }
                    if (max_chars !== undefined && (typeof max_chars !== "number" || max_chars < 1)) {
                        throw new AppError("max_chars must be a positive number", 400);
                    }
                    if (min_chars !== undefined && max_chars !== undefined && min_chars > max_chars) {
                        throw new AppError("min_chars cannot be greater than max_chars", 400);
                    }
                    return { min_chars: min_chars ?? null, max_chars: max_chars ?? null };
                }
                return null;

            case "EMAIL":
                return null;

            case "DATE":
                return settings || null;

            case "NUMBER":
                if (settings) {
                    const { min, max } = settings;
                    if (min !== undefined && typeof min !== "number") {
                        throw new AppError("min must be number", 400);
                    }
                    if (max !== undefined && typeof max !== "number") {
                        throw new AppError("max must be number", 400);
                    }
                    if (min !== undefined && max !== undefined && min > max) {
                        throw new AppError("min <= max", 400);
                    }
                }
                return settings;

            case "RATING":
                const rMin = settings?.min ?? 1;
                const rMax = settings?.max ?? 5;
                if (rMin >= rMax) {
                    throw new AppError("Invalid rating range", 400);
                }
                return { min: rMin, max: rMax };

            case "LINEAR_SCALE":
                if (settings) {
                    const { min, max, min_label, max_label } = settings;
                    if (min === undefined || max === undefined) {
                        throw new AppError("LINEAR_SCALE requires min and max", 400);
                    }
                    if (typeof min !== "number" || typeof max !== "number" || min >= max) {
                        throw new AppError("LINEAR_SCALE min must be less than max", 400);
                    }
                    return { min, max, min_label: min_label ?? null, max_label: max_label ?? null };
                }
                return { min: 1, max: 5, min_label: null, max_label: null };

            case "TIME":
                return settings || null;

            case "FILE_UPLOAD":
                if (settings) {
                    const { max_size_mb, allowed_types } = settings;
                    if (max_size_mb !== undefined && (typeof max_size_mb !== "number" || max_size_mb <= 0)) {
                        throw new AppError("max_size_mb must be a positive number", 400);
                    }
                    if (allowed_types !== undefined && !Array.isArray(allowed_types)) {
                        throw new AppError("allowed_types must be an array", 400);
                    }
                    return { max_size_mb: max_size_mb ?? 5, allowed_types: allowed_types ?? ["image/*"] };
                }
                return { max_size_mb: 5, allowed_types: ["image/*"] };

            case "MATRIX":
                if (settings) {
                    const { rows, columns } = settings;
                    if (!Array.isArray(rows) || rows.length < 1) {
                        throw new AppError("MATRIX requires at least 1 row", 400);
                    }
                    if (!Array.isArray(columns) || columns.length < 2) {
                        throw new AppError("MATRIX requires at least 2 columns", 400);
                    }
                    return { rows, columns };
                }
                return null;

            case "SINGLE_CHOICE":
            case "MULTIPLE_CHOICE":
            case "DROPDOWN":
                return null;

            default:
                throw new AppError("Invalid question type", 400);
        }
    }

    async createQuestion(survey_id, payload) {
        const {
            content, type, required, order_index, settings, options,
            description, placeholder, section_id, media_url, media_type,
            condition, hidden_from_analytics, next_question_id, next_section_id,
        } = payload;

        this._validateQuestionInput({ content, type });

        const cleanedOptions = this._validateOptions(type, options);
        const validatedSettings = this._validateSettingsByType(type, settings);

        const t = await models.sequelize.transaction();

        try {
            const question = await this.Question.create({
                survey_id,
                content: content.trim(),
                description: description || null,
                placeholder: placeholder || null,
                type,
                required: required ?? true,
                order_index: order_index ?? 0,
                settings: validatedSettings,
                section_id: section_id || null,
                media_url: media_url || null,
                media_type: media_type || null,
                condition: condition || null,
                hidden_from_analytics: hidden_from_analytics ?? false,
                next_question_id: next_question_id || null,
                next_section_id: next_section_id || null,
            }, { transaction: t });

            let createdOptions = [];

            if (cleanedOptions.length > 0) {
                createdOptions = await this.Option.bulkCreate(
                    cleanedOptions.map(opt => ({
                        ...opt,
                        question_id: question.id
                    })),
                    { transaction: t }
                );
            }

            await t.commit();

            return {
                message: "Created question successfully",
                question: {
                    ...question.toJSON(),
                    options: createdOptions
                }
            };

        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // update question (content, type, required, order_index, settings, options)
    async updateQuestion(question_id, payload) {
        const {
            content, type, required, order_index, settings, options,
            description, placeholder, section_id, media_url, media_type,
            condition, hidden_from_analytics, next_question_id, next_section_id,
        } = payload;

        const question = await this.Question.findByPk(question_id, {
            include: {
                model: this.Survey,
                as: "survey"
            }
        });

        if (!question) throw new AppError("Question not found", 404);

        const t = await models.sequelize.transaction();

        try {
            if (content !== undefined)          question.content = content.trim();
            if (description !== undefined)      question.description = description || null;
            if (placeholder !== undefined)     question.placeholder = placeholder || null;
            if (section_id !== undefined)       question.section_id = section_id || null;
            if (media_url !== undefined)       question.media_url = media_url || null;
            if (media_type !== undefined)      question.media_type = media_type || null;
            if (condition !== undefined)       question.condition = condition || null;
            if (hidden_from_analytics !== undefined) question.hidden_from_analytics = hidden_from_analytics;
            if (next_question_id !== undefined) question.next_question_id = next_question_id || null;
            if (next_section_id !== undefined)  question.next_section_id = next_section_id || null;
            if (type !== undefined) {
                question.type = type;
                question.settings = this._validateSettingsByType(type, settings);
            }
            if (required !== undefined)       question.required = required;
            if (order_index !== undefined)    question.order_index = order_index;
            if (settings !== undefined)      question.settings = this._validateSettingsByType(question.type, settings);

            await question.save({ transaction: t });

            // handle options if type changed OR options provided
            if (type || options) {
                const cleanedOptions = this._validateOptions(
                    type || question.type,
                    options
                );

                await this.Option.destroy({
                    where: { question_id: question.id },
                    transaction: t
                });

                if (cleanedOptions.length > 0) {
                    await this.Option.bulkCreate(
                        cleanedOptions.map(opt => ({
                            ...opt,
                            question_id: question.id
                        })),
                        { transaction: t }
                    );
                }
            }

            await t.commit();

            return {
                message: "Updated question successfully",
                question: {
                    ...question.toJSON(),
                    survey_id: question.survey_id,
                }
            };

        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // delete question
    async deleteQuestion(question_id) {
        const question = await this.Question.findByPk(question_id, {
            include: {
                model: this.Survey,
                as: "survey"
            }
        });

        if (!question) throw new AppError("Question not found", 404);

        await question.destroy();

        return {
            message: "Deleted question successfully"
        };
    }

    // get questions by survey
    async getQuestionsBySurvey(survey) {
        const status = getSurveyStatus(survey);

        if (status !== "ACTIVE") {
            throw new AppError(`Survey is ${status}`, 403);
        }

        const questions = await this.Question.findAll({
            where: { survey_id: survey.id },
            include: [
                {
                    model: this.Option,
                    as: "options",
                    attributes: ["id", "label", "value", "order_index", "is_other", "image_url", "media_type"]
                }
            ],
            order: [["section_id", "ASC"], ["order_index", "ASC"]]
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
                options: (q.options || []).sort((a, b) => a.order_index - b.order_index).map(o => ({
                    id: o.id,
                    label: o.label,
                    value: o.value,
                    order_index: o.order_index,
                    is_other: o.is_other,
                    image_url: o.image_url,
                    media_type: o.media_type,
                })),
            }))
        };
    }


    // reorder questions
    async reorderQuestions(survey_id, questions) {
        const t = await models.sequelize.transaction();

        try {
            await Promise.all(
                questions.map(q =>
                    this.Question.update(
                        { order_index: q.order_index },
                        {
                            where: { id: q.id, survey_id },
                            transaction: t
                        }
                    )
                )
            );

            await t.commit();

            return { message: "Reordered successfully" };

        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async bulkCreateQuestions(survey_id, questionsPayload) {
        if (!Array.isArray(questionsPayload) || questionsPayload.length === 0) {
            throw new AppError("Questions payload must be a non-empty array", 400);
        }

        const t = await models.sequelize.transaction();

        try {
            const questionData = [];
            const optionData = [];

            // 2. validate + prepare data
            questionsPayload.forEach((q, index) => {
                const {
                    content,
                    type,
                    required = true,
                    order_index = index,
                    settings,
                    options,
                    media_url,
                    media_type,
                } = q;

                this._validateQuestionInput({ content, type });

                const cleanedOptions = this._validateOptions(type, options);
                const validatedSettings = this._validateSettingsByType(type, settings);

                const tempId = crypto.randomUUID();
                questionData.push({
                    id: tempId,
                    survey_id,
                    content: content.trim(),
                    type,
                    required,
                    order_index,
                    settings: validatedSettings,
                    media_url: media_url || null,
                    media_type: media_type || null,
                });

                if (cleanedOptions.length > 0) {
                    cleanedOptions.forEach((opt, optIndex) => {
                        optionData.push({
                            ...opt,
                            image_url: opt.image_url || null,
                            media_type: opt.media_type || null,
                            order_index: opt.order_index ?? optIndex,
                            question_id: tempId
                        });
                    });
                }
            });

            // 3. insert questions
            const createdQuestions = await this.Question.bulkCreate(questionData, {
                transaction: t,
                returning: true
            });

            // 4. insert options
            let createdOptions = [];
            if (optionData.length > 0) {
                createdOptions = await this.Option.bulkCreate(optionData, {
                    transaction: t
                });
            }

            await t.commit();

            return {
                message: "Bulk create questions successfully",
                total: createdQuestions.length,
                questions: createdQuestions
            };

        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

export default new QuestionService();