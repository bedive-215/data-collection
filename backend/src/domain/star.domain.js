export const STAR_REWARDS = {
    // Điểm danh hằng ngày
    DAILY_CHECKIN_BASE: 50,
    DAILY_CHECKIN_MAX: 70,

    // Tạo khảo sát
    CREATE_SURVEY: 50,

    // Người tham gia khảo sát
    FIRST_RESPONDER: 100,
    SECOND_RESPONDER: 50,
    THIRD_RESPONDER: 30,
    LATER_RESPONDER: 20,

    // Người tạo được bonus khi có người tham gia
    CREATOR_BONUS_PER_RESPONDENT: 10,

    // Streak
    STREAK_BONUS_MULTIPLIER: 0.5, // +50% mỗi streak
    STREAK_MAX_MULTIPLIER: 2.0,

    // Referral
    REFERRAL_BONUS: 30,

    // Achievement
    ACHIEVEMENT_BASE_REWARD: 20,

    // Penalty
    SURVEY_CANCELLED_PENALTY: 30,
    ACCOUNT_VIOLATION_PENALTY: 100,
};

export const RANK_CONFIG = [
    { name: "BRONZE", minStars: 0,    maxStars: 499,    color: "#CD7F32", bonusMultiplier: 1.0,  icon: "🥉" },
    { name: "SILVER", minStars: 500,   maxStars: 1999,   color: "#C0C0C0", bonusMultiplier: 1.1,  icon: "🥈" },
    { name: "GOLD",   minStars: 2000,  maxStars: 4999,   color: "#FFD700", bonusMultiplier: 1.2,  icon: "🥇" },
    { name: "PLATINUM", minStars: 5000, maxStars: 9999,  color: "#E5E4E2", bonusMultiplier: 1.3,  icon: "💎" },
    { name: "DIAMOND", minStars: 10000, maxStars: null,  color: "#B9F2FF", bonusMultiplier: 1.5,  icon: "💠" },
];

export const WEEKLY_PRIZES = [
    { rank: 1, prize: "Thẻ điện thoại 500.000đ", stars: null },
    { rank: 2, prize: "Thẻ điện thoại 300.000đ", stars: null },
    { rank: 3, prize: "Thẻ điện thoại 150.000đ", stars: null },
    { rank: 4, prize: "Thẻ điện thoại 70.000đ",  stars: null },
    { rank: 5, prize: "Thẻ điện thoại 30.000đ",  stars: null },
];

export const LEADERBOARD_PERIODS = {
    WEEKLY: "WEEKLY",
    MONTHLY: "MONTHLY",
    ALL_TIME: "ALL_TIME",
};