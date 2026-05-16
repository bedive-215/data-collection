-- =============================================
-- TEST DATA NGẮN CHO ANALYTICS
-- =============================================

-- 1. User test (bỏ qua nếu đã có user)
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'test@example.com', 'hash123', 'Test User', 'user', NOW(), NOW());

-- 2. Survey
INSERT IGNORE INTO surveys (id, title, description, status, created_by, is_published, created_at, updated_at)
VALUES ('660e8400-e29b-41d4-a716-446655440001', 'Khảo sát Test', 'Test description', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440001', TRUE, NOW(), NOW());

-- 3. Questions
INSERT IGNORE INTO questions (id, survey_id, content, type, is_required, order_index, config, created_at, updated_at) VALUES
('q1', '660e8400-e29b-41d4-a716-446655440001', 'Bạn là nam hay nữ?', 'SINGLE_CHOICE', TRUE, 1, NULL, NOW(), NOW()),
('q2', '660e8400-e29b-41d4-a716-446655440001', 'Bạn bao nhiêu tuổi?', 'SINGLE_CHOICE', TRUE, 2, NULL, NOW(), NOW()),
('q3', 'Bạn thích ăn gì?', 'MULTIPLE_CHOICE', TRUE, 3, NULL, NOW(), NOW()),
('q3', '660e8400-e29b-41d4-a716-446655440001', 'Bạn thích ăn gì?', 'MULTIPLE_CHOICE', TRUE, 3, NULL, NOW(), NOW()),
('q4', '660e8400-e29b-41d4-a716-446655440001', 'Đánh giá sức khỏe (1-10)', 'RATING', TRUE, 4, '{"min":1,"max":10}', NOW(), NOW()),
('q5', '660e8400-e29b-41d4-a716-446655440001', 'Tập thể dục mấy giờ/tuần?', 'NUMBER', TRUE, 5, NULL, NOW(), NOW());

-- 4. Options
INSERT IGNORE INTO question_options (id, question_id, label, value, order_index, created_at, updated_at) VALUES
('o1', 'q1', 'Nam', 'male', 1, NOW(), NOW()),
('o2', 'q1', 'Nữ', 'female', 2, NOW(), NOW()),
('o3', 'q2', '18-25', '18-25', 1, NOW(), NOW()),
('o4', 'q2', '26-35', '26-35', 2, NOW(), NOW()),
('o5', 'q2', '36+', '36+', 3, NOW(), NOW()),
('o6', 'q3', 'Rau', 'vegetables', 1, NOW(), NOW()),
('o7', 'q3', 'Thịt', 'meat', 2, NOW(), NOW()),
('o8', 'q3', 'Cá', 'fish', 3, NOW(), NOW());

-- 5. Responses (10 cái - spread 30 ngày)
INSERT IGNORE INTO responses (id, survey_id, user_id, status, started_at, completed_at, time_to_complete_seconds, created_at, updated_at) VALUES
('r1', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), 300, DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
('r2', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY), 240, DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
('r3', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY), 360, DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
('r4', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY), 180, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW()),
('r5', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), 420, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('r6', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 300, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
('r7', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), 250, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('r8', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 280, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
('r9', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 320, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
('r10', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW());

-- 6. Answers (mỗi response 5 câu trả lời)
INSERT IGNORE INTO answers (id, response_id, question_id, option_id, selected_options, answer_text, answer_number, created_at, updated_at) VALUES
-- Response 1
('a1', 'r1', 'q1', 'o1', NULL, NULL, NULL, NOW(), NOW()),
('a2', 'r1', 'q2', 'o3', NULL, NULL, NULL, NOW(), NOW()),
('a3', 'r1', 'q3', NULL, '["o6","o7"]', NULL, NULL, NOW(), NOW()),
('a4', 'r1', 'q4', NULL, NULL, NULL, 8, NOW(), NOW()),
('a5', 'r1', 'q5', NULL, NULL, NULL, 5, NOW(), NOW()),
-- Response 2
('a6', 'r2', 'q1', 'o2', NULL, NULL, NULL, NOW(), NOW()),
('a7', 'r2', 'q2', 'o4', NULL, NULL, NULL, NOW(), NOW()),
('a8', 'r2', 'q3', NULL, '["o7","o8"]', NULL, NULL, NOW(), NOW()),
('a9', 'r2', 'q4', NULL, NULL, NULL, 7, NOW(), NOW()),
('a10', 'r2', 'q5', NULL, NULL, NULL, 3, NOW(), NOW()),
-- Response 3
('a11', 'r3', 'q1', 'o1', NULL, NULL, NULL, NOW(), NOW()),
('a12', 'r3', 'q2', 'o4', NULL, NULL, NULL, NOW(), NOW()),
('a13', 'r3', 'q3', NULL, '["o6","o7","o8"]', NULL, NULL, NOW(), NOW()),
('a14', 'r3', 'q4', NULL, NULL, NULL, 6, NOW(), NOW()),
('a15', 'r3', 'q5', NULL, NULL, NULL, 2, NOW(), NOW()),
-- Response 4
('a16', 'r4', 'q1', 'o2', NULL, NULL, NULL, NOW(), NOW()),
('a17', 'r4', 'q2', 'o3', NULL, NULL, NULL, NOW(), NOW()),
('a18', 'r4', 'q3', NULL, '["o6"]', NULL, NULL, NOW(), NOW()),
('a19', 'r4', 'q4', NULL, NULL, NULL, 9, NOW(), NOW()),
('a20', 'r4', 'q5', NULL, NULL, NULL, 8, NOW(), NOW()),
-- Response 5
('a21', 'r5', 'q1', 'o1', NULL, NULL, NULL, NOW(), NOW()),
('a22', 'r5', 'q2', 'o5', NULL, NULL, NULL, NOW(), NOW()),
('a23', 'r5', 'q3', NULL, '["o7"]', NULL, NULL, NOW(), NOW()),
('a24', 'r5', 'q4', NULL, NULL, NULL, 5, NOW(), NOW()),
('a25', 'r5', 'q5', NULL, NULL, NULL, 4, NOW(), NOW()),
-- Response 6
('a26', 'r6', 'q1', 'o2', NULL, NULL, NULL, NOW(), NOW()),
('a27', 'r6', 'q2', 'o4', NULL, NULL, NULL, NOW(), NOW()),
('a28', 'r6', 'q3', NULL, '["o6","o8"]', NULL, NULL, NOW(), NOW()),
('a29', 'r6', 'q4', NULL, NULL, NULL, 7, NOW(), NOW()),
('a30', 'r6', 'q5', NULL, NULL, NULL, 6, NOW(), NOW()),
-- Response 7
('a31', 'r7', 'q1', 'o1', NULL, NULL, NULL, NOW(), NOW()),
('a32', 'r7', 'q2', 'o3', NULL, NULL, NULL, NOW(), NOW()),
('a33', 'r7', 'q3', NULL, '["o7","o8"]', NULL, NULL, NOW(), NOW()),
('a34', 'r7', 'q4', NULL, NULL, NULL, 4, NOW(), NOW()),
('a35', 'r7', 'q5', NULL, NULL, NULL, 1, NOW(), NOW()),
-- Response 8
('a36', 'r8', 'q1', 'o1', NULL, NULL, NULL, NOW(), NOW()),
('a37', 'r8', 'q2', 'o4', NULL, NULL, NULL, NOW(), NOW()),
('a38', 'r8', 'q3', NULL, '["o6","o7"]', NULL, NULL, NOW(), NOW()),
('a39', 'r8', 'q4', NULL, NULL, NULL, 8, NOW(), NOW()),
('a40', 'r8', 'q5', NULL, NULL, NULL, 5, NOW(), NOW()),
-- Response 9
('a41', 'r9', 'q1', 'o2', NULL, NULL, NULL, NOW(), NOW()),
('a42', 'r9', 'q2', 'o5', NULL, NULL, NULL, NOW(), NOW()),
('a43', 'r9', 'q3', NULL, '["o6","o8"]', NULL, NULL, NOW(), NOW()),
('a44', 'r9', 'q4', NULL, NULL, NULL, 6, NOW(), NOW()),
('a45', 'r9', 'q5', NULL, NULL, NULL, 7, NOW(), NOW()),
-- Response 10 (IN_PROGRESS - partial)
('a46', 'r10', 'q1', 'o1', NULL, NULL, NULL, NOW(), NOW()),
('a47', 'r10', 'q2', 'o3', NULL, NULL, NULL, NOW(), NOW());

-- Check data
SELECT 'Surveys' as t, COUNT(*) as c FROM surveys WHERE id = '660e8400-e29b-41d4-a716-446655440001'
UNION ALL SELECT 'Questions', COUNT(*) FROM questions WHERE survey_id = '660e8400-e29b-41d4-a716-446655440001'
UNION ALL SELECT 'Responses', COUNT(*) FROM responses WHERE survey_id = '660e8400-e29b-41d4-a716-446655440001'
UNION ALL SELECT 'Answers', COUNT(*) FROM answers WHERE response_id LIKE 'r%';
