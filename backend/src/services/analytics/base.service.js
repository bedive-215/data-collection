import { Op } from "sequelize";

class BaseAnalyticsService {
    constructor(models) {
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Answer = models.Answer;
        this.Response = models.Response;
        this.sequelize = models.sequelize;
        this.User = models.User;
    }

    _buildResponseWhere(survey_id, filters = {}) {
        const where = { survey_id };
        if (filters.date_from || filters.date_to) {
            where.created_at = {};
            if (filters.date_from) {
                // Start of day UTC — include the whole day_from
                const startDate = new Date(filters.date_from);
                startDate.setUTCHours(0, 0, 0, 0);
                where.created_at[Op.gte] = startDate;
            }
            if (filters.date_to) {
                // FIX: use END of day UTC so responses at any time on date_to are included.
                // new Date("2026-05-16") = 2026-05-16T00:00:00.000Z (midnight) which would
                // exclude responses created after midnight UTC on the same date.
                const endDate = new Date(filters.date_to);
                endDate.setUTCHours(23, 59, 59, 999);
                where.created_at[Op.lte] = endDate;
            }
        }
        if (filters.response_ids?.length) {
            where.id = { [Op.in]: filters.response_ids };
        }
        if (filters.status && ["IN_PROGRESS", "COMPLETED"].includes(filters.status)) {
            where.status = filters.status;
        }
        return where;
    }

    async _resolveResponseIds(survey_id, filters = {}) {
        if (filters.response_ids?.length) return filters.response_ids;

        const rows = await this.Response.findAll({
            where: this._buildResponseWhere(survey_id, filters),
            attributes: ["id"],
            raw: true,
        });
        return rows.map((r) => r.id);
    }

    _emptyResult(question_id, type) {
        return { question_id, type, total_responses: 0 };
    }
}

export default BaseAnalyticsService;
