import dailyCheckinService from "../services/dailyCheckin.service.js";

class DailyCheckinController {
    async checkin(req, res, next) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress;
            const deviceInfo = req.get("User-Agent") || null;

            const result = await dailyCheckinService.checkin(
                req.user.id,
                ipAddress,
                deviceInfo
            );

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async getCheckinStatus(req, res, next) {
        try {
            const [hasCheckedIn, streakInfo] = await Promise.all([
                dailyCheckinService.hasCheckedInToday(req.user.id),
                dailyCheckinService.getCurrentStreak(req.user.id),
            ]);

            res.status(200).json({
                status: "success",
                data: {
                    ...hasCheckedIn,
                    ...streakInfo,
                },
            });
        } catch (err) {
            next(err);
        }
    }

    async getHistory(req, res, next) {
        try {
            const { page = 1, limit = 30 } = req.query;
            const result = await dailyCheckinService.getCheckinHistory(req.user.id, {
                page: parseInt(page),
                limit: parseInt(limit),
            });

            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async getCurrentStreak(req, res, next) {
        try {
            const result = await dailyCheckinService.getCurrentStreak(req.user.id);
            res.status(200).json({
                status: "success",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new DailyCheckinController();
