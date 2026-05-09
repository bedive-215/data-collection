import { DataTypes } from "sequelize";

export default (sequelize) => {
    const SurveyParticipant = sequelize.define("SurveyParticipant", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        survey_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "surveys",
                key: "id"
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('viewer', 'editor', 'respondent'),
            defaultValue: 'respondent'
        }
    },
    {
        tableName: "survey_participants",
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['survey_id', 'user_id']
            }
        ]
    });
    return SurveyParticipant;
}