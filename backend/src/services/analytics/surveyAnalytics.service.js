import { fn, col, literal, Op } from "sequelize";
import { AppError } from "../../middlewares/handleException.middlware.js";
import models from "../../models/index.js";
import { formatDuration, calculateAge, ageGroup, normalizeGender, cleanSurveyAnalytics } from "./helpers.js";
import QuestionAnalyticsService from "./questionAnalytics.service.js";
import { buildAnalyticsPrompt } from "../../utils/buildPrompt.js";
import { generateGeminiContent } from "../../configs/ai.config.js";

class SurveyAnalyticsService extends QuestionAnalyticsService {
    constructor() {
        super(models);
    }

    getAnswerInclude() {
        return {
            model: this.Answer,
            as: "answers",
            include: [
                {
                    model: this.Question,
                    as: "question",
                    attributes: ["id", "content", "type"],
                },
                {
                    model: this.QuestionOption,
                    as: "option",
                    attributes: ["id", "label"],
                    required: false,
                },
            ],
        };
    }

    getAnswerInclude() {
        return {
            model: this.Answer,
            as: "answers",
            include: [
                {
                    model: this.Question,
                    as: "question",
                    attributes: ["id", "content", "type"],
                    include: [
                        {
                            model: this.QuestionOption,
                            as: "options",
                            attributes: ["id", "label"],
                        }
                    ]
                },
                {
                    model: this.QuestionOption,
                    as: "option",
                    attributes: ["id", "label"],
                    required: false,
                },
            ],
        };
    }

    formatAnswer(a) {
        let value = null;

        switch (a.question?.type) {
            case "SINGLE_CHOICE":
            case "DROPDOWN":
                value = a.option?.label || null;
                break;
            case "MULTIPLE_CHOICE":
                if (a.selected_options && a.question?.options) {
                    try {
                        const ids = typeof a.selected_options === "string"
                            ? JSON.parse(a.selected_options)
                            : a.selected_options;

                        value = a.question.options
                            .filter(opt => ids.includes(opt.id))
                            .map(opt => opt.label);

                    } catch {
                        value = null;
                    }
                }
                break;
            case "TEXT":
            case "PARAGRAPH":
            case "EMAIL":
                value = a.answer_text || null;
                break;

            case "NUMBER":
            case "RATING":
                value = a.answer_number != null ? String(a.answer_number) : null;
                break;

            case "DATE":
                value = a.answer_date || null;
                break;

            default:
                value = null;
        }

        return {
            question_id: a.question?.id,
            question_content: a.question?.content,
            type: a.question?.type,
            value,
        };
    }

    // ─── Survey-level ────────────────────────────────────────────────────────

    async getSurveyAnalytics(survey_id, filters = {}, options = {}) {
        const questions = await this.Question.findAll({
            where: { survey_id },
            order: [["order_index", "ASC"]],
        });
        if (!questions.length) {
            return {
                survey_id,
                total_responses: 0,
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                questions: [],
            };
        }

        const totalResponses = await this.Response.count({
            where: this._buildResponseWhere(survey_id, filters),
        });

        const completeTotal = await this.Response.count({
            where: this._buildResponseWhere(survey_id, { ...filters, status: "COMPLETED" }),
        });

        if(completeTotal === 0) {
            return {
                survey_id,
                total_responses: totalResponses, // Return actual count even if 0 completed
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                questions: [],
            };
        }

        const analytics = await Promise.all(
            questions.map((q) => this.getQuestionAnalytics(q.id, { ...filters, survey_id }, {...options}))
        );

        return {
            survey_id,
            total_responses: totalResponses,
            generated_at: new Date().toISOString(),
            filters_applied: filters,
            questions: analytics,
        };
    }

    async getDashboard(survey_id, filters = {}) {
        const [completion, trend, surveyAnalytics] = await Promise.all([
            this.getCompletionStats(survey_id, filters),
            this.getResponseTrend(survey_id, "day", filters),
            this.getSurveyAnalytics(survey_id, filters),
        ]);

        return {
            survey_id,
            generated_at: new Date().toISOString(),
            overview: {
                total_started: completion.total_started,
                total_completed: completion.total_completed,
                completion_rate: completion.completion_rate,
                avg_completion_time: completion.avg_completion_time_display,
            },
            trend: trend.trend,
            questions: surveyAnalytics.questions,
        };
    }

    // ─── Completion ──────────────────────────────────────────────────────────

