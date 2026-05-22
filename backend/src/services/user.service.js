import models from "../models/index.js";
import { Op } from "sequelize";
import { AppError } from "../middlewares/handleException.middlware.js";
import { uploadBufferToCloudinary } from '../utils/uploadImage.js'

class UserService {
    constructor() {
        this.User = models.User;
    }

    async getUserInfo(id) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        return {
            message: "Get user info successfully",
            user: {
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                avatar: user.avatar
            }
        }
    }

    async updateUserProfile(id, data) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        const { full_name, phone_number, date_of_birth, gender } = data;

        if (full_name !== undefined) user.full_name = full_name;
        if (phone_number !== undefined) user.phone_number = phone_number;
        if (date_of_birth !== undefined) {
            const dob = new Date(date_of_birth);
            if (!isNaN(dob)) {
                user.date_of_birth = dob.toISOString().split('T')[0];
            }
        }
        if (gender !== undefined) user.gender = gender;

        await user.save();

        return {
            message: "User updated successfully",
            user: {
                user_id: user.id,
                full_name: user.full_name,
                phone_number: user.phone_number,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                avatar: user.avatar,
            }
        };
    }

    async updateUserAvatar(id, avatar) {
        if (!avatar || !avatar.buffer) {
            throw new AppError("Avatar file is required", 400);
        }
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError("User not found", 404);

        const { url, public_id } = await uploadBufferToCloudinary(avatar.buffer);

        if (user.avatar_public_id) {
            await cloudinary.uploader.destroy(user.avatar_public_id);
        }

        user.avatar = url;
        user.avatar_public_id = public_id;

        await user.save();

        return {
            message: "User avatar updated successfully",
            user: {
                user_id: user.id,
                avatar: user.avatar
            }
        };
    }

    async getUserById(id) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        return {
            message: "Get user successfully",
            user: {
                user_id: user.id,
                full_name: user.full_name,
                phone_number: user.phone_number,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                avatar: user.avatar,
            }
        };
    }

    async getListOfUser(page = 1, limit = 20, role = null, search, isActive = null) {
        const offset = (page - 1) * limit;

        const whereClause = {};

        if (role) {
            whereClause.role = role;
        }

        if (isActive !== null && isActive !== undefined) {
            whereClause.is_active = isActive;
        }

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await this.User.findAndCountAll({
            where: whereClause,
            attributes: [
                "id",
                "full_name",
                "email",
                "phone_number",
                "date_of_birth",
                "gender",
                "avatar",
                "role",
                "is_active",
                "blocked_at",
                "block_reason",
                "created_at",
            ],
            limit,
            offset,
            order: [["created_at", "DESC"]],
        });

        return {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
            role: role || null,
            isActive: isActive,
            search: search || null,
            data: rows,
        };
    }

    async deleteUser(id) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        await this.User.destroy({ where: { id } });

        return {
            message: 'Delete user successfully',
            user_id: id
        };
    }

    async updateUserRole(id, newRole) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        if (!['user', 'admin'].includes(newRole)) {
            throw new AppError('Invalid role. Must be "user" or "admin"', 400);
        }

        user.role = newRole;
        await user.save();

        return {
            message: 'User role updated successfully',
            user: {
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                is_active: user.is_active
            }
        };
    }

    async blockUser(id, reason = null) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        if (!user.is_active) {
            throw new AppError('User is already blocked', 400);
        }

        user.is_active = false;
        user.blocked_at = new Date();
        user.block_reason = reason || null;
        user.refresh_token = null;
        user.refresh_token_expires_at = null;
        await user.save();

        return {
            message: 'User blocked successfully',
            user: {
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                is_active: user.is_active,
                blocked_at: user.blocked_at,
                block_reason: user.block_reason
            }
        };
    }

    async unblockUser(id) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        if (user.is_active) {
            throw new AppError('User is already active', 400);
        }

        user.is_active = true;
        user.blocked_at = null;
        user.block_reason = null;
        await user.save();

        return {
            message: 'User unblocked successfully',
            user: {
                user_id: user.id,
                full_name: user.full_name,
                email: user.email,
                is_active: user.is_active
            }
        };
    }

    async getUserStats(id) {
        const user = await this.User.findByPk(id, {
            attributes: [
                "id",
                "full_name",
                "email",
                "phone_number",
                "avatar",
                "gender",
                "date_of_birth",
                "role",
                "is_active",
                "blocked_at",
                "block_reason",
                "email_verified",
                "created_at",
                "star_balance",
                "total_stars_earned",
                "current_rank",
                "streak_count",
            ]
        });
        if (!user) throw new AppError('User not found', 404);

        return {
            message: 'Get user stats successfully',
            user
        };
    }
}

export default new UserService();