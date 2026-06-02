import { STREAK_BONUS_TIERS } from "#domain/dailyCheckin.domain.js";

export function todayUTC() {
    return new Date().toISOString().split("T")[0];
}

export function yesterdayUTC() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split("T")[0];
}

// Chuyển DATEONLY field (có thể là Date object hoặc string) về string YYYY-MM-DD để so sánh chính xác
export function toDateString(val) {
    if (!val) return null;
    if (typeof val === "string") return val.split("T")[0];
    return new Date(val).toISOString().split("T")[0];
}

export function getMultiplier(streakCount) {
    for (const tier of STREAK_BONUS_TIERS) {
        if (streakCount >= tier.minStreak) {
            return tier.multiplier;
        }
    }
    return 1.0;
}
