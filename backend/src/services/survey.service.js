import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { Op } from "sequelize";
import { sendInviteEmail } from "../utils/sendMail.js";
import sequelize from "../configs/db.config.js";
import _checkOwnerOrAdmin from "../utils/checkOwnerOrAdmin.js";

const ALLOWED_EDITOR_ROLES = ['respondent', 'viewer'];

class SurveyService {
    constructor() {
        this.Survey = models.Survey;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.User = models.User;
        this.SurveyParticipant = models.SurveyParticipant;
        this.SurveyAccess = models.SurveyAccess;
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
        if (survey.start_at && now < survey.start_at) return "SCHEDULED";
        if (survey.end_at && now > survey.end_at) return "EXPIRED";
        return "ACTIVE";
    }

    _validateTitle(title) {
        if (!title || !title.trim()) {
            throw new AppError("Title is required!", 400);
        }
    }

    _generateAccessToken() {
        return (
            Math.random()
                .toString(36)
                .substring(2, 15)
            +
            Math.random()
                .toString(36)
                .substring(2, 15)
        );
    }

    /**
     * URL người dùng mở trên trình duyệt (SPA).
     * FRONTEND_URL = gốc web (vd http://localhost:5173), khác BASE_URL (API) nếu tách cổng.
     */
    _shareSurveyPublicUrl(survey) {
        const id = survey.id;
        const token = survey.access_token;
        const front = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
        if (front) {
            return `${front}/user/survey/${id}?access_token=${encodeURIComponent(token)}`;
        }
        const apiBase = (process.env.BASE_URL || "").trim().replace(/\/$/, "");
        return `${apiBase}/surveys/${id}?access_token=${token}`;
    }

    // Create new survey
    async createSurvey(user, payload) {
        const { title, description, start_at, end_at } = payload;

        this._validateTitle(title);

        if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
            throw new AppError("end_at must be after start_at", 400);
        }

        const survey = await this.Survey.create({
            title: title.trim(),
            description: description?.trim() || null,
            created_by: user.id,
            start_at: start_at || null,
            end_at: end_at || null,
        });

