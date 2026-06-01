export const AI_QUESTION_TYPES = Object.freeze([
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

export const AI_CHOICE_QUESTION_TYPES = Object.freeze([
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
]);

export const AI_QUESTION_SYSTEM_PROMPT =
  "You are an expert survey designer. Return ONLY valid JSON. No markdown. No code fences. No explanations.";

export function clampQuestionCount(count, fallback = 8) {
  return Math.min(20, Math.max(3, Number(count) || fallback));
}
