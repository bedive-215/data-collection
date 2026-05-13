# EchoForm - Survey & Data Collection Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/MySQL-8+-4479A1?style=flat-square&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

> Nền tảng thu thập dữ liệu và khảo sát đa năng với AI hỗ trợ tạo câu hỏi, hỗ trợ đa ngôn ngữ (EN/VI), và giao diện người dùng hiện đại.

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Bảo mật](#bảo-mật)
- [Đóng góp](#đóng-góp)
- [License](#license)

---

## Giới thiệu

**EchoForm** là một nền tảng khảo sát và thu thập dữ liệu, cho phép người dùng:

- Tạo và quản lý các bảng khảo sát với nhiều loại câu hỏi
- Chia sẻ khảo sát công khai hoặc qua link riêng tư
- Sử dụng AI để tạo câu hỏi tự động
- Theo dõi và phân tích kết quả khảo sát
- Quản trị người dùng và xem thống kê

---

## Tính năng

### Người dùng
- [x] Đăng ký / Đăng nhập (Email + Google OAuth)
- [x] Xác thực email qua mã OTP
- [x] Quên mật khẩu qua email
- [x] Tạo, chỉnh sửa, xóa khảo sát
- [x] Thêm nhiều loại câu hỏi (Text, Paragraph, Choice, Rating, Date, Number, Email)
- [x] AI Assistant hỗ trợ tạo câu hỏi
- [x] Chia sẻ khảo sát (Công khai / Link riêng / Riêng tư)
- [x] Mời người tham gia qua email
- [x] Gửi và xem kết quả khảo sát
- [x] Xuất kết quả ra PDF
- [x] Giao diện đa ngôn ngữ (Tiếng Việt / English)
- [x] Chế độ Dark/Light theme

### Quản trị viên
- [x] Dashboard thống kê tổng quan
- [x] Quản lý người dùng (Active/Banned)
- [x] Quản lý tất cả khảo sát
- [x] Xem chi tiết câu hỏi và câu trả lời

---

## Công nghệ sử dụng

### Backend
| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 5.x |
| Database | MySQL 8+ |
| ORM | Sequelize 6.x |
| Authentication | JWT (Access + Refresh Token) |
| Validation | Joi |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer (SMTP) |
| Real-time | Socket.io |
| AI | OpenAI SDK |
| Security | bcrypt, Helmet, CORS |

### Frontend
| Thành phần | Công nghệ |
|------------|-----------|
| Framework | React 18 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| State Management | Zustand |
| Form Handling | React Hook Form + Yup |
| HTTP Client | Axios |
| Charts | Recharts |
| i18n | i18next |
| Icons | Lucide React, React Icons |
| Notifications | React Toastify |

---

## Cấu trúc dự án

```
data-collection/
├── backend/                    # Node.js/Express API Server
│   ├── src/
│   │   ├── configs/           # Cấu hình database, cloudinary
│   │   ├── controllers/      # Xử lý request
│   │   ├── services/          # Logic nghiệp vụ
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Auth, validation, error handling
│   │   ├── validates/         # Joi schemas
│   │   ├── utils/             # Helpers (token, email, upload)
│   │   ├── app.js             # Express app config
│   │   ├── server.js          # Entry point
│   │   └── bootstrap-env.js  # Load .env
│   ├── .env.example           # Template biến môi trường
│   ├── package.json
│   └── nodemon.json
│
├── frontend/                   # React/Vite SPA
│   ├── src/
│   │   ├── api/               # Axios client, token service
│   │   ├── components/        # Reusable components
│   │   │   ├── admin/         # Components cho admin
│   │   │   ├── common/        # Shared components
│   │   │   ├── survey/        # Survey-specific
│   │   │   └── user/          # User-specific
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── i18n/              # i18next config & locales
│   │   ├── layouts/           # Page layouts
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── auth/           # Auth pages
│   │   │   ├── user/           # User pages
│   │   │   └── error/         # Error pages
│   │   ├── providers/         # Data providers
│   │   ├── routes/            # Router config
│   │   ├── services/           # API services
│   │   └── utils/              # Constants, helpers
│   ├── .env.example           # Template biến môi trường
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── mobile/                     # React Native (đang phát triển)
│   └── MobileApp/
│
├── .gitignore
├── README.md
└── package.json               # Root package.json (workspace)
```

---

## Yêu cầu hệ thống

- **Node.js**: 18.x hoặc cao hơn
- **npm**: 9.x hoặc cao hơn
- **MySQL**: 8.0 hoặc cao hơn
- **Git**: phiên bản mới nhất

---

## Hướng dẫn cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd data-collection
```

### 2. Cài đặt dependencies

```bash
# Cài đặt tất cả packages (root + backend + frontend)
npm install

# Hoặc cài đặt riêng
cd backend && npm install
cd ../frontend && npm install
```

### 3. Cấu hình database

Đảm bảo MySQL đã được cài đặt và đang chạy. Tạo database mới:

```sql
CREATE DATABASE echofom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Cấu hình biến môi trường

**Backend** - Tạo file `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Chỉnh sửa `backend/.env`:

```env
# Database
DB_URL=mysql://username:password@localhost:3306/echofom

# JWT
ACCESS_TOKEN_SECRET=your-super-secret-access-key
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRES_IN=30d

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=EchoForm <noreply@echofom.com>

# OpenAI (Optional - cho AI question generation)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# URLs
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:3000

# Cloudinary (Optional - cho upload hình ảnh)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend** - Tạo file `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_GATEWAY_URL=http://localhost:3000
```

### 5. Khởi tạo database (tự động)

Khi server backend khởi động lần đầu, Sequelize sẽ tự động tạo các bảng. Để seed dữ liệu mẫu:

```bash
cd backend
npm run db:seed
```

---

## Chạy ứng dụng

### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
npm start
# Server chạy tại http://localhost:3000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# App chạy tại http://localhost:5173
```

### Production Mode

**Build Frontend:**

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

**Chạy Production:**

```bash
cd backend
NODE_ENV=production npm start
```

### Docker (Optional)

```bash
cd frontend
docker build -t echofom-frontend .
docker run -p 8080:80 echofom-frontend
```

---

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/v1/auth/login` | Đăng nhập |
| POST | `/api/v1/auth/verify` | Xác thực email (OTP) |
| POST | `/api/v1/auth/forgot-password` | Quên mật khẩu |
| POST | `/api/v1/auth/reset-password` | Đặt lại mật khẩu |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| POST | `/api/v1/auth/login/oauth` | Đăng nhập Google |

### Survey Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/survey` | Tạo khảo sát mới |
| GET | `/api/v1/survey` | Lấy tất cả khảo sát |
| GET | `/api/v1/survey/me` | Lấy khảo sát của user |
| GET | `/api/v1/survey/public` | Lấy khảo sát công khai |
| GET | `/api/v1/survey/:id` | Lấy chi tiết khảo sát |
| PUT | `/api/v1/survey/:id` | Cập nhật khảo sát |
| DELETE | `/api/v1/survey/:id` | Xóa khảo sát |
| POST | `/api/v1/survey/:id/publish` | Publish khảo sát |
| POST | `/api/v1/survey/:id/invite` | Mời người tham gia |

### Question Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/questions/survey/:surveyId` | Tạo câu hỏi |
| GET | `/api/v1/questions/survey/:surveyId` | Lấy câu hỏi |
| PUT | `/api/v1/questions/:id` | Cập nhật câu hỏi |
| DELETE | `/api/v1/questions/:id` | Xóa câu hỏi |
| POST | `/api/v1/questions/:id/ai/suggest` | Gợi ý câu hỏi AI |

### Response Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/responses` | Gửi câu trả lời |
| GET | `/api/v1/responses/survey/:surveyId` | Lấy câu trả lời |
| GET | `/api/v1/responses/:id` | Lấy chi tiết câu trả lời |

### Admin Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/admin-stats` | Thống kê dashboard |
| GET | `/api/v1/admin/users` | Quản lý users |
| PUT | `/api/v1/admin/users/:id/status` | Cập nhật trạng thái user |

### Authentication

API sử dụng JWT Bearer Token:

```
Authorization: Bearer <access_token>
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │───────│   Survey    │───────│  Question   │
└─────────────┘  1:N  └─────────────┘  1:N  └─────────────┘
      │                                       │ 1:N
      │                                       │
      │ 1:N                            ┌──────┴──────┐
      │                                 │QuestionOption│
      │                                 └─────────────┘
┌─────┴──────┐
│  Response  │──────────────────────────┐
└────────────┘                          │
      │                            ┌─────┴──────┐
      │ 1:N                        │   Answer   │
      │                            └─────────────┘
┌─────┴─────────────┐
│SurveyParticipant  │
└───────────────────┘
```

### Tables

| Table | Mô tả |
|-------|-------|
| `users` | Thông tin người dùng |
| `surveys` | Khảo sát |
| `questions` | Câu hỏi |
| `question_options` | Các lựa chọn cho câu hỏi |
| `responses` | Bài khảo sát đã nộp |
| `answers` | Câu trả lời |
| `survey_participants` | Người được mời |
| `survey_accesses` | Access tokens cho link share |
| `user_oauths` | OAuth provider mappings |

---

## Bảo mật

- **Password**: Mã hóa với bcrypt (salt rounds: 10)
- **JWT**: Access token (1h) + Refresh token (30 days)
- **CORS**: Chỉ cho phép frontend origin
- **Helmet**: HTTP headers bảo mật
- **Rate Limiting**: Giới hạn request
- **Input Validation**: Joi schemas cho tất cả input
- **SQL Injection**: Preverted by Sequelize ORM

---

## Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by EchoForm Team
</p>
