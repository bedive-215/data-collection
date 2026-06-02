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
