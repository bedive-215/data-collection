import { Op, fn, col, literal } from "sequelize";
import models from "#models/index.js";
import { AppError } from "#middlewares/handleException.middlware.js";

class AdminStatsService {
    constructor() {
        this.User = models.User;
        this.Survey = models.Survey;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Answer = models.Answer;
        this.Response = models.Response;
    }

    // ─── helpers ────────────────────────────────────────────────
    _dateRange(period) {
        const start = new Date();
        if (period === "month") start.setMonth(start.getMonth() - 29);
        else if (period === "year") start.setFullYear(start.getFullYear() - 11);
        else start.setDate(start.getDate() - 6);
        return start;
    }

    _dateTrunc(period, colName = "created_at") {
        if (period === "month") return `DATE(${colName})`;
        if (period === "year") return `DATE_FORMAT(${colName}, '%Y-%m-01')`;
        return `DATE(${colName})`;
    }

    // ─── getOverviewStats ───────────────────────────────────────
    async getOverviewStats() {
        const [
            totalUsers,
            totalActiveUsers,
            totalBlockedUsers,
            totalSurveys,
            totalQuestions,
            totalOptions
        ] = await Promise.all([
            this.User.count(),
            this.User.count({ where: { is_active: true } }),
            this.User.count({ where: { is_active: false } }),
            this.Survey.count(),
            this.Question.count(),
            this.QuestionOption.count()
        ]);

        return {
            message: "Get overview stats successfully!",
            data: { totalUsers, totalActiveUsers, totalBlockedUsers, totalSurveys, totalQuestions, totalOptions }
        };
    }

    // ─── getSurveyStatsByDay ────────────────────────────────────
    async getSurveyStatsByDay(period = "week") {
        const start = this._dateRange(period);
        const trunc = this._dateTrunc(period, "created_at");

        const stats = await this.Survey.findAll({
            attributes: [
                [literal(trunc), "date"],
                [fn("COUNT", col("id")), "count"]
            ],
            where: { created_at: { [Op.gte]: start } },
            group: [literal(trunc)],
            order: [[literal("date"), "ASC"]],
            raw: true
        });

        return { message: "Get survey stats by day successfully!", data: stats };
    }

    // ─── getResponseTrend ───────────────────────────────────────
    async getResponseTrend(period = "week") {
        const start = this._dateRange(period);
        const trunc = this._dateTrunc(period, "submitted_at");

        const stats = await this.Response.findAll({
            attributes: [
                [literal(trunc), "date"],
                [fn("COUNT", col("id")), "count"]
            ],
            where: { submitted_at: { [Op.gte]: start } },
            group: [literal(trunc)],
            order: [[literal("date"), "ASC"]],
            raw: true
        });

        return { message: "Get response trend successfully!", data: stats };
    }

    // ─── getSurveyStatusDistribution ────────────────────────────
    async getSurveyStatusDistribution() {
        const now = new Date();
        const all = await this.Survey.findAll({
            attributes: ["id", "start_at", "end_at", ["deleted_at", "deletedAt"]],
            paranoid: false
        });

        let active = 0, expired = 0, upcoming = 0, draft = 0;
        for (const s of all) {
            const row = s.toJSON();
            if (row.deletedAt) { draft++; continue; }
            if (!row.start_at && !row.end_at) { draft++; continue; }
            if (row.start_at && new Date(row.start_at) > now) { upcoming++; continue; }
            if (row.end_at && new Date(row.end_at) < now) { expired++; continue; }
            active++;
        }

        return {
            message: "Get survey status distribution successfully!",
            data: [
                { status: "active", label: "Đang hoạt động", count: active },
                { status: "expired", label: "Đã kết thúc", count: expired },
                { status: "upcoming", label: "Sắp diễn ra", count: upcoming },
                { status: "draft", label: "Bản nháp", count: draft }
            ]
        };
    }

    // ─── getQuestionTypeDistribution ────────────────────────────
    async getQuestionTypeDistribution() {
        const stats = await this.Question.findAll({
            attributes: ["type", [fn("COUNT", col("id")), "count"]],
            group: ["type"],
            raw: true
        });

        return { message: "Get question type distribution successfully!", data: stats };
    }

