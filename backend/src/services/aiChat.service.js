import { runChatFlow } from "../ai/chat/chat.flow.js";

class AIChatService {
  async chat(userMessage, conversationHistory, user) {
    return runChatFlow({
      message: userMessage,
      history: conversationHistory,
      user,
    });
  }
}

export default new AIChatService();