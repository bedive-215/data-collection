export const STREAK_BONUS_TIERS = [
    { minStreak: 7, multiplier: 2.0 },
    { minStreak: 4, multiplier: 1.5 },
    { minStreak: 1, multiplier: 1.0 },
];

export function getNextBonusTier(streak) {
    if (streak < 4) return { days_needed: 4 - streak, next_multiplier: 1.5 };
    if (streak < 7) return { days_needed: 7 - streak, next_multiplier: 2.0 };
    return null;
}

export function getBonusMessage(streak, multiplier) {
    if (multiplier >= 2.0) return `Wow! Bạn đang có streak ${streak} ngày với bonus x2! Tiếp tục giữ streak nhé!`;
    if (multiplier >= 1.5) return `Tuyệt vời! Streak ${streak} ngày với bonus x1.5. Còn ${7 - streak} ngày nữa để đạt x2!`;
    if (streak >= 4) return `Tốt lắm! Streak ${streak} ngày. Còn ${7 - streak} ngày nữa để đạt bonus x2!`;
    return `Chào mừng bạn! Điểm danh ${streak} ngày liên tiếp. Đạt 4 ngày để nhận bonus x1.5!`;
}