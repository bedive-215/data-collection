import { buildList } from "./core.builder.js";
import { formatDate } from "../../../helpers/aiChat.helper.js";

export function formatResponseLine(r, index = null) {
  const statusText = r.status === "COMPLETED" ? "Hoàn thành" : "Đang làm";
  const prefix = index !== null ? `${index + 1}. ` : "";

  return `${prefix}${r.survey_title || "Khảo sát"}
${statusText} · ${formatDate(r.submitted_at)}`;
}

export function buildResponseList(responses) {
  if (!responses.length) {
    return buildList(
      "Phản hồi của bạn",
      ["Bạn chưa có phản hồi nào cho khảo sát nào."]
    );
  }

  return buildList(
    "Phản hồi của bạn",
    [
      `Bạn có ${responses.length} phản hồi:`,
      "",
      ...responses.map((r, i) => formatResponseLine(r, i))
    ]
  );
}