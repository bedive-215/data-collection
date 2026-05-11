import SurveyController from "../controllers/survey.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import { createSurveyRequest } from "../validates/createSurvey.validate.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";
import { deleteParticipantParams } from "../validates/deleteParticipantParams.validate.js";

import { Router } from "express";

const route = Router();

route.post('/', validate(createSurveyRequest), SurveyController.createSurvey);
route.get('/me', SurveyController.getMySurveys);
route.get('/public', SurveyController.getSurveyPublic);
route.get('/invited', SurveyController.getInvitedSurveys);

// just admin
route.get('/users/:id', 
    authMiddleware.checkRole('admin'), 
    validate(userIdParams), 
    SurveyController.getSurveyByUserId
);
route.get('/',
    authMiddleware.checkRole('admin'),
    SurveyController.getAllSurvey
);

// get survey by id
route.get('/:survey_id', 
    validate(surveyIdParams), 
    authMiddleware.checkSurveyAccess("editor", "viewer", "respondent"), 
    SurveyController.getSurveyById
);

// Update survey (just editor or owner, admin)
route.put('/:survey_id', 
    validate(surveyIdParams), 
    authMiddleware.checkSurveyAccess('editor'), 
    SurveyController.updateSurvey
);

// Delete survey (just admin or owner)
route.delete('/:survey_id', 
    validate(surveyIdParams), 
    authMiddleware.checkSurveyOwnerOrAdmin, 
    SurveyController.deleteSurvey
);
// Close survey
route.patch('/:survey_id/close', 
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    SurveyController.closeSurvey
);

route.patch('/:survey_id/publish', 
    validate(surveyIdParams), 
    SurveyController.publicSurvey
);
// Share link
route.patch('/:survey_id/share', 
    validate(surveyIdParams),
    authMiddleware.checkSurveyAccess('editor'),
    SurveyController.shareLink
);
// Invite survey (editor (viewer, respondent), owner and admin)
route.post('/:survey_id/invite', 
    validate(surveyIdParams),
    authMiddleware.checkSurveyAccess('editor'),
    SurveyController.inviteSurvey
);

route.post('/:survey_id/invite/bulk', 
    validate(surveyIdParams),
    authMiddleware.checkSurveyAccess('editor'),
    SurveyController.bulkInviteSurvey
);

route.get('/:survey_id/participants',
    validate(surveyIdParams),
    authMiddleware.checkSurveyOwnerOrAdmin,
    SurveyController.getParticipants
);

route.delete('/:survey_id/participants/:pid', 
    validate(deleteParticipantParams), 
    authMiddleware.checkSurveyOwnerOrAdmin,
    SurveyController.deleteParticipant
);

export default route;