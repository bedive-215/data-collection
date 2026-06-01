export function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return { key, model };
}

