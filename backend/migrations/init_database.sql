-- init_database.sql
-- Init database schema from Sequelize models (MySQL)
-- Warning: This creates full schema; run on an empty/new database or back up first.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================
-- users
-- =====================
DROP TABLE IF EXISTS `answers`;
DROP TABLE IF EXISTS `responses`;
DROP TABLE IF EXISTS `question_options`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `sections`;
DROP TABLE IF EXISTS `survey_participants`;
DROP TABLE IF EXISTS `survey_access`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `star_transactions`;
DROP TABLE IF EXISTS `user_achievements`;
DROP TABLE IF EXISTS `daily_checkins`;
DROP TABLE IF EXISTS `achievements`;
DROP TABLE IF EXISTS `ranks`;
DROP TABLE IF EXISTS `user_oauth_providers`;
DROP TABLE IF EXISTS `surveys`;
DROP TABLE IF EXISTS `users`;

-- users
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `gender` ENUM('MALE','FEMALE','OTHER') NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `avatar` VARCHAR(255) NULL,
  `avatar_public_id` VARCHAR(255) NULL,
  `phone_number` VARCHAR(20) NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `date_of_birth` DATE NULL,
  `email_verified` BOOLEAN NOT NULL DEFAULT 0,
  `refresh_token` VARCHAR(500) NULL,
  `refresh_token_expires_at` DATETIME NULL,
  `verification_code` VARCHAR(6) NULL,
  `verification_code_expires_at` DATETIME NULL,
  `last_verification_code_sent_at` DATETIME NULL,
  `password_reset_code` VARCHAR(6) NULL,
  `password_reset_code_expires_at` DATETIME NULL,

  -- gamification fields
  `star_balance` INT NOT NULL DEFAULT 0,
  `total_stars_earned` INT NOT NULL DEFAULT 0,
  `current_rank` VARCHAR(50) NOT NULL DEFAULT 'BRONZE',
  `streak_count` INT NOT NULL DEFAULT 0,
  `last_checkin_date` DATE NULL,
  `highest_streak` INT NOT NULL DEFAULT 0,
  `weekly_stars` INT NOT NULL DEFAULT 0,
  `monthly_stars` INT NOT NULL DEFAULT 0,
  `weekly_stars_updated_at` DATETIME NULL,
  `monthly_stars_updated_at` DATETIME NULL,

  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  `blocked_at` DATETIME NULL,
  `block_reason` VARCHAR(500) NULL,

  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`),
  UNIQUE KEY `uniq_users_phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- surveys (paranoid => deleted_at)
-- =====================
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_by` CHAR(36) NOT NULL,
  `start_at` DATETIME NULL,
  `end_at` DATETIME NULL,
  `settings` JSON NULL,
  `access_type` ENUM('PUBLIC','LINK','PRIVATE') NOT NULL DEFAULT 'PRIVATE',
  `notified_expired` BOOLEAN NULL DEFAULT 0,

  `is_anonymous` BOOLEAN NULL DEFAULT 0,
  `max_responses` INT NULL,
  `randomize_questions` BOOLEAN NULL DEFAULT 0,
  `randomize_options` BOOLEAN NULL DEFAULT 0,
  `time_limit_seconds` INT NULL,
  `show_progress_bar` BOOLEAN NULL DEFAULT 1,
  `allow_back` BOOLEAN NULL DEFAULT 1,
  `one_question_per_page` BOOLEAN NULL DEFAULT 1,
  `thank_you_message` TEXT NULL,
  `logo_url` VARCHAR(500) NULL,
  `background_url` VARCHAR(500) NULL,
  `accent_color` VARCHAR(20) NULL DEFAULT '#6366f1',
  `show_correct_answers` BOOLEAN NULL DEFAULT 0,
  `default_page_order` JSON NULL,
  `thank_you_redirect_url` VARCHAR(500) NULL DEFAULT NULL,

  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL,

  PRIMARY KEY (`id`),
  KEY `idx_surveys_created_by` (`created_by`),
  KEY `idx_surveys_created_at` (`created_at`),
  KEY `idx_surveys_start_at` (`start_at`),
  KEY `idx_surveys_end_at` (`end_at`),
  CONSTRAINT `fk_surveys_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- sections
