import { createSurvey, getSurveyById, getSurveyByUserId, deleteSurveyById } from "../controllers/survey.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createSurveyRequest } from "../validates/createSurvey.validate.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";
import { Router } from "express";

const route = Router();

route.post('/', authMiddleware.checkRole('admin'), validate(createSurveyRequest), createSurvey);
route.get('/:survey_id', validate(surveyIdParams), getSurveyById);
route.get('/users/:id', authMiddleware.checkRole('admin'), validate(userIdParams), getSurveyByUserId);
route.delete('/:survey_id', authMiddleware.checkRole('admin'), validate(surveyIdParams), deleteSurveyById);

export default route;