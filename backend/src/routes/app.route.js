import { Router } from "express";
import routerAuth from './auth.route.js';

const router = Router();

router.use('/auth', routerAuth);

export default router;