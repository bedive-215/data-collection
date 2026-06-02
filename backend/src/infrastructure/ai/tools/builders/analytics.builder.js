import { buildList, statLine, hint, emptyState } from "./core.builder.js";
import { formatDate } from "#helpers/aiChat.helper.js";

export function buildSurveyAnalytics(data) {
  const {
    title,
    created_at,
    response_count,
  } = data;

  const stats = [
    statLine("Phản hồi", response_count),
    `Tạo: ${formatDate(created_at)}`
  ];

  const footer = response_count === 0
    ? emptyState("Chưa có phản hồi nào. Hãy chia sẻ survey!")
    : hint("Xem chi tiết (NPS, Trend, Heatmap...) trong Analytics");

  return buildList(`Thống kê: "${title}"`, [...stats, "", footer]);
}

export function buildTrendResponse({ trend, label }) {
  if (!trend.length) {
    return buildList(
      `Xu hướng phản hồi (theo ${label})`,
      ["Chưa có dữ liệu."]
    );
  }

  return buildList(
    `Xu hướng phản hồi (theo ${label})`,
    trend.map(t => `**${t.period}**: ${t.count} phản hồi`)
  );
}

export function buildCompletionStats(data) {
  const {
    completed,
    in_progress,
    total_participants,
    completion_rate
  } = data;

  return buildList(
    "Tỷ lệ hoàn thành",
    [
      statLine("Hoàn thành", completed),
      statLine("Đang làm", in_progress),
      statLine("Tổng tham gia", total_participants),
      statLine("Tỷ lệ", `${completion_rate}%`)
    ]
  );
}

