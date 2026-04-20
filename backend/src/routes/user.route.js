import UserController from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import {updateUserProfileRequest} from "../validates/updateUser.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";

import { Router } from "express";

const route = Router();

route.get('/me', UserController.getUserInfo);
route.patch('/me', validate(updateUserProfileRequest), UserController.updateUserProfile);
route.patch('/me/avatar', upload.single('avatar'), UserController.updateUserAvatar);
route.get('/:id', validate(userIdParams), UserController.getUserById);
route.get('/', authMiddleware.checkRole("admin"), UserController.getListOfUser);
route.delete('/:id', validate(userIdParams), authMiddleware.checkRole("admin"), UserController.deleteUser);

export default route;