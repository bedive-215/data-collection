import { GoogleGenAI } from "@google/genai";
import { getGeminiConfig } from "../helpers/getAiConfig.helper.js";

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

export const generateClaudianContent = async (prompt) => {
    try {
        // Kiểm tra input
        if (!prompt || typeof prompt !== 'string') {
            throw new Error("Prompt phải là string và không được rỗng");
        }

        const requestBody = {
            model: process.env.CLAUDIAN_MODEL,
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
        };


        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.CLAUDIAN_API_KEY,
            },
            body: JSON.stringify(requestBody),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${data.error?.message || response.statusText}`);
        }
        
        const textContent = data.content.find(block => block.type === "text");
        if (!textContent) {
            throw new Error("Không tìm thấy text content trong response");
        }
        
        return textContent.text;
    }
    catch (error) {
        console.error("Lỗi:", error);
        throw error;
    }
};