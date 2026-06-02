import express from "express";

import QuestionOptionController from "#controllers/option.controller.js";

import authMiddleware from "#middlewares/auth.middleware.js";

import { validate } from "#middlewares/validate.middleware.js";
import { createOptionParams } from "#validates/createOptionParams.validate.js";
import { getOptionParams } from "#validates/getOptionParams.validate.js";
import { updateOptionParams } from "#validates/updateOptionParams.validate.js";
import { deleteOptionParams } from "#validates/deleteOptionParams.validate.js";

const router = express.Router();

// Create option
router.post(
    "/questions/:question_id/survey/:survey_id",
    validate(createOptionParams),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionOptionController.createOption
);

// Get options by question
router.get(
    "/questions/:question_id/survey/:survey_id",
    validate(getOptionParams),
    authMiddleware.checkSurveyAccess('editor', 'viewer', 'respondent'),
    QuestionOptionController.getOptionsByQuestion
);

// Update option
router.patch(
    "/:option_id/survey/:survey_id",
    validate(updateOptionParams),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionOptionController.updateOption
);

// Delete option
router.delete(
    "/:option_id/survey/:survey_id",
    validate(deleteOptionParams),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionOptionController.deleteOption
);

router.post(
    "/questions/:question_id/survey/:survey_id/bulk",
    validate(createOptionParams),
    authMiddleware.checkSurveyAccess('editor'),
    QuestionOptionController.bulkCreateOptions
);

export default router;