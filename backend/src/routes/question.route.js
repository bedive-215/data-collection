import express from "express";
import QuestionController from "#controllers/question.controller.js";
import AiQuestionController from "#controllers/aiQuestion.controller.js";
import authMiddleware from "#middlewares/auth.middleware.js";

import { validate } from "#middlewares/validate.middleware.js";
import { surveyIdParams } from "#validates/surveyIdParams.validate.js";
import { createQuestionRequest } from "#validates/createQuestion.validate.js";
import { questionIdParams } from "#validates/questionIdParams.validate.js";
import { updateQuestionParams } from "#validates/updateQuestionParams.validate.js";
import { deleteQuestionParams } from "#validates/deleteQuestionParams.validate.js";
import { aiSuggestQuestionsRequest } from "#validates/aiSuggestQuestions.validate.js";

const router = express.Router();

router.post(
  "/:survey_id/ai/suggest",
  validate(aiSuggestQuestionsRequest),
  AiQuestionController.suggest
);

// Create question
router.post(
    "/survey/:survey_id",
    validate(createQuestionRequest),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionController.create
);

// Get all questions of survey
router.get(
    "/survey/:survey_id",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('viewer', 'editor', 'respondent'),
    QuestionController.getQuestionsBySurvey
);

// Delete question
router.delete(
    "/:question_id/survey/:survey_id",
    validate(deleteQuestionParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionController.deleteQuestion
);

// Update question
router.patch(
    "/:question_id/survey/:survey_id",
    validate(updateQuestionParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionController.updateQuestion
);

// Reorder questions
router.patch(
    "/survey/:survey_id/reorder",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionController.reorderQuestions
);

router.post(
    "/survey/:survey_id/bulk",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionController.bulkCreateQuestions
);

export default router;