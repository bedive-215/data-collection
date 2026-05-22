import UserService from "../services/user.service.js";

class UserController {

    async getUserInfo (req, res, next) {
        try {
            const id = req.user.id;
            const result = await UserService.getUserInfo(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
    
    async updateUserProfile (req, res, next) {
        try {
            const data = {
                full_name: req.body.full_name,
                phone_number: req.body.phone_number,
                date_of_birth: req.body.date_of_birth,
                gender: req.body.gender,
            };
    
            const result = await UserService.updateUserProfile(req.user.id, data);
    
            return res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            console.error('Update user error:', error);
            next(error);
        }
    };
    
    async updateUserAvatar (req, res, next) {
        try {
            const avatar = req.file;
            if (!avatar) {
                return res.status(400).json({ status: 'error', message: 'Avatar file is required' });
            }
            const result = await UserService.updateUserAvatar(req.user.id, avatar);
            res.status(200).json({
                status: 'success',
                data: result
            });
        } catch (error) {
            console.error('Update user avatar error:', error);
            next(error);
        }
    };          
    
    
    async getUserById (req, res, next) {
        try {
            const id = req.params.id;
            const result = await UserService.getUserById(id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
    
    async getListOfUser (req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const role = req.query.role || null;
            const search = req.query.search || '';
            const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : null;

            const result = await UserService.getListOfUser(page, limit, role, search, isActive);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
    
    async deleteUser (req, res, next) {
        try {
            const result = await UserService.deleteUser(req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    async updateUserRole (req, res, next) {
        try {
            const { role } = req.body;
            const result = await UserService.updateUserRole(req.params.id, role);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    async blockUser (req, res, next) {
        try {
            const { reason } = req.body;
            const result = await UserService.blockUser(req.params.id, reason);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    async unblockUser (req, res, next) {
        try {
            const result = await UserService.unblockUser(req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };

    async getUserStats (req, res, next) {
        try {
            const result = await UserService.getUserStats(req.params.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    };
}

export default new UserController();