        return {
            message: "Created survey successfully",
            survey: this._mapSurvey(survey),
        };
    }

    // get survey by id (with questions & options)
    async getSurveyById(user, survey_id, access_token = null) {
        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const survey = await this.Survey.findByPk(survey_id, {
            attributes: [
                "id",
                "title",
                "description",
                "start_at",
                "end_at",
                "created_at",
                "access_type",
                "created_by"
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

        if (status !== "ACTIVE" && survey.created_by !== user?.id) {
            throw new AppError(`Survey is ${status}`, 403);
        }

        return {
            message: "Get survey successfully!",
            survey: this._mapSurveyDetail(survey, status),
        };
    }

    // get surveys by user id 
    async getMySurveys(user, page = 1, limit = 10) {

        const { offset, limit: safeLimit, page: safePage } =
            this._sanitizePagination(page, limit);

        const surveys = await this.Survey.findAll({
            where: { created_by: user.id },
            attributes: [
                "id",
                "title",
                "start_at",
                "end_at",
                "created_at"
            ],
            offset,
            limit: safeLimit,
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

    // get surveys by user id (for admin)
    async getSurveyByUserId(user, page = 1, limit = 10) {
        const { offset, limit: safeLimit, page: safePage } =
            this._sanitizePagination(page, limit);

        const surveys = await this.Survey.findAll({
            where: { created_by: user.id },
            attributes: [
                "id",
                "title",
                "start_at",
                "end_at",
                "created_at"
            ],
            offset,
            limit: safeLimit,
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

    async getSurveyPublic() {
        const surveys = await this.Survey.findAll({
            where: { access_type: "PUBLIC" }
        });

        return {
            message: "Get public surveys successfully!",
            count: surveys.length,
            surveys: surveys.map(s => ({
                ...this._mapSurvey(s),
                status: this._getSurveyStatus(s)
            }))
        };
    }

    async updateSurvey(user, surveyId, payload) {
        const survey = await this.Survey.findByPk(surveyId);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        const { title, description, start_at, end_at } = payload;

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

        await survey.save();

        return {
            message: "Updated survey successfully",
            survey: this._mapSurvey(survey)
        };
    }

    async deleteSurveyById(surveyId, user) {
        const survey = await this.Survey.findByPk(surveyId);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        survey.destroy();

        return {
            message: "Deleted survey successfully"
        };
    }

    async closeSurvey(surveyId, user) {
        const survey = await this.Survey.findByPk(surveyId);
        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        survey.end_at = new Date();
        await survey.save();

        return {
            message: "Closed survey successfully",
            survey: this._mapSurvey(survey)
        };
    }

    async publicSurvey(surveyId, user) {
        const survey = await this.Survey.findByPk(surveyId);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        if (!_checkOwnerOrAdmin(user, survey)) {
            throw new AppError("You do not have permission to publish this survey", 403);
        }

        if (survey.access_type === "PUBLIC") {
            throw new AppError("Survey is already public", 400);
        }

        survey.access_type = "PUBLIC";
        await survey.save();

        return {
            message: "Published survey successfully",
            survey: this._mapSurvey(survey)
        };
    }

    async shareLink(surveyId, user) {
        const t = await sequelize.transaction();
        try {
            const survey = await this.Survey.findByPk(surveyId, { transaction: t });

            if (!survey) {
                throw new AppError("Survey not found", 404);
            }

            if (!_checkOwnerOrAdmin(user, survey)) {
                throw new AppError("You do not have permission to share this survey", 403);
            }

            // set access type
            if (survey.access_type !== "LINK") {
                survey.access_type = "LINK";
                await survey.save({ transaction: t });
            }

            // find or create access
            const [surveyAccess] = await this.SurveyAccess.findOrCreate({
                where: { survey_id: survey.id },
                defaults: {
                    access_token: this._generateAccessToken()
                },
                transaction: t
            });

            await t.commit();

            return {
                message: "Share link generated successfully",
                url: `${process.env.BASE_URL}/surveys/${survey.id}?access_token=${surveyAccess.access_token}`
            };

        } catch (error) {
            await t.rollback();
            throw error;
        }


        // chỉ owner hoặc admin mới được lấy link
        if (!_checkOwnerOrAdmin(user, survey)) {
            throw new AppError("You do not have permission to share this survey", 403);
        }

        // nếu chưa phải LINK → chuyển sang LINK
        if (survey.access_type !== "LINK") {
            survey.access_type = "LINK";
        }

        // nếu chưa có token → generate
        if (!survey.access_token) {
            survey.access_token = this._generateAccessToken();
        }

        await survey.save();

        return {
            message: "Share link generated successfully",
            url: this._shareSurveyPublicUrl(survey)
        };
}

    async inviteSurvey(surveyId, user, payload) {
        const { email, role = "respondent" } = payload;
        if (!email) {
            throw new AppError("Email required", 403);
        }

        const survey = await this.Survey.findByPk(surveyId);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        // editor chi co the moi voi vai tro la viewer hoac responsdent
        if(!_checkOwnerOrAdmin(user, survey)) {
            if( !ALLOWED_EDITOR_ROLES.includes(role)) {
                throw new AppError("Editor can only invite respondent or viewer", 404);
            }
        }
        
        // chỉ dùng cho PRIVATE
        if (survey.access_type !== "PRIVATE") {
            throw new AppError("Invite only works for PRIVATE survey", 400);
        }
        
        // check tồn tại user (optional)
        const existingUser = await this.User.findOne({ where: { email } });

        // check đã tồn tại participant chưa
        const existingParticipant = await this.SurveyParticipant.findOne({
            where: {
                survey_id: survey.id,
                email: email
            }
        });

        if (existingParticipant) {
            throw new AppError("User already invited", 400);
        }

        const participant = await this.SurveyParticipant.create({
            survey_id: survey.id,
            user_id: existingUser?.id || null,
            email: email,
            role: role
        });

        // send email invite
        await sendInviteEmail({
            to: email,
            surveyTitle: survey.title,
            surveyLink: `${process.env.BASE_URL}/surveys/${survey.id}`,
            senderName: user.name,
            senderEmail: user.email,
        });

        return {
            message: "User invited successfully",
            participant
        };
    }

    async bulkInvite(surveyId, user, payload) {
        const { emails = [], role = "respondent" } = payload;

        // validate role
        const VALID_ROLES = ["viewer", "editor", "respondent"];
        if (!VALID_ROLES.includes(role)) {
            throw new AppError("Invalid role", 400);
        }

        if (!Array.isArray(emails) || emails.length === 0) {
            throw new AppError("Emails must be a non-empty array", 400);
        }

        const survey = await this.Survey.findByPk(surveyId);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        // if is editor cant invite editor
        if(!_checkOwnerOrAdmin(user, survey)) {
            if( !ALLOWED_EDITOR_ROLES.includes(role)) {
                throw new AppError("Editor can only invite respondent or viewer", 404);
            }
        }

        if (survey.access_type !== "PRIVATE") {
            throw new AppError("Bulk invite only works for PRIVATE survey", 400);
        }

        // tìm user đã tồn tại
        const users = await this.User.findAll({
            where: { email: emails }
        });

        const userMap = Object.fromEntries(users.map(u => [u.email, u]));

        // tìm participant đã tồn tại
        const existingParticipants = await this.SurveyParticipant.findAll({
            where: {
                survey_id: survey.id,
                email: emails
            }
        });

        const existingEmails = new Set(existingParticipants.map(p => p.email));

        // lọc email hợp lệ để insert
        const toCreate = emails
            .filter(email => !existingEmails.has(email))
            .map(email => ({
                survey_id: survey.id,
                email,
                user_id: userMap[email]?.id || null,
                role
            }));

        // bulk insert
        const created = await this.SurveyParticipant.bulkCreate(toCreate);

        // gửi email mời
        const emailPromises = toCreate.map((p) =>
            sendInviteEmail({
                to: p.email,
                surveyTitle: survey.title,
                surveyLink: `${process.env.BASE_URL}/surveys/${survey.id}`,
                senderName: user.name,
                senderEmail: user.email,
            }),
        );

        const results = await Promise.allSettled(emailPromises);

        const success = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        return {
            message: "Bulk invite processed",
            total: emails.length,
            created: created.length,
            skipped: existingEmails.size,
            success,
            failed
        };
    }

    async getParticipants(surveyId, user) {
        const survey = await this.Survey.findByPk(surveyId);
        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        if (!_checkOwnerOrAdmin(user, survey)) {
            throw new AppError("You do not have permission", 403);
        }

        const { rows, count } = await this.SurveyParticipant.findAndCountAll({
            where: { survey_id: survey.id },
            attributes: ["id", "email", "role", "created_at"],
            include: [
                {
                    model: this.User,
                    as: "user",
                    attributes: ["id", "full_name", "email"]
                }
            ]
        });

        const participants = rows.map(p => {
            if (p.user && p.email === p.user.email) {
                return {
                    participant_id: p.id,
                    id: p.user.id,
                    name: p.user.name,
                    email: p.user.email,
                    role: p.role,
                    created_at: p.created_at
                };
            }

            return {
                participant_id: p.id,
                id: null,
                name: null,
                email: p.email,
                role: p.role,
                created_at: p.created_at
            };
        });

        return {
            participants,
            count
        };
    }

    // delete participant
    async deleteParticipant(surveyId, participantId, user) {
        const survey = await this.Survey.findByPk(surveyId);

        if (!survey) {
            throw new AppError("Survey not found", 404);
        }

        if (!_checkOwnerOrAdmin(user, survey)) {
            throw new AppError("You do not have permission", 403);
        }

        const participant = await this.SurveyParticipant.findOne({
            where: {
                id: participantId,
                survey_id: survey.id
            }
        });

        if (!participant) {
            throw new AppError("Participant not found", 404);
        }

        await participant.destroy();

        return {
            message: "Participant removed successfully"
        };
    }

    async getInvitedSurveys(user, { page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;

        const { rows, count } = await this.SurveyParticipant.findAndCountAll({
            where: {
                [this.Op.or]: [
                    { user_id: user.id },
                    { email: user.email }
                ]
            },
            include: [
                {
                    model: this.Survey,
                    as: "survey",
                    where: {
                        access_type: "PRIVATE"
                    },
                    attributes: [
                        "id",
                        "title",
                        "description",
                        "created_at",
                        "created_by",
                        "start_at",
                        "end_at"
                    ]
                }
            ],
            limit,
            offset,
            order: [["created_at", "DESC"]]
        });

        const surveys = rows.map(row => {
            const s = row.survey;
            return {
                id: s.id,
                title: s.title,
                description: s.description,
                createdAt: s.created_at,
                createdBy: s.created_by,
                startAt: s.start_at,
                endAt: s.end_at,
                invitedAt: row.created_at
            };
        });


        return {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            data: surveys
        };
    }

    // mapping functions
    _mapSurvey(survey) {
        return {
            id: survey.id,
            title: survey.title,
            description: survey.description,
            start_at: survey.start_at,
            end_at: survey.end_at,
            created_at: survey.created_at
        };
    }

    _mapSurveyDetail(survey, status) {
        return {
            ...this._mapSurvey(survey),
            status,
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