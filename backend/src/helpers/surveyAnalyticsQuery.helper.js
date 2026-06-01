import { Op } from "sequelize";

const stableSerialize = (value) => {
    if (Array.isArray(value)) {
        return `[${value.map(stableSerialize).join(",")}]`;
    }

    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
};

export function buildResponseWhere(survey_id, filters = {}) {
    const where = { survey_id };

    if (filters.date_from || filters.date_to) {
        where.created_at = {};
        if (filters.date_from) {
            const startDate = new Date(filters.date_from);
            startDate.setUTCHours(0, 0, 0, 0);
            where.created_at[Op.gte] = startDate;
        }
        if (filters.date_to) {
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

export function buildAiAnalyticsCacheKey(survey_id, filters = {}) {
    const normalizedFilters = stableSerialize(filters);
    return `survey:${survey_id}:ai_analytics:${Buffer.from(normalizedFilters).toString("base64url")}`;
}
