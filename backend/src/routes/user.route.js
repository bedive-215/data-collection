import UserController from "#controllers/user.controller.js";
import authMiddleware from "#middlewares/auth.middleware.js";
import upload from "#middlewares/multer.middleware.js";

import { validate } from "#middlewares/validate.middleware.js";
import {updateUserProfileRequest} from "#validates/updateUser.validate.js";
import { userIdParams } from "#validates/userIdParams.validate.js";
import { updateUserRoleRequest, blockUserRequest, unblockUserRequest } from "#validates/adminUser.validate.js";

import { Router } from "express";

const route = Router();

route.get('/me', UserController.getUserInfo);
route.patch('/me', validate(updateUserProfileRequest), UserController.updateUserProfile);
route.patch('/me/avatar', upload.single('avatar'), UserController.updateUserAvatar);
route.get('/:id', authMiddleware.checkRole("admin"), validate(userIdParams), UserController.getUserById);
route.get('/:id/stats', authMiddleware.checkRole("admin"), validate(userIdParams), UserController.getUserStats);
route.get('/', authMiddleware.checkRole("admin"), UserController.getListOfUser);
route.patch('/:id/role', authMiddleware.checkRole("admin"), validate(updateUserRoleRequest), UserController.updateUserRole);
route.patch('/:id/block', authMiddleware.checkRole("admin"), validate(blockUserRequest), UserController.blockUser);
route.patch('/:id/unblock', authMiddleware.checkRole("admin"), validate(unblockUserRequest), UserController.unblockUser);
route.delete('/:id', authMiddleware.checkRole("admin"), validate(userIdParams), UserController.deleteUser);

export default route;