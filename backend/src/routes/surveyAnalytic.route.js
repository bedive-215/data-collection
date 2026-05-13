import { Router } from "express";

import surveyAnalyticController from "../controllers/surveyAnalytic.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOptionParams } from "../validates/createOptionParams.validate.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";

const route = Router();

const getQuestionAnalyticParams = createOptionParams;

route.get('/questions/:question_id/survey/:survey_id',
    validate(getQuestionAnalyticParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getQuestionAnalytics
);

route.get('/surveys/:survey_id/analytics',
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    surveyAnalyticController.getSurveyAnalytics
);

export default route;