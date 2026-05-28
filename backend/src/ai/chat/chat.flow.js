import { detectIntent } from "../core/intents/detector.js";
import { executeTool } from "../tools/execute.tool.js";
import { callLLM, callLLMWithTools } from "./gemini.client.js";
import {
  formatError,
  formatTextReply,
  formatToolResponse,
} from "./chat.formatter.js";

export async function runChatFlow({ message, history, user }) {
  validateInput(message);

  // 1. fast intent detection
  const intent = detectIntent(message);

  if (intent) {
    return await handleTool(intent, user);
  }

    // 2. call LLM with tool support
  const firstResponse = await callLLMWithTools({ message, history });

  const calls = firstResponse.functionCalls || [];

  // No tool → return normal text
  if (calls.length === 0) {
    return formatTextReply(firstResponse.text);
  }

  // 3. Execute the first tool call
  const call = calls[0];

  try {
    const toolResult = await executeTool(
      call.name,
      call.arguments || {},
      user
    );

    // 4. Call LLM again to get final response 
    const finalResponse = await callLLM({
      message,
      history,
      toolCall: call,
      toolResult,
    });

    return formatToolResponse(
      toolResult,
      finalResponse.text,
      call.arguments
    );
  } catch (err) {
    return formatError(err);
  }
}

// Handle detected tool intent
async function handleTool(intent, user) {
  try {
    const toolResult = await executeTool(intent.tool, intent.args, user);
    return formatToolResponse(toolResult);
  } catch (err) {
    return formatError(err);
  }
}

// Basic input validation
function validateInput(message) {
  if (!message?.trim()) {
    throw new Error("Tin nhắn không được để trống");
  }

  if (String(message).length > 2000) {
    throw new Error("Tin nhắn quá dài (tối đa 2000 ký tự)");
  }
}