import starService from "../services/star.service.js";

class StarController {
    async getBalance(req, res, next) {
        try {
            const result = await starService.getBalance(req.user.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getTransactionHistory(req, res, next) {
        try {
            const { page = 1, limit = 20, type } = req.query;
            const result = await starService.getTransactionHistory(req.user.id, {
                page: parseInt(page),
                limit: parseInt(limit),
                type,
            });
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getRankInfo(req, res, next) {
        try {
            const user = req.user;
            const result = starService.getRankInfo(user.total_stars_earned || 0);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async adminAdjustStars(req, res, next) {
        try {
            const { user_id, amount, reason } = req.body;

            if (!user_id || amount === undefined || !reason) {
                return res.status(400).json({
                    status: "error",
                    message: "user_id, amount, reason are required",
                });
            }

            const result = await starService.adminAdjustStars(user_id, amount, reason, req.user.id);
            res.json({ status: "success", data: result });
        } catch (err) {
            next(err);
        }
    }
}

export default new StarController();
