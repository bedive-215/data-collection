import QuestionOptionService from "../services/option.service.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class QuestionOptionController {

    // Create option
    async createOption(req, res, next) {
        try {
            const { question_id } = req.params;
            const { content } = req.body;

            if (!content || !content.trim()) {
                throw new AppError("Content is required", 400);
            }

            const result = await QuestionOptionService.createOption(
                question_id,
                content.trim()
            );

            return res.status(201).json({
                message: result.message,
                data: result.option
            });
        } catch (err) {
            next(err);
        }
    }

    // Get options by question
    async getOptionsByQuestion(req, res, next) {
        try {
            const { question_id } = req.params;

            const result =
                await QuestionOptionService.getOptionsByQuestion(
                    question_id
                );

            return res.status(200).json({
                message: result.message,
                count: result.count,
                data: result.options
            });
        } catch (err) {
            next(err);
        }
    }

    // Update option
    async updateOption(req, res, next) {
        try {
            const { option_id } = req.params;
            const { content } = req.body;

            if (!content || !content.trim()) {
                throw new AppError("Content is required", 400);
            }

            const result = await QuestionOptionService.updateOption(
                option_id,
                content.trim()
            );

            return res.status(200).json({
                message: result.message,
                data: result.option
            });
        } catch (err) {
            next(err);
        }
    }

    // Delete option
    async deleteOption(req, res, next) {
        try {
            const { option_id } = req.params;

            const result = await QuestionOptionService.deleteOption(
                option_id
            );

            return res.status(200).json({
                message: result.message
            });
        } catch (err) {
            next(err);
        }
    }

    // Bulk create options
    async bulkCreateOptions(req, res, next) {
        try {
            const { question_id } = req.params;
            const { options } = req.body;

            const result = await QuestionOptionService.bulkCreateOptions(
                question_id,
                options
            );

            return res.status(201).json({
                message: result.message,
                count: result.count,
                data: result.options
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new QuestionOptionController();