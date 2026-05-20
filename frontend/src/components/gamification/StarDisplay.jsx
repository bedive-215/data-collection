// src/components/gamification/StarDisplay.jsx
import React from "react";

const RANK_COLORS = {
  BRONZE: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", glow: "shadow-amber-200" },
  SILVER: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", glow: "shadow-gray-200" },
  GOLD: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-300", glow: "shadow-yellow-200" },
  PLATINUM: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-300", glow: "shadow-slate-200" },
  DIAMOND: { bg: "bg-sky-100", text: "text-sky-600", border: "border-sky-300", glow: "shadow-sky-200" },
};

const RANK_ICONS = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
  DIAMOND: "💠",
};

const RANK_NAMES = {
  BRONZE: "Đồng",
  SILVER: "Bạc",
  GOLD: "Vàng",
  PLATINUM: "Bạch Kim",
  DIAMOND: "Kim Cương",
};

export function StarDisplay({ balance, rank, showRank = true, size = "md" }) {
  const rankKey = rank?.name || "BRONZE";
  const colors = RANK_COLORS[rankKey] || RANK_COLORS.BRONZE;
  const icon = RANK_ICONS[rankKey];
  const rankName = RANK_NAMES[rankKey];

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-full border font-semibold
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size] || sizeClasses.md}
      `}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      <span>{balance?.toLocaleString("vi-VN") ?? 0}</span>
      {showRank && (
        <span className="opacity-60 mx-1">|</span>
      )}
      {showRank && (
        <span>{icon} {rankName}</span>
      )}
    </div>
  );
}

export function StarBadge({ amount, label, icon, color = "amber" }) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${colorMap[color] || colorMap.amber}`}>
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className="text-lg font-bold">{amount?.toLocaleString("vi-VN") ?? 0}</div>
      <div className="text-xs opacity-70 text-center">{label}</div>
    </div>
  );
}

export function RankProgress({ currentRank, nextRank, progress, starsNeeded }) {
  const rankKey = currentRank?.name || "BRONZE";
  const colors = RANK_COLORS[rankKey] || RANK_COLORS.BRONZE;
  const icon = RANK_ICONS[rankKey];
  const rankName = RANK_NAMES[rankKey];
  const nextIcon = nextRank ? RANK_ICONS[nextRank.name] : null;
  const nextName = nextRank ? RANK_NAMES[nextRank.name] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={`flex items-center gap-1 font-semibold ${colors.text}`}>
          {icon} {rankName}
        </span>
        {nextRank && (
          <span className="flex items-center gap-1 text-gray-500">
            {nextIcon} {nextName}
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            rankKey === "DIAMOND" ? "bg-gradient-to-r from-sky-400 to-sky-600"
            : rankKey === "GOLD" ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
            : rankKey === "SILVER" ? "bg-gradient-to-r from-gray-400 to-gray-600"
            : rankKey === "PLATINUM" ? "bg-gradient-to-r from-slate-400 to-slate-600"
            : "bg-gradient-to-r from-amber-400 to-amber-600"
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      {nextRank && (
        <div className="text-xs text-gray-500 text-right">
          Cần thêm {starsNeeded?.toLocaleString("vi-VN")} sao để lên {nextName}
        </div>
      )}
    </div>
  );
}

export default StarDisplay;
