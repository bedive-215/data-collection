import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  createPartFromText,
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
  createUserContent,
  createModelContent,
} from "@google/genai";
import { Op } from "sequelize";
import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { getSurveyStatus } from "../domain/survey.domain.js";
import { getGeminiConfig } from "../helpers/getAiConfig.helper.js";
import { TOOL_DECLARATIONS } from "../domain/aiChat.domain.js";
import { formatDate } from "../helpers/aiChat.helper.js";
import { executeTool } from "../ai/tools/execute.tool.js";
import { buildSystemPrompt } from "../domain/aiChat.domain.js";

const { key, model } = getGeminiConfig();

// ─── INTENT DETECTION (fast path — no AI needed) ───────────────────────
function detectIntent(msg) {
  const lower = msg.toLowerCase();

  // List surveys
  if (/^(liệt kê|danh sách|xem|hiển thị|kể|cho tôi|xem nào)\b.*(khảo sát|survey|bảng khảo sát|các khảo sát|của tôi)|^(tôi có|cho xem|hiện|tất cả).*(khảo|survey|survey)/.test(lower) ||
    /^liệt\s*kê/.test(lower) ||
    /^(tôi có bao nhiêu|show me|list)\b/.test(lower)) {
    return { tool: "list_my_surveys", args: {} };
  }

  // System overview
  if (/tổng quan|hệ thống|thống kê chung|overview|system/i.test(lower) &&
    !/(khảo.sát|survey)/.test(lower)) {
    return { tool: "get_system_overview", args: {} };
  }

  // My responses
  if (/phản hồi\s*(của\s*)?tôi|lịch sử|responses\s*me/.test(lower)) {
    return { tool: "get_my_responses", args: {} };
  }

  // Notifications
  if (/thông báo|notification|bell/i.test(lower)) {
    return { tool: "get_notifications", args: {} };
  }

  // Analytics for a named survey
  const surveyMatch = lower.match(/(?:thống kê|xem|phân tích|xem thống kê|cStat)\b.*(?:khảo sát|survey)[s]?\s*(?:về |của |\"?|')?(.+)/);
  if (surveyMatch) {
    return { tool: "search_surveys", args: { keyword: surveyMatch[1].trim() } };
  }

  // Create survey
  if (/^(tạo|mới|làm|mở)\b.*(khảo sát|survey)/.test(lower) ||
    /^tạo\s*(khảo|mới)\b/.test(lower)) {
    const titleMatch = lower.match(/(?:tạo|mới|làm)\b.*(?:khảo sát|survey)\s*(?:về |có tiêu đề |tên |\"?|')?(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : "Khảo sát mới";
    return { tool: "create_survey", args: { title } };
  }

  // Survey detail by name
  const detailMatch = lower.match(/(?:xem|chi tiết|detail)\b.*(?:khảo sát|survey)[s]?\s*(?:về |của |\"?|')?(.+)/);
  if (detailMatch) {
    return { tool: "search_surveys", args: { keyword: detailMatch[1].trim() } };
  }

  return null; // Let AI decide
}

// ─── MAIN CHAT ───────────────────────────────────────────────────────────

async function chatWithAgent(userMessage, conversationHistory = [], user) {
  if (!userMessage?.trim()) throw new Error("Tin nhắn không được để trống");
  if (String(userMessage).length > 2000) throw new Error("Tin nhắn quá dài (tối đa 2000 ký tự)");

  const { key, model } = getGeminiConfig();
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const ai = new GoogleGenAI({ apiKey: key });

  // Build contents array using proper helper functions
  const contents = [];
  for (const m of conversationHistory.slice(-4)) {
    if (m.role === "user") {
      contents.push(createUserContent(createPartFromText(m.content)));
    } else {
      contents.push(createModelContent(createPartFromText(m.content)));
    }
  }

  const userContent = createUserContent(createPartFromText(String(userMessage).trim()));

  // ── FAST PATH: Intent detection (no AI needed) ──
  const intent = detectIntent(String(userMessage).trim());
  if (intent) {
    let toolResult;
    try {
      toolResult = await executeTool(intent.tool, intent.args, user);
    } catch (err) {
      return {
        reply: `❌ ${err?.message || "Lỗi khi thực hiện"}`,
        timestamp: new Date().toISOString(),
        action: null,
      };
    }

    const reply = toolResult._reply?.trim() || "Đã xong!";
    return {
      reply,
      timestamp: new Date().toISOString(),
      action:
        toolResult?.action || toolResult?.id
          ? {
            type: toolResult.action || "VIEW",
            surveyId: toolResult.id || intent.args?.survey_id || null,
            data: toolResult,
          }
          : null,
    };
  }

  // ── SLOW PATH: AI decides what tool to call ──
  const firstResponse = await ai.models.generateContent({
    model,
    contents: [...contents, userContent],
    config: {
      systemInstruction: buildSystemPrompt(),
      temperature: 0.1,
      maxOutputTokens: 512,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.ANY },
      },
    },
  });

  const firstCalls = firstResponse.functionCalls || [];

  // Case 1: No tool → return text directly
  if (firstCalls.length === 0) {
    const text = firstResponse.text?.trim() || "";
    return {
      reply: text || "Mình chưa hiểu ý bạn. Bạn có thể diễn đạt lại được không?",
      timestamp: new Date().toISOString(),
      action: null,
    };
  }

  // Case 2: Execute tool
  const call = firstCalls[0];
  const fnName = call.name;
  const fnArgs = call.arguments || {};

  let toolResult;
  try {
    toolResult = await executeTool(fnName, fnArgs, user);
  } catch (err) {
    return {
      reply: `❌ ${err?.message || "Lỗi khi thực hiện"}`,
      timestamp: new Date().toISOString(),
      action: null,
    };
  }

  // ── STEP 2: Generate reply from tool result ──
  const replyResponse = await ai.models.generateContent({
    model,
    contents: [
      ...contents,
      userContent,
      createModelContent(createPartFromFunctionCall(fnName, fnArgs)),
      createUserContent(createPartFromFunctionResponse(fnName, JSON.stringify(toolResult))),
    ],
    config: {
      systemInstruction: buildSystemPrompt(),
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  });

  // Ưu tiên _reply từ backend, fallback sang AI text
  const preFormatted = toolResult._reply?.trim();
  const aiText = replyResponse.text?.trim() || "";
  const reply = preFormatted || aiText || "Đã xong!";

  return {
    reply,
    timestamp: new Date().toISOString(),
    action:
      toolResult?.action || toolResult?.id
        ? {
          type: toolResult.action || "VIEW",
          surveyId: toolResult.id || fnArgs.survey_id || null,
          data: toolResult,
        }
        : null,
  };
}

class AiChatService {
  async chat(userMessage, conversationHistory, user) {
    return chatWithAgent(userMessage, conversationHistory, user);
  }
}

export default new AiChatService();
