import aiChatService from "../services/aiChat.service.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class AiChatController {
  async chat(req, res, next) {
    try {
      const { message, history } = req.body;

      if (!message?.trim()) {
        throw new AppError("Tin nhắn không được để trống", 400);
      }

      // Lấy user từ auth middleware (đã được attach vào req.user)
      const user = req.user || null;

      const result = await aiChatService.chat(message, history, user);

      return res.status(200).json({
        message: "OK",
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AiChatController();
