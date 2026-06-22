import React from "react";
import { Star, Lock, Check } from "lucide-react";
import { getRankStyle, CATEGORY_CONFIG } from "@/utils/gamification";

export function AchievementBadge({ achievement, size = "md", showProgress = true }) {
  const {
    name,
    description,
    icon: customIcon,
    tier = "BRONZE",
    star_reward,
    is_unlocked = false,
    progress = 0,
    progress_percent = 0,
    condition_value,
    category,
  } = achievement || {};

  const style = getRankStyle(tier);
  const catConfig = CATEGORY_CONFIG[category];

  const sizeClass = size === "sm" ? "p-2" : size === "lg" ? "p-4" : "p-3";
  const iconSize = size === "sm" ? 20 : size === "lg" ? 32 : 28;
  const nameSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  const IconComponent = customIcon
    ? () => <span className="text-center">{customIcon}</span>
    : catConfig?.icon || Star;

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 ${sizeClass} ${style.bg} ${style.border} ${
        is_unlocked ? `shadow ${style.shadow}` : "opacity-50 grayscale"
      } ${is_unlocked ? "hover:scale-105 cursor-pointer" : ""}`}
      title={description}
    >
      {!is_unlocked && (
        <div className="absolute top-1 right-1">
          <Lock size={12} className="text-gray-400 opacity-50" />
        </div>
      )}

      {is_unlocked && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${style.badge} shadow`}>
          <Check size={10} className="text-white" />
        </div>
      )}

      <div className="flex justify-center mb-1">
        <IconComponent size={iconSize} className={`${style.color}`} />
      </div>

      <div className={`font-bold ${nameSize} ${style.color} text-center leading-tight`}>{name}</div>

      <div className="flex items-center justify-center gap-0.5 mt-1 text-xs">
        <Star size={10} className={style.color} fill="currentColor" />
        <span className={`font-semibold ${style.color}`}>{star_reward}</span>
      </div>

      {showProgress && !is_unlocked && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${style.badge}`}
              style={{ width: `${progress_percent}%` }}
            />
          </div>
          <div className="text-center text-xs text-gray-400 mt-0.5">
            {progress}/{condition_value}
          </div>
        </div>
      )}
    </div>
  );
}

export function AchievementCard({ achievement }) {
  const { is_unlocked, unlocked_at, category, tier = "BRONZE" } = achievement || {};
  const style = getRankStyle(tier);
  const catConfig = CATEGORY_CONFIG[category];
  const CategoryIcon = catConfig?.icon || Star;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
        is_unlocked
          ? "bg-white border-gray-200 hover:border-amber-200 hover:shadow-sm"
          : "bg-gray-50 border-gray-200 opacity-60"
      }`}
    >
      <AchievementBadge achievement={achievement} size="md" showProgress={false} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {catConfig && (
            <span className={`flex items-center gap-1 text-xs font-semibold ${catConfig.color}`}>
              <CategoryIcon size={12} />
              {catConfig.label || category}
            </span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${style.bg} ${style.border} ${style.color}`}
          >
            {tier}
          </span>
        </div>
        <div className="font-semibold text-sm text-gray-800 mt-0.5">{achievement?.name}</div>
        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{achievement?.description}</div>
        {is_unlocked && unlocked_at && (
          <div className="text-xs text-green-600 mt-1">
            <Check size={10} className="inline mr-0.5" />
            Mở khóa {new Date(unlocked_at).toLocaleDateString("vi-VN")}
          </div>
        )}
      </div>
    </div>
  );
}
