export const evaluateCondition = (achievement, { surveyCount, responseCount, starBalance, streakCount, data }) => {
    const val = achievement.condition_value;
    let shouldUnlock = false;
    let progress = 0;

    switch (achievement.condition_type) {
        case "SURVEY_COUNT":
            progress = surveyCount;
            shouldUnlock = surveyCount >= val;
            break;

        case "RESPONSE_COUNT":
            progress = responseCount;
            shouldUnlock = responseCount >= val;
            break;

        case "STREAK":
            progress = streakCount;
            shouldUnlock = streakCount >= val;
            break;

        case "TOTAL_STARS":
        case "RANK":
            progress = starBalance;
            shouldUnlock = starBalance >= val;
            break;

        case "FIRST_RESPONSE_ACH":
            if (data.is_first_responder) {
                shouldUnlock = true;
                progress = 1;
            }
            break;

        case "SURVEY_RESPONSES":
            if (data.survey_id && data.is_creator) {
                progress = data.survey_response_count ?? 0;
                shouldUnlock = progress >= val;
            }
            break;

        default:
            break;
    }

    return { shouldUnlock, progress };
}