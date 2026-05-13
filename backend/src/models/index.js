import sequelize from "../configs/db.config.js";
import UserModel from "./user.model.js";
import UserOAuthModel from "./userOauth.model.js";
import SurveyModel from "./survey.model.js";
import QuestionModel from "./question.model.js";
import QuestionOptionModel from "./questionOption.model.js";
import ResponseModel from "./response.model.js";
import AnswerModel from "./answer.model.js";
import SurveyParticipantModel from "./surveyParticipant.model.js";
import SurveyAccessModel from "./surveyAccess.model.js";
import NotificationModel from "./notification.model.js";


const User = UserModel(sequelize);
const UserOAuth = UserOAuthModel(sequelize);
const Survey = SurveyModel(sequelize);
const Question = QuestionModel(sequelize);
const QuestionOption = QuestionOptionModel(sequelize);
const Response = ResponseModel(sequelize);
const Answer = AnswerModel(sequelize);
const SurveyParticipant = SurveyParticipantModel(sequelize);
const SurveyAccess = SurveyAccessModel(sequelize);
const Notification = NotificationModel(sequelize);

// Define associations
User.hasMany(UserOAuth, { foreignKey: "user_id", as: "oauth_providers" });
UserOAuth.belongsTo(User, { foreignKey: "user_id", as: "user", onDelete: "CASCADE" });

// Survey
Survey.belongsTo(User, { foreignKey: "created_by", as: "creator", onDelete: "CASCADE" });
User.hasMany(Survey, { foreignKey: "created_by", as: "surveys" });

// Questions
Survey.hasMany(Question, { foreignKey: "survey_id", as: "questions" });
Question.belongsTo(Survey, { foreignKey: "survey_id", as: "survey", onDelete: "CASCADE" });

// Options
Question.hasMany(QuestionOption, { foreignKey: "question_id", as: "options" });
QuestionOption.belongsTo(Question, { foreignKey: "question_id", as: "question", onDelete: "CASCADE" });

// Responses
Survey.hasMany(Response, { foreignKey: "survey_id", as: "responses" });
Response.belongsTo(Survey, { foreignKey: "survey_id", as: "survey", onDelete: "CASCADE" });

User.hasMany(Response, { foreignKey: "user_id", as: "responses" });
Response.belongsTo(User, { foreignKey: "user_id", as: "user", onDelete: "CASCADE" });

// Answers
Response.hasMany(Answer, { foreignKey: "response_id", as: "answers" });
Answer.belongsTo(Response, { foreignKey: "response_id", as: "response", onDelete: "CASCADE" });

Question.hasMany(Answer, { foreignKey: "question_id", as: "answers" });
Answer.belongsTo(Question, { foreignKey: "question_id", as: "question", onDelete: "CASCADE" });

QuestionOption.hasMany(Answer, { foreignKey: "option_id", as: "answers" });
Answer.belongsTo(QuestionOption, { foreignKey: "option_id", as: "option", onDelete: "CASCADE" });

// Survey Participant
Survey.hasMany(SurveyParticipant, { foreignKey: "survey_id", as: "participants" });

SurveyParticipant.belongsTo(Survey, { foreignKey: "survey_id", as: "survey", onDelete: "CASCADE" });

// User -> Participants
User.hasMany(SurveyParticipant, {foreignKey: "user_id", as: "survey_participations"});

SurveyParticipant.belongsTo(User, { foreignKey: "user_id", as: "user", onDelete: "CASCADE" });

// Survey -> SurveyAccess
Survey.hasOne(SurveyAccess, { foreignKey: 'survey_id', as: 'survey_access' });

SurveyAccess.belongsTo(Survey, { foreignKey: 'survey_id', as: 'survey', onDelete: 'CASCADE' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });

const models = {
    User,
    UserOAuth,
    Survey,
    Question,
    QuestionOption,
    Response,
    Answer,
    SurveyParticipant,
    SurveyAccess,
    Notification,
    sequelize,
};

export default models;