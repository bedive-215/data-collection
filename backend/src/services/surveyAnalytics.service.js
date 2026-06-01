import { fn, col, literal, Op } from "sequelize";
import { AppError } from "../middlewares/handleException.middlware.js";

import models from "../models/index.js";

import {
    formatDuration,
    calculateAge,
    ageGroup,
    normalizeGender,
    cleanSurveyAnalytics,
    computeWordFrequency
} from "../helpers/surveyAnalytic.helper.js";
import { buildAnalyticsPrompt } from "../utils/surveyAnalytics/buildPrompt.js";
import { generateText } from "../ai/gemini/geminiClient.js";
import { cache } from "../helpers/cache.helper.js";
import { buildAiAnalyticsCacheKey, buildResponseWhere } from "../helpers/surveyAnalyticsQuery.helper.js";
import { textAnalytics } from "../utils/surveyAnalytics/textAnalytics.js";
import { buildSurveyCSV } from "../utils/surveyAnalytics/exportCSV.js";
import { CHOICE_TYPES } from "../domain/surveyAnalytics/questionTypes.js";
import { getQuestionTypeHandlers } from "../domain/surveyAnalytics/questionTypeHandlers.js";
import { baseQuestionResult, emptyQuestionResult, mapOptionsWithCounts } from "../domain/surveyAnalytics/analyticsResult.js";
import { buildAgeComparison, buildAgeGenderInsight } from "../domain/surveyAnalytics/demographicInsight.js";
import { buildPaginatedSurveyResponses, mapSurveyResponse, surveyResponseMatchesSearch } from "../mappers/surveyAnalytics.mapper.js";

const AI_ANALYTICS_CACHE_TTL_SECONDS = 60 * 10;

class SurveyAnalyticsService {
    constructor(models) {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Answer = models.Answer;
        this.Response = models.Response;
        this.sequelize = models.sequelize;
        this.User = models.User;
    }

