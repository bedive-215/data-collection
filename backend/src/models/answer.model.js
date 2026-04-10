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
        option_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "question_options",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        answer_text: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: "answers",
        timestamps: false,
        underscored: true
    });

    return Answer;
};