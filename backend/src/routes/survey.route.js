import SurveyController from "../controllers/survey.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createSurveyRequest } from "../validates/createSurvey.validate.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";
import { Router } from "express";

const route = Router();

route.post('/', authMiddleware.checkRole('admin'), validate(createSurveyRequest), SurveyController.createSurvey);
route.get('/:survey_id', validate(surveyIdParams), SurveyController.getSurveyById);
route.get('/users/:id', authMiddleware.checkRole('admin'), validate(userIdParams), SurveyController.getSurveyByUserId);
route.delete('/:survey_id', authMiddleware.checkRole('admin'), validate(surveyIdParams), SurveyController.deleteSurveyById);
route.get('/', SurveyController.getAllSurvey);
route.put('/:survey_id', authMiddleware.checkRole('admin'), validate(surveyIdParams), SurveyController.updateSurvey);

export default route;