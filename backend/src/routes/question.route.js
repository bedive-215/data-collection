import express from "express";
import QuestionController from "../controllers/question.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { questionIdParams } from "../validates/questionIdParams.validate.js";

const router = express.Router();

// Create question
router.post(
    "/:survey_id",
    authMiddleware.checkRole('admin'),
    validate(surveyIdParams),
    QuestionController.createQuestions
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
    authMiddleware.checkRole('admin'),
    validate(questionIdParams),
    QuestionController.deleteQuestion
);

// Update question
router.patch(
    "/:question_id",
    authMiddleware.checkRole('admin'),
    validate(questionIdParams),
    QuestionController.updateQuestion
);

// Reorder questions
router.patch(
    "/:survey_id/reorder",
    authMiddleware.checkRole('admin'),
    validate(surveyIdParams),
    QuestionController.reorderQuestions
);

// Bulk update questions
router.patch(
    "/:survey_id/bulk",
    authMiddleware.checkRole('admin'),
    validate(surveyIdParams),
    QuestionController.bulkUpdateQuestions
);

export default router;