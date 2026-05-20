// src/components/gamification/AchievementBadge.jsx
import React from "react";

const TIER_STYLES = {
  BRONZE: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    badge: "bg-amber-500",
    shadow: "shadow-amber-200",
  },
  SILVER: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-600",
    badge: "bg-gray-500",
    shadow: "shadow-gray-200",
  },
  GOLD: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    badge: "bg-yellow-500",
    shadow: "shadow-yellow-200",
  },
  PLATINUM: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    text: "text-slate-600",
    badge: "bg-slate-500",
    shadow: "shadow-slate-200",
  },
  DIAMOND: {
    bg: "bg-sky-50",
    border: "border-sky-300",
    text: "text-sky-700",
    badge: "bg-sky-500",
    shadow: "shadow-sky-200",
  },
};

const CATEGORY_LABELS = {
  STREAK: "🔥 Streak",
  SURVEY_CREATION: "📝 Tạo khảo sát",
  PARTICIPATION: "🎯 Tham gia",
  SOCIAL: "🌐 Cộng đồng",
  SPECIAL: "⭐ Đặc biệt",
  RANK: "🏅 Rank",
};

const CATEGORY_COLORS = {
  STREAK: "text-red-600",
  SURVEY_CREATION: "text-indigo-600",
  PARTICIPATION: "text-green-600",
  SOCIAL: "text-blue-600",
  SPECIAL: "text-purple-600",
  RANK: "text-amber-600",
};

export function AchievementBadge({ achievement, size = "md", showProgress = true }) {
  const {
    code,
    name,
    description,
    icon,
    tier = "BRONZE",
    star_reward,
    is_unlocked = false,
    progress = 0,
    progress_percent = 0,
    unlocked_at,
  } = achievement || {};

  const style = TIER_STYLES[tier] || TIER_STYLES.BRONZE;
  const sizeClass = size === "sm"
    ? "p-2"
    : size === "lg"
      ? "p-4"
      : "p-3";

  const iconSize = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";
  const nameSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div
      className={`
        relative rounded-2xl border-2 transition-all duration-300
        ${sizeClass}
        ${style.bg} ${style.border}
        ${is_unlocked ? `shadow-lg ${style.shadow}` : "opacity-60 grayscale"}
        ${is_unlocked ? "hover:scale-105 cursor-pointer" : ""}
      `}
      title={description}
    >
      {/* Lock overlay */}
      {!is_unlocked && (
        <div className="absolute top-1 right-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="gray" className="opacity-50">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
      )}

      {/* Unlocked badge */}
      {is_unlocked && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${style.badge} shadow`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      )}

      {/* Icon */}
      <div className={`${iconSize} text-center mb-1`}>{icon || "🏅"}</div>

      {/* Name */}
      <div className={`font-bold ${nameSize} ${style.text} text-center leading-tight`}>
        {name}
      </div>

      {/* Stars reward */}
      <div className="flex items-center justify-center gap-0.5 mt-1 text-xs">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={style.text}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span className={`font-semibold ${style.text}`}>{star_reward}</span>
      </div>

      {/* Progress bar */}
      {showProgress && !is_unlocked && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                tier === "DIAMOND" ? "bg-sky-500"
                  : tier === "GOLD" ? "bg-yellow-500"
                  : tier === "SILVER" ? "bg-gray-400"
                  : tier === "PLATINUM" ? "bg-slate-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${progress_percent}%` }}
            />
          </div>
          <div className="text-center text-xs text-gray-400 mt-0.5">
            {progress}/{achievement?.condition_value}
          </div>
        </div>
      )}
    </div>
  );
}

export function AchievementCard({ achievement }) {
  const { is_unlocked, unlocked_at } = achievement || {};
  const style = TIER_STYLES[achievement?.tier] || TIER_STYLES.BRONZE;
  const categoryLabel = CATEGORY_LABELS[achievement?.category] || "🏅";
  const categoryColor = CATEGORY_COLORS[achievement?.category] || "text-gray-600";

  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-xl border transition-all
      ${is_unlocked
        ? "bg-white border-gray-200 hover:border-amber-200 hover:shadow-md"
        : "bg-gray-50 border-gray-200 opacity-70"
      }
    `}>
      <AchievementBadge achievement={achievement} size="md" showProgress={false} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${categoryColor}`}>{categoryLabel}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${style.bg} ${style.border} ${style.text}`}>
            {achievement?.tier}
          </span>
        </div>
        <div className="font-semibold text-sm text-gray-800 mt-0.5">{achievement?.name}</div>
        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{achievement?.description}</div>
        {is_unlocked && unlocked_at && (
          <div className="text-xs text-green-600 mt-1">
            ✓ Mở khóa {new Date(unlocked_at).toLocaleDateString("vi-VN")}
          </div>
        )}
      </div>
    </div>
  );
}

export default AchievementBadge;
