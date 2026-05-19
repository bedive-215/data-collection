import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  createPartFromText,
  createPartFromFunctionCall,
  createPartFromFunctionResponse,
  createUserContent,
  createModelContent,
} from "@google/genai";
import { Op } from "sequelize";
import models from "../models/index.js";
import { AppError } from "../middlewares/handleException.middlware.js";

function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return { key, model };
}

function getSurveyStatus(survey) {
  const now = new Date();
  if (survey.start_at && now < new Date(survey.start_at)) return "SCHEDULED";
  if (survey.end_at && now > new Date(survey.end_at)) return "EXPIRED";
  return "ACTIVE";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── APP KNOWLEDGE BASE ──────────────────────────────────────────────────
const APP_KNOWLEDGE = `
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

const TOOL_DECLARATIONS = [
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

// ─── TOOL EXECUTOR ───────────────────────────────────────────────────────

async function executeTool(name, args, user) {
  const { Survey, Question, SurveyParticipant, Response, QuestionOption } = models;

  switch (name) {
    case "list_my_surveys": {
      const surveys = await Survey.findAll({
        where: { created_by: user.id },
        order: [["created_at", "DESC"]],
        limit: 50,
        attributes: ["id", "title", "description", "created_at", "start_at", "end_at"],
        include: [
          { model: Question, as: "questions", attributes: ["id"], required: false },
          { model: Response, as: "responses", attributes: ["id"], required: false },
          { model: SurveyParticipant, as: "participants", attributes: ["id"], required: false },
        ],
      });

      const mapped = surveys.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: getSurveyStatus(s),
        created_at: s.created_at,
        question_count: s.questions?.length || 0,
        response_count: s.responses?.length || 0,
        participant_count: s.participants?.length || 0,
      }));

      const lines = ["📋 **Danh sách khảo sát của bạn**"];
      if (mapped.length === 0) {
        lines.push("Bạn chưa có khảo sát nào. Hãy tạo khảo sát đầu tiên nhé!");
      } else {
        lines.push(`Tổng cộng: **${mapped.length}** khảo sát\n`);
        mapped.slice(0, 10).forEach((s) => {
          const emoji = s.status === "ACTIVE" ? "🟢" : s.status === "SCHEDULED" ? "🟡" : "⚫";
          lines.push(`${emoji} **${s.title}**\n   📝 ${s.question_count} câu · 💬 ${s.response_count} phản hồi · 👥 ${s.participant_count} tham gia`);
        });
        if (mapped.length > 10) lines.push(`\n...và ${mapped.length - 10} khảo sát khác`);
        lines.push(`\n💡 Muốn làm gì? Tạo survey mới, xem thống kê, hay thêm câu hỏi?`);
      }

      return { surveys: mapped, total: mapped.length, _reply: lines.join("\n") };
    }

    case "search_surveys": {
      const { keyword } = args;
      const surveys = await Survey.findAll({
        where: {
          created_by: user.id,
          [Op.or]: [
            { title: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
          ],
        },
        order: [["created_at", "DESC"]],
        limit: 20,
        attributes: ["id", "title", "description", "created_at", "start_at", "end_at"],
        include: [
          { model: Question, as: "questions", attributes: ["id"], required: false },
          { model: Response, as: "responses", attributes: ["id"], required: false },
          { model: SurveyParticipant, as: "participants", attributes: ["id"], required: false },
        ],
      });

      const mapped = surveys.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        status: getSurveyStatus(s),
        created_at: s.created_at,
        question_count: s.questions?.length || 0,
        response_count: s.responses?.length || 0,
        participant_count: s.participants?.length || 0,
      }));

      const lines = [`🔍 **Kết quả tìm kiếm: "${keyword}"**`];
      if (mapped.length === 0) {
        lines.push(`Không tìm thấy khảo sát nào khớp "${keyword}".`);
        lines.push("Bạn có muốn tạo một khảo sát mới với tên đó?");
      } else {
        lines.push(`Tìm thấy **${mapped.length}** khảo sát:`);
        mapped.forEach((s, i) => {
          const emoji = s.status === "ACTIVE" ? "🟢" : s.status === "SCHEDULED" ? "🟡" : "⚫";
          lines.push(`${i + 1}. ${emoji} **${s.title}**\n   📝 ${s.question_count} câu · 💬 ${s.response_count} phản hồi`);
        });
        lines.push(`\n💡 Xem chi tiết, thêm câu hỏi, hay xem thống kê?`);
      }

      return { surveys: mapped, total: mapped.length, keyword, _reply: lines.join("\n") };
    }

    case "get_survey_detail": {
      const { survey_id } = args;
      if (!survey_id) return { _reply: "Mình cần biết bạn muốn xem khảo sát nào. Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const survey = await Survey.findOne({
        where: { id: survey_id, created_by: user.id },
        include: [{ model: Question, as: "questions", order: [["order_index", "ASC"]] }],
      });

      if (!survey) return { _reply: "Không tìm thấy khảo sát. Có thể bạn không có quyền. Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const [responseCount, participantCount] = await Promise.all([
        Response.count({ where: { survey_id } }),
        SurveyParticipant.count({ where: { survey_id } }),
      ]);

      const status = getSurveyStatus(survey);
      const emoji = status === "ACTIVE" ? "🟢" : status === "SCHEDULED" ? "🟡" : "⚫";
      const lines = [
        `${emoji} **${survey.title}**`,
        `━━━━━━━━━━━━━━━━━━`,
        `📝 Mô tả: ${survey.description || "(không có)"}`,
        `📅 Tạo: ${formatDate(survey.created_at)} | Bắt đầu: ${formatDate(survey.start_at)} | Kết thúc: ${formatDate(survey.end_at)}`,
        `━━━━━━━━━━━━━━━━━━`,
        `📊 Câu hỏi: **${survey.questions?.length || 0}** | Phản hồi: **${responseCount}** | Tham gia: **${participantCount}**`,
        `🎯 Tỷ lệ hoàn thành: **${participantCount > 0 ? Math.round((responseCount / participantCount) * 100) : 0}%**`,
      ];

      if (survey.questions?.length > 0) {
        lines.push(`━━━━━━━━━━━━━━━━━━`);
        lines.push(`**📋 Câu hỏi (${survey.questions.length}):**`);
        survey.questions.forEach((q, i) => {
          lines.push(`  ${i + 1}. [${q.type}] ${q.content}`);
        });
      }

      lines.push(`━━━━━━━━━━━━━━━━━━\n💡 Thêm câu hỏi, xem thống kê, hay chỉnh sửa?`);
      return {
        id: survey.id, title: survey.title, status,
        question_count: survey.questions?.length || 0,
        response_count: responseCount,
        participant_count: participantCount,
        questions: survey.questions?.map(q => ({ id: q.id, content: q.content, type: q.type, required: q.required })),
        _reply: lines.join("\n"),
      };
    }

    case "get_survey_analytics": {
      const { survey_id } = args;
      if (!survey_id) return { _reply: "Bạn cho mình biết tên khảo sát muốn xem thống kê được không?", need_search: true };

      const survey = await Survey.findOne({
        where: { id: survey_id, created_by: user.id },
        attributes: ["id", "title", "created_at"],
      });

      if (!survey) return { _reply: "Không tìm thấy khảo sát. Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const [respCount, partCount] = await Promise.all([
        Response.count({ where: { survey_id } }),
        SurveyParticipant.count({ where: { survey_id } }),
      ]);

      const rate = partCount > 0 ? Math.round((respCount / partCount) * 100) : 0;
      const lines = [
        `📊 **Thống kê: "${survey.title}"**`,
        `━━━━━━━━━━━━━━━━━━`,
        `💬 Phản hồi: **${respCount}**`,
        `👥 Người tham gia: **${partCount}**`,
        `🎯 Tỷ lệ hoàn thành: **${rate}%**`,
        `📅 Tạo: ${formatDate(survey.created_at)}`,
        `━━━━━━━━━━━━━━━━━━`,
      ];

      if (respCount === 0) {
        lines.push(`📭 Chưa có phản hồi nào. Hãy chia sẻ survey để thu thập phản hồi!`);
      } else {
        lines.push(`💡 Xem chi tiết (NPS, Cross-tab, Trend, Heatmap...) trong trang Analytics.`);
      }

      return { id: survey.id, title: survey.title, response_count: respCount, participant_count: partCount, completion_rate: rate, _reply: lines.join("\n") };
    }

    case "get_response_trend": {
      const { survey_id, group_by } = args;
      if (!survey_id) return { _reply: "Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const responses = await Response.findAll({
        where: { survey_id },
        attributes: ["submitted_at"],
        order: [["submitted_at", "ASC"]],
        raw: true,
      });

      const trendMap = {};
      responses.forEach((r) => {
        if (!r.submitted_at) return;
        const d = new Date(r.submitted_at);
        let key;
        if (group_by === "week") key = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
        else if (group_by === "month") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        else key = d.toISOString().split("T")[0];
        trendMap[key] = (trendMap[key] || 0) + 1;
      });

      const trend = Object.entries(trendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => ({ period, count }));

      const label = group_by === "day" ? "ngày" : group_by === "week" ? "tuần" : "tháng";
      return {
        survey_id, group_by, trend, total_responses: responses.length,
        _reply: `📈 **Xu hướng phản hồi (theo ${label}):**\n${trend.length > 0 ? trend.map(t => `• **${t.period}**: ${t.count} phản hồi`).join("\n") : "Chưa có dữ liệu."}`,
      };
    }

    case "get_completion_stats": {
      const { survey_id } = args;
      if (!survey_id) return { _reply: "Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const [completed, inProgress, totalParticipants] = await Promise.all([
        Response.count({ where: { survey_id, status: "COMPLETED" } }),
        Response.count({ where: { survey_id, status: "IN_PROGRESS" } }),
        SurveyParticipant.count({ where: { survey_id } }),
      ]);

      const rate = totalParticipants > 0 ? Math.round((completed / totalParticipants) * 100) : 0;
      return {
        survey_id, completed, in_progress: inProgress, total_participants: totalParticipants, completion_rate: rate,
        _reply: `📊 **Tỷ lệ hoàn thành**\n✅ Hoàn thành: **${completed}**\n⏳ Đang làm: **${inProgress}**\n👥 Tổng tham gia: **${totalParticipants}**\n🎯 Tỷ lệ: **${rate}%**`,
      };
    }

    case "get_system_overview": {
      const [totalUsers, totalSurveys, totalQuestions, totalResponses] = await Promise.all([
        models.User.count(),
        Survey.count(),
        Question.count(),
        Response.count(),
      ]);

      const activeSurveys = await Survey.count({
        where: {
          start_at: { [Op.or]: [{ [Op.is]: null }, { [Op.lte]: new Date() }] },
          end_at: { [Op.or]: [{ [Op.is]: null }, { [Op.gte]: new Date() }] },
        },
      });

      return {
        total_users: totalUsers, total_surveys: totalSurveys, active_surveys: activeSurveys,
        total_questions: totalQuestions, total_responses: totalResponses,
        _reply: `📊 **Tổng quan hệ thống EchoForm**\n━━━━━━━━━━━━━━━━━━\n👥 Người dùng: **${totalUsers}**\n📋 Tổng survey: **${totalSurveys}**\n🟢 Survey đang hoạt động: **${activeSurveys}**\n❓ Tổng câu hỏi: **${totalQuestions}**\n💬 Tổng phản hồi: **${totalResponses}**\n━━━━━━━━━━━━━━━━━━`,
      };
    }

    case "get_my_responses": {
      const responses = await Response.findAll({
        where: { user_id: user.id },
        order: [["submitted_at", "DESC"]],
        limit: 20,
        attributes: ["id", "survey_id", "status", "submitted_at", "created_at"],
        include: [{ model: Survey, as: "survey", attributes: ["title"] }],
      });

      const lines = ["📨 **Phản hồi của bạn**"];
      if (responses.length === 0) {
        lines.push("Bạn chưa có phản hồi nào cho khảo sát nào.");
      } else {
        responses.forEach((r, i) => {
          const emoji = r.status === "COMPLETED" ? "✅" : "⏳";
          lines.push(`${i + 1}. ${emoji} **${r.survey?.title || "Khảo sát"}** — ${r.status === "COMPLETED" ? "Hoàn thành" : "Đang làm"} — ${formatDate(r.submitted_at || r.created_at)}`);
        });
      }

      return { responses: responses.map(r => ({ id: r.id, survey_id: r.survey_id, survey_title: r.survey?.title, status: r.status, submitted_at: r.submitted_at })), total: responses.length, _reply: lines.join("\n") };
    }

    case "get_notifications": {
      const notifications = await models.Notification.findAll({
        where: { user_id: user.id },
        order: [["created_at", "DESC"]],
        limit: 10,
        attributes: ["id", "title", "message", "is_read", "created_at"],
      });

      const unread = notifications.filter((n) => !n.is_read).length;
      const lines = [`🔔 **Thông báo**${unread > 0 ? ` (${unread} chưa đọc)` : ""}`];
      if (notifications.length === 0) {
        lines.push("Bạn không có thông báo nào.");
      } else {
        notifications.forEach((n) => {
          const prefix = n.is_read ? "  " : "🔵";
          lines.push(`${prefix} **${n.title}**\n   ${n.message}\n   📅 ${formatDate(n.created_at)}`);
        });
      }

      return { notifications: notifications.map((n) => ({ id: n.id, title: n.title, message: n.message, is_read: n.is_read })), unread_count: unread, _reply: lines.join("\n") };
    }

    case "create_survey": {
      const title = (args?.title && String(args.title).trim()) ? String(args.title).trim() : "Khảo sát mới";
      const description = args?.description ? String(args.description).trim() : null;

      const survey = await Survey.create({
        title, description, created_by: user.id, start_at: null, end_at: null,
      });

      const lines = [
        `✅ **Đã tạo khảo sát thành công!**`,
        `━━━━━━━━━━━━━━━━━━`,
        `📌 Tiêu đề: **${survey.title}**`,
        `📝 Mô tả: ${description || "(không có)"}`,
        `🟢 Status: **Đang hoạt động**`,
        `🔑 ID: \`${survey.id}\``,
        ``,
        `💡 Bước tiếp theo:`,
        `• Thêm câu hỏi vào survey`,
        `• Công khai survey`,
        `• Xem và chỉnh sửa survey`,
      ];

      return { id: survey.id, title: survey.title, status: "ACTIVE", action: "CREATED", _reply: lines.join("\n") };
    }

    case "add_questions_to_survey": {
      const { survey_id, questions } = args;
      if (!survey_id) return { _reply: "Mình cần biết bạn muốn thêm vào khảo sát nào. Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const survey = await Survey.findOne({ where: { id: survey_id, created_by: user.id } });
      if (!survey) return { _reply: "Không tìm thấy khảo sát. Bạn cho mình biết tên khảo sát được không?", need_search: true };

      const existingCount = await Question.count({ where: { survey_id } });
      const created = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type);
        const question = await Question.create({
          survey_id, content: q.content, type: q.type,
          required: q.required !== false, order_index: existingCount + i, settings: {},
        });
        if (isChoice && q.options?.length > 0) {
          await QuestionOption.bulkCreate(
            q.options.map((opt, idx) => ({ question_id: question.id, label: opt.label, value: opt.value || `opt_${idx + 1}`, order_index: idx }))
          );
        }
        created.push({ id: question.id, content: question.content, type: question.type });
      }

      const lines = [`✅ **Đã thêm ${created.length} câu hỏi vào "${survey.title}"!**`];
      created.forEach((q, i) => lines.push(`${i + 1}. [${q.type}] ${q.content}`));
      lines.push(`━━━━━━━━━━━━━━━━━━\n📊 Tổng câu hỏi: **${existingCount + created.length}**`);

      return { survey_id, survey_title: survey.title, action: "QUESTIONS_ADDED", created_count: created.length, questions: created, _reply: lines.join("\n") };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────

