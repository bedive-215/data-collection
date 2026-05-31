# EchoForm - Survey & Data Collection Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/React%20Native-0.83-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/MySQL-8+-4479A1?style=flat-square&logo=mysql" alt="MySQL" />
  <img src="https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis" alt="Redis" />
</p>

EchoForm is a production-oriented survey and data collection platform for creating surveys, inviting participants, collecting responses, analyzing results, and improving engagement through gamification. It includes a REST API, a web dashboard, and a mobile client.

> Build surveys faster, collect responses reliably, and turn feedback into actionable analytics.

## Tech Stack

**Backend**

- Node.js, Express.js 5, Sequelize, MySQL
- JWT authentication with access and refresh tokens
- Redis and BullMQ for background jobs
- Socket.IO for realtime notifications
- Cloudinary, Multer, Nodemailer, Joi
- Google Gemini API for AI-assisted survey generation and insights

**Frontend**

- React 18, Vite 7, React Router
- Tailwind CSS, lucide-react, react-icons
- Axios, Zustand, React Hook Form, Yup
- Recharts, pdfmake, i18next
- Socket.IO Client

**Mobile**

- React Native 0.83
- React Navigation
- AsyncStorage, Axios, React Hook Form, Yup
- Native image picker and Google Sign-In support

## Features

**Authentication and User Management**

- Email registration and login
- Google OAuth login
- Email verification with OTP code
- Forgot password and reset password flow
- Role-based access control for users and admins
- Account status management for admin workflows

**Survey Builder**

- Create, update, publish, close, and delete surveys
- Public, private, token-based, and invitation-based survey access
- Multiple question types: text, paragraph, email, number, date, time, rating, single choice, multiple choice, dropdown, linear scale, and file upload
- Section-based survey organization
- Question ordering and bulk question creation
- Conditional logic and media support for richer survey experiences

**Responses and Collaboration**

- Start survey sessions and submit responses
- Autosave response progress
- View personal responses and survey response details
- Invite participants individually or in bulk by email
- Assign participant access roles such as viewer, editor, and respondent

**Analytics**

- Survey dashboard metrics
- Question-level analytics
- Response trends by day, week, or month
- Completion and drop-off statistics
- Individual response browsing with pagination
- Cross-tab analysis between questions
- Age and gender comparisons
- Heatmap activity view
- CSV export and AI-generated insights

**AI and Automation**

- AI assistant for generating or parsing survey questions
- AI chat endpoint for application-aware assistance
- Email worker for asynchronous email delivery
- Event-driven handlers for survey, response, star, check-in, and achievement workflows

**Gamification**

- Star balance and transaction history
- Daily check-in streaks
- Achievements and recent unlocks
- Leaderboard, rank information, and top-prize views
- Admin controls for star adjustments and leaderboard resets

## Project Structure

```text
data-collection/
├── backend/
│   ├── data/                 # SQL seed data
│   ├── src/
│   │   ├── ai/               # AI chat, tools, prompts, and knowledge base
│   │   ├── configs/          # Database, Redis, Cloudinary, Socket.IO, AI config
│   │   ├── controllers/      # HTTP controllers
│   │   ├── domain/           # Domain-level business logic
│   │   ├── events/           # Event bus and event handlers
│   │   ├── helpers/          # Reusable helper functions
│   │   ├── mappers/          # Response/data mappers
│   │   ├── middlewares/      # Auth, validation, uploads, error handling
│   │   ├── models/           # Sequelize models
│   │   ├── queues/           # BullMQ queues
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Application services
│   │   ├── validates/        # Joi validation schemas
│   │   ├── workers/          # Background workers
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── public/               # Static public assets
│   ├── src/
│   │   ├── api/              # API client and token service
│   │   ├── assets/           # Images and frontend assets
│   │   ├── components/       # Shared, admin, survey, and gamification components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── layouts/          # Page layouts
│   │   ├── pages/            # Auth, user, admin, shared, and error pages
│   │   ├── providers/        # Data providers
│   │   ├── routes/           # Frontend route guards and router
│   │   ├── services/         # API service modules
│   │   └── utils/            # Helpers, constants, validators, permissions
│   └── package.json
├── mobile/
│   └── MobileApp/
│       ├── android/          # Android native project
│       ├── ios/              # iOS native project
│       ├── src/              # React Native screens, services, providers, navigation
│       └── package.json
├── migrations/               # SQL migration scripts
├── docs/                     # Diagrams and project documentation
└── README.md
```

## Installation

### Prerequisites

- Node.js 20+
- npm
- MySQL 8+
- Redis instance
- Cloudinary account for media uploads
- SMTP account for transactional email
- Gemini API key for AI features
- Android Studio or Xcode for mobile development, if running the mobile app

### 1. Clone the Repository

```bash
git clone <repository-url>
cd data-collection
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
NODE_ENV=development
PORT=8080
BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5173

DB_URL=mysql://<user>:<password>@localhost:3306/data_collection

ACCESS_TOKEN_SECRET=replace-with-access-token-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=replace-with-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-smtp-app-password
EMAIL_FROM=noreply@data-collection.com

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_OAUTH_URL=https://oauth2.googleapis.com/tokeninfo?id_token=
```

Create the database before starting the API:

