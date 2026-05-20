import achievementService from "../services/achievement.service.js";

class AchievementController {
    async getUserAchievements(req, res, next) {
        try {
            const result = await achievementService.getUserAchievements(req.user.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getRecentUnlocks(req, res, next) {
        try {
            const { limit = 5 } = req.query;
            const result = await achievementService.getRecentUnlocks(req.user.id, parseInt(limit));
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async seedAchievements(req, res, next) {
        try {
            const result = await achievementService.seedAchievements();
            res.json({
                status: "success",
                data: result,
                message: `Seeded ${result.filter(r => r.created).length} new achievements`,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AchievementController();
