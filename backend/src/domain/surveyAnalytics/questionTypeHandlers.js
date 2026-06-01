import { AppError } from "../../middlewares/handleException.middlware.js";
import { QUESTION_TYPES } from "./questionTypes.js";

export function getQuestionTypeHandlers({ svc, question, answerWhere, totalResponses, textOpts = {} }) {
  if (!svc) throw new AppError("Missing SurveyAnalyticsService dependency", 500);

  const handlers = {
    [QUESTION_TYPES.SINGLE_CHOICE]: () => svc._singleChoiceAnalytics(question, answerWhere, totalResponses),
    [QUESTION_TYPES.DROPDOWN]: () => svc._singleChoiceAnalytics(question, answerWhere, totalResponses),
    [QUESTION_TYPES.MULTIPLE_CHOICE]: () => svc._multipleChoiceAnalytics(question, answerWhere, totalResponses),
    [QUESTION_TYPES.RATING]: () => svc._ratingAnalytics(question, answerWhere, totalResponses),
    [QUESTION_TYPES.NUMBER]: () => svc._numberAnalytics(question, answerWhere, totalResponses),
    [QUESTION_TYPES.DATE]: () => svc._dateAnalytics(question, answerWhere, totalResponses),
    [QUESTION_TYPES.TEXT]: () => svc._textAnalytics(question, answerWhere, totalResponses, textOpts),
    [QUESTION_TYPES.PARAGRAPH]: () => svc._textAnalytics(question, answerWhere, totalResponses, textOpts),
    [QUESTION_TYPES.EMAIL]: () => svc._textAnalytics(question, answerWhere, totalResponses, textOpts),
  };

  return handlers;
}

