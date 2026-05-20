// src/components/gamification/GamificationDashboard.jsx
import React, { useState } from "react";
import { StarDisplay, RankProgress } from "./StarDisplay";
import { CheckinButton } from "./CheckinButton";
import { LeaderboardCard, LeaderboardSkeleton } from "./LeaderboardCard";
import { AchievementBadge } from "./AchievementBadge";
import { useGamification } from "@/contexts/GamificationContext";
import { LEADERBOARD_PERIODS } from "@/services/leaderboardService";

const PERIOD_TABS = [
  { key: "WEEKLY", label: "Tuần", emoji: "📅" },
  { key: "MONTHLY", label: "Tháng", emoji: "🗓️" },
  { key: "ALL_TIME", label: "All-time", emoji: "🏆" },
];

export function GamificationDashboard({ compact = false }) {
  const {
    balance,
    checkinStatus,
    achievements,
    leaderboard,
    myRank,
    top5WithPrizes,
    loading,
    checkinLoading,
    doCheckin,
    changeLeaderboardPeriod,
  } = useGamification();

  const [activePeriod, setActivePeriod] = useState("WEEKLY");

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    changeLeaderboardPeriod(period);
  };

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {/* Star balance */}
        <div className="flex flex-col items-center p-3 bg-amber-50 rounded-xl border border-amber-200">
          <div className="text-2xl">⭐</div>
          <div className="font-bold text-amber-700 text-lg">
            {balance?.star_balance?.toLocaleString("vi-VN") ?? 0}
          </div>
          <div className="text-xs text-amber-600">Sao</div>
        </div>

        {/* Rank */}
        <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-xl border border-indigo-200">
          <div className="text-2xl">
            {balance?.rank_info?.icon || "🥉"}
          </div>
          <div className="font-bold text-indigo-700 text-sm">
            {balance?.rank_info?.name === "BRONZE" ? "Đồng"
              : balance?.rank_info?.name === "SILVER" ? "Bạc"
                : balance?.rank_info?.name === "GOLD" ? "Vàng"
                  : balance?.rank_info?.name === "PLATINUM" ? "Bạch Kim"
                    : balance?.rank_info?.name === "DIAMOND" ? "Kim Cương"
                      : "Đồng"
            }
          </div>
          <div className="text-xs text-indigo-600">Rank</div>
        </div>

        {/* Checkin */}
        <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl border border-green-200">
          <div className="text-2xl">🔥</div>
          <div className="font-bold text-green-700 text-lg">
            {balance?.active_streak ?? balance?.streak_count ?? 0}
          </div>
          <div className="text-xs text-green-600">Streak</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── TOP ROW: Stars + Checkin + Achievements ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Star Balance & Rank */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <span>⭐</span> Tài khoản Sao
            </h3>
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
              {balance?.current_rank || "BRONZE"}
            </span>
          </div>

          <div className="text-center py-2">
            <div className="text-5xl font-black text-amber-700">
              {balance?.star_balance?.toLocaleString("vi-VN") ?? 0}
            </div>
            <div className="text-sm text-amber-600 mt-1">sao hiện có</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">
                {balance?.total_stars_earned?.toLocaleString("vi-VN") ?? 0}
              </div>
              <div className="text-xs text-amber-600">Tổng kiếm được</div>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <div className="text-2xl">
                {balance?.rank_info?.icon || "🥉"}
              </div>
              <div className="text-xs text-amber-600">
                {balance?.rank_info?.name === "BRONZE" ? "Đồng"
                  : balance?.rank_info?.name === "SILVER" ? "Bạc"
                    : balance?.rank_info?.name === "GOLD" ? "Vàng"
                      : balance?.rank_info?.name === "PLATINUM" ? "Bạch Kim"
                        : balance?.rank_info?.name === "DIAMOND" ? "Kim Cương"
                          : "Đồng"
                }
              </div>
            </div>
          </div>

          <RankProgress
            currentRank={balance?.rank_info}
            nextRank={balance?.rank_info?.next}
            progress={balance?.rank_info?.progress_to_next || 0}
            starsNeeded={balance?.rank_info?.stars_needed}
          />
        </div>

        {/* Daily Checkin */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5">
          <h3 className="font-bold text-green-800 flex items-center gap-2 mb-4">
            <span>📅</span> Điểm danh hằng ngày
          </h3>
          <CheckinButton
            status={checkinStatus}
            onCheckin={doCheckin}
            loading={checkinLoading}
          />
          <div className="mt-3 text-xs text-gray-500 text-center">
            Điểm danh mỗi ngày để nhận sao & streak bonus!
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-5 space-y-3">
          <h3 className="font-bold text-indigo-800 flex items-center gap-2">
            <span>🏆</span> Thành tựu
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Huy hiệu đã mở</span>
              <span className="font-bold text-indigo-700">
                {achievements?.total_unlocked ?? 0}/{achievements?.total_achievements ?? 0}
              </span>
            </div>

            {/* Recent achievements */}
            {achievements && Object.values(achievements.categories || {}).flat().length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.values(achievements.categories)
                  .flat()
                  .filter(a => a.is_unlocked)
                  .slice(0, 6)
                  .map((ach) => (
                    <AchievementBadge key={ach.code} achievement={ach} size="sm" />
                  ))
                }
                {Object.values(achievements.categories).flat().filter(a => a.is_unlocked).length === 0 && (
                  <div className="text-xs text-gray-400 italic w-full text-center py-2">
                    Chưa có huy hiệu nào
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-indigo-200 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">🔥 Streak cao nhất</span>
              <span className="font-bold text-orange-700">
                {balance?.highest_streak ?? 0} ngày
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">⭐ Rank hiện tại</span>
              <span className="font-bold text-indigo-700">
                {balance?.current_rank || "BRONZE"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">📅 Lần điểm danh cuối</span>
              <span className="text-xs text-gray-500">
                {balance?.last_checkin_date || "Chưa bao giờ"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LEADERBOARD ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span>🏆</span> Bảng xếp hạng
          </h3>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {PERIOD_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handlePeriodChange(tab.key)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${activePeriod === tab.key
                    ? "bg-white text-indigo-700 shadow-sm font-bold"
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LeaderboardSkeleton />
        ) : leaderboard?.top?.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.top.map((user, index) => (
              <LeaderboardCard
                key={user.user_id}
                user={user}
                rank={index + 1}
                isCurrentUser={user.user_id === balance?.user_id}
                showPrize={activePeriod === "WEEKLY"}
              />
            ))}

            {/* My rank */}
            {myRank && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600 px-1">
                  <span>Xếp hạng của bạn: <strong className="text-indigo-700">#{myRank.rank}</strong></span>
                  <span className="text-gray-400">{myRank.total_users} người chơi</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🏆</div>
            <div>Chưa có dữ liệu bảng xếp hạng</div>
          </div>
        )}
      </div>

    </div>
  );
}

export default GamificationDashboard;
