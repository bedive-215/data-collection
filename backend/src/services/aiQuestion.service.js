import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import _checkSurveyAccess from "../utils/checkSurveyAccess.js";
import {
  AI_QUESTION_SYSTEM_PROMPT,
  clampQuestionCount,
} from "../domain/aiQuestion.domain.js";
import { callGeminiJson } from "../utils/aiQuestion/geminiJson.js";
import { normalizeQuestionList } from "../utils/aiQuestion/normalize.js";
import { buildAiQuestionPrompt } from "../utils/aiQuestion/prompts.js";

class AiQuestionService {
  constructor() {
    this.Survey = models.Survey;
  }

  async _findSurveyOrFail(surveyId) {
    const survey = await this.Survey.findByPk(surveyId);
    if (!survey) throw new AppError("Survey not found", 404);
    return survey;
  }

  async _assertEditorAccess(user, survey) {
    const role = await _checkSurveyAccess(user, survey);
    if (role !== "editor") {
      throw new AppError("Forbidden", 403);
    }
  }

  async suggestQuestions(surveyId, body, user) {
    const survey = await this._findSurveyOrFail(surveyId);
    await this._assertEditorAccess(user, survey);

    const userPrompt = buildAiQuestionPrompt({
      ...body,
      count: clampQuestionCount(body.count),
    });
    const rawList = await callGeminiJson(AI_QUESTION_SYSTEM_PROMPT, userPrompt);
    const questions = normalizeQuestionList(rawList);

    if (questions.length === 0) {
      throw new AppError("AI khong tao duoc cau hoi hop le", 400);
    }

    return {
      message: "OK",
      count: questions.length,
      questions,
    };
  }
}

export default new AiQuestionService();