-- =====================
CREATE TABLE IF NOT EXISTS `sections` (
  `id` CHAR(36) NOT NULL,
  `survey_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `icon` VARCHAR(50) NULL,
  `cover_url` VARCHAR(500) NULL,
  `min_required` INT NULL,
  `show_progress` BOOLEAN NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sections_survey_id` (`survey_id`),
  KEY `idx_sections_survey_order` (`survey_id`,`order_index`),
  CONSTRAINT `fk_sections_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- questions
-- =====================
CREATE TABLE IF NOT EXISTS `questions` (
  `id` CHAR(36) NOT NULL,
  `survey_id` CHAR(36) NOT NULL,
  `section_id` CHAR(36) NULL,
  `content` TEXT NOT NULL,
  `description` TEXT NULL,
  `placeholder` VARCHAR(255) NULL,
  `type` ENUM('TEXT','PARAGRAPH','SINGLE_CHOICE','MULTIPLE_CHOICE','DROPDOWN','RATING','DATE','NUMBER','EMAIL','LINEAR_SCALE','TIME','FILE_UPLOAD','MATRIX') NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT 1,
  `order_index` INT NOT NULL DEFAULT 0,
  `settings` JSON NULL,
  `media_url` VARCHAR(500) NULL,
  `media_type` ENUM('image','video') NULL,
  `condition` JSON NULL,
  `hidden_from_analytics` BOOLEAN NULL DEFAULT 0,
  `next_question_id` CHAR(36) NULL,
  `next_section_id` CHAR(36) NULL,

  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_questions_survey_id` (`survey_id`),
  KEY `idx_questions_survey_order` (`survey_id`,`order_index`),
  KEY `idx_questions_section_id` (`section_id`),
  CONSTRAINT `fk_questions_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_questions_section` FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- question_options
-- =====================
CREATE TABLE IF NOT EXISTS `question_options` (
  `id` CHAR(36) NOT NULL,
  `question_id` CHAR(36) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `is_other` BOOLEAN NOT NULL DEFAULT 0,
  `image_url` VARCHAR(500) NULL,
  `media_type` ENUM('image','video') NULL,

  PRIMARY KEY (`id`),
  KEY `idx_question_options_question_id` (`question_id`),
  CONSTRAINT `fk_question_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- responses
-- =====================
CREATE TABLE IF NOT EXISTS `responses` (
  `id` CHAR(36) NOT NULL,
  `survey_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NULL,
  `status` ENUM('IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  `submitted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_responses_user_survey` (`user_id`,`survey_id`),
  KEY `idx_responses_survey_id` (`survey_id`),
  CONSTRAINT `fk_responses_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_responses_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- answers
-- =====================
CREATE TABLE IF NOT EXISTS `answers` (
  `id` CHAR(36) NOT NULL,
  `response_id` CHAR(36) NOT NULL,
  `question_id` CHAR(36) NOT NULL,
  `option_id` CHAR(36) NULL,
  `selected_options` JSON NULL,
  `answer_text` TEXT NULL,
  `answer_number` FLOAT NULL,
  `answer_date` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_answers_response_id` (`response_id`),
  KEY `idx_answers_question_id` (`question_id`),
  CONSTRAINT `fk_answers_response` FOREIGN KEY (`response_id`) REFERENCES `responses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_answers_option` FOREIGN KEY (`option_id`) REFERENCES `question_options`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- survey_participants
-- =====================
CREATE TABLE IF NOT EXISTS `survey_participants` (
  `id` CHAR(36) NOT NULL,
  `survey_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NULL,
  `role` ENUM('viewer','editor','respondent') NOT NULL DEFAULT 'respondent',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_survey_participants_survey_user` (`survey_id`,`user_id`),
  KEY `idx_survey_participants_survey_id` (`survey_id`),
  CONSTRAINT `fk_survey_participants_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_survey_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- survey_access
-- =====================
CREATE TABLE IF NOT EXISTS `survey_access` (
  `id` CHAR(36) NOT NULL,
  `survey_id` CHAR(36) NOT NULL,
  `access_token` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_survey_access_survey_token` (`survey_id`,`access_token`),
  CONSTRAINT `fk_survey_access_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- notifications
-- =====================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `survey_id` CHAR(36) NULL,
  `type` ENUM('SURVEY_INVITATION','SURVEY_INVITATION_SENT','SURVEY_RESPONSE','SURVEY_EXPIRED','SURVEY_PUBLISHED','SURVEY_CLOSED','NEW_PARTICIPANT','SURVEY_TIMEOUT','SYSTEM') NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  `data` JSON NULL,
  `read` BOOLEAN NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`,`read`),
  KEY `idx_notifications_user_created_at` (`user_id`,`created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- star_transactions
-- =====================
CREATE TABLE IF NOT EXISTS `star_transactions` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `amount` INT NOT NULL,
  `type` ENUM('DAILY_CHECKIN','CREATE_SURVEY','RESPOND_SURVEY','FIRST_RESPONDER','SECOND_RESPONDER','THIRD_RESPONDER','LATER_RESPONDER','SURVEY_CREATOR_BONUS','BONUS','PENALTY','ADMIN_ADJUST','REFERRAL_BONUS','STREAK_BONUS','ACHIEVEMENT_REWARD','RANK_UP_BONUS') NOT NULL,
  `description` VARCHAR(500) NULL,
  `metadata` JSON NULL,
  `balance_after` INT NOT NULL,
  `ref_id` CHAR(36) NULL,
  `ref_type` VARCHAR(50) NULL,
  `is_reversed` BOOLEAN NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_star_transactions_user_id` (`user_id`),
  KEY `idx_star_transactions_type` (`type`),
  KEY `idx_star_transactions_created_at` (`created_at`),
  KEY `idx_star_transactions_ref` (`ref_id`,`ref_type`),
  CONSTRAINT `fk_star_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- achievements
-- =====================
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(255) NULL,
  `category` ENUM('SURVEY_CREATION','PARTICIPATION','STREAK','SOCIAL','SPECIAL','RANK') NOT NULL,
  `star_reward` INT NOT NULL DEFAULT 0,
  `tier` ENUM('BRONZE','SILVER','GOLD','PLATINUM','DIAMOND') NOT NULL DEFAULT 'BRONZE',
  `condition_type` VARCHAR(50) NOT NULL,
  `condition_value` INT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_achievements_code` (`code`),
  KEY `idx_achievements_category` (`category`),
  KEY `idx_achievements_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- user_achievements
-- =====================
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `achievement_id` CHAR(36) NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `is_unlocked` BOOLEAN NOT NULL DEFAULT 0,
  `unlocked_at` DATETIME NULL,
  `notification_sent` BOOLEAN NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_achievements_user_achievement` (`user_id`,`achievement_id`),
  KEY `idx_user_achievements_user_id` (`user_id`),
  KEY `idx_user_achievements_achievement_id` (`achievement_id`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- daily_checkins
-- =====================
CREATE TABLE IF NOT EXISTS `daily_checkins` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `checkin_date` DATE NOT NULL,
  `stars_earned` INT NOT NULL,
  `streak_count` INT NOT NULL DEFAULT 1,
  `multiplier` DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  `ip_address` VARCHAR(50) NULL,
  `device_info` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_daily_checkins_user_date` (`user_id`,`checkin_date`),
  KEY `idx_daily_checkins_user_id` (`user_id`),
  KEY `idx_daily_checkins_checkin_date` (`checkin_date`),
  CONSTRAINT `fk_daily_checkins_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- ranks
-- =====================
CREATE TABLE IF NOT EXISTS `ranks` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `icon` VARCHAR(255) NULL,
  `color` VARCHAR(20) NOT NULL DEFAULT '#9E9E9E',
  `min_stars` INT NOT NULL,
  `max_stars` INT NULL,
  `bonus_multiplier` DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  `description` VARCHAR(500) NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `idx_ranks_min_stars` (`min_stars`),
  KEY `idx_ranks_order_index` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================
-- user_oauth_providers
-- =====================
CREATE TABLE IF NOT EXISTS `user_oauth_providers` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `provider_uid` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_oauth_providers_provider_uid` (`provider_uid`),
  KEY `idx_user_oauth_providers_user_id` (`user_id`),
  CONSTRAINT `fk_user_oauth_providers_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Done.
-- Note: This SQL focuses on schema. Seed data (e.g., ranks/achievements) is not included.

