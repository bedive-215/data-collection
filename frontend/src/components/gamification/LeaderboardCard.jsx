import React from "react";
import { Star, Gift, Flame } from "lucide-react";

const PRIZE_COLORS = [
  { bg: "bg-gradient-to-br from-yellow-400 to-amber-500", text: "text-white", badge: "from-yellow-500 to-amber-600" },
  { bg: "bg-gradient-to-br from-gray-300 to-gray-400", text: "text-white", badge: "from-gray-400 to-gray-500" },
  { bg: "bg-gradient-to-br from-orange-400 to-orange-600", text: "text-white", badge: "from-orange-500 to-orange-700" },
  { bg: "bg-gradient-to-br from-blue-400 to-blue-600", text: "text-white", badge: "from-blue-500 to-blue-700" },
  { bg: "bg-gradient-to-br from-purple-400 to-purple-600", text: "text-white", badge: "from-purple-500 to-purple-700" },
];

function Avatar({ name, avatar, size = "md" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-sm" : size === "lg" ? "w-12 h-12 text-lg" : "w-10 h-10 text-base";
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  if (avatar) {
    return (
      <img src={avatar} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow`} />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold ring-2 ring-white shadow`}
    >
      {initial}
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank <= 5) {
    const config = PRIZE_COLORS[rank - 1];
    return (
      <div
        className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br ${config.badge} text-white text-xs font-bold shadow-lg ring-2 ring-white`}
      >
        {rank}
      </div>
    );
  }

  return (
    <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-xs font-bold shadow ring-2 ring-white">
      {rank}
    </div>
  );
}

export function LeaderboardCard({ user, rank, isCurrentUser = false, showPrize = false }) {
  const { full_name, avatar, stars, current_rank, streak_count, weekly_prize } = user || {};
  const prizeConfig = rank <= 5 ? PRIZE_COLORS[rank - 1] : null;

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
        isCurrentUser
          ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200"
          : prizeConfig
            ? `bg-gradient-to-r ${prizeConfig.bg} ${prizeConfig.text}`
            : "bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <RankBadge rank={rank} />
      <Avatar name={full_name} avatar={avatar} />

      <div className="flex-1 min-w-0">
        <div
          className={`font-semibold truncate text-sm ${isCurrentUser ? "text-indigo-700" : prizeConfig ? "text-white" : "text-gray-800"}`}
        >
          {full_name || "Người dùng"}
          {isCurrentUser && (
            <span className="ml-2 text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">Bạn</span>
          )}
        </div>
        <div
          className={`flex items-center gap-2 text-xs ${isCurrentUser ? "text-indigo-500" : prizeConfig ? "text-white/80" : "text-gray-500"}`}
        >
          {current_rank && <span>{current_rank}</span>}
          {streak_count > 0 && (
            <span className="flex items-center gap-0.5">
              <Flame size={10} />
              {streak_count} ngày
            </span>
          )}
        </div>
      </div>

      <div className="text-right">
        <div
          className={`flex items-center gap-1 text-sm font-bold ${isCurrentUser ? "text-indigo-700" : prizeConfig ? "text-white" : "text-amber-600"}`}
        >
          <Star size={14} fill="currentColor" />
          <span>{stars?.toLocaleString("vi-VN")}</span>
        </div>
        {showPrize && weekly_prize && (
          <div className={`flex items-center gap-0.5 text-xs mt-0.5 ${prizeConfig ? "text-white/90" : "text-green-600"}`}>
            <Gift size={10} />
            {weekly_prize.prize}
          </div>
        )}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 animate-pulse">
          <div className="w-7 h-7 rounded-full bg-gray-300" />
          <div className="w-10 h-10 rounded-full bg-gray-300" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-32" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
          <div className="w-16 h-4 bg-gray-300 rounded" />
        </div>
      ))}
    </div>
  );
}