    async getCompletionStats(survey_id, filters = {}) {
        const baseFilters = { ...filters };
        delete baseFilters.status;
        const responseWhere = this._buildResponseWhere(survey_id, baseFilters);
        const completedWhere = { ...responseWhere, status: "COMPLETED" };

        const [totalStarted, totalCompleted] = await Promise.all([
            this.Response.count({ where: responseWhere }),
            this.Response.count({ where: completedWhere }),
        ]);

        const avgTimeRow = await this.Response.findOne({
            where: completedWhere,
            attributes: [[fn("AVG", literal("TIMESTAMPDIFF(SECOND, created_at, submitted_at)")), "avg_seconds"]],
            raw: true,
        });

        const avgSeconds = parseFloat(avgTimeRow?.avg_seconds) || 0;

        const incompleteIds = await this.Response.findAll({
            where: { ...responseWhere, status: "IN_PROGRESS" },
            attributes: ["id"],
            raw: true,
        }).then((rows) => rows.map((r) => r.id));

        const dropOffByQuestion = incompleteIds.length
            ? await this.Answer.findAll({
                where: { response_id: { [Op.in]: incompleteIds } },
                attributes: ["question_id", [fn("COUNT", col("id")), "answered_count"]],
                group: ["question_id"],
                raw: true,
            })
            : [];

        return {
            survey_id,
            total_started: totalStarted,
            total_completed: totalCompleted,
            completion_rate: totalStarted ? Number(((totalCompleted / totalStarted) * 100).toFixed(2)) : 0,
            avg_completion_time_seconds: Math.round(avgSeconds),
            avg_completion_time_display: formatDuration(avgSeconds),
            drop_off_by_question: dropOffByQuestion.map((d) => ({
                question_id: d.question_id,
                answered_count: Number(d.answered_count),
            })),
        };
    }

    async getResponseTrend(survey_id, groupBy = "day", filters = {}) {
        const FORMAT = { day: "%Y-%m-%d", week: "%Y-%u", month: "%Y-%m" };
        if (!FORMAT[groupBy]) throw new AppError("groupBy must be day | week | month", 400);

        const fmt = FORMAT[groupBy];
        const rows = await this.Response.findAll({
            where: this._buildResponseWhere(survey_id, filters),
            attributes: [
                [fn("DATE_FORMAT", col("created_at"), fmt), "period"],
                [fn("COUNT", col("id")), "count"],
            ],
            group: [literal(`DATE_FORMAT(created_at, '${fmt}')`)],
            order: [[literal(`DATE_FORMAT(created_at, '${fmt}')`), "ASC"]],
            raw: true,
        });

        return {
            survey_id,
            group_by: groupBy,
            trend: rows.map((r) => ({ period: r.period, count: parseInt(r.count) })),
        };
    }

    // ─── Individual responses ────────────────────────────────────────────────

    async getIndividualResponses(survey_id, filters = {}, { page = 1, limit = 20 } = {}) {
        const whereClause = this._buildResponseWhere(survey_id, filters);

        if (filters.search_query) {
            const allRows = await this.Response.findAll({
                where: whereClause,
                order: [["created_at", "DESC"]],
                include: [this.getAnswerInclude()],
            });

            const query = filters.search_query.toLowerCase();
            const filtered = [];

            for (const res of allRows) {
                const answers = (res.answers || []).map(a => this.formatAnswer(a));

                const hasMatch = answers.some(a =>
                    (a.question_content || "").toLowerCase().includes(query) ||
                    (String(a.value || "")).toLowerCase().includes(query)
                );

                if (!hasMatch) continue;

                filtered.push({
                    response_id: res.id,
                    status: res.status,
                    created_at: res.created_at,
                    submitted_at: res.submitted_at,
                    time_to_complete_seconds: res.created_at && res.submitted_at
                        ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
                        : null,
                    answers,
                });
            }

            const totalFiltered = filtered.length;
            const offset = (page - 1) * limit;

            return {
                survey_id,
                pagination: {
                    page,
                    limit,
                    total_responses: totalFiltered,
                    total_pages: Math.ceil(totalFiltered / limit) || 1,
                },
                responses: filtered.slice(offset, offset + limit),
            };
        }

        const { count, rows } = await this.Response.findAndCountAll({
            where: whereClause,
            order: [["created_at", "DESC"]],
            limit,
            offset: (page - 1) * limit,
            include: [this.getAnswerInclude()],
        });

        return {
            survey_id,
            pagination: {
                page,
                limit,
                total_responses: count,
                total_pages: Math.ceil(count / limit) || 1,
            },
            responses: rows.map(res => ({
                response_id: res.id,
                status: res.status,
                created_at: res.created_at,
                submitted_at: res.submitted_at,
                time_to_complete_seconds: res.created_at && res.submitted_at
                    ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
                    : null,
                answers: (res.answers || []).map(a => this.formatAnswer(a)),
            })),
        };
    }

