import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Answer = sequelize.define("Answer", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },

        response_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "responses",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        question_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "questions",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        // SINGLE_CHOICE
        option_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "question_options",
                key: "id"
            }
        },

        // MULTIPLE_CHOICE
        selected_options: {
            type: DataTypes.JSON, // [option_id1, option_id2]
            allowNull: true
        },

        // TEXT / EMAIL / PARAGRAPH
        answer_text: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // NUMBER / RATING
        answer_number: {
            type: DataTypes.FLOAT,
            allowNull: true
        }

    }, {
        tableName: "answers",
        timestamps: false,
        underscored: true,
        indexes: [
            { fields: ["response_id"] },
            { fields: ["question_id"] }
        ]
    });

    return Answer;
};