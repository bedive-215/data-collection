export const buildSurveyPublicUrl = (survey) => {
    const id = survey.id;
    const token = survey.access_token;

    const front = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
    if (front) {
        return `${front}/user/survey/${id}?access_token=${encodeURIComponent(token)}`;
    }

    const apiBase = (process.env.BASE_URL || "").trim().replace(/\/$/, "");
    return `${apiBase}/surveys/${id}?access_token=${token}`;
};