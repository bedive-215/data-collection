-- ============================================================
-- Migration: survey_advanced_features
-- Description: Thêm các trường nâng cao cho Survey, Question, Section model
-- ============================================================

-- 1. Survey: thêm các trường nâng cao
ALTER TABLE surveys
  ADD COLUMN is_anonymous            TINYINT(1) DEFAULT 0  AFTER notified_expired,
  ADD COLUMN max_responses         INT     DEFAULT NULL   AFTER is_anonymous,
  ADD COLUMN randomize_questions   TINYINT(1) DEFAULT 0  AFTER max_responses,
  ADD COLUMN randomize_options      TINYINT(1) DEFAULT 0  AFTER randomize_questions,
  ADD COLUMN time_limit_seconds    INT     DEFAULT NULL   AFTER randomize_options,
  ADD COLUMN show_progress_bar      TINYINT(1) DEFAULT 1  AFTER time_limit_seconds,
  ADD COLUMN allow_back             TINYINT(1) DEFAULT 1  AFTER show_progress_bar,
  ADD COLUMN one_question_per_page   TINYINT(1) DEFAULT 1  AFTER allow_back,
  ADD COLUMN thank_you_message     TEXT     DEFAULT NULL   AFTER one_question_per_page,
  ADD COLUMN logo_url               VARCHAR(500) DEFAULT NULL AFTER thank_you_message,
  ADD COLUMN background_url         VARCHAR(500) DEFAULT NULL AFTER logo_url,
  ADD COLUMN accent_color          VARCHAR(20) DEFAULT '#6366f1' AFTER background_url,
  ADD COLUMN show_correct_answers   TINYINT(1) DEFAULT 0  AFTER accent_color,
  ADD COLUMN default_page_order     JSON     DEFAULT NULL   AFTER show_correct_answers;

-- 2. Question: thêm các trường mới
ALTER TABLE questions
  ADD COLUMN section_id            CHAR(36) DEFAULT NULL   AFTER survey_id,
  ADD COLUMN description           TEXT     DEFAULT NULL   AFTER content,
  ADD COLUMN placeholder           VARCHAR(255) DEFAULT NULL AFTER description,
  ADD COLUMN media_url             VARCHAR(500) DEFAULT NULL AFTER settings,
  ADD COLUMN media_type            ENUM('image','video') DEFAULT NULL AFTER media_url,
  ADD COLUMN `condition`           JSON     DEFAULT NULL   AFTER media_type,
  ADD COLUMN hidden_from_analytics  TINYINT(1) DEFAULT 0  AFTER `condition`,
  ADD COLUMN next_question_id      CHAR(36) DEFAULT NULL   AFTER hidden_from_analytics,
  ADD COLUMN next_section_id       CHAR(36) DEFAULT NULL   AFTER next_question_id;

-- Add foreign key cho section_id
ALTER TABLE questions
  ADD CONSTRAINT fk_question_section
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL;

-- 3. Tạo bảng sections (pages)
CREATE TABLE IF NOT EXISTS sections (
  id               CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  survey_id        CHAR(36) NOT NULL,
  title            VARCHAR(255) DEFAULT NULL,
  description      TEXT     DEFAULT NULL,
  order_index      INT      DEFAULT 0,
  icon             VARCHAR(50) DEFAULT NULL,
  cover_url        VARCHAR(500) DEFAULT NULL,
  min_required     INT      DEFAULT NULL,
  show_progress    TINYINT(1) DEFAULT 1,
  created_at       DATETIME  DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_survey_order (survey_id, order_index),
  CONSTRAINT fk_section_survey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- 4. Cập nhật question_options: thêm is_other
ALTER TABLE question_options
  ADD COLUMN is_other TINYINT(1) DEFAULT 0 AFTER order_index;

-- ============================================================
-- Rollback:
-- ALTER TABLE surveys DROP COLUMN is_anonymous, max_responses, randomize_questions,
--   randomize_options, time_limit_seconds, show_progress_bar, allow_back,
--   one_question_per_page, thank_you_message, logo_url, background_url,
--   accent_color, show_correct_answers, default_page_order;
-- ALTER TABLE questions DROP COLUMN section_id, description, placeholder,
--   media_url, media_type, `condition`, hidden_from_analytics,
--   next_question_id, next_section_id;
-- DROP TABLE IF EXISTS sections;
-- ALTER TABLE question_options DROP COLUMN is_other;
-- ============================================================
