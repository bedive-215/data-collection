import { Op } from "sequelize";
import models from "../../../models/index.js";
import { buildSystemOverviewMessage } from "../builders/system.builder.js";

const { Survey, Question, Response, User } = models;

export async function getSystemOverview({ args, user }) {
    const [totalUsers, totalSurveys, totalQuestions, totalResponses] =
        await Promise.all([
            User.count(),
            Survey.count(),
            Question.count(),
            Response.count(),
        ]);

    const activeSurveys = await Survey.count({
        where: {
            start_at: {
                [Op.or]: [{ [Op.is]: null }, { [Op.lte]: new Date() }],
            },
            end_at: {
                [Op.or]: [{ [Op.is]: null }, { [Op.gte]: new Date() }],
            },
        },
    });

    const stats = {
        totalUsers,
        totalSurveys,
        activeSurveys,
        totalQuestions,
        totalResponses,
    };

    return {
        ...stats,
        _reply: buildSystemOverviewMessage(stats),
    };
}