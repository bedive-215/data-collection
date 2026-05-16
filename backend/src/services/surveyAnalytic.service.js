import { fn, col, literal, Op } from "sequelize";
import { AppError } from "../middlewares/handleException.middlware.js";
import models from "../models/index.js";

class SurveyAnalyticsService {
    constructor() {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Answer = models.Answer;
        this.Response = models.Response;
        this.sequelize = models.sequelize;
    }

    _buildResponseWhere(survey_id, filters = {}) {
        const where = { survey_id };
        if (filters.date_from || filters.date_to) {
            where.created_at = {};
            if (filters.date_from) where.created_at[Op.gte] = new Date(filters.date_from);
            if (filters.date_to) where.created_at[Op.lte] = new Date(filters.date_to);
        }
        if (filters.response_ids?.length) {
            where.id = { [Op.in]: filters.response_ids };
        }
        return where;
    }

    async _resolveResponseIds(survey_id, filters = {}) {
        if (filters.response_ids?.length) return filters.response_ids;

        const responseWhere = this._buildResponseWhere(survey_id, filters);
        const rows = await this.Response.findAll({
            where: responseWhere,
            attributes: ["id"],
            raw: true,
        });
        return rows.map((r) => r.id);
    }

    _emptyResult(question_id, type) {
        return { question_id, type, total_responses: 0 };
    }

    _formatDuration(seconds) {
        if (!seconds) return "0s";
        const m = Math.floor(seconds / 60);
        const s = Math.round(seconds % 60);
        return m ? `${m}m ${s}s` : `${s}s`;
    }

    _computeWordFrequency(texts) {
        const STOP_WORDS = new Set([
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "is", "it", "i", "you", "we", "they", "this", "that",
            "was", "are", "be", "have", "has", "do", "did", "not", "no", "so",
            "my", "your", "our", "their", "its", "như", "và", "là", "của", "có",
            "được", "trong", "với", "cho", "một", "các", "những", "này", "đó",
        ]);

        const freq = {};
        for (const text of texts) {
            const words = text
                .toLowerCase()
                .replace(/[^a-zA-ZÀ-ỹ\s]/g, " ")
                .split(/\s+/)
                .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
            for (const w of words) {
                freq[w] = (freq[w] || 0) + 1;
            }
        }

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .map(([word, count]) => ({ word, count }));
    }

