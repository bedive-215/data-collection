import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { Op } from "sequelize";

import _checkOwnerOrAdmin from "../utils/checkOwnerOrAdmin.js";
import { sanitizePagination } from "../utils/pagination.js";
import { generateSurveyAccessToken } from "../utils/token.js";
import { buildSurveyPublicUrl } from "../utils/surveyUrl.js";

import { getSurveyStatus } from "../domain/survey.domain.js";
import { mapSurveyDetail, mapSurvey } from "../mappers/survey.mapper.js";

import eventBus from "../events/eventBus.js";
import { SURVEY_EVENTS } from "../events/survey/survey.events.js";
import { START_EVENTS } from "../events/start/start.event.js";
import { ACHIEVEMENT_EVENTS } from "../events/achivenent/achivement.event.js";

import { emailQueue } from "../queues/email.queue.js";

const ALLOWED_EDITOR_ROLES = ["viewer", "respondent"];
const VALID_INVITE_ROLES = ["viewer", "editor", "respondent"];

class SurveyService {
    constructor() {
        const { Survey, Question, QuestionOption, User, SurveyParticipant, SurveyAccess, Section } = models;
        Object.assign(this, { Survey, Question, QuestionOption, User, SurveyParticipant, SurveyAccess, Section });
    }

    _validateTitle(title) {
        if (!title || !title.trim()) throw new AppError("Title is required!", 400);
    }

