import OpenAI from "openai";
import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import _checkSurveyAccess from "../utils/checkSurveyAccess.js";

/** Đọc env lúc gọi API — tránh undefined khi module load trước dotenv */
function getOpenAIConfig() {
  const key = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

async function callOpenAIJson(system, userContent) {
  const { key, model } = getOpenAIConfig();

  if (!key) {
    throw new AppError("Missing OPENAI_API_KEY", 500);
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const response = await client.responses.create({
      model,
      input: `${system}\n\n${userContent}`,
      temperature: 0.35,
      max_output_tokens: 1200,
    });

    const text =
      response.output_text ||
      (Array.isArray(response.output)
        ? response.output
            .map((item) => (item.type === "output_text" ? item.text : ""))
            .join("")
        : "");

    if (!text) {
      throw new AppError("AI không trả về nội dung hợp lệ", 500);
    }

    return JSON.parse(text).questions;
  } catch (err) {
    const statusCode = err?.status || err?.statusCode || 500;
    const code = err?.code || err?.error?.code || err?.type;
    const message =
      code === "insufficient_quota"
        ? "OpenAI quota đã hết. Vui lòng kiểm tra plan và billing của bạn."
        : err?.message || "Lỗi gọi OpenAI";

    throw new AppError(message, statusCode === 429 ? 429 : 500);
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
      "You are an expert survey designer. Always respond with a single JSON object only, no prose.";

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

    const rawList = await callOpenAIJson(system, userPrompt);
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
