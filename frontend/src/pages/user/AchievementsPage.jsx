// src/pages/user/AchievementsPage.jsx
import React, { useState } from "react";
import { AchievementCard } from "@/components/gamification/AchievementBadge";
import { StarDisplay } from "@/components/gamification/StarDisplay";
import { useGamification } from "@/contexts/GamificationContext";

const CATEGORY_ORDER = [
  { key: "STREAK", label: "🔥 Streak", color: "bg-red-100 text-red-700 border-red-200", emoji: "🔥" },
  { key: "SURVEY_CREATION", label: "📝 Tạo khảo sát", color: "bg-indigo-100 text-indigo-700 border-indigo-200", emoji: "📝" },
  { key: "PARTICIPATION", label: "🎯 Tham gia", color: "bg-green-100 text-green-700 border-green-200", emoji: "🎯" },
  { key: "SOCIAL", label: "🌐 Cộng đồng", color: "bg-blue-100 text-blue-700 border-blue-200", emoji: "🌐" },
  { key: "SPECIAL", label: "⭐ Đặc biệt", color: "bg-purple-100 text-purple-700 border-purple-200", emoji: "⭐" },
  { key: "RANK", label: "🏅 Rank", color: "bg-amber-100 text-amber-700 border-amber-200", emoji: "🏅" },
];

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
const TIER_COLORS = {
  BRONZE: { bg: "bg-amber-50", border: "border-amber-300", badge: "bg-amber-500" },
  SILVER: { bg: "bg-gray-50", border: "border-gray-300", badge: "bg-gray-500" },
  GOLD: { bg: "bg-yellow-50", border: "border-yellow-300", badge: "bg-yellow-500" },
  PLATINUM: { bg: "bg-slate-50", border: "border-slate-300", badge: "bg-slate-500" },
  DIAMOND: { bg: "bg-sky-50", border: "border-sky-300", badge: "bg-sky-500" }};

export default function AchievementsPage() {
  const { achievements, balance } = useGamification();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  const categories = achievements?.categories || {};
  const allAchievements = Object.values(categories).flat();
  const unlockedCount = allAchievements.filter(a => a.is_unlocked).length;
  const totalCount = allAchievements.length;

  // Filter achievements
  let filtered = allAchievements;
  if (activeCategory !== "ALL") {
    filtered = categories[activeCategory] || [];
  }
  if (tierFilter !== "ALL") {
    filtered = filtered.filter(a => a.tier === tierFilter);
  }

  // Sort: unlocked first, then by tier order
  const tierRank = Object.fromEntries(TIER_ORDER.map((t, i) => [t, i]));
  filtered.sort((a, b) => {
    if (a.is_unlocked !== b.is_unlocked) return b.is_unlocked - a.is_unlocked;
    return (tierRank[a.tier] || 99) - (tierRank[b.tier] || 99);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">🏅 Huy hiệu & Thành tựu</h1>
          <p className="text-white/80 text-sm">
            Mở khóa huy hiệu để nhận thêm sao!
          </p>

          {/* Progress */}
          <div className="mt-4 bg-white/20 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Tiến độ mở khóa</span>
              <span className="text-sm font-bold">{unlockedCount}/{totalCount} huy hiệu</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

        {/* Category Filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-500 uppercase mb-3">Danh mục</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("ALL")}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${activeCategory === "ALL"
                  ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-200"
                }
              `}
            >
              Tất cả
            </button>
            {CATEGORY_ORDER.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                  ${activeCategory === cat.key
                    ? `${cat.color} border-current`
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-200"
                  }
                `}
              >
                {cat.emoji} {cat.label.split(" ").slice(1).join(" ")}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-500 uppercase mb-3">Hạng</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTierFilter("ALL")}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${tierFilter === "ALL"
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }
              `}
            >
              Tất cả
            </button>
            {TIER_ORDER.map((tier, idx) => {
              const icons = ["🥉", "🥈", "🥇", "💎", "💠"];
              return (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                    ${tierFilter === tier
                      ? `${TIER_COLORS[tier].badge} text-white border-transparent`
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                    }
                  `}
                >
                  {icons[idx]} {tier.charAt(0) + tier.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements Grid */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((ach) => (
              <AchievementCard key={ach.code} achievement={ach} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
            <div className="text-5xl mb-3">🏅</div>
            <div className="font-semibold">Không có huy hiệu nào</div>
            <div className="text-sm mt-1">Thử chọn danh mục hoặc hạng khác</div>
          </div>
        )}
      </div>
    </div>
  );
}
