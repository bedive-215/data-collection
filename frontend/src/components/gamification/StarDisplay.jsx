import React from "react";
import { Star, TrendingUp } from "lucide-react";
import { getRankStyle, getRankLabel } from "@/utils/gamification";

export function StarDisplay({ balance, rank, showRank = true, size = "md" }) {
  const rankKey = rank?.name || "BRONZE";
  const style = getRankStyle(rankKey);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-full border font-semibold
        ${style.bg} ${style.color} ${style.border}
        ${sizeClasses[size] || sizeClasses.md}
      `}
    >
      <Star size={16} className="flex-shrink-0 fill-current" />
      <span>{balance?.toLocaleString("vi-VN") ?? 0}</span>
      {showRank && <span className="opacity-40 mx-1">|</span>}
      {showRank && (
        <span className="flex items-center gap-1">
          <style.icon {...style.iconProps} />
          {getRankLabel(rankKey)}
        </span>
      )}
    </div>
  );
}

export function StarBadge({ amount, label, icon: Icon, color = "amber" }) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    green: "bg-green-50 text-green-600 border-green-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${colorMap[color] || colorMap.amber}`}>
      {Icon && (
        <div className="mb-1">
          <Icon size={24} className="opacity-80" />
        </div>
      )}
      <div className="text-lg font-bold">{amount?.toLocaleString("vi-VN") ?? 0}</div>
      <div className="text-xs opacity-70 text-center">{label}</div>
    </div>
  );
}

export function RankProgress({ currentRank, nextRank, progress, starsNeeded }) {
  const rankKey = currentRank?.name || "BRONZE";
  const style = getRankStyle(rankKey);
  const nextStyle = nextRank ? getRankStyle(nextRank.name) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={`flex items-center gap-1.5 font-semibold ${style.color}`}>
          <style.icon {...style.iconProps} />
          {getRankLabel(rankKey)}
        </span>
        {nextRank && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <nextStyle.icon {...nextStyle.iconProps} />
            {getRankLabel(nextRank.name)}
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.progress}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      {nextRank && (
        <div className="text-xs text-gray-500 text-right">
          Cần thêm {starsNeeded?.toLocaleString("vi-VN")} sao để lên {getRankLabel(nextRank.name)}
        </div>
      )}
    </div>
  );
}
