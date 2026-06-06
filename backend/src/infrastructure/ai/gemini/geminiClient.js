import { GoogleGenAI } from "@google/genai";

import { getGeminiConfig } from "#configs/ai.config.js";

let _client = null;
let _clientKey = null;

function getClient() {
  const { key } = getGeminiConfig();
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  if (!_client || _clientKey !== key) {
    _client = new GoogleGenAI({ apiKey: key });
    _clientKey = key;
  }

  return _client;
}

export async function generateText({ contents, model, config } = {}) {
  const { model: defaultModel } = getGeminiConfig();
  const ai = getClient();

  if (!contents) throw new Error("Missing gemini contents");

  const finalModel = model || defaultModel;
  const response = await ai.models.generateContent({
    model: finalModel,
    contents,
    config,
  });

  return response.text;
}

function extractJSON(text) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON object found");
  }

  return cleaned.substring(start, end + 1);
}

export async function generateJsonQuestions({
  system,
  userContent,
  model,
  config,
} = {}) {
  const text = await generateText({
    model,
    contents: `${system}\n\n${userContent}`,
    config,
  });

  if (!text) throw new Error("Gemini khong tra ve noi dung");

  try {
    const parsed = JSON.parse(text);
    return parsed.questions;
  } catch {
    try {
      const extracted = extractJSON(text);
      const parsed = JSON.parse(extracted);
      return parsed.questions;
    } catch (err) {
      throw new Error("AI response is not valid JSON");
    }
  }
}
