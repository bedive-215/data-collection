import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import surveyService from "./survey.service.js";

class QuestionOptionService {
    constructor() {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Survey = models.Survey;
        this.SurveyParticipant = models.SurveyParticipant;
    }

    async createOption(question_id, payload) {
        if (!question_id) {
            throw new AppError("Question id is required", 400);
        }

        const { label, value, order_index, is_other } = payload;

        if (!label) {
            throw new AppError("Label is required", 400);
        }

        const question = await this.Question.findByPk(question_id);
        if (!question) {
            throw new AppError("Question not found", 404);
        }

        if (question.type === "TEXT") {
            throw new AppError("TEXT question cannot have options", 400);
        }

        const normalizeValue = (str) => {
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
        };

        const option = await this.QuestionOption.create({
            question_id,
            label,
            value: value || normalizeValue(label),
            order_index: order_index ?? 0,
            is_other: is_other ?? false
        });

        return {
            message: "Option created successfully",
            option
        };
    }

    async updateOption(option_id, payload) {
        const option = await this.QuestionOption.findByPk(option_id);
        if (!option) {
            throw new AppError("Option not found", 404);
        }

        const { label, value, order_index, is_other } = payload;

        if (
            label === undefined &&
            value === undefined &&
            order_index === undefined &&
            is_other === undefined
        ) {
            throw new AppError("No data provided to update", 400);
        }

        const question = await this.Question.findByPk(option.question_id);
        if (!question) {
            throw new AppError("Question not found", 404);
        }

        // Update từng field nếu có
        if (label !== undefined) option.label = label;
        if (value !== undefined) option.value = value;
        if (order_index !== undefined) option.order_index = order_index;
        if (is_other !== undefined) option.is_other = is_other;

        await option.save();

        return {
            message: "Option updated successfully",
            option
        };
    }

    async deleteOption(option_id) {
        const option = await this.QuestionOption.findByPk(option_id);
        if (!option) throw new AppError("Option not found", 404);

        const question = await this.Question.findByPk(option.question_id);

        await option.destroy();

        return {
            message: "Option deleted successfully"
        };
    }

    async getOptionsByQuestion(question_id, survey) {
        const status = surveyService._getSurveyStatus(survey);
        if (status !== "ACTIVE") {
            throw new AppError(`Survey is ${status}`, 403);
        }
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const options = await this.QuestionOption.findAll({
            where: { question_id }
        });

        return {
            message: "Get options successfully",
            count: options.length,
            options
        };
    }

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