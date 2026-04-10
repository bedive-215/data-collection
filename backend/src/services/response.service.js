import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

class ResponseService {
    constructor() {
        this.Response = models.Response;
        this.Answer = models.Answer;
        this.Question = models.Question;
        this.QuestionOption = models.QuestionOption;
        this.sequelize = models.sequelize;
    }

    async submitSurvey(user_id, survey_id, answers) {
        if (!survey_id) throw new AppError("Survey id is required", 400);
        if (!answers || answers.length === 0) {
            throw new AppError("Answers are required", 400);
        }

        const transaction = await this.sequelize.transaction();

        try {
            // 1. create response
            const response = await this.Response.create({
                survey_id,
                user_id: user_id || null
            }, { transaction });

            // 2. validate questions
            const questionIds = answers.map(a => a.question_id);

            const questions = await this.Question.findAll({
                where: { id: questionIds }
            });

            const questionMap = {};
            questions.forEach(q => {
                questionMap[q.id] = q;
            });

            // 3. create answers
            const answerRecords = [];

            for (const ans of answers) {
                const question = questionMap[ans.question_id];

                if (!question) {
                    throw new AppError("Invalid question", 400);
                }

                // TEXT question
                if (question.type === "TEXT") {
                    if (!ans.answer_text) {
                        throw new AppError("Answer text required", 400);
                    }

                    answerRecords.push({
                        response_id: response.id,
                        question_id: question.id,
                        answer_text: ans.answer_text,
                        option_id: null
                    });
                }

                // CHOICE question
                else {
                    if (!ans.option_id) {
                        throw new AppError("Option is required", 400);
                    }

                    // check option belongs to question
                    const option = await this.QuestionOption.findOne({
                        where: {
                            id: ans.option_id,
                            question_id: question.id
                        }
                    });

                    if (!option) {
                        throw new AppError("Invalid option", 400);
                    }

                    answerRecords.push({
                        response_id: response.id,
                        question_id: question.id,
                        option_id: option.id,
                        answer_text: null
                    });
                }
            }

            // bulk insert
            await this.Answer.bulkCreate(answerRecords, { transaction });

            await transaction.commit();

            return {
                message: "Submit survey successfully",
                response_id: response.id
            };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

export default new ResponseService();