import express from "express";
import ResponseController from "../controllers/response.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";

import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";
import { responseIdParams } from "../validates/responseIdParams.validate.js";
import { getUserResponse } from "../validates/getUserResponse.validate.js";

const router = express.Router();


// submit survey
router.post(
    "/surveys/:survey_id",
    validate(surveyIdParams),
    ResponseController.submit
);

// get my response in survey
router.get(
    "/:survey_id/me",
    validate(surveyIdParams),
    ResponseController.getMyResponse
);

// update response
router.put(
    "/:survey_id",
    validate(surveyIdParams),
    ResponseController.update
);

// delete response
router.delete(
    "/:response_id",
    validate(responseIdParams),
    ResponseController.delete
);

router.get(
    "/:response_id/answers",
    validate(responseIdParams),
    ResponseController.getAnswers
);

// get all my responses
router.get(
    "/me",
    ResponseController.getMyResponses
);



// get specific user's response in a survey
router.get(
    "/admin/surveys/:survey_id/users/:id",
    authMiddleware.checkRole("admin"),
    validate(getUserResponse),
    ResponseController.getUserResponse
);

// get all responses of a user
router.get(
    "/admin/users/:id",
    authMiddleware.checkRole("admin"),
    validate(userIdParams),
    ResponseController.getUserResponses
);

export default router;