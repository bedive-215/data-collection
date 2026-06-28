// src/pages/user/LeaderboardPage.jsx
import React, { useState } from "react";
import { LeaderboardCard, LeaderboardSkeleton } from "@/components/gamification/LeaderboardCard";
import { StarDisplay } from "@/components/gamification/StarDisplay";
import { useGamification } from "@/contexts/GamificationContext";

const PERIOD_TABS = [
  { key: "WEEKLY", label: "📅 Tuần này", sub: "Top 5 nhận thẻ điện thoại" },
  { key: "MONTHLY", label: "🗓️ Tháng này", sub: "Bảng xếp hạng tháng" },
  { key: "ALL_TIME", label: "🏆 All-time", sub: "Các huyền thoại" },
];

const WEEKLY_PRIZES = [
  { rank: 1, prize: "🥇 Thẻ điện thoại 500.000đ", color: "from-yellow-400 to-amber-500" },
  { rank: 2, prize: "🥈 Thẻ điện thoại 300.000đ", color: "from-gray-300 to-gray-400" },
  { rank: 3, prize: "🥉 Thẻ điện thoại 150.000đ", color: "from-orange-300 to-orange-500" },
  { rank: 4, prize: "4️⃣ Thẻ điện thoại 70.000đ", color: "from-blue-300 to-blue-500" },
  { rank: 5, prize: "5️⃣ Thẻ điện thoại 30.000đ", color: "from-purple-300 to-purple-500" },
];

export default function LeaderboardPage() {
  const { leaderboard, myRank, loading, changeLeaderboardPeriod } = useGamification();
  const [activePeriod, setActivePeriod] = useState("WEEKLY");

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    changeLeaderboardPeriod(period);
  };

  const periodLabel = PERIOD_TABS.find(t => t.key === activePeriod);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">🏆 Bảng xếp hạng</h1>
          <p className="text-white/80 text-sm">Đua top nhận thẻ điện thoại - hoàn toàn miễn phí!</p>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 flex gap-1">
          {PERIOD_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handlePeriodChange(tab.key)}
              className={`
                flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2
                ${activePeriod === tab.key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <div>{tab.label.split(" ")[0]} {tab.label.split(" ").slice(1).join(" ")}</div>
              <div className="text-xs font-normal opacity-60">{tab.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

        {/* Weekly Prizes */}
        {activePeriod === "WEEKLY" && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 p-4">
            <h3 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
              🎁 Phần thưởng Top 5 tuần này
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {WEEKLY_PRIZES.map((prize, idx) => (
                <div key={prize.rank} className={`
                  text-center p-2 rounded-xl border-2
                  bg-gradient-to-b ${prize.color}
                  text-white
                `}>
                  <div className="text-lg mb-1">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}️⃣`}
                  </div>
                  <div className="text-xs font-bold leading-tight">{prize.prize.split(" ").slice(1).join(" ")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Rank Card */}
        {myRank && (
          <div className="bg-indigo-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">Xếp hạng của bạn</div>
                <div className="text-4xl font-black mt-1">
                  #{myRank.rank}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  Top {myRank.percentile}% người chơi
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="font-bold">{myRank.stars?.toLocaleString("vi-VN")}</span>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {activePeriod === "WEEKLY" ? "Tuần này" : activePeriod === "MONTHLY" ? "Tháng này" : "Tổng cộng"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="font-bold text-gray-800 mb-3">📊 {periodLabel?.sub}</div>

          {loading ? (
            <LeaderboardSkeleton />
          ) : leaderboar?.top?.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.top.map((user, index) => (
                <LeaderboardCard
                  key={user.user_id}
                  user={user}
                  rank={index + 1}
                  isCurrentUser={false}
                  showPrize={activePeriod === "WEEKLY"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🏆</div>
              <div className="font-semibold">Chưa có dữ liệu</div>
              <div className="text-sm mt-1">Hãy tích cực tham gia để lên top!</div>
            </div>
          )}
        </div>

        {/* How to earn stars */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="font-bold text-gray-800 mb-3">✨ Cách kiếm sao</h3>
          <div className="space-y-2 text-sm">
            {[
              { icon: "📅", action: "Điểm danh hằng ngày", stars: "+50-100 sao" },
              { icon: "📝", action: "Tạo khảo sát mới", stars: "+50 sao" },
              { icon: "🎯", action: "Tham gia khảo sát", stars: "+20-100 sao" },
              { icon: "👥", action: "Có người tham gia khảo sát của bạn", stars: "+10 sao/người" },
              { icon: "🔥", action: "Điểm danh 7 ngày liên tiếp", stars: "x2 bonus!" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-gray-700">{item.action}</span>
                </div>
                <span className="font-bold text-amber-600">{item.stars}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
