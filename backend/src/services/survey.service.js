import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class SurveyService {
    constructor() {
        this.Survey = models.Survey;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.User = models.User;
    }

    _sanitizePagination(page, limit) {
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

        return {
            page: safePage,
            limit: safeLimit,
            offset: (safePage - 1) * safeLimit
        };
    }

    _getSurveyStatus(survey) {
        const now = new Date();

        if (!survey.is_published) return "DRAFT";
        if (survey.start_at && now < survey.start_at) return "SCHEDULED";
        if (survey.end_at && now > survey.end_at) return "EXPIRED";

        return "ACTIVE";
    }

    _canModifySurvey(survey, user) {
        return survey.created_by === user.id || user.role === "ADMIN";
    }

    _ensureOwnership(survey, user) {
        if (!this._canModifySurvey(survey, user)) {
            throw new AppError("Forbidden", 403);
        }
    }

    _validateTitle(title) {
        if (!title || !title.trim()) {
            throw new AppError("Title is required!", 400);
        }
    }

    // Create new survey
    async createSurvey(userId, payload) {
        const { title, description, start_at, end_at } = payload;

        this._validateTitle(title);

        if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
            throw new AppError("end_at must be after start_at", 400);
        }

        const survey = await this.Survey.create({
            title: title.trim(),
            description: description?.trim() || null,
            created_by: userId,
            start_at: start_at || null,
            end_at: end_at || null
        });

        return {
            message: "Created survey successfully",
            survey: this._mapSurvey(survey)
        };
    }

    // get survey by id (with questions & options)
    async getSurveyById(survey_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const survey = await this.Survey.findByPk(survey_id, {
            attributes: [
                "id",
                "title",
                "description",
                "is_published",
                "start_at",
                "end_at",
                "created_at"
            ],
            include: [
                {
                    model: this.Question,
                    as: "questions",
                    attributes: [
                        "id",
                        "content",
                        "order_index",
                        "type",
                        "required"
                    ],
                    separate: false,
                    order: [["order_index", "ASC"]],
                    include: [
                        {
                            model: this.QuestionOption,
                            as: "options",
                            attributes: ["id", "label", "value", "order_index"]
                        }
                    ]
                }
            ]
        });

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        const status = this._getSurveyStatus(survey);
        if (status !== "ACTIVE") {
            throw new AppError(`Survey is ${status}`, 403);
        }

        return {
            message: "Get survey successfully!",
            survey: this._mapSurveyDetail(survey, status)
        };
    }

    // get surveys by user id
    async getSurveyByUserId(user_id) {
        if (!user_id) {
            throw new AppError("User id is required!", 400);
        }

        const surveys = await this.Survey.findAll({
            where: { created_by: user_id },
            attributes: [
                "id",
                "title",
                "is_published",
                "start_at",
                "end_at",
                "created_at"
            ],
            order: [["created_at", "DESC"]]
        });

        return {
            message: "Get surveys successfully!",
            count: surveys.length,
            surveys: surveys.map(s => ({
                ...this._mapSurvey(s),
                status: this._getSurveyStatus(s)
            }))
        };
    }

    // get all surveys (for admin)
    async getAllSurvey(page = 1, limit = 10) {
        const { offset, limit: safeLimit, page: safePage } =
            this._sanitizePagination(page, limit);

        const { count, rows } = await this.Survey.findAndCountAll({
            attributes: [
                "id",
                "title",
                "is_published",
                "created_at"
            ],
            offset,
            limit: safeLimit,
            order: [["created_at", "DESC"]]
        });

        return {
            message: "Get surveys successfully!",
            count,
            surveys: rows.map(s => ({
                ...this._mapSurvey(s),
                status: this._getSurveyStatus(s)
            })),
            page: safePage,
            totalPages: Math.ceil(count / safeLimit)
        };
    }

    // update survey
    async updateSurvey(survey_id, user_id, payload) {
        const { title, description, start_at, end_at, is_published } = payload;

        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        const user = await this.User.findByPk(user_id);

        if (!user) {
            throw new AppError("User not found!", 404);
        }

        this._ensureOwnership(survey, user);

        if (title !== undefined) {
            this._validateTitle(title);
            survey.title = title.trim();
        }

        if (description !== undefined) {
            survey.description = description?.trim() || null;
        }

        if (start_at !== undefined) {
            survey.start_at = start_at;
        }

        if (end_at !== undefined) {
            if (survey.start_at && new Date(end_at) <= new Date(survey.start_at)) {
                throw new AppError("end_at must be after start_at", 400);
            }
            survey.end_at = end_at;
        }

        if (is_published !== undefined) {
            survey.is_published = is_published;
        }

        await survey.save();

        return {
            message: "Updated survey successfully",
            survey: this._mapSurvey(survey)
        };
    }

    // delete survey
    async deleteSurvey(survey_id, user_id) {
        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        const user = await this.User.findByPk(user_id);

        if (!user) {
            throw new AppError("User not found!", 404);
        }

        this._ensureOwnership(survey, user);

        await survey.destroy();

        return {
            message: "Deleted survey successfully"
        };
    }

    // close survey (set end_at to now)
    async closeSurvey(survey_id, user_id) {
        const survey = await this.Survey.findByPk(survey_id);
        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }
        const user = await this.User.findByPk(user_id);
        if (!user) {
            throw new AppError("User not found!", 404);
        }
        this._ensureOwnership(survey, user);

        survey.end_at = new Date();
        await survey.save();
        return {
            message: "Closed survey successfully",
            survey: this._mapSurvey(survey)
        };
    }

    // mapping functions
    _mapSurvey(survey) {
        return {
            id: survey.id,
            title: survey.title,
            is_published: survey.is_published,
            start_at: survey.start_at,
            end_at: survey.end_at,
            created_at: survey.created_at
        };
    }

    _mapSurveyDetail(survey, status) {
        return {
            ...this._mapSurvey(survey),
            status,
            description: survey.description,
            questions: survey.questions.map(q => ({
                id: q.id,
                content: q.content,
                type: q.type,
                required: q.required,
                order_index: q.order_index,
                options: q.options?.map(o => ({
                    id: o.id,
                    label: o.label,
                    value: o.value,
                    order_index: o.order_index
                })) || []
            }))
        };
    }
}

export default new SurveyService();