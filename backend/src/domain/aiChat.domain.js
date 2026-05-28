export const APP_KNOWLEDGE = `
    ## ECHOFORM — APP KNOWLEDGE

    ### TỔNG QUAN
    EchoForm: nền tảng khảo sát online. Backend Node.js+Express+Sequelize+MySQL. Frontend React+Vite. AI: Gemini.

    ### API BACKEND
    Base: /api/v1/

    #### AUTH
    - POST /auth/register, /auth/login, /auth/logout, /auth/me
    - PATCH /auth/profile (avatar, display_name, phone, address)
    - POST /auth/forgot-password, PATCH /auth/password

    #### SURVEYS (CRUD + quản lý)
    - GET /survey/me — danh sách survey của user
    - GET /survey/:survey_id — chi tiết survey
    - PUT /survey/:survey_id — cập nhật survey
    - DELETE /survey/:survey_id — xóa survey
    - PATCH /survey/:survey_id/close — đóng survey
    - PATCH /survey/:survey_id/publish — công khai survey
    - PATCH /survey/:survey_id/extend — gia hạn
    - POST /survey/:survey_id/invite — mời email
    - GET /survey/:survey_id/participants — danh sách người tham gia

    #### QUESTIONS
    - GET /questions/survey/:survey_id — lấy câu hỏi
    - POST /questions/survey/:survey_id — tạo câu hỏi
    - PATCH /questions/:question_id/survey/:survey_id — cập nhật
    - DELETE /questions/:question_id/survey/:survey_id — xóa
    - POST /questions/survey/:survey_id/bulk — tạo nhiều câu hỏi

    #### RESPONSES
    - POST /responses/surveys/:survey_id/start — bắt đầu
    - POST /responses/surveys/:survey_id — nộp survey
    - GET /responses/:survey_id/me — phản hồi của tôi
    - PATCH /responses/:survey_id/autosave — tự động lưu
    - GET /responses/me — tất cả phản hồi của tôi

    #### ANALYTICS
    - GET /analytics/surveys/:survey_id — thống kê survey
    - GET /analytics/surveys/:survey_id/dashboard — dashboard
    - GET /analytics/surveys/:survey_id/completion — tỷ lệ hoàn thành + drop-off
    - GET /analytics/surveys/:survey_id/trend?group_by=day|week|month — xu hướng
    - GET /analytics/surveys/:survey_id/responses?page=&limit= — danh sách phản hồi
    - GET /analytics/surveys/:survey_id/crosstab — cross-tab
    - GET /analytics/surveys/:survey_id/heatmap — date heatmap
    - GET /analytics/surveys/:survey_id/export — xuất CSV
    - GET /analytics/surveys/:survey_id/responses/filtered — tìm phản hồi

    #### ADMIN STATS
    - GET /admin-stats/overview — tổng quan hệ thống (users, surveys, questions)

    #### NOTIFICATIONS
    - GET /notifications — danh sách thông báo
    - PATCH /notifications/:id/read — đánh dấu đã đọc

    ### CÁC LOẠI CÂU HỎI
    TEXT | PARAGRAPH | SINGLE_CHOICE | MULTIPLE_CHOICE | RATING | DATE | NUMBER | EMAIL | DROPDOWN

    ### TRẠNG THÁI SURVEY (tính từ ngày)
    ACTIVE → Đang hoạt động
    SCHEDULED → Đã lên lịch (start_at > now)
    EXPIRED → Hết hạn (end_at < now)

    ### TRẠNG THÁI PHẢN HỒI
    IN_PROGRESS → Đang làm | COMPLETED → Đã nộp

    ### ANALYTICS FEATURES
    NPS Score | Cross-tab + Chi-Square | Date Heatmap | Response Trend | Drop-off | Word frequency | Export CSV/JSON
`;

// ─── TOOL DECLARATIONS ───────────────────────────────────────────────────

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

export function buildSystemPrompt() {
  return `Bạn là EchoAI, trợ lý AI của nền tảng khảo sát EchoForm.

        ${APP_KNOWLEDGE}

        ## HƯỚNG DẪN BẮT BUỘC

        ### KHI USER MUỐN XEM DANH SÁCH SURVEY:
        → list_my_surveys()

        ### KHI USER NHẮC TÊN SURVEY MÀ KHÔNG CÓ ID:
        → search_surveys(keyword="tên survey")

        ### KHI USER MUỐN XEM THỐNG KÊ:
        → list_my_surveys() trước → get_survey_analytics(survey_id)

        ### KHI USER MUỐN XEM CHI TIẾT SURVEY:
        → search_surveys(keyword="tên") → get_survey_detail(survey_id)

        ### KHI USER MUỐN TẠO SURVEY:
        → create_survey(title="tên", description="mô tả")

        ### KHI USER MUỐN THÊM CÂU HỎI:
        → search_surveys(keyword="tên") → add_questions_to_survey(survey_id, questions)

        ### KHI USER HỎI VỀ HỆ THỐNG:
        → get_system_overview()

        ### KHI USER HỎI VỀ PHẢN HỒI CỦA HỌ:
        → get_my_responses()

        ### KHI USER HỎI VỀ THÔNG BÁO:
        → get_notifications()

        ## QUAN TRỌNG
        - SAU KHI gọi tool, kết quả có trường **_reply** chứa reply đã FORMAT SẴN.
        - LUÔN trả lại nội dung **_reply** cho user. KHÔNG viết lại.
        - KHÔNG hỏi lại user. Gọi tool ngay.
        - Trả lời TIẾNG VIỆT.
    `;
}