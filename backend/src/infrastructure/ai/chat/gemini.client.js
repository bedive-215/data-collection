import { GoogleGenAI } from "@google/genai";
import {
  createUserContent,
  createModelContent,
  createPartFromText,
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
} from "@google/genai";
import { getGeminiConfig } from "#configs/ai.config.js";
import { buildSystemPrompt } from "#ai/core/prompts/system.prompt.js";
import { TOOL_DECLARATIONS } from "#ai/core/tools/tool.declarations.js";

import { withRetry } from "#utils/retry.js";

function buildHistoryContents(history = []) {
  return history
    .slice(-4)
    .filter(m => {
      if (m.role === "assistant" && /Người dùng:|Survey:|Câu hỏi:|Phản hồi:/.test(m.content)) {
        return false;
      }
      return m.content?.trim();
    })
    .map((m) => {
      if (m.role === "user") return createUserContent(createPartFromText(m.content));
      return createModelContent(createPartFromText(m.content));
    });
}

function getClient() {
  const { key } = getGeminiConfig();
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  return new GoogleGenAI({ apiKey: key });
}

// call with tool
export async function callLLMWithTools({ message, history }) {
  const { model } = getGeminiConfig();
  const ai = getClient();
  const contents = [
    ...buildHistoryContents(history),
    createUserContent(createPartFromText(message)),
  ];
  return withRetry(() => ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(),
      temperature: 0.1,
      maxOutputTokens: 512,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    },
  }));
}

// call llm for 
export async function callLLM({ message, history, toolCall, toolResult }) {
  const { model } = getGeminiConfig();
  const ai = getClient();
  const contents = [
    ...buildHistoryContents(history),
    createUserContent(createPartFromText(message)),
    createModelContent(createPartFromFunctionCall(toolCall.name, toolCall.arguments)),
    createUserContent(createPartFromFunctionResponse(toolCall.name, JSON.stringify(toolResult))),
  ];
  return withRetry(() => ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(),
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  }));
}