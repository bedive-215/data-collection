import { formatDate } from "../../../helpers/aiChat.helper.js";
import models from "../../../models/index.js";
import { buildSurveyAnalytics, buildTrendResponse, buildCompletionStats } from "../builders/analytics.builder.js";

const { Survey, Response, SurveyParticipant } = models;

export async function getSurveyAnalytics({ args, user }) {
  const { survey_id } = args;

  if (!survey_id) {
    return {
      _reply: "Bạn cho mình biết tên khảo sát muốn xem thống kê được không?",
      need_search: true
    };
  }

  const survey = await Survey.findOne({
    where: { id: survey_id, created_by: user.id },
    attributes: ["id", "title", "created_at"],
  });

  if (!survey) {
    return {
      _reply: "Không tìm thấy khảo sát.",
      need_search: true
    };
  }

  const [respCount, partCount] = await Promise.all([
    Response.count({ where: { survey_id } }),
    SurveyParticipant.count({ where: { survey_id } }),
  ]);

  const rate = partCount > 0
    ? Math.round((respCount / partCount) * 100)
    : 0;

  const data = {
    title: survey.title,
    created_at: survey.created_at,
    response_count: respCount,
    participant_count: partCount,
    completion_rate: rate
  };

  return {
    id: survey.id,
    ...data,
    _reply: buildSurveyAnalytics(data)
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