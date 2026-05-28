export function formatTextReply(text) {
  return {
    reply: text?.trim() || "Mình chưa hiểu ý bạn.",
    timestamp: new Date().toISOString(),
    action: null,
  };
}

export function formatToolResponse(toolResult = {}, aiText = "", args = {}) {
  const reply =
    toolResult._reply?.trim() ||
    aiText?.trim() ||
    "Đã xong!";

  return {
    reply,
    timestamp: new Date().toISOString(),
    action:
      toolResult?.action || toolResult?.id
        ? {
            type: toolResult.action || "VIEW",
            surveyId: toolResult.id || args?.survey_id || null,
            data: toolResult,
          }
        : null,
  };
}

export function formatError(err) {
  return {
    reply: err?.message || "Có lỗi xảy ra",
    timestamp: new Date().toISOString(),
    action: null,
  };
}