export const STAR_TYPE_LABELS = {
    DAILY_CHECKIN: "Điểm danh hằng ngày",
    STREAK_BONUS: "Bonus streak điểm danh",
    CREATE_SURVEY: "Tạo khảo sát mới",
    FIRST_RESPONDER: "Người đầu tiên hoàn thành",
    SECOND_RESPONDER: "Người thứ hai hoàn thành",
    THIRD_RESPONDER: "Người thứ ba hoàn thành",
    LATER_RESPONDER: "Hoàn thành khảo sát",
    SURVEY_CREATOR_BONUS: "Có người tham gia khảo sát",
    ACHIEVEMENT_REWARD: "Mở khóa huy hiệu",
    RANK_UP_BONUS: "Thăng cấp rank",
};

export const RANK_META = {
    BRONZE: { emoji: "🥉", name: "Đồng" },
    SILVER: { emoji: "🥈", name: "Bạc" },
    GOLD: { emoji: "🥇", name: "Vàng" },
    PLATINUM: { emoji: "💎", name: "Bạch Kim" },
    DIAMOND: { emoji: "💠", name: "Kim Cương" },
};

export const ROLE_LABEL = (role) =>
    role === "editor"    ? "Biên tập viên (chỉnh sửa)"
        : role === "viewer"  ? "Người xem (chỉ xem)"
            : role === "respondent" ? "Người trả lời (làm khảo sát)"
                : role;