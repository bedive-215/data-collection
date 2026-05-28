export const TOOL_DECLARATIONS = [
    {
        name: "list_my_surveys",
        description: "Liệt kê tất cả khảo sát của user. KHÔNG cần tham số. Gọi khi user muốn xem danh sách khảo sát.",
        parameters: { type: "object", properties: {} },
    },
    {
        name: "search_surveys",
        description: "Tìm survey bằng tên/mô tả. Gọi khi user nhắc tên survey mà không có ID.",
        parameters: {
            type: "object",
            properties: { keyword: { type: "string", description: "Từ khóa tìm kiếm" } },
            required: ["keyword"],
        },
    },
    {
        name: "get_survey_detail",
        description: "Xem chi tiết 1 survey. Cần survey_id (UUID).",
        parameters: {
            type: "object",
            properties: { survey_id: { type: "string", description: "ID survey (UUID)" } },
            required: ["survey_id"],
        },
    },
    {
        name: "get_survey_analytics",
        description: "Xem thống kê 1 survey: phản hồi, hoàn thành, tỷ lệ. Cần survey_id.",
        parameters: {
            type: "object",
            properties: { survey_id: { type: "string", description: "ID survey" } },
            required: ["survey_id"],
        },
    },
    {
        name: "get_response_trend",
        description: "Xu hướng phản hồi theo thời gian. Cần survey_id và group_by (day|week|month).",
        parameters: {
            type: "object",
            properties: {
                survey_id: { type: "string", description: "ID survey" },
                group_by: { type: "string", description: "day | week | month", enum: ["day", "week", "month"] },
            },
            required: ["survey_id", "group_by"],
        },
    },
    {
        name: "get_completion_stats",
        description: "Tỷ lệ hoàn thành và drop-off. Cần survey_id.",
        parameters: {
            type: "object",
            properties: { survey_id: { type: "string", description: "ID survey" } },
            required: ["survey_id"],
        },
    },
    {
        name: "get_system_overview",
        description: "Tổng quan hệ thống: số users, surveys, questions. KHÔNG cần tham số.",
        parameters: { type: "object", properties: {} },
    },
    {
        name: "get_my_responses",
        description: "Lấy tất cả phản hồi của user hiện tại. KHÔNG cần tham số.",
        parameters: { type: "object", properties: {} },
    },
    {
        name: "get_notifications",
        description: "Lấy thông báo của user. KHÔNG cần tham số.",
        parameters: { type: "object", properties: {} },
    },
    {
        name: "create_survey",
        description: "TẠO survey mới. Nếu user không cung cấp tiêu đề → dùng 'Khảo sát mới'.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "Tiêu đề. MẶC ĐỊNH: 'Khảo sát mới'" },
                description: { type: "string", description: "Mô tả. Có thể bỏ trống." },
            },
            required: ["title"],
        },
    },
    {
        name: "add_questions_to_survey",
        description: "Thêm câu hỏi vào survey. Cần survey_id và mảng questions.",
        parameters: {
            type: "object",
            properties: {
                survey_id: { type: "string", description: "ID survey" },
                questions: {
                    type: "array",
                    description: "Mảng câu hỏi. Ví dụ: [{content:'Bạn hài lòng?',type:'SINGLE_CHOICE',required:true,options:[{label:'Rất hài lòng'}]}]",
                    items: {
                        type: "object",
                        properties: {
                            content: { type: "string" },
                            type: { type: "string", enum: ["TEXT", "PARAGRAPH", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "RATING", "DATE", "NUMBER", "EMAIL", "DROPDOWN"] },
                            required: { type: "boolean" },
                            options: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
                        },
                        required: ["content", "type"],
                    },
                },
            },
            required: ["survey_id", "questions"],
        },
    },
];