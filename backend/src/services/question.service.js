import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class QuestionService {
    constructor() {
        this.Question = models.Question;
        this.Survey = models.Survey;
        this.QuestionOption = models.QuestionOption;
    }

    // Create
    async createQuestionWithOptions(survey_id, payload) {
        const { content, type, required, order_index } = payload;

        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!content) throw new AppError("Content is required", 400);

        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) throw new AppError("Survey not found", 404);

        const question = await this.Question.create({
            survey_id,
            content,
            type,
            required,
            order_index
        });

        return {
            message: "Created question successfully",
            question
        };
    }

    // create question with options
    async createQuestions(survey_id, payload) {
        const { content, type, required, order_index, options } = payload;

        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!content || !content.trim()) {
            throw new AppError("Content is required", 400);
        }

        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) throw new AppError("Survey not found", 404);

        const t = await this.Question.sequelize.transaction();

        try {
            // create question
            const question = await this.Question.create(
                {
                    survey_id,
                    content: content.trim(),
                    type,
                    required,
                    order_index
                },
                { transaction: t }
            );

            let createdOptions = [];

            // handle options
            if (type !== "TEXT") {
                if (!Array.isArray(options) || options.length === 0) {
                    throw new AppError("Options are required", 400);
                }

                // clean + unique
                const cleaned = options
                    .map(o => o?.trim())
                    .filter(Boolean);

                const unique = [...new Set(cleaned)];

                if (unique.length === 0) {
                    throw new AppError("Options cannot be empty", 400);
                }

                // bulk insert
                createdOptions = await this.QuestionOption.bulkCreate(
                    unique.map(content => ({
                        question_id: question.id,
                        content
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

    // Get all questions of survey
    async getQuestionsBySurvey(survey_id) {
        if (!survey_id) throw new AppError("Survey id is required", 400);

        const questions = await this.Question.findAll({
            where: { survey_id },
            include: [
                {
                    model: this.QuestionOption,
                    as: "options",
                    attributes: ["id", "content"]
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

    // Update question
    async updateQuestion(question_id, payload) {
        const { content, type, required, order_index } = payload;

        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        if (content !== undefined) question.content = content;
        if (type !== undefined) question.type = type;
        if (required !== undefined) question.required = required;
        if (order_index !== undefined) question.order_index = order_index;

        if (type === "TEXT") {
            await models.QuestionOption.destroy({
                where: { question_id: question.id }
            });
        }

        await question.save();

        return {
            message: "Updated question successfully",
            question
        };
    }

    // Delete
    async deleteQuestion(question_id) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        await question.destroy();

        return {
            message: "Deleted question successfully"
        };
    }

    // drag and drop question
    async reorderQuestions(survey_id, questions) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!Array.isArray(questions))
            throw new AppError("Questions must be array", 400);

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

            return {
                message: "Reordered questions successfully"
            };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }


    async bulkUpdateQuestions(survey_id, questions) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!Array.isArray(questions))
            throw new AppError("Questions must be array", 400);

        const t = await models.sequelize.transaction();

        try {
            const questionIds = questions.map(q => q.id);

            const existingQuestions = await this.Question.findAll({
                where: {
                    id: questionIds,
                    survey_id
                },
                transaction: t
            });

            if (existingQuestions.length !== questions.length) {
                throw new AppError(
                    "Some questions do not belong to this survey",
                    400
                );
            }

            const questionMap = new Map(
                existingQuestions.map(q => [q.id, q])
            );

            for (const q of questions) {
                const question = questionMap.get(q.id);

                await question.update(q, { transaction: t });

                // If question type is updated to TEXT, delete all options
                if (q.type === "TEXT") {
                    await models.QuestionOption.destroy({
                        where: { question_id: q.id },
                        transaction: t
                    });
                }
            }

            await t.commit();

            return {
                message: "Bulk update questions successfully"
            };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

export default new QuestionService();