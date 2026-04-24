import { Router } from "express";
import routerAuth from './auth.route.js';
import routerUser from './user.route.js';
import routerSurvey from './survey.route.js';
import routerQuestion from './question.route.js';
import routerResponse from './response.route.js';
import routerOption from './option.route.js';
import routerAdminStats from './adminStats.route.js';

import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use('/auth', routerAuth);

router.use('/users', authMiddleware.auth.bind(authMiddleware));
router.use('/users', routerUser);

router.use('/survey', authMiddleware.auth.bind(authMiddleware));
router.use('/survey', routerSurvey);

router.use('/questions', authMiddleware.auth.bind(authMiddleware));
router.use('/questions', routerQuestion);

router.use('/responses', authMiddleware.auth.bind(authMiddleware));
router.use('/responses', routerResponse);

router.use('/options', authMiddleware.auth.bind(authMiddleware));
router.use('/options', routerOption);

router.use('/admin-stats', authMiddleware.auth.bind(authMiddleware));
router.use('/admin-stats', routerAdminStats);

export default router;