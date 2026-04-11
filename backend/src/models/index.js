import sequelize from "../configs/db.config.js";
import UserModel from "./user.model.js";
import UserOAuthModel from "./userOauth.model.js";
import SurveyModel from "./survey.model.js";
import QuestionModel from "./question.model.js";
import QuestionOptionModel from "./questionOption.model.js";
import ResponseModel from "./response.model.js";
import AnswerModel from "./answer.model.js";


const User = UserModel(sequelize);
const UserOAuth = UserOAuthModel(sequelize);
const Survey = SurveyModel(sequelize);
const Question = QuestionModel(sequelize);
const QuestionOption = QuestionOptionModel(sequelize);
const Response = ResponseModel(sequelize);
const Answer = AnswerModel(sequelize);

// Define associations
User.hasMany(UserOAuth, { foreignKey: "user_id", as: "oauth_providers", onDelete: "CASCADE" });
UserOAuth.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Survey
Survey.belongsTo(User, { foreignKey: "created_by", as: "creator" });
User.hasMany(Survey, { foreignKey: "created_by", as: "surveys" });

// Questions
Survey.hasMany(Question, { foreignKey: "survey_id", as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Survey, { foreignKey: "survey_id", as: "survey" });

// Options
Question.hasMany(QuestionOption, { foreignKey: "question_id", as: "options", onDelete: "CASCADE" });
QuestionOption.belongsTo(Question, { foreignKey: "question_id", as: "question" });

// Responses
Survey.hasMany(Response, { foreignKey: "survey_id", as: "responses", onDelete: "CASCADE" });
Response.belongsTo(Survey, { foreignKey: "survey_id", as: "survey" });

User.hasMany(Response, { foreignKey: "user_id", as: "responses" });
Response.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Answers
Response.hasMany(Answer, { foreignKey: "response_id", as: "answers", onDelete: "CASCADE" });
Answer.belongsTo(Response, { foreignKey: "response_id", as: "response" });

Question.hasMany(Answer, { foreignKey: "question_id", as: "answers" });
Answer.belongsTo(Question, { foreignKey: "question_id", as: "question" });

QuestionOption.hasMany(Answer, { foreignKey: "option_id", as: "answers" });
Answer.belongsTo(QuestionOption, { foreignKey: "option_id", as: "option" });

const models = {
    User,
    UserOAuth,
    Survey,
    Question,
    QuestionOption,
    Response,
    Answer,
    sequelize
};

export default models;