    // ─── Cross-tab ───────────────────────────────────────────────────────────

    async getCrossTab(survey_id, question_id_a, question_id_b, filters = {}) {
        const [qA, qB] = await Promise.all([
            this.Question.findByPk(question_id_a),
            this.Question.findByPk(question_id_b),
        ]);
        if (!qA) throw new AppError("Question A not found", 404);
        if (!qB) throw new AppError("Question B not found", 404);

        const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
        if (!CHOICE_TYPES.includes(qA.type) || !CHOICE_TYPES.includes(qB.type))
            throw new AppError("Cross-tab only supports choice questions", 400);

        const responseIds = await this._resolveResponseIds(survey_id, filters);
        if (!responseIds.length) return { survey_id, question_id_a, question_id_b, rows: [] };

        const rows = await this.sequelize.query(
            `SELECT
                oa.id    AS option_a_id,
                oa.label AS option_a_label,
                ob.id    AS option_b_id,
                ob.label AS option_b_label,
                COUNT(DISTINCT aa.response_id) AS count
            FROM answers aa
            JOIN answers ab ON aa.response_id = ab.response_id AND ab.question_id = :qB
            LEFT JOIN JSON_TABLE(
                IF(JSON_VALID(aa.option_id), aa.option_id, JSON_ARRAY(aa.option_id)),
                '$[*]' COLUMNS(option_id VARCHAR(36) PATH '$')
            ) aa_multi ON TRUE
            LEFT JOIN JSON_TABLE(
                IF(JSON_VALID(ab.option_id), ab.option_id, JSON_ARRAY(ab.option_id)),
                '$[*]' COLUMNS(option_id VARCHAR(36) PATH '$')
            ) ab_multi ON TRUE
            JOIN question_options oa ON oa.id = aa_multi.option_id
            JOIN question_options ob ON ob.id = ab_multi.option_id
            WHERE aa.question_id = :qA AND aa.response_id IN (:responseIds)
            GROUP BY oa.id, ob.id
            ORDER BY oa.id, ob.id`,
            { replacements: { qA: question_id_a, qB: question_id_b, responseIds }, type: this.sequelize.QueryTypes.SELECT }
        );

        const pivot = {};
        for (const r of rows) {
            if (!pivot[r.option_a_id]) {
                pivot[r.option_a_id] = { option_id: r.option_a_id, label: r.option_a_label, breakdown: {} };
            }
            pivot[r.option_a_id].breakdown[r.option_b_id] = {
                option_id: r.option_b_id, label: r.option_b_label, count: Number(r.count),
            };
        }

        return {
            survey_id,
            question_a: { id: qA.id, label: qA.content, type: qA.type },
            question_b: { id: qB.id, label: qB.content, type: qB.type },
            rows: Object.values(pivot),
        };
    }

