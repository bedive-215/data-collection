import eventBus from "../eventBus";
import starService from "../../services/star.service.js";
import { START_EVENTS } from "./start.event.js";
import NotificationService from "../../services/notification.service.js";
import leaderboardService from "../../services/leaderboard.service.js";

eventBus.on(START_EVENTS.STARTED, async (payload) => {
    const { userId, surveyId } = payload;
    await starService.handleStartSurvey(userId, surveyId);
});

eventBus.on(START_EVENTS.DELETED, async (payload) => {
    const { owner, surveyId } = payload;
    await starService.handleStartSurveyDeleted(owner, surveyId);
});

eventBus.on(START_EVENTS.EARNED, async (payload) => {
    await NotificationService.notifyStarEarned(payload);
});

eventBus.on(START_EVENTS.RANK_UP, async (payload) => {
    await NotificationService.notifyRankUp(payload);
});

eventBus.on(START_EVENTS.PENALTY, async (payload) => {
    await NotificationService.createNotification(payload);
});

eventBus.on(START_EVENTS.PERIODIC_UPDATE, async (payload) => {
    const { userId, amount } = payload;
    await leaderboardService.updatePeriodicStars(userId, amount);
});