    async getQuestionAnalytics(question_id, filters = {}, textOpts = {}) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const answerWhere = { question_id };
        if (filters.survey_id) {
            const ids = await this._resolveResponseIds(filters.survey_id, filters);
            if (!ids.length) {
                const opts = await this.QuestionOption.findAll({
                    where: { question_id },
                    order: [["order_index", "ASC"]],
                    raw: true,
                });
                const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type);
                return {
                    question_id: question.id,
                    question_content: question.content,
                    type: question.type,
                    total_responses: 0,
                    ...(isChoice ? {
                        options: opts.map(o => ({
                            option_id: o.id,
                            label: o.label,
                            value: o.value,
                            count: 0,
                            percent: 0,
                        })),
                    } : {}),
                };
            }
            answerWhere.response_id = { [Op.in]: ids };
        }

        const totalResponses = await this.Answer.count({ where: answerWhere });

        switch (question.type) {
            case "SINGLE_CHOICE":
            case "DROPDOWN":
                return this._singleChoiceAnalytics(question, answerWhere, totalResponses);
            case "MULTIPLE_CHOICE":
                return this._multipleChoiceAnalytics(question, answerWhere, totalResponses);
            case "RATING":
                return this._ratingAnalytics(question, answerWhere, totalResponses);
            case "NUMBER":
                return this._numberAnalytics(question, answerWhere, totalResponses);
            case "DATE":
                return this._dateAnalytics(question, answerWhere, totalResponses);
            case "TEXT":
            case "PARAGRAPH":
            case "EMAIL":
                return this._textAnalytics(question, answerWhere, totalResponses, textOpts);
            default:
                throw new AppError(`Unsupported question type: ${question.type}`, 400);
        }
    }

    // SINGLE_CHOICE / DROPDOWN
    async _singleChoiceAnalytics(question, answerWhere, totalResponses) {
        const options = await this.QuestionOption.findAll({
            where: { question_id: question.id },
            order: [["order_index", "ASC"]],
            raw: true,
        });

        const countRows = await this.Answer.findAll({
            where: { ...answerWhere, option_id: { [Op.ne]: null } },
            attributes: [
                "option_id",
                [fn("COUNT", col("id")), "count"],
            ],
            group: ["option_id"],
            raw: true,
        });

        const countMap = {};
        countRows.forEach((r) => { countMap[r.option_id] = parseInt(r.count) || 0; });

        return {
            question_id: question.id,
            question_content: question.content,
            type: question.type,
            total_responses: totalResponses,
            options: options.map((opt) => {
                const count = countMap[opt.id] || 0;
                return {
                    option_id: opt.id,
                    label: opt.label,
                    value: opt.value,
                    count,
                    percent: totalResponses
                        ? parseFloat(((count / totalResponses) * 100).toFixed(2))
                        : 0,
                };
            }),
        };
    }

    // MULTIPLE_CHOICE 
    async _multipleChoiceAnalytics(question, answerWhere, totalResponses) {
        const options = await this.QuestionOption.findAll({
            where: { question_id: question.id },
            order: [["order_index", "ASC"]],
            raw: true,
        });

        const rows = await this.Answer.findAll({
            where: answerWhere,
            attributes: ["selected_options"],
            raw: true,
        });

        const countMap = {};
        rows.forEach((r) => {
            if (!r.selected_options) return;
            const ids = typeof r.selected_options === "string"
                ? JSON.parse(r.selected_options)
                : r.selected_options;
            ids.forEach((id) => { countMap[id] = (countMap[id] || 0) + 1; });
        });

        return {
            question_id: question.id,
            question_content: question.content,
            type: question.type,
            total_responses: totalResponses,
            options: options.map((opt) => {
                const count = countMap[opt.id] || 0;
                return {
                    option_id: opt.id,
                    label: opt.label,
                    value: opt.value,
                    count,
                    percent: totalResponses
                        ? parseFloat(((count / totalResponses) * 100).toFixed(2))
                        : 0,
                };
            }),
        };
    }

    // RATING — dùng answer_number
    async _ratingAnalytics(question, answerWhere, totalResponses) {
        const scaleMin = question.settings?.min ?? 1;
        const scaleMax = question.settings?.max ?? 5;

        const stats = await this.Answer.findOne({
            where: answerWhere,
            attributes: [
                [fn("AVG", col("answer_number")), "avg"],
                [fn("MIN", col("answer_number")), "min"],
                [fn("MAX", col("answer_number")), "max"],
                [fn("STDDEV", col("answer_number")), "stddev"],
            ],
            raw: true,
        });

        const distribution = await this.Answer.findAll({
            where: answerWhere,
            attributes: [
                [col("answer_number"), "rating"],
                [fn("COUNT", col("id")), "count"],
            ],
            group: ["answer_number"],
            order: [["answer_number", "ASC"]],
            raw: true,
        });

        return {
            question_id: question.id,
            question_content: question.content,
            type: "RATING",
            scale: { min: scaleMin, max: scaleMax },
            total_responses: totalResponses,
            avg: parseFloat(stats?.avg) || 0,
            min: parseFloat(stats?.min) || 0,
            max: parseFloat(stats?.max) || 0,
            stddev: parseFloat(stats?.stddev) || 0,
            distribution: distribution.map((d) => ({
                rating: parseFloat(d.rating),
                count: parseInt(d.count),
                percent: totalResponses
                    ? parseFloat(((d.count / totalResponses) * 100).toFixed(2))
                    : 0,
            })),
        };
    }

    // NUMBER — dùng answer_number
    async _numberAnalytics(question, answerWhere, totalResponses) {
        const stats = await this.Answer.findOne({
            where: answerWhere,
            attributes: [
                [fn("AVG", col("answer_number")), "avg"],
                [fn("MIN", col("answer_number")), "min"],
                [fn("MAX", col("answer_number")), "max"],
                [fn("STDDEV", col("answer_number")), "stddev"],
                [fn("SUM", col("answer_number")), "sum"],
            ],
            raw: true,
        });

        return {
            question_id: question.id,
            question_content: question.content,
            type: "NUMBER",
            total_responses: totalResponses,
            avg: parseFloat(stats?.avg) || 0,
            min: parseFloat(stats?.min) || 0,
            max: parseFloat(stats?.max) || 0,
            sum: parseFloat(stats?.sum) || 0,
            stddev: parseFloat(stats?.stddev) || 0,
        };
    }

    // DATE — dùng answer_date
    async _dateAnalytics(question, answerWhere, totalResponses) {
        const distribution = await this.Answer.findAll({
            where: answerWhere,
            attributes: [
                [fn("DATE_FORMAT", col("answer_date"), "%Y-%m"), "month"],
                [fn("COUNT", col("id")), "count"],
            ],
            group: [literal("DATE_FORMAT(answer_date, '%Y-%m')")],
            order: [[literal("DATE_FORMAT(answer_date, '%Y-%m')"), "ASC"]],
            raw: true,
        });

        return {
            question_id: question.id,
            question_content: question.content,
            type: "DATE",
            total_responses: totalResponses,
            distribution: distribution.map((d) => ({
                month: d.month,
                count: parseInt(d.count),
            })),
        };
    }

    // TEXT / PARAGRAPH / EMAIL — dùng answer_text
    async _textAnalytics(question, answerWhere, totalResponses, { page = 1, limit = 50 } = {}) {
        const offset = (page - 1) * limit;

        const { count, rows } = await this.Answer.findAndCountAll({
            where: answerWhere,
            attributes: ["id", "answer_text", "created_at"],
            order: [["created_at", "DESC"]],
            limit,
            offset,
        });

        const wordFrequency = ["TEXT", "PARAGRAPH"].includes(question.type)
            ? this._computeWordFrequency(rows.map((a) => a.answer_text).filter(Boolean))
            : [];

        return {
            question_id: question.id,
            question_content: question.content,
            type: question.type,
            total_responses: totalResponses,
            pagination: {
                page,
                limit,
                total_pages: Math.ceil(count / limit),
                total_answers: count,
            },
            answers: rows.map((a) => ({
                id: a.id,
                text: a.answer_text,
                submitted_at: a.created_at,
            })),
            ...(wordFrequency.length && { word_frequency: wordFrequency.slice(0, 30) }),
        };
    }

    async getSurveyAnalytics(survey_id, filters = {}) {
        const questions = await this.Question.findAll({
            where: { survey_id },
            order: [["order_index", "ASC"]],
        });

        const responseWhere = this._buildResponseWhere(survey_id, filters);
        const totalResponses = await this.Response.count({ where: responseWhere });

        if (!questions.length) {
            return {
                survey_id,
                total_responses: totalResponses,
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                questions: [],
            };
        }

        const analytics = await Promise.all(
            questions.map((q) =>
                this.getQuestionAnalytics(q.id, { ...filters, survey_id })
            )
        );

        return {
            survey_id,
            total_responses: totalResponses,
            generated_at: new Date().toISOString(),
            filters_applied: filters,
            questions: analytics,
        };
    }

    async getCompletionStats(survey_id, filters = {}) {
        const responseWhere = this._buildResponseWhere(survey_id, filters);

        const [totalStarted, totalCompleted] = await Promise.all([
            this.Response.count({ where: responseWhere }),

            this.Response.count({
                where: {
                    ...responseWhere,
                    submitted_at: { [Op.ne]: null }
                }
            }),
        ]);

        const avgTimeRow = await this.Response.findOne({
            where: {
                ...responseWhere,
                submitted_at: { [Op.ne]: null }
            },
            attributes: [
                [
                    fn(
                        "AVG",
                        literal("TIMESTAMPDIFF(SECOND, created_at, submitted_at)")
                    ),
                    "avg_seconds"
                ],
            ],
            raw: true,
        });

        const avgSeconds = parseFloat(avgTimeRow?.avg_seconds) || 0;

        const incompleteIds = await this.Response.findAll({
            where: {
                ...responseWhere,
                submitted_at: null
            },
            attributes: ["id"],
            raw: true,
        }).then(rows => rows.map(r => r.id));

        let dropOffByQuestion = [];

        if (incompleteIds.length) {
            dropOffByQuestion = await this.Answer.findAll({
                where: {
                    response_id: { [Op.in]: incompleteIds }
                },
                attributes: [
                    "question_id",
                    [fn("COUNT", col("id")), "answered_count"]
                ],
                group: ["question_id"],
                raw: true,
            });
        }

        return {
            survey_id,

            total_started: totalStarted,
            total_completed: totalCompleted,

            completion_rate: totalStarted
                ? Number(((totalCompleted / totalStarted) * 100).toFixed(2))
                : 0,

            avg_completion_time_seconds: Math.round(avgSeconds),
            avg_completion_time_display: this._formatDuration(avgSeconds),

            drop_off_by_question: dropOffByQuestion.map(d => ({
                question_id: d.question_id,
                answered_count: Number(d.answered_count),
            })),
        };
    }

    async getResponseTrend(survey_id, groupBy = "day", filters = {}) {
        const VALID = ["day", "week", "month"];
        if (!VALID.includes(groupBy)) throw new AppError("groupBy must be day | week | month", 400);

        const responseWhere = this._buildResponseWhere(survey_id, filters);

        const formatMap = { day: "%Y-%m-%d", week: "%Y-%u", month: "%Y-%m" };
        const fmt = formatMap[groupBy];

        const rows = await this.Response.findAll({
            where: responseWhere,
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
            trend: rows.map((r) => ({
                period: r.period,
                count: parseInt(r.count),
            })),
        };
    }

    async getCrossTab(survey_id, question_id_a, question_id_b, filters = {}) {
        const [qA, qB] = await Promise.all([
            this.Question.findByPk(question_id_a),
            this.Question.findByPk(question_id_b),
        ]);
        if (!qA) throw new AppError("Question A not found", 404);
        if (!qB) throw new AppError("Question B not found", 404);

        const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
        if (!CHOICE_TYPES.includes(qA.type) || !CHOICE_TYPES.includes(qB.type)) {
            throw new AppError("Cross-tab only supports choice questions", 400);
        }

        const responseIds = await this._resolveResponseIds(survey_id, filters);
        if (!responseIds.length) {
            return { survey_id, question_id_a, question_id_b, rows: [] };
        }

        const rows = await this.sequelize.query(
            `
        SELECT
            oa.id    AS option_a_id,
            oa.label AS option_a_label,
            ob.id    AS option_b_id,
            ob.label AS option_b_label,
            COUNT(DISTINCT aa.response_id) AS count

        FROM answers aa

        JOIN answers ab 
            ON aa.response_id = ab.response_id
            AND ab.question_id = :qB

        -- expand A (handle cả single + multiple)
        LEFT JOIN JSON_TABLE(
            IF(
                JSON_VALID(aa.option_id),
                aa.option_id,
                JSON_ARRAY(aa.option_id)
            ),
            '$[*]' COLUMNS(option_id VARCHAR(36) PATH '$')
        ) aa_multi ON TRUE

        -- expand B
        LEFT JOIN JSON_TABLE(
            IF(
                JSON_VALID(ab.option_id),
                ab.option_id,
                JSON_ARRAY(ab.option_id)
            ),
            '$[*]' COLUMNS(option_id VARCHAR(36) PATH '$')
        ) ab_multi ON TRUE

        -- join option A
        JOIN question_options oa 
            ON oa.id = aa_multi.option_id

        -- join option B
        JOIN question_options ob 
            ON ob.id = ab_multi.option_id

        WHERE aa.question_id = :qA
        AND aa.response_id IN (:responseIds)

        GROUP BY oa.id, ob.id
        ORDER BY oa.id, ob.id
        `,
            {
                replacements: { qA: question_id_a, qB: question_id_b, responseIds },
                type: this.sequelize.QueryTypes.SELECT,
            }
        );

        const pivot = {};
        for (const r of rows) {
            if (!pivot[r.option_a_id]) {
                pivot[r.option_a_id] = {
                    option_id: r.option_a_id,
                    label: r.option_a_label,
                    breakdown: {},
                };
            }
            pivot[r.option_a_id].breakdown[r.option_b_id] = {
                option_id: r.option_b_id,
                label: r.option_b_label,
                count: Number(r.count),
            };
        }

        return {
            survey_id,
            question_a: { id: qA.id, label: qA.content, type: qA.type },
            question_b: { id: qB.id, label: qB.content, type: qB.type },
            rows: Object.values(pivot),
        };
    }

    async getIndividualResponses(survey_id, filters = {}, { page = 1, limit = 20 } = {}) {
        const responseWhere = this._buildResponseWhere(survey_id, filters);
        const offset = (page - 1) * limit;

        const { count, rows: responses } = await this.Response.findAndCountAll({
            where: responseWhere,
            order: [["created_at", "DESC"]],
            limit,
            offset,
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
                total_pages: Math.ceil(count / limit),
            },
            responses: responses.map((res) => ({
                response_id: res.id,
                status: res.status,
                submitted_at: res.created_at,
                time_to_complete_seconds: res.created_at && res.submitted_at
                    ? Math.round((new Date(res.submitted_at) - new Date(res.created_at)) / 1000)
                    : null,
                answers: (res.answers || []).map((ans) => ({
                    question_id: ans.question?.id,
                    question_content: ans.question?.content,
                    type: ans.question?.type,
                    value: ans.option?.label
                        ?? ans.answer_text
                        ?? ans.answer_number
                        ?? ans.answer_date
                        ?? null,
                })),
            })),
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

    // ─────────────────────────────────────────────
    // 8. DATE HEATMAP (GitHub-style)
    // ─────────────────────────────────────────────
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
        const { count, rows: responses } = await this.Response.findAndCountAll({
            where: this._buildResponseWhere(survey_id, filters),
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

        const filtered = [];

        for (const res of responses) {
            const answers = (res.answers || []).map(a => ({
                question_id: a.question?.id,
                question_content: a.question?.content,
                type: a.question?.type,
                value: a.option?.label ?? a.answer_text ?? a.answer_number ?? a.answer_date ?? null,
            }));

            // Filter by status
            if (filters.status && res.status !== filters.status) continue;

            // Filter by search query (partial match in answer text)
            if (filters.search_query) {
                const query = filters.search_query.toLowerCase();
                const hasMatch = answers.some(a =>
                    (a.question_content || "").toLowerCase().includes(query) ||
                    (a.value || "").toLowerCase().includes(query)
                );
                if (!hasMatch) continue;
            }

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

        return {
            survey_id,
            pagination: {
                page,
                limit,
                total_responses: count,
                total_pages: Math.ceil(count / limit),
            },
            responses: filtered,
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
}

export default new SurveyAnalyticsService();