function buildSystemPrompt() {
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
- Trả lời TIẾNG VIỆT.`;
}

// ─── INTENT DETECTION (fast path — no AI needed) ───────────────────────
function detectIntent(msg) {
  const lower = msg.toLowerCase();

  // List surveys
  if (/^(liệt kê|danh sách|xem|hiển thị|kể|cho tôi|xem nào)\b.*(khảo sát|survey|bảng khảo sát|các khảo sát|của tôi)|^(tôi có|cho xem|hiện|tất cả).*(khảo|survey|survey)/.test(lower) ||
      /^liệt\s*kê/.test(lower) ||
      /^(tôi có bao nhiêu|show me|list)\b/.test(lower)) {
    return { tool: "list_my_surveys", args: {} };
  }

  // System overview
  if (/tổng quan|hệ thống|thống kê chung|overview|system/i.test(lower) &&
      !/(khảo.sát|survey)/.test(lower)) {
    return { tool: "get_system_overview", args: {} };
  }

  // My responses
  if (/phản hồi\s*(của\s*)?tôi|lịch sử|responses\s*me/.test(lower)) {
    return { tool: "get_my_responses", args: {} };
  }

  // Notifications
  if (/thông báo|notification|bell/i.test(lower)) {
    return { tool: "get_notifications", args: {} };
  }

  // Analytics for a named survey
  const surveyMatch = lower.match(/(?:thống kê|xem|phân tích|xem thống kê|cStat)\b.*(?:khảo sát|survey)[s]?\s*(?:về |của |\"?|')?(.+)/);
  if (surveyMatch) {
    return { tool: "search_surveys", args: { keyword: surveyMatch[1].trim() } };
  }

  // Create survey
  if (/^(tạo|mới|làm|mở)\b.*(khảo sát|survey)/.test(lower) ||
      /^tạo\s*(khảo|mới)\b/.test(lower)) {
    const titleMatch = lower.match(/(?:tạo|mới|làm)\b.*(?:khảo sát|survey)\s*(?:về |có tiêu đề |tên |\"?|')?(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : "Khảo sát mới";
    return { tool: "create_survey", args: { title } };
  }

  // Survey detail by name
  const detailMatch = lower.match(/(?:xem|chi tiết|detail)\b.*(?:khảo sát|survey)[s]?\s*(?:về |của |\"?|')?(.+)/);
  if (detailMatch) {
    return { tool: "search_surveys", args: { keyword: detailMatch[1].trim() } };
  }

  return null; // Let AI decide
}

// ─── MAIN CHAT ───────────────────────────────────────────────────────────

async function chatWithAgent(userMessage, conversationHistory = [], user) {
  if (!userMessage?.trim()) throw new Error("Tin nhắn không được để trống");
  if (String(userMessage).length > 2000) throw new Error("Tin nhắn quá dài (tối đa 2000 ký tự)");

  const { key, model } = getGeminiConfig();
  if (!key) throw new Error("Missing GEMINI_API_KEY");

  const ai = new GoogleGenAI({ apiKey: key });

  // Build contents array using proper helper functions
  const contents = [];
  for (const m of conversationHistory.slice(-4)) {
    if (m.role === "user") {
      contents.push(createUserContent(createPartFromText(m.content)));
    } else {
      contents.push(createModelContent(createPartFromText(m.content)));
    }
  }

  const userContent = createUserContent(createPartFromText(String(userMessage).trim()));

  // ── FAST PATH: Intent detection (no AI needed) ──
  const intent = detectIntent(String(userMessage).trim());
  if (intent) {
    let toolResult;
    try {
      toolResult = await executeTool(intent.tool, intent.args, user);
    } catch (err) {
      return {
        reply: `❌ ${err?.message || "Lỗi khi thực hiện"}`,
        timestamp: new Date().toISOString(),
        action: null,
      };
    }

    const reply = toolResult._reply?.trim() || "Đã xong!";
    return {
      reply,
      timestamp: new Date().toISOString(),
      action:
        toolResult?.action || toolResult?.id
          ? {
              type: toolResult.action || "VIEW",
              surveyId: toolResult.id || intent.args?.survey_id || null,
              data: toolResult,
            }
          : null,
    };
  }

  // ── SLOW PATH: AI decides what tool to call ──
  const firstResponse = await ai.models.generateContent({
    model,
    contents: [...contents, userContent],
    config: {
      systemInstruction: buildSystemPrompt(),
      temperature: 0.1,
      maxOutputTokens: 512,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.ANY },
      },
    },
  });

  const firstCalls = firstResponse.functionCalls || [];

  // Case 1: No tool → return text directly
  if (firstCalls.length === 0) {
    const text = firstResponse.text?.trim() || "";
    return {
      reply: text || "Mình chưa hiểu ý bạn. Bạn có thể diễn đạt lại được không?",
      timestamp: new Date().toISOString(),
      action: null,
    };
  }

  // Case 2: Execute tool
  const call = firstCalls[0];
  const fnName = call.name;
  const fnArgs = call.arguments || {};

  let toolResult;
  try {
    toolResult = await executeTool(fnName, fnArgs, user);
  } catch (err) {
    return {
      reply: `❌ ${err?.message || "Lỗi khi thực hiện"}`,
      timestamp: new Date().toISOString(),
      action: null,
    };
  }

  // ── STEP 2: Generate reply from tool result ──
  const replyResponse = await ai.models.generateContent({
    model,
    contents: [
      ...contents,
      userContent,
      createModelContent(createPartFromFunctionCall(fnName, fnArgs)),
      createUserContent(createPartFromFunctionResponse(fnName, JSON.stringify(toolResult))),
    ],
    config: {
      systemInstruction: buildSystemPrompt(),
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  });

  // Ưu tiên _reply từ backend, fallback sang AI text
  const preFormatted = toolResult._reply?.trim();
  const aiText = replyResponse.text?.trim() || "";
  const reply = preFormatted || aiText || "Đã xong!";

  return {
    reply,
    timestamp: new Date().toISOString(),
    action:
      toolResult?.action || toolResult?.id
        ? {
            type: toolResult.action || "VIEW",
            surveyId: toolResult.id || fnArgs.survey_id || null,
            data: toolResult,
          }
        : null,
  };
}

class AiChatService {
  async chat(userMessage, conversationHistory, user) {
    return chatWithAgent(userMessage, conversationHistory, user);
  }
}

export default new AiChatService();
