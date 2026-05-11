import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import crypto from "crypto";

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
            "DROPDOWN"
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
                is_other: opt.is_other || false
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
                const min = settings?.min ?? 1;
                const max = settings?.max ?? 5;

                if (min >= max) {
                    throw new AppError("Invalid rating range", 400);
                }

                return { min, max };

            case "SINGLE_CHOICE":
            case "MULTIPLE_CHOICE":
            case "DROPDOWN":
                return null;

            default:
                throw new AppError("Invalid question type", 400);
        }
    }

    async createQuestion(survey_id, payload) {
        const { content, type, required, order_index, settings, options } = payload;

        this._validateQuestionInput({ content, type });

        const cleanedOptions = this._validateOptions(type, options);
        const validatedSettings = this._validateSettingsByType(type, settings);

        const t = await models.sequelize.transaction();

        try {
            const question = await this.Question.create({
                survey_id,
                content: content.trim(),
                type,
                required,
                order_index,
                settings: validatedSettings
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
        const { content, type, required, order_index, settings, options } = payload;

        const question = await this.Question.findByPk(question_id, {
            include: {
                model: this.Survey,
                as: "survey"
            }
        });

        if (!question) throw new AppError("Question not found", 404);

        const t = await models.sequelize.transaction();

        try {
            if (content !== undefined) question.content = content.trim();
            if (type !== undefined) {
                question.type = type;
                question.settings = this._validateSettingsByType(type, settings);
            }
            if (required !== undefined) question.required = required;
            if (order_index !== undefined) question.order_index = order_index;
            if (settings !== undefined) question.settings = settings;

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
                question
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
    async getQuestionsBySurvey(survey_id) {
        const questions = await this.Question.findAll({
            where: { survey_id },
            include: [
                {
                    model: this.Option,
                    as: "options",
                    attributes: ["id", "label", "value", "order_index", "is_other"]
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
                    options
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
                    settings: validatedSettings
                });

                if (cleanedOptions.length > 0) {
                    cleanedOptions.forEach((opt, optIndex) => {
                        optionData.push({
                            ...opt,
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