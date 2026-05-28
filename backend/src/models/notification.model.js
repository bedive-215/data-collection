import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Notification = sequelize.define("Notification", {

        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },

        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },

        survey_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "surveys",
                key: "id"
            }
        },

        type: {
            type: DataTypes.ENUM(
                "SURVEY_INVITATION",
                "SURVEY_INVITATION_SENT",
                "SURVEY_RESPONSE",
                "SURVEY_EXPIRED",
                "SURVEY_PUBLISHED",
                "SURVEY_CLOSED",
                "NEW_PARTICIPANT",
                "SURVEY_TIMEOUT",
                "SYSTEM"
            ),
            allowNull: false
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },
        data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: "Additional data like survey_id, response_id, etc."
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: "notifications",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ["user_id", "read"]
            },
            {
                fields: ["user_id", "created_at"]
            }
        ]
    });

    return Notification;
};
