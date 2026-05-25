import eventBus from "../eventBus";
import starService from "../../services/star.service.js";

eventBus.on(START_EVENTS.STARTED, async (payload) => {
    const { userId, surveyId } = payload;
    await starService.handleStartSurvey(userId, surveyId);
});

eventBus.on(START_EVENTS.DELETED, async (payload) => {
    const { owner, surveyId } = payload;
    await starService.handleStartSurveyDeleted(owner, surveyId);
});