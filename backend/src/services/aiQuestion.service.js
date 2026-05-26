import { GoogleGenAI } from "@google/genai";
import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import _checkSurveyAccess from "../utils/checkSurveyAccess.js";

/** Đọc env lúc gọi API — tránh undefined khi module load trước dotenv */
function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return { key, model };
}

const VALID_TYPES = new Set([
  "TEXT",
  "PARAGRAPH",
  "EMAIL",
  "DATE",
  "NUMBER",
  "RATING",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
]);

function stripHtml(s) {
  if (!s || typeof s !== "string") return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeOption(opt, i) {
  if (typeof opt === "string") {
    const t = opt.trim();
    return t ? { label: t, value: `opt_${i + 1}`, order_index: i, is_other: false } : null;
  }
  const label = String(opt?.label ?? "").trim();
  const value = String(opt?.value ?? "").trim() || `opt_${i + 1}`;
  if (!label) return null;
  return {
    label,
    value,
    order_index: opt?.order_index ?? i,
    is_other: Boolean(opt?.is_other),
  };
}

function normalizeQuestion(q, index) {
  let content = stripHtml(String(q?.content ?? "")).slice(0, 5000);
  if (!content) return null;

  let type = String(q?.type ?? "TEXT").toUpperCase().trim();
  if (!VALID_TYPES.has(type)) type = "TEXT";

  const required = q?.required !== false;

  let options = Array.isArray(q?.options) ? q.options.map(normalizeOption).filter(Boolean) : [];

  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(type)) {
    if (options.length < 2) {
      type = "TEXT";
      options = [];
    }
  } else {
    options = [];
  }

  let settings = q?.settings;
  if (type === "RATING") {
    const min = Number.isFinite(Number(settings?.min)) ? Number(settings.min) : 1;
    const max = Number.isFinite(Number(settings?.max)) ? Number(settings.max) : 5;
    settings = min < max ? { min, max } : { min: 1, max: 5 };
  } else if (type === "NUMBER" && settings && typeof settings === "object") {
    const min = settings.min !== undefined ? Number(settings.min) : undefined;
    const max = settings.max !== undefined ? Number(settings.max) : undefined;
    settings = {};
    if (Number.isFinite(min)) settings.min = min;
    if (Number.isFinite(max)) settings.max = max;
  } else {
    settings = null;
  }

  return {
    content,
    type,
    required,
    order_index: index,
    settings,
    options: options.length ? options : undefined,
  };
}

function buildPromptParse(rawText) {
  return `You split user text into separate survey questions. The user may paste numbered lists (1. 2. 3. or Câu 1, Câu 2), bullet points, or free-form paragraphs.

Rules:
- Output STRICT JSON object: { "questions": [ ... ] } only, no markdown.
- Each item: { "content": string (plain text only), "type": one of TEXT,PARAGRAPH,EMAIL,DATE,NUMBER,RATING,SINGLE_CHOICE,MULTIPLE_CHOICE,DROPDOWN, "required": boolean, "options"?: [{ "label": string, "value": string }] }
- Prefer TEXT for short answers; PARAGRAPH for "mô tả", "giải thích".
- If a block has clear A/B/C choices or "Không / Có / Khác", use SINGLE_CHOICE with 2-6 options (value slug ascii, e.g. yes, no).
- Preserve meaning; do not invent facts. Merge broken lines that belong to one question.
- Max 40 questions. Skip empty fragments.

USER TEXT:
---
${rawText.slice(0, 100000)}
---
`;
}

function buildPromptGenerate({ surveyTitle, surveyDescription, count }) {
  const desc = surveyDescription?.trim() || "(none)";
  return `You create survey questions for a Vietnamese / bilingual audience.

Survey title: ${surveyTitle.trim()}
Survey description: ${desc}

Rules:
- Output STRICT JSON object: { "questions": [ ... ] } only, no markdown.
- Generate exactly ${count} questions, ordered logically (demographics → topic → feedback).
- Mix types: mostly TEXT and SINGLE_CHOICE, 1-2 RATING, optional one EMAIL or NUMBER if relevant.
- Each item: { "content": string (plain Vietnamese or bilingual, plain text), "type": TEXT|PARAGRAPH|EMAIL|DATE|NUMBER|RATING|SINGLE_CHOICE|MULTIPLE_CHOICE|DROPDOWN, "required": boolean, "options"?: [...] }
- For choice questions provide 3-5 sensible options; value lowercase slug.
- Do not repeat title verbatim in every question; be specific to the topic.
`;
}

async function callGeminiJson(system, userContent) {
  const { key, model } = getGeminiConfig();

  if (!key) {
    throw new AppError("Missing GEMINI_API_KEY", 500);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
    });

    const response = await ai.models.generateContent({
      model,
      contents: `${system}\n\n${userContent}`,
    });

    const text = response.text;

    if (!text) {
      throw new AppError("Gemini không trả về nội dung", 500);
    }

    // Gemini hay bọc ```json
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned).questions;
  } catch (err) {
    console.error("Gemini Error:", err);

    throw new AppError(
      err?.message || "Lỗi gọi Gemini API",
      500
    );
  }
}
class AiQuestionService {
  constructor() {
    this.Survey = models.Survey;
  }

  async suggestQuestions(surveyId, body, user) {
    const survey = await this.Survey.findByPk(surveyId);
    if (!survey) throw new AppError("Survey not found", 404);

    const role = await _checkSurveyAccess(user, survey);
    if (!["editor"].includes(role)) {
      throw new AppError("Forbidden", 403);
    }

    const { mode, rawText, surveyTitle, surveyDescription, count = 8 } = body;

    const system =
      "You are an expert survey designer. Return ONLY valid JSON. No markdown. No code fences. No explanations.";

    let userPrompt;
    if (mode === "parse") {
      userPrompt = buildPromptParse(rawText);
    } else {
      const n = Math.min(20, Math.max(3, Number(count) || 8));
      userPrompt = buildPromptGenerate({
        surveyTitle,
        surveyDescription,
        count: n,
      });
    }

    const rawList = await callGeminiJson(system, userPrompt);
    const questions = rawList
      .map((q, i) => normalizeQuestion(q, i))
      .filter(Boolean)
      .slice(0, 40)
      .map((q, i) => ({ ...q, order_index: i }));

    if (questions.length === 0) {
      throw new AppError("AI không tạo được câu hỏi hợp lệ", 400);
    }

    return {
      message: "OK",
      count: questions.length,
      questions,
    };
  }
}

export default new AiQuestionService();
