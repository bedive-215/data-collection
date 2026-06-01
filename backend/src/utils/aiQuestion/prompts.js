export function buildPromptParse(rawText) {
  return `You split user text into separate survey questions. The user may paste numbered lists (1. 2. 3. or Cau 1, Cau 2), bullet points, or free-form paragraphs.

Rules:
- Output STRICT JSON object: { "questions": [ ... ] } only, no markdown.
- Each item: { "content": string (plain text only), "type": one of TEXT,PARAGRAPH,EMAIL,DATE,NUMBER,RATING,SINGLE_CHOICE,MULTIPLE_CHOICE,DROPDOWN, "required": boolean, "options"?: [{ "label": string, "value": string }] }
- Prefer TEXT for short answers; PARAGRAPH for "mo ta", "giai thich".
- If a block has clear A/B/C choices or "Khong / Co / Khac", use SINGLE_CHOICE with 2-6 options (value slug ascii, e.g. yes, no).
- Preserve meaning; do not invent facts. Merge broken lines that belong to one question.
- Max 40 questions. Skip empty fragments.

USER TEXT:
---
${rawText.slice(0, 100000)}
---
`;
}

export function buildPromptGenerate({ surveyTitle, surveyDescription, count }) {
  const desc = surveyDescription?.trim() || "(none)";
  return `You create survey questions for a Vietnamese / bilingual audience.

Survey title: ${surveyTitle.trim()}
Survey description: ${desc}

Rules:
- Output STRICT JSON object: { "questions": [ ... ] } only, no markdown.
- Generate exactly ${count} questions, ordered logically (demographics -> topic -> feedback).
- Mix types: mostly TEXT and SINGLE_CHOICE, 1-2 RATING, optional one EMAIL or NUMBER if relevant.
- Each item: { "content": string (plain Vietnamese or bilingual, plain text), "type": TEXT|PARAGRAPH|EMAIL|DATE|NUMBER|RATING|SINGLE_CHOICE|MULTIPLE_CHOICE|DROPDOWN, "required": boolean, "options"?: [...] }
- For choice questions provide 3-5 sensible options; value lowercase slug.
- Do not repeat title verbatim in every question; be specific to the topic.
`;
}

export function buildAiQuestionPrompt({ mode, rawText, surveyTitle, surveyDescription, count }) {
  if (mode === "parse") {
    return buildPromptParse(rawText);
  }

  return buildPromptGenerate({
    surveyTitle,
    surveyDescription,
    count,
  });
}