    // ─── getRecentResponses ─────────────────────────────────────
    async getRecentResponses(limit = 10) {
        const rows = await this.Response.findAll({
            where: { submitted_at: { [Op.ne]: null } },
            include: [
                { model: this.User, as: "user", attributes: ["full_name", "avatar"] },
                { model: this.Survey, as: "survey", attributes: ["title"] }
            ],
            order: [["submitted_at", "DESC"]],
            limit
        });

        const data = rows.map(r => {
            const json = r.toJSON();
            return {
                id: json.id,
                userName: json.user?.full_name || "Ẩn danh",
                avatar: json.user?.avatar || null,
                surveyTitle: json.survey?.title || "Không xác định",
                submittedAt: json.submitted_at
            };
        });

        return { message: "Get recent responses successfully!", data };
    }

    // ─── getQuickStats ──────────────────────────────────────────
    async getQuickStats() {
        const weekAgo = this._dateRange("week");
        const monthAgo = this._dateRange("month");

        const [
            newUsersWeek,
            completedResponses,
            totalResponses,
            newUsersMonth
        ] = await Promise.all([
            this.User.count({ where: { created_at: { [Op.gte]: weekAgo } } }),
            this.Response.count({ where: { status: "COMPLETED" } }),
            this.Response.count(),
            this.User.count({ where: { created_at: { [Op.gte]: monthAgo } } })
        ]);

        const completionRate = totalResponses > 0
            ? Math.round((completedResponses / totalResponses) * 100)
            : 0;

        return {
            message: "Get quick stats successfully!",
            data: {
                newUsersWeek,
                newUsersMonth,
                completedResponses,
                totalResponses,
                completionRate
            }
        };
    }

    // ─── getFullDashboard ───────────────────────────────────────
    async getFullDashboard(period = "week") {
        const safeResolve = (promise, fallback) =>
            promise.catch(err => {
                console.error("Dashboard sub-query error:", err.message);
                return { data: fallback };
            });

        const [
            overview,
            surveyByDay,
            responseTrend,
            surveyStatusDist,
            questionTypeDist,
            recentResponses,
            quickStats
        ] = await Promise.all([
            safeResolve(this.getOverviewStats(), {}),
            safeResolve(this.getSurveyStatsByDay(period), []),
            safeResolve(this.getResponseTrend(period), []),
            safeResolve(this.getSurveyStatusDistribution(), []),
            safeResolve(this.getQuestionTypeDistribution(), []),
            safeResolve(this.getRecentResponses(5), []),
            safeResolve(this.getQuickStats(), {})
        ]);

        return {
            message: "Get full dashboard stats successfully!",
            data: {
                overview: overview.data,
                surveyByDay: surveyByDay.data,
                responseTrend: responseTrend.data,
                surveyStatusDistribution: surveyStatusDist.data,
                questionTypeDistribution: questionTypeDist.data,
                recentResponses: recentResponses.data,
                quickStats: quickStats.data
            }
        };
    }

    // ─── legacy ─────────────────────────────────────────────────
    async getDashboard() {
        const [overview, surveyByDay] = await Promise.all([
            this.getOverviewStats(),
            this.getSurveyStatsByDay()
        ]);
        return { message: "Get dashboard stats successfully!", data: { overview: overview.data, surveyByDay: surveyByDay.data } };
    }

    async getTotalUsersAnsweredSurvey() {
        const total = await this.Response.count({ where: { user_id: { [Op.ne]: null } } });
        return { message: "Get total users answered survey successfully!", data: { count: total } };
    }

    async getUsersAnsweredBySurvey(survey_id) {
        if (!survey_id) throw new AppError("Survey id is required!", 400);
        const total = await this.Response.count({ where: { survey_id, user_id: { [Op.ne]: null } } });
        return { message: "Get users answered by survey successfully!", data: { survey_id, count: total } };
    }
}

export default new AdminStatsService();
