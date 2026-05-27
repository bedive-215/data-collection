export function buildSystemOverviewMessage(stats) {
  const {
    totalUsers,
    totalSurveys,
    activeSurveys,
    totalQuestions,
    totalResponses,
  } = stats;

  return [
    `📊 **Tổng quan hệ thống EchoForm**`,
    `━━━━━━━━━━━━━━━━━━`,
    `👥 Người dùng: **${totalUsers}**`,
    `📋 Tổng survey: **${totalSurveys}**`,
    `🟢 Survey đang hoạt động: **${activeSurveys}**`,
    `❓ Tổng câu hỏi: **${totalQuestions}**`,
    `💬 Tổng phản hồi: **${totalResponses}**`,
    `━━━━━━━━━━━━━━━━━━`,
  ].join("\n");
}