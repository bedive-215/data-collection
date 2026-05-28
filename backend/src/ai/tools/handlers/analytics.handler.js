import { Op } from "sequelize";
import models from "../../../models/index.js";
import {
  buildSurveyAnalytics,
  buildTrendResponse,
  buildCompletionStats
} from "../builders/analytics.builder.js";

const { Survey, Response, SurveyParticipant } = models;

export async function getSurveyAnalytics({ args, user }) {
  let survey;

  if (args.survey_id) {
    survey = await Survey.findByPk(args.survey_id);
  } else if (args.keyword) {
    survey = await Survey.findOne({
      where: {
        created_by: user.id,
        title: { [Op.like]: `%${args.keyword}%` }
      }
    });
  }

  if (!survey) {
    return {
      _reply: "Mình không tìm thấy khảo sát phù hợp.",
      need_search: true
    };
  }

  console.log("Found survey for analytics:", survey);

  return {
    id: survey.id,
    _reply: buildSurveyAnalytics({
      title: survey.title,
      created_at: survey.createdAt,
      response_count: responseCount,
    }),
  };
}

export async function getResponseTrend({ args }) {
  const { survey_id, group_by } = args;

  if (!survey_id) {
    return { _reply: "Bạn cho mình biết tên khảo sát được không?", need_search: true };
  }

  const responses = await Response.findAll({
    where: { survey_id },
    attributes: ["submitted_at"],
    raw: true,
  });

  const trendMap = {};

  responses.forEach(r => {
    if (!r.submitted_at) return;

    const d = new Date(r.submitted_at);
    let key;

    if (group_by === "week") key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    else if (group_by === "month") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    else key = d.toISOString().split("T")[0];

    trendMap[key] = (trendMap[key] || 0) + 1;
  });

  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }));

  const label =
    group_by === "week" ? "tuần" :
      group_by === "month" ? "tháng" : "ngày";

  return {
    survey_id,
    trend,
    _reply: buildTrendResponse({ trend, label })
  };
}

export async function getCompletionStats({ args }) {
  const { survey_id } = args;

  if (!survey_id) {
    return { _reply: "Bạn cho mình biết tên khảo sát được không?", need_search: true };
  }

  const [completed, inProgress, totalParticipants] = await Promise.all([
    Response.count({ where: { survey_id, status: "COMPLETED" } }),
    Response.count({ where: { survey_id, status: "IN_PROGRESS" } }),
    SurveyParticipant.count({ where: { survey_id } }),
  ]);

  const rate = totalParticipants > 0
    ? Math.round((completed / totalParticipants) * 100)
    : 0;

  const data = {
    completed,
    in_progress: inProgress,
    total_participants: totalParticipants,
    completion_rate: rate
  };

  return {
    survey_id,
    ...data,
    _reply: buildCompletionStats(data)
  };
}