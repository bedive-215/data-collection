import { AI_CHOICE_QUESTION_TYPES, AI_QUESTION_TYPES } from "#domain/aiQuestion.domain.js";

const VALID_TYPES = new Set(AI_QUESTION_TYPES);

export function stripHtml(s) {
  if (!s || typeof s !== "string") return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeOption(opt, i) {
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

export function normalizeQuestion(q, index) {
  const content = stripHtml(String(q?.content ?? "")).slice(0, 5000);
  if (!content) return null;

  let type = String(q?.type ?? "TEXT").toUpperCase().trim();
  if (!VALID_TYPES.has(type)) type = "TEXT";

  const required = q?.required !== false;
  let options = Array.isArray(q?.options) ? q.options.map(normalizeOption).filter(Boolean) : [];

  if (AI_CHOICE_QUESTION_TYPES.includes(type)) {
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

export function normalizeQuestionList(rawList) {
  const normalizedList = Array.isArray(rawList) ? rawList : (rawList?.questions ?? []);
  return normalizedList
    .map((q, i) => normalizeQuestion(q, i))
    .filter(Boolean)
    .slice(0, 40)
    .map((q, i) => ({ ...q, order_index: i }));
}
