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
    QuestionController.create
);

// Get all questions of survey
router.get(
    "/:survey_id",
    validate(surveyIdParams),
    QuestionController.getBySurvey
);

// Delete question
router.delete(
    "/:question_id",
    authMiddleware.checkRole('admin'),
    validate(questionIdParams),
    QuestionController.delete
);

export default router;