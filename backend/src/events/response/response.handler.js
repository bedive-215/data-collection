import eventBus from "../eventBus.js";
import { RESPONSE_EVENTS } from "./response.events.js";

import starService from "../../services/star.service.js";
import achievementService from "../../services/achievement.service.js";
import notificationService from "../../services/notification.service.js";
import { ACHIEVEMENT_EVENTS } from "../achivenent/achivement.event.js";

import models from "../../models/index.js";

eventBus.on(RESPONSE_EVENTS.SUBMITTED, async ({ userId, surveyId, responseId, isCreator, survey }) => {
    try {
        const starReward = await starService.rewardSubmitSurvey(userId, surveyId, responseId);

        if (!isCreator && survey.created_by) {
            await starService.rewardCreatorForRespondent(survey.created_by, surveyId, userId);
        }

        eventBus.emit(ACHIEVEMENT_EVENTS.UNLOCKED, {
            userId,
            trigger: "response_completed",
            data: {
                survey_id: surveyId,
                is_creator: isCreator,
                is_first_responder: starReward.order === 1,
                survey_response_count: starReward.order,
            },
        });

        const responder = await models.User.findByPk(userId, { attributes: ["id", "full_name"] });
        await notificationService.notifySurveyResponse({
            survey,
            responder,
            responseId,
        });

        if (global.emitToSurveyAdmins) {
            const responseCount = await models.Response.count({ where: { survey_id: surveyId, status: "COMPLETED" } });
            global.emitToSurveyAdmins(surveyId, "survey:new-response", {
                survey_id: surveyId,
                response_id: responseId,
                total_responses: responseCount,
                submitted_at: new Date(),
            });
        }

    } catch (err) {
        console.error("[RESPONSE_EVENTS.SUBMITTED] error:", err);
    }
});