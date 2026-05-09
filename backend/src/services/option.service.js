import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import _checkSurveyAccess from "../utils/checkSurveyAccess.js";

class QuestionOptionService {
    constructor() {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Survey = models.Survey;
        this.SurveyParticipant = models.SurveyParticipant;
    }

    // 🔥 LẤY ROLE TỪ SURVEY
    async _getRole(user, question, access_token) {
        const survey = await this.Survey.findByPk(question.survey_id);

        if (!survey) throw new AppError("Survey not found", 404);

        return await _checkSurveyAccess(
            user,
            survey,
            access_token,
            this.SurveyParticipant
        );
    }

    // ===============================
    // ➕ CREATE
    // ===============================
    async createOption(question_id, content, user, access_token) {
        if (!question_id) throw new AppError("Question id is required", 400);
        if (!content) throw new AppError("Content is required", 400);

        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const role = await this._getRole(user, question, access_token);

        // 🔥 CHẶN VIEWER
        if (role !== "editor") {
            throw new AppError("Forbidden", 403);
        }

        if (question.type === "TEXT") {
            throw new AppError("TEXT question cannot have options", 400);
        }

        const option = await this.QuestionOption.create({
            question_id,
            content
        });

        return {
            message: "Option created successfully",
            option
        };
    }

    // ===============================
    // ✏️ UPDATE
    // ===============================
    async updateOption(option_id, content, user) {
        const option = await this.QuestionOption.findByPk(option_id);
        if (!option) throw new AppError("Option not found", 404);

        const question = await this.Question.findByPk(option.question_id);

        const role = await this._getRole(user, question);

        if (role !== "editor") {
            throw new AppError("Forbidden", 403);
        }

        option.content = content;
        await option.save();

        return {
            message: "Option updated successfully",
            option
        };
    }

    // ===============================
    // 🗑 DELETE
    // ===============================
    async deleteOption(option_id, user) {
        const option = await this.QuestionOption.findByPk(option_id);
        if (!option) throw new AppError("Option not found", 404);

        const question = await this.Question.findByPk(option.question_id);

        const role = await this._getRole(user, question);

        if (role !== "editor") {
            throw new AppError("Forbidden", 403);
        }

        await option.destroy();

        return {
            message: "Option deleted successfully"
        };
    }

    // ===============================
    // 👀 READ
    // ===============================
    async getOptionsByQuestion(question_id, user, access_token) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const role = await this._getRole(user, question, access_token);

        // 🔥 viewer + editor đều đọc được
        if (!["viewer", "editor"].includes(role)) {
            throw new AppError("Forbidden", 403);
        }

        const options = await this.QuestionOption.findAll({
            where: { question_id }
        });

        return {
            message: "Get options successfully",
            count: options.length,
            options
        };
    }

    // ===============================
    // 🚀 BULK CREATE
    // ===============================
    async bulkCreateOptions(question_id, options, user, access_token) {
        if (!question_id) {
            throw new AppError("Question id is required", 400);
        }

        if (!Array.isArray(options) || options.length === 0) {
            throw new AppError("Options must be a non-empty array", 400);
        }

        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const role = await this._getRole(user, question, access_token);

        if (role !== "editor") {
            throw new AppError("Forbidden", 403);
        }

        if (question.type === "TEXT") {
            throw new AppError("TEXT question cannot have options", 400);
        }

        const cleanedOptions = options
            .map(opt => opt?.trim())
            .filter(opt => opt);

        const uniqueOptions = [...new Set(cleanedOptions)];

        const existing = await this.QuestionOption.findAll({
            where: {
                question_id,
                content: uniqueOptions
            }
        });

        const existingContents = existing.map(o => o.content);

        const finalOptions = uniqueOptions.filter(
            opt => !existingContents.includes(opt)
        );

        if (finalOptions.length === 0) {
            throw new AppError("All options already exist", 400);
        }

        const createdOptions = await this.QuestionOption.bulkCreate(
            finalOptions.map(content => ({
                question_id,
                content
            }))
        );

        return {
            message: "Bulk create options successfully",
            count: createdOptions.length,
            options: createdOptions
        };
    }
}

export default new QuestionOptionService;