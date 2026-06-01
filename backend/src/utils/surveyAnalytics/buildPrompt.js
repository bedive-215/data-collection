import { jsonToToon } from "../jsonToToon.js";

export function buildAnalyticsPrompt(cleanedData) {
    const optimizedData = jsonToToon(cleanedData);
    return `
        Dưới đây là dữ liệu khảo sát. Hãy phân tích và trả lời:
        1. Tóm tắt ngắn gọn kết quả từng câu hỏi (1–2 dòng/câu)
        2. 3 insight quan trọng nhất từ toàn bộ dữ liệu
        3. Với câu hỏi mở (PARAGRAPH), nhóm các câu trả lời thành chủ đề chính

        Dữ liệu:
        ${optimizedData}

        Trả lời theo ngôn ngữ trong dữ liệu, dùng markdown.
    `.trim();
}
