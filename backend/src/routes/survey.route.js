import SurveyController from "../controllers/survey.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createSurveyRequest } from "../validates/createSurvey.validate.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";
import { Router } from "express";

const route = Router();

route.post('/', validate(createSurveyRequest), SurveyController.createSurvey);
route.get('/me', SurveyController.getMySurveys);
route.get('/users/:id', authMiddleware.checkRole('admin'), validate(userIdParams), SurveyController.getSurveyByUserId);
route.get('/',authMiddleware.checkRole('admin'), SurveyController.getAllSurvey);

route.get('/:survey_id', validate(surveyIdParams), SurveyController.getSurveyById);
route.get('/public', SurveyController.getSurveyPublic);
route.put('/:survey_id', validate(surveyIdParams), SurveyController.updateSurvey);
route.delete('/:survey_id', validate(surveyIdParams), SurveyController.deleteSurvey);
route.patch('/:survey_id/close', validate(surveyIdParams), SurveyController.closeSurvey);
route.patch('/:survey_id/publish', validate(surveyIdParams), SurveyController.publicSurvey);
route.patch('/:survey_id/share', validate(surveyIdParams), SurveyController.shareLink);
route.post('/:survey_id/invite', validate(surveyIdParams), SurveyController.inviteSurvey);


export default route;