    _validateDates(start_at, end_at) {
        if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
            throw new AppError("end_at must be after start_at", 400);
        }
    }

    _validateTimeLimit(time_limit_seconds) {
        if (time_limit_seconds !== undefined && time_limit_seconds !== null && time_limit_seconds < 30) {
            throw new AppError("time_limit_seconds must be at least 30", 400);
        }
    }

    async _loadParticipantsMap(surveyIds) {
        if (!surveyIds.length) return {};
        const rows = await this.SurveyParticipant.findAll({
            where: { survey_id: surveyIds },
            attributes: ["id", "survey_id", "email", "role", "user_id"],
            include: [{ model: this.User, as: "user", attributes: ["id", "full_name", "email", "avatar"] }],
            order: [["created_at", "ASC"]],
        });
        return rows.reduce((map, p) => {
            (map[p.survey_id] ??= []).push({
                id: p.user?.id ?? null,
                name: p.user?.full_name ?? null,
                email: p.email,
            });
            return map;
        }, {});
    }

    async createSurvey(user, payload) {
        const {
            title, description, start_at, end_at,
            is_anonymous, max_responses, randomize_questions,
            randomize_options, time_limit_seconds, show_progress_bar,
            allow_back, one_question_per_page, thank_you_message,
            logo_url, background_url, accent_color, show_correct_answers,
        } = payload;

        this._validateTitle(title);
        this._validateDates(start_at, end_at);
        this._validateTimeLimit(time_limit_seconds);

        const survey = await this.Survey.create({
            title: title.trim(),
            description: description?.trim() || null,
            created_by: user.id,
            start_at: start_at || null,
            end_at: end_at || null,
            is_anonymous: is_anonymous ?? false,
            max_responses: max_responses ?? null,
            randomize_questions: randomize_questions ?? false,
            randomize_options: randomize_options ?? false,
            time_limit_seconds: time_limit_seconds ?? null,
            show_progress_bar: show_progress_bar ?? true,
            allow_back: allow_back ?? true,
            one_question_per_page: one_question_per_page ?? true,
            thank_you_message: thank_you_message || null,
            logo_url: logo_url || null,
            background_url: background_url || null,
            accent_color: accent_color || "#6366f1",
            show_correct_answers: show_correct_answers ?? false,
        });

        // Emit events for starting survey and unlocking achievement
        eventBus.emit(START_EVENTS.STARTED, { userId: user.id, surveyId: survey.id });
        eventBus.emit(ACHIEVEMENT_EVENTS.UNLOCKED, { userId: user.id, achievementKey: "survey_created", data: { survey_id: survey.id } });

        return { message: "Created survey successfully", survey: mapSurvey(survey) };
    }

    async getSurveyById(user, survey_id, access_token = null) {
        if (!survey_id) throw new AppError("Survey id is required!", 400);

        const survey = await this.Survey.findByPk(survey_id, {
            include: [
                { model: this.Question, as: "questions", include: [{ model: this.QuestionOption, as: "options" }] },
                { model: this.Section, as: "sections", include: [{ model: this.Question, as: "questions" }], order: [["order_index", "ASC"]] },
            ],
        });

        if (!survey) throw new AppError("Survey not found!", 404);

        const status = getSurveyStatus(survey);

        if (status !== "ACTIVE") {
            throw new AppError(`Survey is ${status}`, 403);
        }

        return { message: "Get survey successfully!", survey: mapSurveyDetail(survey, status) };
    }

    async updateSurvey(user, survey, payload) {
        if (!survey) throw new AppError("Survey not found", 404);

        const {
            title, description, start_at, end_at,
            is_anonymous, max_responses, randomize_questions,
            randomize_options, time_limit_seconds, show_progress_bar,
            allow_back, one_question_per_page, thank_you_message,
            logo_url, background_url, accent_color, show_correct_answers,
        } = payload;

        if (title !== undefined) { this._validateTitle(title); survey.title = title.trim(); }
        if (description !== undefined) survey.description = description?.trim() || null;
        if (start_at !== undefined) survey.start_at = start_at;
        if (end_at !== undefined) {
            if (survey.start_at && new Date(end_at) <= new Date(survey.start_at)) {
                throw new AppError("end_at must be after start_at", 400);
            }
            survey.end_at = end_at;
        }
        if (is_anonymous !== undefined) survey.is_anonymous = is_anonymous;
        if (max_responses !== undefined) survey.max_responses = max_responses;
        if (randomize_questions !== undefined) survey.randomize_questions = randomize_questions;
        if (randomize_options !== undefined) survey.randomize_options = randomize_options;
        if (time_limit_seconds !== undefined) {
            this._validateTimeLimit(time_limit_seconds);
            survey.time_limit_seconds = time_limit_seconds;
        }
        if (show_progress_bar !== undefined) survey.show_progress_bar = show_progress_bar;
        if (allow_back !== undefined) survey.allow_back = allow_back;
        if (one_question_per_page !== undefined) survey.one_question_per_page = one_question_per_page;
        if (thank_you_message !== undefined) survey.thank_you_message = thank_you_message || null;
        if (logo_url !== undefined) survey.logo_url = logo_url || null;
        if (background_url !== undefined) survey.background_url = background_url || null;
        if (accent_color !== undefined) survey.accent_color = accent_color || "#6366f1";
        if (show_correct_answers !== undefined) survey.show_correct_answers = show_correct_answers;

        await survey.save();
        return { message: "Updated survey successfully", survey: mapSurvey(survey) };
    }

    async deleteSurveyById(survey, user) {
        if (!survey) throw new AppError("Survey not found", 404);

        if (survey.created_by === user.id) {
            eventBus.emit(START_EVENTS.DELETED, { owner: survey.created_by, surveyId: survey.id });
            eventBus.emit(SURVEY_EVENTS.DELETED, { survey, deleter: user });
        }

        await survey.destroy();
        return { message: "Deleted survey successfully" };
    }

    // base survey query with optional participant loading
    async _getSurveysByUser(user, page, limit, { withParticipants = false } = {}) {
        const { offset, limit: safeLimit, page: safePage } = sanitizePagination(page, limit);

        const surveys = await this.Survey.findAll({
            where: { created_by: user.id },
            attributes: ["id", "title", "start_at", "end_at", "created_at"],
            offset,
            limit: safeLimit,
            order: [["created_at", "DESC"]],
        });

        const participantsMap = withParticipants
            ? await this._loadParticipantsMap(surveys.map(s => s.id))
            : {};

        return {
            message: "Get surveys successfully!",
            count: surveys.length,
            surveys: surveys.map(s => ({
                ...mapSurvey(s),
                status: getSurveyStatus(s),
                ...(withParticipants && { participants: participantsMap[s.id] || [] }),
            })),
        };
    }

    async getMySurveys(user, page = 1, limit = 10) {
        return this._getSurveysByUser(user, page, limit, { withParticipants: true });
    }

    async getSurveyByUserId(user, page = 1, limit = 10) {
        return this._getSurveysByUser(user, page, limit);
    }

    async getAllSurvey(page = 1, limit = 100) {
        const { offset, limit: safeLimit, page: safePage } = sanitizePagination(page, limit);

        const { count, rows } = await this.Survey.findAndCountAll({
            attributes: ["id", "title", "description", "start_at", "end_at", "access_type", "created_at", "created_by"],
            include: [{ model: this.User, as: "creator", attributes: ["id", "full_name", "email", "avatar"] }],
            offset,
            limit: safeLimit,
            order: [["created_at", "DESC"]],
        });

        return {
            message: "Get surveys successfully!",
            count,
            page: safePage,
            totalPages: Math.ceil(count / safeLimit),
            surveys: rows.map(s => ({
                ...mapSurvey(s),
                access_type: s.access_type,
                created_by: s.created_by,
                creator: s.creator
                    ? { id: s.creator.id, full_name: s.creator.full_name, email: s.creator.email, avatar: s.creator.avatar }
                    : null,
                status: getSurveyStatus(s),
            })),
        };
    }

    async getSurveyPublic() {
        const surveys = await this.Survey.findAll({ where: { access_type: "PUBLIC" } });
        const participantsMap = await this._loadParticipantsMap(surveys.map(s => s.id));

        return {
            message: "Get public surveys successfully!",
            count: surveys.length,
            surveys: surveys.map(s => ({
                ...mapSurvey(s),
                status: getSurveyStatus(s),
                participants: participantsMap[s.id] || [],
            })),
        };
    }

    async extendDeadline(survey, user, payload) {
        const { new_end_at } = payload;

        if (!new_end_at) throw new AppError("new_end_at is required", 400);

        const newDate = new Date(new_end_at);
        if (newDate <= new Date()) throw new AppError("new_end_at must be in the future", 400);
        if (survey.start_at && newDate <= survey.start_at) throw new AppError("new_end_at must be after start_at", 400);

        survey.end_at = newDate;
        survey.notified_expired = false;
        await survey.save();

        return { message: "Survey deadline extended successfully", survey: mapSurvey(survey) };
    }

    async closeSurvey(survey, user) {
        survey.end_at = new Date();
        await survey.save();
        eventBus.emit(SURVEY_EVENTS.CLOSED, { survey });
        return { message: "Closed survey successfully", survey: mapSurvey(survey) };
    }

    async publicSurvey(survey, user) {
        if (survey.access_type === "PUBLIC") throw new AppError("Survey is already public", 400);
        survey.access_type = "PUBLIC";
        await survey.save();
        return { message: "Published survey successfully", survey: mapSurvey(survey) };
    }

    async shareLink(survey, user) {
        if (survey.access_type !== "LINK") survey.access_type = "LINK";
        if (!survey.access_token) survey.access_token = generateSurveyAccessToken();

        await survey.save();
        return { message: "Share link generated successfully", url: buildSurveyPublicUrl(survey) };
    }

    // invite participant to survey (owner)
    async inviteSurvey(survey, user, payload) {
        const { email, role = "viewer" } = payload;
        if (!email) throw new AppError("Email required", 400);
        if (!VALID_INVITE_ROLES.includes(role)) throw new AppError("Invalid role. Must be viewer or editor", 400);
        if (!_checkOwnerOrAdmin(user, survey) && !ALLOWED_EDITOR_ROLES.includes(role)) {
            throw new AppError("Only owner or admin can invite participants with this role", 403);
        }

        if (survey.access_type !== "PRIVATE") throw new AppError("Invite only works for PRIVATE survey", 400);

        const existingUser = await this.User.findOne({ where: { email } });
        if (!existingUser) throw new AppError(`User with email ${email} does not exist`, 400);

        const existing = await this.SurveyParticipant.findOne({ where: { survey_id: survey.id, email } });
        if (existing) throw new AppError("User already invited", 409);

        const participant = await this.SurveyParticipant.create({
            survey_id: survey.id,
            user_id: existingUser.id,
            email: existingUser.email,
            role,
        });

        await emailQueue.add("invite-email", {
            to: email,
            surveyTitle: survey.title,
            surveyLink: `${process.env.FRONTEND_URL}/user/survey/${survey.id}`,
            senderName: user.full_name,
            senderEmail: user.email,
        });

        eventBus.emit(SURVEY_EVENTS.INVITATION, { survey, inviteeEmail: email, inviter: user, role });

        return { message: "User invited successfully", participant };
    }

    async bulkInvite(survey, user, payload) {
        const { emails = [], role = "viewer" } = payload;
        if (!VALID_INVITE_ROLES.includes(role)) throw new AppError("Invalid role. Must be viewer or editor", 400);
        if (!_checkOwnerOrAdmin(user, survey) && !ALLOWED_EDITOR_ROLES.includes(role)) {
            throw new AppError("Only owner or admin can invite participants with this role", 403);
        }
        if (!Array.isArray(emails) || emails.length === 0) throw new AppError("Emails must be a non-empty array", 400);

        if (survey.access_type !== "PRIVATE") throw new AppError("Bulk invite only works for PRIVATE survey", 400);

        const [users, existingParticipants] = await Promise.all([
            this.User.findAll({ where: { email: emails } }),
            this.SurveyParticipant.findAll({ where: { survey_id: survey.id, email: emails } }),
        ]);

        const userMap = Object.fromEntries(users.map(u => [u.email, u]));
        const existingEmails = new Set(existingParticipants.map(p => p.email));

        const toCreate = emails
            .filter(email => !existingEmails.has(email))
            .map(email => ({ survey_id: survey.id, email, user_id: userMap[email]?.id || null, role }));

        const created = await this.SurveyParticipant.bulkCreate(toCreate);

        await emailQueue.addBulk(
            toCreate.map(p => ({
                name: "invite-email",
                data: {
                    to: p.email,
                    surveyTitle: survey.title,
                    surveyLink: `${process.env.FRONTEND_URL}/survey/${survey.id}`,
                    senderName: user.full_name,
                    senderEmail: user.email,
                },
            }))
        );

        return { message: "Bulk invite processed", total: emails.length, created: created.length, skipped: existingEmails.size };
    }

    async getParticipants(survey, user) {
        const { rows, count } = await this.SurveyParticipant.findAndCountAll({
            where: { survey_id: survey.id },
            attributes: ["id", "email", "role", "created_at"],
            include: [{ model: this.User, as: "user", attributes: ["id", "full_name", "email"] }],
        });

        const participants = rows.map(p => ({
            participant_id: p.id,
            id: p.user?.id ?? null,
            name: p.user?.full_name ?? null,
            email: p.email,
            role: p.role,
            created_at: p.created_at,
        }));

        return { participants, count };
    }

    async deleteParticipant(survey, participantId, user) {
        const participant = await this.SurveyParticipant.findOne({ where: { id: participantId, survey_id: survey.id } });
        if (!participant) throw new AppError("Participant not found", 404);

        await participant.destroy();
        return { message: "Participant removed successfully" };
    }

    async getInvitedSurveys(user, { page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;

        const { rows, count } = await this.SurveyParticipant.findAndCountAll({
            where: { [Op.or]: [{ user_id: user.id }, { email: user.email }] },
            include: [{
                model: this.Survey,
                as: "survey",
                where: { access_type: "PRIVATE" },
                attributes: ["id", "title", "description", "created_at", "created_by", "start_at", "end_at"],
            }],
            limit,
            offset,
            order: [["created_at", "DESC"]],
        });

        const surveys = rows.map(row => {
            const s = row.survey;
            return { id: s.id, title: s.title, description: s.description, created_at: s.created_at, created_by: s.created_by, start_at: s.start_at, end_at: s.end_at, invitedAt: row.created_at };
        });

        return { total: count, page, totalPages: Math.ceil(count / limit), data: surveys };
    }
}

export default new SurveyService();