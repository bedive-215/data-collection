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
            allowNull: false
        },

        // section_id: liên kết câu hỏi với section (page)
        section_id: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        // NEW: mô tả phụ dưới tiêu đề câu hỏi
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
        },

        // NEW: placeholder hiển thị trong ô nhập liệu
        placeholder: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
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
                'EMAIL',
                'LINEAR_SCALE',
                'TIME',
                'FILE_UPLOAD',
                'MATRIX'
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
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },

        // NEW: link ảnh/video hiển thị với câu hỏi
        media_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

        // NEW: loại media (image | video)
        media_type: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: true,
            defaultValue: null
        },

        // NEW: Conditional logic - khi nào câu hỏi này được hiển thị
        // JSON: { question_id, operator, value }
        // operators: equals, not_equals, contains, greater_than, less_than, is_selected
        // ví dụ: { "question_id": "abc", "operator": "equals", "value": "Có" }
        // null = luôn hiển thị
        condition: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        },

        // NEW: Ẩn câu hỏi khỏi analytics (vẫn hiển thị khi làm survey)
        hidden_from_analytics: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },

        // NEW: ID câu hỏi tiếp theo khi submit (bỏ qua thứ tự mặc định)
        // null = đi theo thứ tự order_index
        next_question_id: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null
        },

        // NEW: Nhảy đến section/page cụ thể khi submit
        next_section_id: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null
        },

    }, {
        tableName: "questions",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["survey_id"] },
            { fields: ["survey_id", "order_index"] },
            { fields: ["section_id"] }
        ]
    });

    return Question;
};