    // ─── Demographics ────────────────────────────────────────────────────────
    async _getRawStats(questionId, filters = {}) {
        const answerWhere = { question_id: questionId };
        if (filters.survey_id) {
            const ids = await this._resolveResponseIds(filters.survey_id, filters);
            if (!ids.length) return [];
            answerWhere.response_id = { [Op.in]: ids };
        }

        const whereClause = answerWhere.response_id
            ? `a.question_id = :questionId AND a.response_id IN (:responseIds)`
            : `a.question_id = :questionId`;

        const rows = await this.sequelize.query(
            `SELECT
            qo.label          AS option_label,
            u.gender          AS gender,
            u.date_of_birth   AS dob,
            COUNT(a.id)       AS total
        FROM answers a
        LEFT JOIN responses r   ON a.response_id = r.id
        LEFT JOIN users u       ON r.user_id = u.id
        LEFT JOIN question_options qo ON a.option_id = qo.id
        WHERE ${whereClause}
        GROUP BY qo.label, u.gender, u.date_of_birth`,
            {
                replacements: {
                    questionId,
                    ...(answerWhere.response_id && { responseIds: answerWhere.response_id[Op.in] }),
                },
                type: this.sequelize.QueryTypes.SELECT,
            }
        );

        return rows.map((r) => ({
            option_label: r.option_label,
            total: r.total,
            gender: r.gender,
            dob: r.dob,
        }));
    }
    async getCompareByGender(questionId, survey) {
        const question = await this.Question.findByPk(questionId);
        if (!question || question.survey_id !== survey.id)
            throw new AppError("This question does not belong to the survey.", 400);

        const rows = await this.Answer.findAll({
            attributes: [
                "option_id",
                [col("option.label"), "option_label"],
                [col("response.user.gender"), "gender"],
                [fn("COUNT", col("*")), "total"],
            ],
            include: [
                {
                    model: this.Response, as: "response", attributes: [],
                    include: [{ model: this.User, as: "user", attributes: [] }],
                },
                { model: this.QuestionOption, as: "option", attributes: [] },
            ],
            where: { question_id: questionId },
            group: ["response.user.gender", "option_id", "option.label"],
            raw: true,
        });

        const totalByGender = {};
        rows.forEach((r) => {
            const gender = normalizeGender(r.gender);
            totalByGender[gender] = (totalByGender[gender] || 0) + Number(r.total);
        });

        const result = {};
        rows.forEach((r) => {
            const gender = normalizeGender(r.gender);
            if (!result[gender]) result[gender] = { total: totalByGender[gender], data: {} };
            result[gender].data[r.option_label] = Number(((r.total / totalByGender[gender]) * 100).toFixed(2));
        });

        return result;
    }

    async getCompareByAge(questionId) {
        const rows = await this._getRawStats(questionId);
        const result = {};

        for (const r of rows) {
            const option = r.option_label || "UNKNOWN";
            const count = Number(r.total);
            const group = ageGroup(calculateAge(r.dob));

            if (!result[group]) result[group] = { total: 0, data: {} };
            result[group].total += count;
            result[group].data[option] = (result[group].data[option] || 0) + count;
        }

        for (const group in result) {
            const { total, data } = result[group];
            for (const opt in data) {
                data[opt] = Math.round((data[opt] / (total || 1)) * 100);
            }
        }

        return result;
    }

    async getInsightAgeGender(questionId, filters = {}) {
        const question = await this.Question.findByPk(questionId);
        if (!question) throw new AppError("Question not found", 404);

        const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
        if (!CHOICE_TYPES.includes(question.type))
            throw new AppError("Insight only supports choice questions", 400);

        const answerWhere = { question_id: questionId };
        if (filters.survey_id) {
            const ids = await this._resolveResponseIds(filters.survey_id, filters);
            if (!ids.length) return {};
            answerWhere.response_id = { [Op.in]: ids };
        }

        const whereClause = answerWhere.response_id
            ? `a.question_id = :questionId AND a.response_id IN (:responseIds)`
            : `a.question_id = :questionId`;

        const rows = await this.sequelize.query(
            `SELECT
            qo.label        AS option_label,
            u.gender        AS gender,
            u.date_of_birth AS dob,
            COUNT(a.id)     AS total
        FROM answers a
        LEFT JOIN responses r          ON a.response_id = r.id
        LEFT JOIN users u              ON r.user_id = u.id
        LEFT JOIN question_options qo  ON a.option_id = qo.id
        WHERE ${whereClause}
          AND u.gender IS NOT NULL
          AND u.date_of_birth IS NOT NULL
        GROUP BY qo.label, u.gender, u.date_of_birth`,
            {
                replacements: {
                    questionId,
                    ...(answerWhere.response_id && { responseIds: answerWhere.response_id[Op.in] }),
                },
                type: this.sequelize.QueryTypes.SELECT,
            }
        );

        // Tổng hợp: { ageGroup: { gender: { option: count } } }
        const raw = {};
        for (const r of rows) {
            const group = ageGroup(calculateAge(r.dob));
            const gender = normalizeGender(r.gender);
            const option = r.option_label || "UNKNOWN";
            const count = Number(r.total);

            if (!raw[group]) raw[group] = {};
            if (!raw[group][gender]) raw[group][gender] = {};

            raw[group][gender][option] = (raw[group][gender][option] || 0) + count;
        }

        // Tính percent trong từng ageGroup+gender cell
        const result = {};
        for (const group in raw) {
            result[group] = {};
            for (const gender in raw[group]) {
                const data = raw[group][gender];
                const total = Object.values(data).reduce((s, v) => s + v, 0);
                result[group][gender] = {
                    total,
                    data: Object.fromEntries(
                        Object.entries(data).map(([opt, cnt]) => [
                            opt,
                            Math.round((cnt / total) * 100),
                        ])
                    ),
                };
            }
        }

        return {
            question_id: question.id,
            question_content: question.content,
            type: question.type,
            insight: result,
        };
    }

