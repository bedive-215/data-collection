import { buildList } from "../builders/core.builder.js";
import { getStatusEmoji, formatDate } from "../../../helpers/aiChat.helper.js";
import { getSurveyStatus } from "../../../domain/survey.domain.js";

export function formatSurveyLine(s, index = null) {
    const emoji = getStatusEmoji(s.status);
    const prefix = index !== null ? `${index + 1}. ` : "";
    return `${prefix}${emoji} **${s.title}**
   📝 ${s.question_count} câu · 💬 ${s.response_count} phản hồi · 👥 ${s.participant_count}`;
}

export function buildSurveyListMessage(surveys) {
  if (!surveys.length) {
    return buildList("📋 **Danh sách khảo sát của bạn**", [
      "Bạn chưa có khảo sát nào. Hãy tạo khảo sát đầu tiên nhé!",
    ]);
  }

  const items = [
    `Tổng cộng: **${surveys.length}** khảo sát\n`,
    ...surveys.slice(0, 10).map((s, i) => formatSurveyLine(s, i)),
  ];

  if (surveys.length > 10) {
    items.push(`\n...và ${surveys.length - 10} khảo sát khác`);
  }

  items.push(`\n💡 Muốn làm gì tiếp?`);

  return buildList("📋 **Danh sách khảo sát của bạn**", items);
}

export function buildSearchSurveyMessage(keyword, surveys) {
  if (!surveys.length) {
    return buildList(`🔍 Kết quả: "${keyword}"`, [
      "Không tìm thấy khảo sát nào.",
      "Bạn có muốn tạo khảo sát mới không?",
    ]);
  }

  return buildList(
    `🔍 Kết quả: "${keyword}"`,
    surveys.map((s, i) => formatSurveyLine(s, i))
  );
}

export function buildSurveyDetailMessage(survey, stats) {
  const { responseCount, participantCount } = stats;

  const status = getSurveyStatus(survey);
  const emoji = getStatusEmoji(status);

  const lines = [
    `${emoji} **${survey.title}**`,
    `━━━━━━━━━━━━━━━━━━`,
    `📝 Mô tả: ${survey.description || "(không có)"}`,
    `📅 Tạo: ${formatDate(survey.created_at)} | Bắt đầu: ${formatDate(survey.start_at)} | Kết thúc: ${formatDate(survey.end_at)}`,
    `━━━━━━━━━━━━━━━━━━`,
    `📊 Câu hỏi: **${survey.questions?.length || 0}** | Phản hồi: **${responseCount}** | Tham gia: **${participantCount}**`,
    `🎯 Tỷ lệ hoàn thành: **${participantCount > 0 ? Math.round((responseCount / participantCount) * 100) : 0}%**`,
  ];

  if (survey.questions?.length > 0) {
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`**📋 Câu hỏi (${survey.questions.length}):**`);

    survey.questions.forEach((q, i) => {
      lines.push(`  ${i + 1}. [${q.type}] ${q.content}`);
    });
  }

  lines.push(`━━━━━━━━━━━━━━━━━━\n💡 Thêm câu hỏi, xem thống kê, hay chỉnh sửa?`);

  return lines.join("\n");
}

export function buildSurveyAnalyticsMessage(survey, stats) {
  const { respCount, partCount } = stats;

  const rate = partCount > 0
    ? Math.round((respCount / partCount) * 100)
    : 0;

  const lines = [
    `📊 **Thống kê: "${survey.title}"**`,
    `━━━━━━━━━━━━━━━━━━`,
    `💬 Phản hồi: **${respCount}**`,
    `👥 Người tham gia: **${partCount}**`,
    `🎯 Tỷ lệ hoàn thành: **${rate}%**`,
    `📅 Tạo: ${formatDate(survey.created_at)}`,
    `━━━━━━━━━━━━━━━━━━`,
  ];

  if (respCount === 0) {
    lines.push(`📭 Chưa có phản hồi nào. Hãy chia sẻ survey để thu thập phản hồi!`);
  } else {
    lines.push(`💡 Xem chi tiết (NPS, Cross-tab, Trend, Heatmap...) trong trang Analytics.`);
  }

  return lines.join("\n");
}

export function buildCreateSurveyMessage(survey) {
  return [
    `✅ **Đã tạo khảo sát thành công!**`,
    `━━━━━━━━━━━━━━━━━━`,
    `📌 Tiêu đề: **${survey.title}**`,
    `📝 Mô tả: ${survey.description || "(không có)"}`,
    `🟢 Status: **Đang hoạt động**`,
    `🔑 ID: \`${survey.id}\``,
    ``,
    `💡 Bước tiếp theo:`,
    `• Thêm câu hỏi vào survey`,
    `• Công khai survey`,
    `• Xem và chỉnh sửa survey`,
  ].join("\n");
}

export function buildAddQuestionsMessage(survey, created, total) {
  const lines = [
    `✅ **Đã thêm ${created.length} câu hỏi vào "${survey.title}"!**`,
  ];

  created.forEach((q, i) => {
    lines.push(`${i + 1}. [${q.type}] ${q.content}`);
  });

  lines.push(`━━━━━━━━━━━━━━━━━━`);
  lines.push(`📊 Tổng câu hỏi: **${total}**`);

  return lines.join("\n");
}