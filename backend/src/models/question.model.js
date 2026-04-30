import { DataTypes } from "sequelize";

export default (sequelize, DataTypes) => {
    const Question = sequelize.define("Question", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },

        survey_id: {
            type: DataTypes.UUID,
            allowNull: false
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        type: {
            type: DataTypes.ENUM(
                'TEXT',
                'PARAGRAPH',
                'SINGLE_CHOICE',
                'MULTIPLE_CHOICE',
                'DROPDOWN',
                'RATING',
                'DATE',
                'NUMBER',
                'EMAIL'
            ),
            allowNull: false
        },

        required: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        settings: {
            type: DataTypes.JSONB,
            allowNull: true
        }

    }, {
        tableName: "questions",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["survey_id"] },
            { fields: ["survey_id", "order_index"] }
        ]
    });

    return Question;
};