    async getDateHeatmap(survey_id, filters = {}) {
        const responseWhere = this._buildResponseWhere(survey_id, filters);

        const rows = await this.Response.findAll({
            where: responseWhere,
            attributes: [
                [fn("DATE", col("created_at")), "date"],
                [fn("COUNT", col("id")), "count"],
            ],
            group: [literal("DATE(created_at)")],
            order: [[literal("DATE(created_at)"), "ASC"]],
            raw: true,
        });

        // Fill gaps — generate all dates in range
        const dateMap = {};
        rows.forEach(r => { dateMap[r.date] = parseInt(r.count); });

        // Detect range
        let startDate, endDate;
        if (filters.date_from && filters.date_to) {
            startDate = new Date(filters.date_from);
            endDate = new Date(filters.date_to);
        } else {
            endDate = new Date();
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 90); // last 90 days default
        }

        const heatmap = [];
        const cur = new Date(startDate);
        while (cur <= endDate) {
            const key = cur.toISOString().split("T")[0];
            heatmap.push({ date: key, count: dateMap[key] || 0 });
            cur.setDate(cur.getDate() + 1);
        }

        return { survey_id, heatmap, start_date: startDate.toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0] };
    }

    // ─────────────────────────────────────────────
    // 9. RESPONSE SEARCH + FILTER
    // ─────────────────────────────────────────────
    async getFilteredResponses(survey_id, filters = {}, { page = 1, limit = 20 } = {}) {
        // FIX: status is now in _buildResponseWhere, so DB-level filtering is correct.
        // For search_query we still need a JS-level filter after fetching, because
        // full-text search across joined answer values is complex in Sequelize.
        // To get correct pagination for search_query, we fetch without pagination first.
        const whereClause = this._buildResponseWhere(survey_id, filters);

        if (filters.search_query) {
            // Fetch all matching rows (status already filtered at DB), then JS-filter by search
            const allRows = await this.Response.findAll({
                where: whereClause,
                order: [["created_at", "DESC"]],
                include: [
                    {
                        model: this.Answer,
                        as: "answers",
                        include: [
                            { model: this.Question, as: "question", attributes: ["id", "content", "type"] },
                            { model: this.QuestionOption, as: "option", attributes: ["id", "label"], required: false },
                        ],
                    },
                ],
            });

            const query = filters.search_query.toLowerCase();
            const filtered = [];

            for (const res of allRows) {
                const answers = (res.answers || []).map(a => ({
                    question_id: a.question?.id,
                    question_content: a.question?.content,
                    type: a.question?.type,
                    value: a.option?.label ?? a.answer_text ?? (a.answer_number != null ? String(a.answer_number) : null) ?? a.answer_date ?? null,
                }));

                const hasMatch = answers.some(a =>
                    (a.question_content || "").toLowerCase().includes(query) ||
                    (String(a.value || "")).toLowerCase().includes(query)
                );
                if (!hasMatch) continue;

                filtered.push({
                    response_id: res.id,
                    status: res.status,
                    created_at: res.created_at,
                    submitted_at: res.submitted_at,
                    time_to_complete_seconds: res.created_at && res.submitted_at
                        ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
                        : null,
                    answers,
                });
            }

            const totalFiltered = filtered.length;
            const offset = (page - 1) * limit;
            return {
                survey_id,
                pagination: {
                    page,
                    limit,
                    total_responses: totalFiltered,
                    total_pages: Math.ceil(totalFiltered / limit) || 1,
                },
                responses: filtered.slice(offset, offset + limit),
            };
        }

        // No search_query — use DB pagination directly (status already in WHERE)
        const { count, rows: responses } = await this.Response.findAndCountAll({
            where: whereClause,
            order: [["created_at", "DESC"]],
            limit,
            offset: (page - 1) * limit,
            include: [
                {
                    model: this.Answer,
                    as: "answers",
                    include: [
                        { model: this.Question, as: "question", attributes: ["id", "content", "type"] },
                        { model: this.QuestionOption, as: "option", attributes: ["id", "label"], required: false },
                    ],
                },
            ],
        });

        return {
            survey_id,
            pagination: {
                page,
                limit,
                total_responses: count,
                total_pages: Math.ceil(count / limit) || 1,
            },
            responses: responses.map(res => ({
                response_id: res.id,
                status: res.status,
                created_at: res.created_at,
                submitted_at: res.submitted_at,
                time_to_complete_seconds: res.created_at && res.submitted_at
                    ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
                    : null,
                answers: (res.answers || []).map(a => ({
                    question_id: a.question?.id,
                    question_content: a.question?.content,
                    type: a.question?.type,
                    value: a.option?.label ?? a.answer_text ?? (a.answer_number != null ? String(a.answer_number) : null) ?? a.answer_date ?? null,
                })),
            })),
        };
    }

    // ─────────────────────────────────────────────
    // 10. EXPORT FULL CSV
    // ─────────────────────────────────────────────
    async exportCSV(survey_id, filters = {}) {
        const questions = await this.Question.findAll({
            where: { survey_id },
            order: [["order_index", "ASC"]],
            raw: true,
        });

        const optionsMap = {};
        for (const q of questions) {
            const opts = await this.QuestionOption.findAll({
                where: { question_id: q.id },
                order: [["order_index", "ASC"]],
                raw: true,
            });
            optionsMap[q.id] = opts;
        }

        const responseWhere = this._buildResponseWhere(survey_id, filters);
        const responses = await this.Response.findAll({
            where: responseWhere,
            order: [["created_at", "ASC"]],
            include: [{ model: this.Answer, as: "answers" }],
        });

        // Header row
        const headers = ["Response ID", "Status", "Submitted At", "Duration (s)", ...questions.map(q => q.content)];

        // Data rows
        const rows = responses.map(res => {
            const ansMap = {};
            (res.answers || []).forEach(a => { ansMap[a.question_id] = a; });

            const row = [
                res.id,
                res.status,
                res.submitted_at ? new Date(res.submitted_at).toISOString() : "",
                res.submitted_at && res.created_at
                    ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
                    : "",
            ];

            questions.forEach(q => {
                const a = ansMap[q.id];
                if (!a) { row.push(""); return; }

                const isMulti = q.type === "MULTIPLE_CHOICE";
                const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type);

                if (isChoice) {
                    if (isMulti) {
                        const selected = typeof a.selected_options === "string"
                            ? JSON.parse(a.selected_options)
                            : (a.selected_options || []);
                        const labels = (optionsMap[q.id] || [])
                            .filter(o => selected.includes(o.id))
                            .map(o => o.label);
                        row.push(labels.join("; "));
                    } else {
                        const opt = (optionsMap[q.id] || []).find(o => o.id === a.option_id);
                        row.push(opt ? opt.label : "");
                    }
                } else if (a.answer_text !== null && a.answer_text !== undefined) {
                    row.push(a.answer_text);
                } else if (a.answer_number !== null && a.answer_number !== undefined) {
                    row.push(String(a.answer_number));
                } else if (a.answer_date) {
                    row.push(new Date(a.answer_date).toISOString().split("T")[0]);
                } else {
                    row.push("");
                }
            });

            return row;
        });

        // Build CSV string
        const escape = v => {
            const s = v == null ? "" : String(v);
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const csv = [
            headers.map(escape).join(","),
            ...rows.map(row => row.map(escape).join(","))
        ].join("\n");

        return { csv, filename: `survey-${survey_id}-export-${Date.now()}.csv`, row_count: rows.length };
    }

    async getAiAnalytics(survey_id, filters = {},) {
        const data = await this.getSurveyAnalytics(survey_id, filters, {ai_mode: true});
        if(data.total_responses === 0) {
            return {
                survey_id,
                total_responses: 0,
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                ai_insights: "Khảo sát này chưa có phản hồi nào. Hãy chia sẻ khảo sát để thu thập dữ liệu trước.",
            };
        }
        const cleaned = cleanSurveyAnalytics(data);

        const prompt = buildAnalyticsPrompt(cleaned);
        const aiResponse = await generateGeminiContent(prompt);

        return {
            survey_id,
            total_responses: data.total_responses,
            generated_at: new Date().toISOString(),
            ai_insights: aiResponse,
        };
    }
}

export default new SurveyAnalyticsService();
