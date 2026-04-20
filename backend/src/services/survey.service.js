import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class SurveyService {
    constructor() {
        this.Survey = models.Survey;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
    }

    // Create Survey
    async createSurvey(userId, title, description) {
        if (!title || !title.trim()) {
            throw new AppError("Title is required!", 400);
        }

        const survey = await this.Survey.create({
            title: title.trim(),
            description: description?.trim() || null,
            created_by: userId
        });

        return {
            message: "Created survey successfully",
            survey
        };
    }

    // Get survey by id (FULL DATA)
    async getSurveyById(survey_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const survey = await this.Survey.findByPk(survey_id, {
            include: [
                {
                    model: this.Question,
                    as: "questions",
                    include: [
                        {
                            model: this.QuestionOption,
                            as: "options"
                        }
                    ],
                    order: [["order_index", "ASC"]]
                }
            ]
        });

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        return {
            message: "Get survey successfully!",
            survey
        };
    }

    // Get surveys by user
    async getSurveyByUserId(user_id) {
        if (!user_id) {
            throw new AppError("User id is required!", 400);
        }

        const surveys = await this.Survey.findAll({
            where: { created_by: user_id },
            order: [["created_at", "DESC"]]
        });

        return {
            message: "Get surveys by user successfully!",
            count: surveys.length,
            surveys
        };
    }

    // Delete survey (ownership check)
    async deleteSurvey(survey_id, user_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        if (survey.created_by !== user_id) {
            throw new AppError("Forbidden", 403);
        }

        await survey.destroy();

        return {
            message: "Deleted survey successfully"
        };
    }

    // Get all surveys (pagination)
    async getAllSurvey(page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const { count, rows } = await this.Survey.findAndCountAll({
            offset,
            limit,
            order: [["created_at", "DESC"]]
        });

        return {
            message: "Get surveys successfully!",
            count,
            surveys: rows,
            page,
            totalPages: Math.ceil(count / limit)
        };
    }

    // Update survey
    async updateSurvey(survey_id, user_id, payload) {
        const { title, description } = payload;

        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        if (survey.created_by !== user_id) {
            throw new AppError("Forbidden", 403);
        }

        if (title) {
            survey.title = title.trim();
        }

        if (description !== undefined) {
            survey.description = description?.trim() || null;
        }

        await survey.save();

        return {
            message: "Updated survey successfully",
            survey
        };
    }
}

export default new SurveyService();