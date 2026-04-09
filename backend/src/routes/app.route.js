import { Router } from "express";
import routerAuth from './auth.route.js';
import routerUser from './user.route.js';
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use('/auth', routerAuth);

router.use('/users', authMiddleware.auth.bind(authMiddleware));
router.use('/users', routerUser);


export default router;