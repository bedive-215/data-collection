-- ============================================================
-- Migration: survey_redirect_url
-- Description: Thêm trường thank_you_redirect_url vào bảng surveys
-- ============================================================
ALTER TABLE surveys
  ADD COLUMN thank_you_redirect_url VARCHAR(500) DEFAULT NULL AFTER accent_color;

-- ============================================================
-- Rollback:
-- ALTER TABLE surveys DROP COLUMN thank_you_redirect_url;
-- ============================================================
