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
        },

        // NEW: URL ảnh/video của lựa chọn
        image_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

        // NEW: loại media (image | video)
        media_type: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: true,
            defaultValue: null
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