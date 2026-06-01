import { GoogleGenAI } from "@google/genai";
import { AppError } from "../../middlewares/handleException.middlware.js";

function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return { key, model };
}

export async function callGeminiJson(system, userContent) {
  const { key, model } = getGeminiConfig();

  if (!key) {
    throw new AppError("Missing GEMINI_API_KEY", 500);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model,
      contents: `${system}\n\n${userContent}`,
    });

    const text = response.text;
    if (!text) {
      throw new AppError("Gemini khong tra ve noi dung", 500);
    }

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned).questions;
  } catch (err) {
    console.error("Gemini Error:", err);
    throw new AppError(err?.message || "Loi goi Gemini API", 500);
  }
}
