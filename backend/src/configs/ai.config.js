import { GoogleGenAI } from "@google/genai";

export function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return { key, model };
}

const { key, model } = getGeminiConfig();
const ai = new GoogleGenAI({ apiKey: key });

export const generateGeminiContent = async (prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
};