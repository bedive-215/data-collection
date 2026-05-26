import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { getSurveyStatus } from "../domain/survey.domain.js";
import { normalizeValue } from "../helpers/option.helper.js";

const UPDATABLE_FIELDS = ["label", "value", "order_index", "is_other", "image_url", "media_type"];

class QuestionOptionService {
    constructor() {
        const { Question, QuestionOption, Survey, SurveyParticipant } = models;
        Object.assign(this, { Question, QuestionOption, Survey, SurveyParticipant });
    }

    async _findQuestionOrFail(question_id) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);
        return question;
    }

    async _findOptionOrFail(option_id) {
        const option = await this.QuestionOption.findByPk(option_id);
        if (!option) throw new AppError("Option not found", 404);
        return option;
    }

    _assertNotTextType(question) {
        if (question.type === "TEXT") throw new AppError("TEXT question cannot have options", 400);
    }

    _cleanOption(opt) {
        if (typeof opt === "string") {
            const label = opt.trim();
            return label ? { label, value: normalizeValue(label) } : null;
        }
        if (typeof opt === "object" && opt?.label) {
            return { label: opt.label.trim(), value: opt.value?.trim() || normalizeValue(opt.label.trim()) };
        }
        return null;
    }

    async createOption(question_id, payload) {
        if (!question_id) throw new AppError("Question id is required", 400);

        const { label, value, order_index, is_other, image_url, media_type } = payload;
        if (!label) throw new AppError("Label is required", 400);

        const question = await this._findQuestionOrFail(question_id);
        this._assertNotTextType(question);

        const option = await this.QuestionOption.create({
            question_id,
            label,
            value: value || normalizeValue(label),
            order_index: order_index ?? 0,
            is_other: is_other ?? false,
            image_url: image_url || null,
            media_type: media_type || null,
        });

        return { message: "Option created successfully", option };
    }

    async updateOption(option_id, payload) {
        const option = await this._findOptionOrFail(option_id);

        if (UPDATABLE_FIELDS.every(f => payload[f] === undefined)) {
            throw new AppError("No data provided to update", 400);
        }

        const { label, value, order_index, is_other, image_url, media_type } = payload;

        if (label !== undefined)       option.label = label;
        if (value !== undefined)       option.value = value;
        if (order_index !== undefined) option.order_index = order_index;
        if (is_other !== undefined)    option.is_other = is_other;
        if (image_url !== undefined)   option.image_url = image_url || null;
        if (media_type !== undefined)  option.media_type = media_type || null;

        await option.save();
        return { message: "Option updated successfully", option };
    }

    async deleteOption(option_id) {
        const option = await this._findOptionOrFail(option_id);
        await option.destroy();
        return { message: "Option deleted successfully" };
    }

    async bulkCreateOptions(question_id, options) {
        if (!question_id) throw new AppError("Question id is required", 400);
        if (!Array.isArray(options) || !options.length) throw new AppError("Options must be a non-empty array", 400);

        const question = await this._findQuestionOrFail(question_id);
        this._assertNotTextType(question);

        const uniqueOptions = [
            ...new Map(
                options.map(o => this._cleanOption(o)).filter(Boolean).map(o => [o.value, o])
            ).values()
        ];

        const existing = await this.QuestionOption.findAll({
            where: { question_id, label: uniqueOptions.map(o => o.label) },
        });
        const existingLabels = new Set(existing.map(o => o.label));

        const toCreate = uniqueOptions.filter(opt => !existingLabels.has(opt.label));
        if (!toCreate.length) throw new AppError("All options already exist", 400);

        const createdOptions = await this.QuestionOption.bulkCreate(
            toCreate.map((opt, idx) => ({ question_id, label: opt.label, value: opt.value, order_index: idx }))
        );

        return { message: "Bulk create options successfully", count: createdOptions.length, options: createdOptions };
    }


    async getOptionsByQuestion(question_id, survey) {
        const status = getSurveyStatus(survey);
        if (status !== "ACTIVE") throw new AppError(`Survey is ${status}`, 403);

        const question = await this._findQuestionOrFail(question_id);

        const options = await this.QuestionOption.findAll({
            where: { question_id },
            attributes: ["id", "label", "value", "order_index", "is_other", "image_url", "media_type"],
        });

        return {
            message: "Get options successfully",
            count: options.length,
            options: options
                .map(o => ({
                    id: o.id,
                    label: o.label,
                    value: o.value,
                    order_index: o.order_index,
                    is_other: o.is_other ?? false,
                    image_url: o.image_url ?? null,
                    media_type: o.media_type ?? null,
                }))
                .sort((a, b) => a.order_index - b.order_index),
        };
    }
}

export default new QuestionOptionService();