import _checkOwnerOrAdmin from "./checkOwnerOrAdmin.js";

const _checkSurveyAccess = async (user, survey, access_token) => {
     if (user?.role === "admin") {
        return "editor";
    }

    // OWNER
    if (_checkOwnerOrAdmin(user, survey)) {
        return "editor";
    }

    // PUBLIC
    if (survey.access_type === "PUBLIC") {
        return "respondent";
    }

    // LINK
    if (survey.access_type === "LINK") {
        if (!access_token || access_token !== survey.access_token) {
            throw new AppError("Invalid or missing access token", 403);
        }
        return "respondent";
    }

    // PRIVATE
    if (survey.access_type === "PRIVATE") {
        if (!user) {
            throw new AppError("Unauthorized", 401);
        }

        const participant = await this.SurveyParticipant.findOne({
            where: {
                survey_id: survey.id,
                [Op.or]: [
                    { user_id: user.id },
                    { email: user.email }
                ]
            }
        });

        if (!participant) {
            throw new AppError("You are not allowed to access this survey", 403);
        }

        return participant.role;
    }

    throw new AppError("Invalid survey access type", 400);
}

export default _checkSurveyAccess;