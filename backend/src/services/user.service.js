import models from "../models/index.js";
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
                avatar: user.avatar
            }
        }
    }

    async updateUserProfile(id, data) {
        const user = await this.User.findByPk(id);
        if (!user) throw new AppError('User not found', 404);

        const { full_name, phone_number, date_of_birth } = data;

        if (full_name !== undefined) user.full_name = full_name;
        if (phone_number !== undefined) user.phone_number = phone_number;
        if (date_of_birth !== undefined) {
            const dob = new Date(date_of_birth);
            if (!isNaN(dob)) {
                user.date_of_birth = dob.toISOString().split('T')[0];
            }
        }

        await user.save();

        return {
            message: "User updated successfully",
            user: {
                user_id: user.id,
                full_name: user.full_name,
                phone_number: user.phone_number,
                date_of_birth: user.date_of_birth,
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
                avatar: user.avatar,
            }
        };
    }

    async getListOfUser(page = 1, limit = 20, role = 'user', search) {
        const offset = (page - 1) * limit;

        const whereClause = {};

        if (role) {
            whereClause.role = role;
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
                "avatar",
                "role",
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
}

export default new UserService();