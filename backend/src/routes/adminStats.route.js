import { Router } from "express";
import AdminStatsController from "../controllers/adminStats.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { surveyIdParams } from "../validates/surveyIdParams.validate.js";

const router = Router();

router.get("/overview", 
    authMiddleware.checkRole("admin"), 
    AdminStatsController.getOverview);

router.get("/survey-by-day", 
    authMiddleware.checkRole("admin"), 
    AdminStatsController.getSurveyByDay);

router.get("/dashboard", 
    authMiddleware.checkRole("admin"), 
    AdminStatsController.getDashboard);

router.get("/answered-users", 
    authMiddleware.checkRole("admin"), 
    AdminStatsController.getTotalUsersAnswered);

router.get("/answered-users/:survey_id", 
    authMiddleware.checkRole("admin"), 
    validate(surveyIdParams), 
    AdminStatsController.getUsersAnsweredBySurvey);

export default router;