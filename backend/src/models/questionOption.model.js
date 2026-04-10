import { DataTypes } from "sequelize";

export default (sequelize) => {
    const QuestionOption = sequelize.define("QuestionOption", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
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
        content: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: "question_options",
        timestamps: false,
        underscored: true
    });

    return QuestionOption;
};