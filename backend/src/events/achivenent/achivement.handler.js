import eventBus from "../eventBus";
import { ACHIEVEMENT_EVENTS } from "./achivement.event.js";

import achievementService from "../../services/achievement.service.js";
import notificationService from "../../services/notification.service.js";

eventBus.on(ACHIEVEMENT_EVENTS.UNLOCKED, async ({ userId, achievementKey, data }) => {
    try {
        await achievementService.checkAndUnlock(userId, achievementKey, data);
    } catch (err) {
        console.error("ACHIEVEMENT_EVENTS.UNLOCKED error:", err);
    }
});

eventBus.on(ACHIEVEMENT_EVENTS.NOTIFY_UNLOCKED, async (payload) => {
    try {
        await notificationService.notifyAchievementUnlocked(payload);
    } catch (err) {
        console.error("ACHIEVEMENT_EVENTS.NOTIFY_UNLOCKED error:", err);
    }
});