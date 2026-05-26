import eventBus from "../eventBus.js";
import { CHECKIN_EVENTS } from "./dailyCheckin.event.js";

import achievementService from "../../services/achievement.service.js";
import notificationService from "../../services/notification.service.js";

const MILESTONE_STREAKS = [7, 30, 100];

eventBus.on(CHECKIN_EVENTS.COMPLETED, async ({ userId, streakCount }) => {
    await achievementService.checkAndUnlock(
        userId,
        "checkin",
        { streak_count: streakCount },
    );
});

eventBus.on(CHECKIN_EVENTS.COMPLETED, async (payload) => {
    const { userId, streakCount, multiplier, starsEarned, isNewRecord } = payload;

    if (!MILESTONE_STREAKS.includes(streakCount) && !isNewRecord) return;

    await notificationService.notifyStreakMilestone({
        userId,
        streakCount,
        multiplier,
        starsEarned,
        isNewRecord,
    });
});
