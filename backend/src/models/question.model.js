import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Question = sequelize.define("Question", {
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
            },
            onDelete: "CASCADE"
        },
        content: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'),
            allowNull: false,
            defaultValue: 'SINGLE_CHOICE'
        },
        required: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
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