```sql
CREATE DATABASE data_collection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Optional: apply SQL migrations from the root `migrations/` directory and seed data from `backend/data/seed.sql` if needed.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Mobile Setup

```bash
cd ../mobile/MobileApp
npm install
```

For iOS, install pods from the mobile app directory:

```bash
cd ios
pod install
cd ..
```

## Usage

### Backend API

```bash
cd backend
npm start
```

The API starts on `http://localhost:8080` when `PORT=8080` is configured. The default code fallback is `3000`.

### Email Worker

Run the email worker in a separate terminal:

```bash
cd backend
npm run worker
```

### Web Frontend

```bash
cd frontend
npm run dev
```

Build and preview production assets:

```bash
npm run build
npm run preview
```

### Mobile App

```bash
cd mobile/MobileApp
npm start
npm run android
```

For iOS:

```bash
npm run ios
```

### Linting and Tests

```bash
cd frontend
npm run lint

cd ../mobile/MobileApp
npm run lint
npm test
```

The backend currently defines a placeholder `npm test` script.

## API Overview

Base URL:

```text
/api/v1
```

**Authentication**

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email and password |
| POST | `/auth/login/oauth` | Login with OAuth token |
| POST | `/auth/verify` | Verify email OTP |
| POST | `/auth/verification-code/resend` | Resend verification code |
| POST | `/auth/forgot-password` | Send password reset code |
| POST | `/auth/verify-reset-code` | Verify password reset code |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/refresh-token` | Refresh authentication session |
| POST | `/auth/logout` | Logout current user |

**Surveys**

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/survey` | Create a survey |
| GET | `/survey/me` | Get current user's surveys |
| GET | `/survey/public` | List public surveys |
| GET | `/survey/invited` | List surveys shared with the current user |
| GET | `/survey/:survey_id` | Get survey details |
| PUT | `/survey/:survey_id` | Update a survey |
| DELETE | `/survey/:survey_id` | Delete a survey |
| PATCH | `/survey/:survey_id/publish` | Publish a survey |
| PATCH | `/survey/:survey_id/close` | Close a survey |
| PATCH | `/survey/:survey_id/extend` | Extend survey deadline |
| PATCH | `/survey/:survey_id/share` | Generate a share link |
| POST | `/survey/:survey_id/invite` | Invite one participant |
| POST | `/survey/:survey_id/invite/bulk` | Invite participants in bulk |
| GET | `/survey/:survey_id/participants` | List survey participants |

**Questions and Responses**

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/questions/survey/:survey_id` | Create a question |
| POST | `/questions/survey/:survey_id/bulk` | Bulk create questions |
| GET | `/questions/survey/:survey_id` | List survey questions |
| PATCH | `/questions/:question_id/survey/:survey_id` | Update a question |
| DELETE | `/questions/:question_id/survey/:survey_id` | Delete a question |
| PATCH | `/questions/survey/:survey_id/reorder` | Reorder questions |
| POST | `/questions/:survey_id/ai/suggest` | Generate or parse questions with AI |
| POST | `/responses/surveys/:survey_id/start` | Start a survey session |
| POST | `/responses/surveys/:survey_id` | Submit a survey response |
| PATCH | `/responses/:survey_id/autosave` | Autosave response progress |
| GET | `/responses/:survey_id/me` | Get current user's response for a survey |
| GET | `/responses/me` | Get all current user's responses |

**Analytics**

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/analytics/surveys/:survey_id` | Full survey analytics |
| GET | `/analytics/surveys/:survey_id/dashboard` | Dashboard overview |
| GET | `/analytics/surveys/:survey_id/completion` | Completion and drop-off stats |
| GET | `/analytics/surveys/:survey_id/trend` | Response trend |
| GET | `/analytics/surveys/:survey_id/responses` | Paginated individual responses |
| GET | `/analytics/surveys/:survey_id/crosstab` | Cross-tabulation analysis |
| GET | `/analytics/surveys/:survey_id/heatmap` | Date heatmap |
| GET | `/analytics/surveys/:survey_id/export` | Export survey data as CSV |
| GET | `/analytics/surveys/:survey_id/ai-insights` | AI-generated survey insights |
| GET | `/analytics/questions/:question_id/survey/:survey_id` | Question-level analytics |

**Gamification and AI**

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/gamification/balance` | Get star balance |
| GET | `/gamification/history` | Get star transaction history |
| GET | `/gamification/rank-info` | Get current rank information |
| POST | `/gamification/checkin` | Perform daily check-in |
| GET | `/gamification/checkin/status` | Get check-in status |
| GET | `/gamification/achievements` | Get user achievements |
| GET | `/gamification/leaderboard` | Get leaderboard |
| GET | `/gamification/leaderboard/my-rank` | Get current user's rank |
| POST | `/ai/chat` | Send a message to the AI assistant |

## Notes and Highlights

- The backend follows a layered structure with routes, controllers, services, domain helpers, mappers, and Sequelize models.
- Joi schemas are used to validate request parameters and payloads before business logic runs.
- Survey permissions are enforced through authentication middleware and survey-access checks.
- Email delivery is designed to run asynchronously through BullMQ and a dedicated worker process.
- Socket.IO is initialized on the HTTP server for realtime user-facing events.
- AI features are isolated under `backend/src/ai` and service modules, making them easier to evolve independently.
- The repository includes separate web and mobile clients that consume the same backend API.

## License

This project is licensed under the terms of the repository license file.
