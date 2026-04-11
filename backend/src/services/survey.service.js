import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";
import { where } from "sequelize";

class SurveyService {
    constructor () {
        this.Survey = models.Survey;
        this.User = models.User;
    }

    async createSurvey (userId, title, description) {
        if(!title) throw new AppError("Title required!", 400);
        const user = await this.User.findByPk(userId);
        if(!user) throw new AppError('User not found!', 404);
        
        const survey = await this.Survey.create({
            title,
            description,
            created_by: user.id
        });

        return {
            message: 'Created survey successfully',
            survey: {
                id: survey.id,
                title: survey.title,
                description: survey.description
            }
        }
    }

    async getSurveyById(survey_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }
        return {
            message: "Get survey successfully!",
            survey
        };
    }

    async getSurveyByUserId(user_id) {
        if (!user_id) {
            throw new AppError("User id is required!", 400);
        }

        const surveys = await this.Survey.findAll({
            where: {
                created_by: user_id
            },
            order: [["created_at", "DESC"]]
        });

        return {
            message: "Get surveys by user successfully!",
            count: surveys.length,
            surveys
        };
    }

    async deleteSurvey(survey_id, user_id) {
        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const survey = await this.Survey.findByPk(survey_id);

        if (!survey) {
            throw new AppError("Survey not found!", 404);
        }

        if (survey.created_by !== user_id) {
            throw new AppError("Forbidden", 403);
        }

        await survey.destroy();

        return {
            message: "Deleted survey successfully"
        };
    }

    async getAllSurvey() {
        const surveys = await this.Survey.findAll({
            order: [["created_at", "DESC"]]
        });

        return {
            message: "Get surveys successfully!",
            count: surveys.length,
            surveys
        };
    }
}

export default new SurveyService();