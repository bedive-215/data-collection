import { AppError } from "../../middlewares/handleException.middlware.js";

export function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarity(a, b) {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));

  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;

  return union === 0 ? 0 : intersection / union;
}

function computeWordFrequency(texts, { computeWordFrequencyFn } = {}) {
  if (computeWordFrequencyFn) return computeWordFrequencyFn(texts);
  // Fallback: keep behaviour consistent with existing helper usage
  const freq = {};
  for (const text of texts) {
    const words = String(text)
      .toLowerCase()
      .replace(/[^a-zA-ZÀ-ỹ\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !new Set(["the", "a", "an"]).has(w));

    for (const w of words) freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({ word, count }));
}

export async function textAnalytics({
  models,
  question,
  answerWhere,
  totalResponses,
  textOpts = {},
  computeWordFrequencyFn,
}) {
  const {
    page = 1,
    limit = 50,
    ai_mode = false,
    minLength = 5,
    minWords = 2,
    similarityThreshold = 0.6,
  } = textOpts;

  const offset = (page - 1) * limit;

  const queryOptions = ai_mode
    ? {
        where: answerWhere,
        attributes: ["answer_text"],
      }
    : {
        where: answerWhere,
        attributes: ["id", "answer_text", "created_at"],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      };

  const { Answer } = models;

  const { rows, count } = await Answer.findAndCountAll(queryOptions);

  // non-ai mode: include pagination + word frequency
  if (!ai_mode) {
    const wordFrequency = ["TEXT", "PARAGRAPH"].includes(question.type)
      ? computeWordFrequency(rows.map((a) => a.answer_text).filter(Boolean), {
          computeWordFrequencyFn,
        })
      : [];

    return {
      question_id: question.id,
      question_content: question.content,
      type: question.type,
      total_responses: totalResponses,
      pagination: {
        page,
        limit,
        total_pages: Math.ceil(count / limit),
        total_answers: count,
      },
      answers: rows.map((a) => ({
        id: a.id,
        text: a.answer_text,
        submitted_at: a.created_at,
      })),
      ...(wordFrequency.length && {
        word_frequency: wordFrequency.slice(0, 30),
      }),
    };
  }

  // ai_mode: clustering/cleaned answers
  const clusters = [];

  for (const row of rows) {
    const raw = row.answer_text;
    if (!raw) continue;

    const normalized = normalizeText(raw);

    if (normalized.length < minLength) continue;

    const words = normalized.split(" ");
    if (words.length < minWords) continue;

    let matched = false;

    for (const cluster of clusters) {
      const score = similarity(normalized, cluster.text);

      if (score >= similarityThreshold) {
        cluster.count += 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({
        text: normalized,
        count: 1,
      });
    }
  }

  const totalCleaned = clusters.reduce((sum, c) => sum + c.count, 0) || 1;

  const cleanedAnswers = clusters
    .map((c) => ({
      text: c.text,
      count: c.count,
      percent: totalCleaned ? parseFloat(((c.count / totalCleaned) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    question_id: question.id,
    question_content: question.content,
    type: question.type,
    total_responses: totalResponses,
    cleaned_answers: cleanedAnswers,
  };
}

export function assertQuestionTypeSupported(question) {
  if (!question) throw new AppError("Question not found", 404);
  return true;
}