    async _resolveResponseIds(survey_id, filters = {}) {
        if (filters.response_ids?.length) return filters.response_ids;
        const rows = await this.Response.findAll({
            where: buildResponseWhere(survey_id, filters),
            attributes: ["id"],
            raw: true,
        });
        return rows.map((r) => r.id);
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

    async _getResponsePage(survey_id, filters = {}, { page = 1, limit = 20 } = {}) {
        const whereClause = buildResponseWhere(survey_id, filters);

        if (filters.search_query) {
            const rows = await this.Response.findAll({
                where: whereClause,
                order: [["created_at", "DESC"]],
                include: [this.getAnswerInclude()],
            });

            const filtered = rows
                .map(mapSurveyResponse)
                .filter((res) => surveyResponseMatchesSearch(res, filters.search_query));

            const offset = (page - 1) * limit;
            return buildPaginatedSurveyResponses(
                survey_id,
                filtered.slice(offset, offset + limit),
                page,
                limit,
                filtered.length
            );
        }

        const { count, rows } = await this.Response.findAndCountAll({
            where: whereClause,
            order: [["created_at", "DESC"]],
            limit,
            offset: (page - 1) * limit,
            include: [this.getAnswerInclude()],
        });

        return buildPaginatedSurveyResponses(
            survey_id,
            rows.map(mapSurveyResponse),
            page,
            limit,
            count
        );
    }

    async _getOptions(question_id) {
        return this.QuestionOption.findAll({
            where: { question_id },
            order: [["order_index", "ASC"]],
            raw: true,
        });
    }

    async _singleChoiceAnalytics(question, answerWhere, totalResponses) {
        const options = await this._getOptions(question.id);

        const countRows = await this.Answer.findAll({
            where: { ...answerWhere, option_id: { [Op.ne]: null } },
            attributes: ["option_id", [fn("COUNT", col("id")), "count"]],
            group: ["option_id"],
            raw: true,
        });

        const countMap = Object.fromEntries(countRows.map((r) => [r.option_id, parseInt(r.count) || 0]));

        return {
            ...baseQuestionResult(question),
            total_responses: totalResponses,
            options: mapOptionsWithCounts(options, countMap, totalResponses),
        };
    }

    async _multipleChoiceAnalytics(question, answerWhere, totalResponses) {
        const options = await this._getOptions(question.id);

        const rows = await this.Answer.findAll({
            where: answerWhere,
            attributes: ["selected_options"],
            raw: true,
        });

        const countMap = {};
        rows.forEach((r) => {
            if (!r.selected_options) return;
            const ids = typeof r.selected_options === "string" ? JSON.parse(r.selected_options) : r.selected_options;
            ids.forEach((id) => { countMap[id] = (countMap[id] || 0) + 1; });
        });

        return {
            ...baseQuestionResult(question),
            total_responses: totalResponses,
            options: mapOptionsWithCounts(options, countMap, totalResponses),
        };
    }

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
            ...baseQuestionResult(question),
            scale: { min: scaleMin, max: scaleMax },
            total_responses: totalResponses,
            avg: parseFloat(stats?.avg) || 0,
            min: parseFloat(stats?.min) || 0,
            max: parseFloat(stats?.max) || 0,
            stddev: parseFloat(stats?.stddev) || 0,
            distribution: distribution.map((d) => ({
                rating: parseFloat(d.rating),
                count: parseInt(d.count),
                percent: totalResponses ? parseFloat(((parseInt(d.count) / totalResponses) * 100).toFixed(2)) : 0,
            })),
        };
    }

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
            ...baseQuestionResult(question),
            total_responses: totalResponses,
            avg: parseFloat(stats?.avg) || 0,
            min: parseFloat(stats?.min) || 0,
            max: parseFloat(stats?.max) || 0,
            sum: parseFloat(stats?.sum) || 0,
            stddev: parseFloat(stats?.stddev) || 0,
        };
    }

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
            ...baseQuestionResult(question),
            total_responses: totalResponses,
            distribution: distribution.map((d) => ({ month: d.month, count: parseInt(d.count) })),
        };
    }

    async _textAnalytics(
        question,
        answerWhere,
        totalResponses,
        textOpts = {}
    ) {
        return textAnalytics({
            models: {
                Answer: this.Answer,
            },
            question,
            answerWhere,
            totalResponses,
            textOpts,
            computeWordFrequencyFn: computeWordFrequency,
        });
    }


    async getQuestionAnalytics(question_id, filters = {}, textOpts = {}) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const answerWhere = { question_id };
        if (filters.survey_id) {
            const ids = await this._resolveResponseIds(filters.survey_id, filters);
            if (!ids.length) return emptyQuestionResult(question_id, question.type);
            answerWhere.response_id = { [Op.in]: ids };
        }

        const totalResponses = await this.Answer.count({ where: answerWhere });

        const handlerByType = getQuestionTypeHandlers({
            svc: this,
            question,
            answerWhere,
            totalResponses,
            textOpts,
        });

        const handler = handlerByType[question.type];
        if (!handler) throw new AppError(`Unsupported question type: ${question.type}`, 400);
        return handler();
    }

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
            where: buildResponseWhere(survey_id, filters),
        });

        const completeTotal = await this.Response.count({
            where: buildResponseWhere(survey_id, { ...filters, status: "COMPLETED" }),
        });

        if (completeTotal === 0) {
            return {
                survey_id,
                total_responses: totalResponses, // Return actual count even if 0 completed
                generated_at: new Date().toISOString(),
                filters_applied: filters,
                questions: [],
            };
        }

        const analytics = await Promise.all(
            questions.map((q) => this.getQuestionAnalytics(q.id, { ...filters, survey_id }, { ...options }))
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

    async getCompletionStats(survey_id, filters = {}) {
        const baseFilters = { ...filters };
        delete baseFilters.status;
        const responseWhere = buildResponseWhere(survey_id, baseFilters);
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
            where: buildResponseWhere(survey_id, filters),
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

    async getIndividualResponses(survey_id, filters = {}, { page = 1, limit = 20 } = {}) {
        return this._getResponsePage(survey_id, filters, { page, limit });
    }

    async getCrossTab(survey_id, question_id_a, question_id_b, filters = {}) {
        const [qA, qB] = await Promise.all([
            this.Question.findByPk(question_id_a),
            this.Question.findByPk(question_id_b),
        ]);
        if (!qA) throw new AppError("Question A not found", 404);
        if (!qB) throw new AppError("Question B not found", 404);

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
        return buildAgeComparison(rows, { calculateAge, ageGroup });
    }

    async getInsightAgeGender(questionId, filters = {}) {
        const question = await this.Question.findByPk(questionId);
        if (!question) throw new AppError("Question not found", 404);

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

        const result = buildAgeGenderInsight(rows, { calculateAge, ageGroup, normalizeGender });

        return {
            question_id: question.id,
            question_content: question.content,
            type: question.type,
            insight: result,
        };
    }

    async getDateHeatmap(survey_id, filters = {}) {
        const responseWhere = buildResponseWhere(survey_id, filters);

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
            startDate.setDate(startDate.getDate() - 90);
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

    async getFilteredResponses(survey_id, filters = {}, { page = 1, limit = 20 } = {}) {
        return this._getResponsePage(survey_id, filters, { page, limit });
    }

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

        const responseWhere = buildResponseWhere(survey_id, filters);
        const responses = await this.Response.findAll({
            where: responseWhere,
            order: [["created_at", "ASC"]],
            include: [{ model: this.Answer, as: "answers" }],
        });

        return buildSurveyCSV({
            survey_id,
            questions,
            optionsMap,
            responses,
        });
    }

    async _generateAiAnalytics(survey_id, filters = {}) {
        const data = await this.getSurveyAnalytics(survey_id, filters, { ai_mode: true });
        if (data.total_responses === 0) {
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
        const aiResponse = await generateText({ contents: prompt });

        return {
            survey_id,
            total_responses: data.total_responses,
            generated_at: new Date().toISOString(),
            ai_insights: aiResponse,
        };
    }

    async getAiAnalytics(survey_id, filters = {},) {
        const cacheKey = buildAiAnalyticsCacheKey(survey_id, filters);

        return cache.getOrSetJSON({
            key: cacheKey,
            ttlSeconds: AI_ANALYTICS_CACHE_TTL_SECONDS,
            fetcher: () => this._generateAiAnalytics(survey_id, filters),
        });
    }
}


export default new SurveyAnalyticsService(models);
