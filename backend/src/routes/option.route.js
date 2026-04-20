import express from "express";
import QuestionOptionController from "../controllers/option.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { questionIdParams } from "../validates/questionIdParams.validate.js";
import { optionIdParams } from "../validates/optionIdParams.validate.js";

const router = express.Router();

// Create option
router.post(
    "/:question_id",
    authMiddleware.checkRole('admin'),
    validate(questionIdParams),
    QuestionOptionController.createOption
);

// Get options by question
router.get(
    "/:question_id",
    validate(questionIdParams),
    QuestionOptionController.getOptionsByQuestion
);

// Update option
router.patch(
    "/:option_id",
    authMiddleware.checkRole('admin'),
    validate(optionIdParams),
    QuestionOptionController.updateOption
);

// Delete option
router.delete(
    "/:option_id",
    authMiddleware.checkRole('admin'),
    validate(optionIdParams),
    QuestionOptionController.deleteOption
);

router.post(
    "/:question_id/bulk",
    authMiddleware.checkRole('admin'),
    validate(questionIdParams),
    QuestionOptionController.bulkCreateOptions
);

export default router;