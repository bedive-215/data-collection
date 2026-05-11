import { DataTypes } from "sequelize";

export default (sequelize) => {
    const SurveyAccess = sequelize.define("SurveyAccess", {
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
        access_token: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        tableName: "survey_access",
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['survey_id', 'access_token']
            }
        ]
    });
    return SurveyAccess;
}