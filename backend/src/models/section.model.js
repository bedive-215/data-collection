import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Section = sequelize.define("Section", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },

        survey_id: {
            type: DataTypes.UUID,
            allowNull: false
        },

        // Tên page/section (hiển thị cho user)
        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },

        // Mô tả ngắn cho section
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
        },

        // Thứ tự hiển thị
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        // Icon cho section (lucide icon name hoặc emoji)
        icon: {
            type: DataTypes.STRING(50),
            allowNull: true,
            defaultValue: null
        },

        // Ảnh bìa section (URL)
        cover_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

        // Số câu hỏi tối thiểu cần trả lời trước khi qua section tiếp theo
        min_required: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },

        // Có hiển thị progress cho section này không
        show_progress: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },

    }, {
        tableName: "sections",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["survey_id"] },
            { fields: ["survey_id", "order_index"] }
        ]
    });

    return Section;
};
