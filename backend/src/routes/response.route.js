import express from "express";
import ResponseController from "../controllers/response.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// submit survey (allow anonymous → có thể bỏ authMiddleware nếu muốn)
router.post(
    "/:survey_id/submit",
    validate(surveyIdParams),
    ResponseController.submit
);

router.get(
    "/:survey_id/submissions/me",
    validate(surveyIdParams),
    ResponseController.getMySubmission
);

router.get(
    '/:survey/submission/:id', 
    validate(surveyIdParams),
    validate(userIdParams),
    authMiddleware.checkRole('admin'),
    ResponseController.getUserSubmit
);

router.get('/', ResponseController.getAllMyResponse);

router.get(
    '/users/:id',
    validate(userIdParams),
    authMiddleware.checkRole('admin'),
    ResponseController.getAllUserResponse
);

export default router;