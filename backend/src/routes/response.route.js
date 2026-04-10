import express from "express";
import ResponseController from "../controllers/response.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";

const router = express.Router();

// submit survey (allow anonymous → có thể bỏ authMiddleware nếu muốn)
router.post(
    "/:survey_id/submit",
    validate(surveyIdParams),
    ResponseController.submit
);

export default router;