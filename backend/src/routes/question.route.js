import express from "express";
import QuestionController from "../controllers/question.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { createQuestionRequest } from "../validates/createQuestion.validate.js";
import { questionIdParams } from "../validates/questionIdParams.validate.js";

const router = express.Router();

// Create question
router.post(
    "/:survey_id",
    validate(createQuestionRequest),
    QuestionController.create
);

// Get all questions of survey
router.get(
    "/:survey_id",
    validate(surveyIdParams),
    QuestionController.getQuestionsBySurvey
);

// Delete question
router.delete(
    "/:question_id",
    validate(questionIdParams),
    QuestionController.deleteQuestion
);

// Update question
router.patch(
    "/:question_id",
    validate(questionIdParams),
    QuestionController.updateQuestion
);

// Reorder questions
router.patch(
    "/:survey_id/reorder",
    validate(surveyIdParams),
    QuestionController.reorderQuestions
);

router.post(
    "/:survey_id/bulk",
    validate(surveyIdParams),
    QuestionController.bulkCreateQuestions
);

export default router;