import models from "../../../models/index.js";

import { buildResponseList } from "../builders/response.builder.js";

const { Response, Survey } = models;

export async function getResponseDetail({ args, user }) {
    const responses = await Response.findAll({
        where: { user_id: user.id },
        order: [["submitted_at", "DESC"]],
        limit: 20,
        attributes: ["id", "survey_id", "status", "submitted_at", "created_at"],
        include: [{ model: Survey, as: "survey", attributes: ["title"] }],
    });

    const mapped = responses.map(r => ({
        id: r.id,
        survey_id: r.survey_id,
        survey_title: r.survey?.title,
        status: r.status,
        submitted_at: r.submitted_at || r.created_at
    }));

    return {
        responses: mapped,
        total: mapped.length,
        _reply: buildResponseList(mapped)
    };
}