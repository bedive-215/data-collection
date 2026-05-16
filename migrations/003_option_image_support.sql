-- ============================================================
-- Migration: option_image_support
-- Description: Thêm image_url và media_type cho question_options
-- ============================================================

ALTER TABLE question_options
  ADD COLUMN image_url  VARCHAR(500) DEFAULT NULL AFTER is_other,
  ADD COLUMN media_type ENUM('image','video') DEFAULT NULL AFTER image_url;

-- ============================================================
-- Rollback:
-- ALTER TABLE question_options DROP COLUMN image_url, media_type;
-- ============================================================
