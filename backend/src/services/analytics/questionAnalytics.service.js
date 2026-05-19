import { fn, col, literal, Op } from "sequelize";
import { AppError } from "../../middlewares/handleException.middlware.js";
import { toPercent, computeWordFrequency, STOP_WORDS } from "./helpers.js";
import BaseAnalyticsService from "./base.service.js";

class QuestionAnalyticsService extends BaseAnalyticsService {
    async getQuestionAnalytics(question_id, filters = {}, textOpts = {}) {
        const question = await this.Question.findByPk(question_id);
        if (!question) throw new AppError("Question not found", 404);

        const answerWhere = { question_id };
        if (filters.survey_id) {
            const ids = await this._resolveResponseIds(filters.survey_id, filters);
            if (!ids.length) return this._emptyResult(question_id, question.type);
            answerWhere.response_id = { [Op.in]: ids };
        }

        const totalResponses = await this.Answer.count({ where: answerWhere });

        const handlers = {
            SINGLE_CHOICE: () => this._singleChoiceAnalytics(question, answerWhere, totalResponses),
            DROPDOWN: () => this._singleChoiceAnalytics(question, answerWhere, totalResponses),
            MULTIPLE_CHOICE: () => this._multipleChoiceAnalytics(question, answerWhere, totalResponses),
            RATING: () => this._ratingAnalytics(question, answerWhere, totalResponses),
            NUMBER: () => this._numberAnalytics(question, answerWhere, totalResponses),
            DATE: () => this._dateAnalytics(question, answerWhere, totalResponses),
            TEXT: () => this._textAnalytics(question, answerWhere, totalResponses, textOpts),
            PARAGRAPH: () => this._textAnalytics(question, answerWhere, totalResponses, textOpts),
            EMAIL: () => this._textAnalytics(question, answerWhere, totalResponses, textOpts),
        };

        const handler = handlers[question.type];
        if (!handler) throw new AppError(`Unsupported question type: ${question.type}`, 400);
        return handler();
    }

    _baseResult(question) {
        return {
            question_id: question.id,
            question_content: question.content,
            type: question.type,
        };
    }

    _mapOptions(options, countMap, total) {
        return options.map((opt) => {
            const count = countMap[opt.id] || 0;
            return { option_id: opt.id, label: opt.label, value: opt.value, count, percent: toPercent(count, total) };
        });
    }

    async _getOptions(question_id) {
        return this.QuestionOption.findAll({
            where: { question_id },
            order: [["order_index", "ASC"]],
            raw: true,
        });
    }

    // SINGLE_CHOICE / DROPDOWN
    async _singleChoiceAnalytics(question, answerWhere, totalResponses) {
        const options = await this._getOptions(question.id);

        const countRows = await this.Answer.findAll({
            where: { ...answerWhere, option_id: { [Op.ne]: null } },
            attributes: ["option_id", [fn("COUNT", col("id")), "count"]],
            group: ["option_id"],
            raw: true,
        });

        const countMap = Object.fromEntries(countRows.map((r) => [r.option_id, parseInt(r.count) || 0]));

        return { ...this._baseResult(question), total_responses: totalResponses, options: this._mapOptions(options, countMap, totalResponses) };
    }

    // MULTIPLE_CHOICE
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

        return { ...this._baseResult(question), total_responses: totalResponses, options: this._mapOptions(options, countMap, totalResponses) };
    }

    // RATING
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
            ...this._baseResult(question),
            scale: { min: scaleMin, max: scaleMax },
            total_responses: totalResponses,
            avg: parseFloat(stats?.avg) || 0,
            min: parseFloat(stats?.min) || 0,
            max: parseFloat(stats?.max) || 0,
            stddev: parseFloat(stats?.stddev) || 0,
            distribution: distribution.map((d) => ({
                rating: parseFloat(d.rating),
                count: parseInt(d.count),
                percent: toPercent(d.count, totalResponses),
            })),
        };
    }

    // NUMBER
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
            ...this._baseResult(question),
            total_responses: totalResponses,
            avg: parseFloat(stats?.avg) || 0,
            min: parseFloat(stats?.min) || 0,
            max: parseFloat(stats?.max) || 0,
            sum: parseFloat(stats?.sum) || 0,
            stddev: parseFloat(stats?.stddev) || 0,
        };
    }

    // DATE
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
            ...this._baseResult(question),
            total_responses: totalResponses,
            distribution: distribution.map((d) => ({ month: d.month, count: parseInt(d.count) })),
        };
    }

    // TEXT / PARAGRAPH / EMAIL
    _normalizeText(text) {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/\s+/g, " ")
            .trim();
    }

    _similarity(a, b) {
        const setA = new Set(a.split(" "));
        const setB = new Set(b.split(" "));

        const intersection = [...setA].filter(x => setB.has(x)).length;
        const union = new Set([...setA, ...setB]).size;

        return union === 0 ? 0 : intersection / union;
    }

    async _textAnalytics(
        question,
        answerWhere,
        totalResponses,
        {
            page = 1,
            limit = 50,
            ai_mode = false,
            minLength = 5,
            minWords = 2,
            similarityThreshold = 0.6
        } = {}
    ) {
        const offset = (page - 1) * limit;

        const queryOptions = ai_mode
            ? {
                where: answerWhere,
                attributes: ["answer_text"],
            }
            : {
                where: answerWhere,
                attributes: ["id", "answer_text", "created_at"],
                order: [["created_at", "DESC"]],
                limit,
                offset,
            };

        const { rows, count } = await this.Answer.findAndCountAll(queryOptions);

        if (!ai_mode) {
            const wordFrequency = ["TEXT", "PARAGRAPH"].includes(question.type)
                ? computeWordFrequency(rows.map((a) => a.answer_text).filter(Boolean))
                : [];

            return {
                ...this._baseResult(question),
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
                ...(wordFrequency.length && {
                    word_frequency: wordFrequency.slice(0, 30),
                }),
            };
        }

        const clusters = [];

        for (let row of rows) {
            const raw = row.answer_text;
            if (!raw) continue;

            const normalized = this._normalizeText(raw);

            if (normalized.length < minLength) continue;

            const words = normalized.split(" ");
            if (words.length < minWords) continue;

            let matched = false;

            for (let cluster of clusters) {
                const score = this._similarity(normalized, cluster.text);

                if (score >= similarityThreshold) {
                    cluster.count += 1;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                clusters.push({
                    text: normalized,
                    count: 1,
                });
            }
        }

        const totalCleaned =
            clusters.reduce((sum, c) => sum + c.count, 0) || 1;

        const cleanedAnswers = clusters
            .map((c) => ({
                text: c.text,
                count: c.count,
                percent: toPercent(c.count, totalCleaned),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        return {
            ...this._baseResult(question),
            total_responses: totalResponses,

            cleaned_answers: cleanedAnswers,
        };
    }
}

export default QuestionAnalyticsService;
