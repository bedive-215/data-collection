import express from "express";
import SectionController from "#controllers/section.controller.js";
import authMiddleware from "#middlewares/auth.middleware.js";
import { validate } from "#middlewares/validate.middleware.js";
import { surveyIdParams } from "#validates/surveyIdParams.validate.js";

const router = express.Router();

// GET/POST /survey/sections/surveys/:survey_id/sections
router.get(
    "/surveys/:survey_id/sections",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor', 'viewer', 'respondent'),
    SectionController.getBySurvey
);

router.post(
    "/surveys/:survey_id/sections",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    SectionController.create
);

router.patch(
    "/surveys/:survey_id/sections/reorder",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    SectionController.reorder
);

router.post(
    "/surveys/:survey_id/sections/bulk",
    validate(surveyIdParams),
    authMiddleware.auth.bind(authMiddleware),
    authMiddleware.checkSurveyAccess('editor'),
    SectionController.bulkCreate
);

// PATCH/DELETE /survey/sections/:section_id
router.patch(
    "/:section_id",
    authMiddleware.auth.bind(authMiddleware),
    SectionController.update
);

router.delete(
    "/:section_id",
    authMiddleware.auth.bind(authMiddleware),
    SectionController.delete
);

export default router;
