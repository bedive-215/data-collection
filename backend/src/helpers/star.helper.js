import { STAR_REWARDS, RANK_CONFIG } from "../domain/star.domain.js";

export function calculateStreakMultiplier(streakCount) {
    if (streakCount >= 7) return 2.0;
    if (streakCount >= 4) return 1.5;
    return 1.0;
}


export function getRankFromStars(totalStars) {
    for (let i = RANK_CONFIG.length - 1; i >= 0; i--) {
        if (totalStars >= RANK_CONFIG[i].minStars) {
            return RANK_CONFIG[i];
        }
    }
    return RANK_CONFIG[0];
}


export function getCheckinStars(streakCount) {
    const base = STAR_REWARDS.DAILY_CHECKIN_BASE;
    const multiplier = calculateStreakMultiplier(streakCount);
    return Math.floor(base * multiplier);
}

export function getRankProgress(totalStars) {
    const rank = getRankFromStars(totalStars);
    const nextRank = RANK_CONFIG.find(r => r.minStars > totalStars);
    const progress = nextRank
        ? Math.floor(((totalStars - rank.minStars) / (nextRank.minStars - rank.minStars)) * 100)
        : 100;
    return {
        rank,
        nextRank: nextRank || null,
        progress,
        starsNeeded: nextRank ? nextRank.minStars - totalStars : 0,
    };
}