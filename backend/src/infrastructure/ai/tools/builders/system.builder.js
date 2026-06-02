export function buildSystemOverviewMessage(stats) {
  const {
    totalUsers,
    totalSurveys,
    activeSurveys,
    totalQuestions,
    totalResponses,
  } = stats;

  return [
    `**Tổng quan hệ thống**`,
    ``,
    `Người dùng: ${totalUsers}`,
    `Survey: ${totalSurveys} (${activeSurveys} đang hoạt động)`,
    `Câu hỏi: ${totalQuestions}`,
    `Phản hồi: ${totalResponses}`,
  ].join("\n");
}