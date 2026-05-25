import eventBus from "../eventBus.js";

import notificationService from "../../services/notification.service.js";
import starService from "../../services/star.service.js";
import achievementService from "../../services/achievement.service.js";
import { SURVEY_EVENTS } from "./survey.events.js";

eventBus.on(SURVEY_EVENTS.CLOSED, async (payload) => {
    await notificationService.notifySurveyClosed(payload);
});

eventBus.on(SURVEY_EVENTS.DELETED, async (payload) => {
    await notificationService.notifySurveyDeleted(payload);
});

eventBus.on(SURVEY_EVENTS.INVITATION, async (payload) => {
    await notificationService.notifySurveyInvitation(payload);
});