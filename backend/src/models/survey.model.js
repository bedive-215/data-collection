import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Survey = sequelize.define("Survey", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },

        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Title cannot be empty"
                },
                len: {
                    args: [1, 255],
                    msg: "Title must be between 1 and 255 characters"
                }
            }
        },

        description: {
            type: DataTypes.TEXT
        },

        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        },

        start_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        end_at: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterStart(value) {
                    if (this.start_at && value && value <= this.start_at) {
                        throw new Error("end_at must be after start_at");
                    }
                }
            }
        },

        settings: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },

        access_type: {
            type: DataTypes.ENUM('PUBLIC', 'LINK', 'PRIVATE'),
            defaultValue: 'PRIVATE'
        },

        notified_expired: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },

        is_anonymous: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },

        // Giới hạn số phản hồi tối đa
        max_responses: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                min: 1
            }
        },

        // Xáo trộn thứ tự câu hỏi khi user làm survey
        randomize_questions: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },

        // Xáo trộn thứ tự lựa chọn trong câu hỏi
        randomize_options: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },

        // Thời gian làm survey (giây), null = không giới hạn
        time_limit_seconds: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
            validate: {
                min: 30
            }
        },

        // Thứ tự các trang/section mà user đi qua
        show_progress_bar: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },

        // Bật/tắt nút quay lại câu trước
        allow_back: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },

        // Chế độ một câu hỏi mỗi trang
        one_question_per_page: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },

        // Tin nhắn cảm ơn tùy chỉnh
        thank_you_message: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
        },

        // Logo survey (URL)
        logo_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

        // Ảnh nền survey (URL)
        background_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

        // Màu chủ đạo (hex color)
        accent_color: {
            type: DataTypes.STRING(20),
            allowNull: true,
            defaultValue: "#6366f1"
        },

        // Cho phép tải lại kết quả
        show_correct_answers: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },

        // Thứ tự trang mặc định
        default_page_order: {
            type: DataTypes.JSON, // mảng section/page UUID
            allowNull: true,
            defaultValue: null
        },

        // URL chuyển hướng sau khi hoàn thành khảo sát
        thank_you_redirect_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null
        },

    }, {
        tableName: "surveys",
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            { fields: ["created_by"] },
            { fields: ["created_at"] },
            { fields: ["start_at"] },
            { fields: ["end_at"] }
        ]
    });

    return Survey;
};
