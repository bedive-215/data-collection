export function getSurveyStatus(survey) {
    const now = new Date();
    if (survey.start_at && now < survey.start_at) return "SCHEDULED";
    if (survey.end_at && now > survey.end_at) return "EXPIRED";
    return "ACTIVE";
}