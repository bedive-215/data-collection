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
            allowNull: false
        },

        label: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        value: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        is_other: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }

    }, {
        tableName: "question_options",
        timestamps: false,
        underscored: true,
        indexes: [
            { fields: ["question_id"] }
        ]
    });

    return QuestionOption;
};