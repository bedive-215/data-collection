import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class QuestionOptionService {
    constructor() {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
    }

    // Add option
    async createOption(question_id, content) {
        if (!question_id) throw new AppError("Question id is required", 400);
        if (!content) throw new AppError("Content is required", 400);

        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

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

    // Update option
    async updateOption(option_id, content) {
        const option = await this.QuestionOption.findByPk(option_id);

        if (!option) throw new AppError("Option not found", 404);

        option.content = content;
        await option.save();

        return {
            message: "Option updated successfully",
            option
        };
    }

    // Delete option
    async deleteOption(option_id) {
        const option = await this.QuestionOption.findByPk(option_id);

        if (!option) throw new AppError("Option not found", 404);

        await option.destroy();

        return {
            message: "Option deleted successfully"
        };
    }

    // Get options by question
    async getOptionsByQuestion(question_id) {
        const options = await this.QuestionOption.findAll({
            where: { question_id }
        });

        return {
            message: "Get options successfully",
            count: options.length,
            options
        };
    }

    // Bulk update options
    async bulkCreateOptions(question_id, options) {
        if (!question_id) {
            throw new AppError("Question id is required", 400);
        }

        if (!Array.isArray(options) || options.length === 0) {
            throw new AppError("Options must be a non-empty array", 400);
        }

        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        if (question.type === "TEXT") {
            throw new AppError("TEXT question cannot have options", 400);
        }

        // Clean + validate
        const cleanedOptions = options
            .map(opt => opt?.trim())
            .filter(opt => opt);

        if (cleanedOptions.length === 0) {
            throw new AppError("Options cannot be empty", 400);
        }

        // Remove duplicate trong request
        const uniqueOptions = [...new Set(cleanedOptions)];

        // Check duplicate trong DB
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

        // Bulk create
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

export default new QuestionOptionService();