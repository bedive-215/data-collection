import { getUserById, getListOfUser, getUserInfo, updateUserProfile, updateUserAvatar, deleteUser } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

import { validate } from "../middlewares/validate.middleware.js";
import {updateUserProfileRequest} from "../validates/updateUser.validate.js";
import { userIdParams } from "../validates/userIdParams.validate.js";

import { Router } from "express";

const route = Router();

route.get('/me', getUserInfo);
route.patch('/me', validate(updateUserProfileRequest), updateUserProfile);
route.patch('/me/avatar', upload.single('avatar'), updateUserAvatar);
route.get('/:id', validate(userIdParams), getUserById);
route.get('/', authMiddleware.checkRole("admin"), getListOfUser);
route.delete('/:id', validate(userIdParams), authMiddleware.checkRole("admin"), deleteUser);

export default route;