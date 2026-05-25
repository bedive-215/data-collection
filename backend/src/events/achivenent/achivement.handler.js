import eventBus from "../eventBus";
import { ACHIEVEMENT_EVENTS } from "./achivement.event.js";

import achievementService from "../../services/achievement.service.js";

eventBus.on(ACHIEVEMENT_EVENTS.UNLOCKED, async (payload) => {
    const { userId, achievementKey, data } = payload;
    await achievementService.handleAchievementUnlocked(userId, achievementKey, data);
});