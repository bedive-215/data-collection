import AiQuestionService from "../services/aiQuestion.service.js";

class AiQuestionController {
  async suggest(req, res, next) {
    try {
      const { survey_id } = req.params;
      const result = await AiQuestionService.suggestQuestions(survey_id, req.body, req.user);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default new AiQuestionController();
