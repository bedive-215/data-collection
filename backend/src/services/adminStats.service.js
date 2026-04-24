import { Op, fn, col, literal, where } from "sequelize";
import models from "../models/index.js";
import { response } from "express";

class AdminStatsService {
    constructor() {
        this.User = models.User;
        this.Survey = models.Survey;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.Answer = models.Answer;
        this.Response = models.Response;
    }

    // Tổng quan hệ thống
    async getOverviewStats() {
        const [
            totalUsers,
            totalSurveys,
            totalQuestions,
            totalOptions
        ] = await Promise.all([
            this.User.count(),
            this.Survey.count(),
            this.Question.count(),
            this.QuestionOption.count()
        ]);

        return {
            message: "Get overview stats successfully!",
            data: {
                totalUsers,
                totalSurveys,
                totalQuestions,
                totalOptions
            }
        };
    }

    // Thống kê theo ngày (7 ngày gần nhất)
    async getSurveyStatsByDay() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const stats = await this.Survey.findAll({
            attributes: [
                [literal("DATE(created_at)"), "date"],
                [fn("COUNT", col("id")), "count"]
            ],
            where: {
                created_at: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            group: [literal("DATE(created_at)")],
            order: [[literal("date"), "ASC"]],
            raw: true
        });

        return {
            message: "Get survey stats by day successfully!",
            data: stats
        };
    }

    // Dashboard tổng hợp
    async getDashboard() {
        const [overview, surveyByDay] = await Promise.all([
            this.getOverviewStats(),
            this.getSurveyStatsByDay()
        ]);

        return {
            message: "Get dashboard stats successfully!",
            data: {
                overview: overview.data,
                surveyByDay: surveyByDay.data
            }
        };
    }

    async getTotalUsersAnsweredSurvey() {
        await this.Response.count({
            where: {
                user_id: {
                    [Op.ne]: null
                }
            }
        });
        return {
            message: "Get total users answered survey successfully!",
            data: {
                count: total
            }
        };
    }

    async getUsersAnsweredBySurvey(survey_id) {

        if (!survey_id) {
            throw new AppError("Survey id is required!", 400);
        }

        const total = await this.Response.count({
            where: {
                survey_id,
                user_id: {
                    [Op.ne]: null
                }
            }
        });

        return {
            message: "Get users answered by survey successfully!",
            data: {
                survey_id,
                count: total
            }
        };
    }
}

export default new AdminStatsService();