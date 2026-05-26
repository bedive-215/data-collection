import eventBus from "../eventBus.js";
import starService from "../../services/star.service.js";
import { STAR_EVENTS } from "./star.event.js";
import NotificationService from "../../services/notification.service.js";
import leaderboardService from "../../services/leaderboard.service.js";

eventBus.on(STAR_EVENTS.STARTED, async (payload) => {
    const { userId, surveyId } = payload;
    await starService.handleStartSurvey(userId, surveyId);
});

eventBus.on(STAR_EVENTS.DELETED, async (payload) => {
    const { owner, surveyId } = payload;
    await starService.handleStartSurveyDeleted(owner, surveyId);
});

eventBus.on(STAR_EVENTS.EARNED, async (payload) => {
    await NotificationService.notifyStarEarned(payload);
});

eventBus.on(STAR_EVENTS.RANK_UP, async (payload) => {
    await NotificationService.notifyRankUp(payload);
});

eventBus.on(STAR_EVENTS.PENALTY, async (payload) => {
    await NotificationService.createNotification(payload);
});

eventBus.on(STAR_EVENTS.PERIODIC_UPDATE, async (payload) => {
    const { userId, amount } = payload;
    await leaderboardService.updatePeriodicStars(userId, amount);
});