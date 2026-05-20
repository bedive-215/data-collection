// src/pages/user/StarWalletPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Trophy, TrendingUp, History, ChevronRight, Award, Zap } from "lucide-react";
import { RankProgress } from "@/components/gamification/StarDisplay";
import starService from "@/services/starService";
import leaderboardService from "@/services/leaderboardService";
import { useGamification } from "@/contexts/GamificationContext";

const TYPE_CONFIG = {
  DAILY_CHECKIN: { icon: "📅", label: "Điểm danh", color: "text-green-600", bg: "bg-green-50" },
  STREAK_BONUS: { icon: "🔥", label: "Streak Bonus", color: "text-red-600", bg: "bg-red-50" },
  CREATE_SURVEY: { icon: "📝", label: "Tạo khảo sát", color: "text-indigo-600", bg: "bg-indigo-50" },
  FIRST_RESPONDER: { icon: "🥇", label: "Người đầu tiên", color: "text-yellow-600", bg: "bg-yellow-50" },
  SECOND_RESPONDER: { icon: "🥈", label: "Người thứ 2", color: "text-gray-600", bg: "bg-gray-50" },
  THIRD_RESPONDER: { icon: "🥉", label: "Người thứ 3", color: "text-orange-600", bg: "bg-orange-50" },
  LATER_RESPONDER: { icon: "🎯", label: "Tham gia KS", color: "text-blue-600", bg: "bg-blue-50" },
  RESPOND_SURVEY: { icon: "🎯", label: "Tham gia KS", color: "text-blue-600", bg: "bg-blue-50" },
  SURVEY_CREATOR_BONUS: { icon: "👥", label: "Có người tham gia", color: "text-purple-600", bg: "bg-purple-50" },
  ACHIEVEMENT_REWARD: { icon: "🏅", label: "Huy hiệu", color: "text-amber-600", bg: "bg-amber-50" },
  RANK_UP_BONUS: { icon: "⬆️", label: "Thăng rank", color: "text-emerald-600", bg: "bg-emerald-50" },
  PENALTY: { icon: "⚠️", label: "Thu hồi", color: "text-red-700", bg: "bg-red-100" },
  ADMIN_ADJUST: { icon: "🔧", label: "Admin điều chỉnh", color: "text-gray-600", bg: "bg-gray-50" },
  BONUS: { icon: "✨", label: "Bonus", color: "text-violet-600", bg: "bg-violet-50" },
};

function getTypeInfo(type) {
  const cfg = TYPE_CONFIG[type];
  if (cfg) return cfg;
  return { icon: "⭐", label: type || "Khác", color: "text-gray-600", bg: "bg-gray-50" };
}

function TransactionItem({ tx }) {
  const { amount, type, description, balance_after, created_at } = tx;
  const typeInfo = getTypeInfo(type);
  const isPositive = amount > 0;
  const time = new Date(created_at).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });

  return React.createElement("div", { className: "flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-amber-200 transition-all hover:shadow-sm" },
    React.createElement("div", { className: `w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${typeInfo.bg}` }, typeInfo.icon),
    React.createElement("div", { className: "flex-1 min-w-0" },
      React.createElement("div", { className: "flex items-center justify-between gap-2" },
        React.createElement("span", { className: `font-bold text-sm ${isPositive ? "text-green-600" : "text-red-600"}` },
          `${isPositive ? "+" : ""}${amount.toLocaleString("vi-VN")} ⭐`
        ),
        React.createElement("span", { className: "text-xs text-gray-400 flex-shrink-0" }, time)
      ),
      React.createElement("div", { className: `text-xs font-medium ${typeInfo.color} mt-0.5` }, typeInfo.label),
      description ? React.createElement("div", { className: "text-xs text-gray-500 mt-0.5 line-clamp-2" }, description) : null
    ),
    React.createElement("div", { className: "text-right flex-shrink-0" },
      React.createElement("div", { className: "text-xs text-gray-400" }, "Sau"),
      React.createElement("div", { className: "text-xs font-semibold text-gray-600" },
        `${(balance_after || 0).toLocaleString("vi-VN")} ⭐`
      )
    )
  );
}

export default function StarWalletPage() {
  const navigate = useNavigate();
  const { balance } = useGamification();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [comparison, setComparison] = useState(null);
  const [loadingComp, setLoadingComp] = useState(true);

  const loadHistory = async (page, reset) => {
    if (!reset) reset = page === 1;
    if (reset) setHistoryLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterType !== "ALL") params.type = filterType;
      const res = await starService.getHistory(params);
      const txs = res.data?.transactions || [];
      if (reset) {
        setHistory(txs);
      } else {
        setHistory(prev => [...prev, ...txs]);
      }
      setHasMore(txs.length === 20);
      setHistoryPage(page);
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(1, true); }, [filterType]);

  useEffect(() => {
    leaderboardService.getComparison()
      .then(res => setComparison(res.data))
      .catch(err => console.error("Comparison error:", err))
      .finally(() => setLoadingComp(false));
  }, []);

  const earnedTotal = history.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spentTotal = history.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const rankName = balance?.rank_info?.name;
  const rankLabel = rankName === "SILVER" ? "Bạc" : rankName === "GOLD" ? "Vàng" : rankName === "PLATINUM" ? "Bạch Kim" : rankName === "DIAMOND" ? "Kim Cương" : "Đồng";
  const rankIcon = balance?.rank_info?.icon || "🥉";

  const statCards = [
    { label: "Tuần này", value: balance?.weekly_stars, icon: "📅", bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Tháng này", value: balance?.monthly_stars, icon: "🗓️", bg: "bg-indigo-50", color: "text-indigo-600" },
    { label: "Tổng cộng", value: balance?.total_stars_earned, icon: "⭐", bg: "bg-amber-50", color: "text-amber-600" },
  ];

  const howToEarn = [
    { icon: "📅", text: "Điểm danh hằng ngày", stars: "+50-100 sao" },
    { icon: "📝", text: "Tạo khảo sát mới", stars: "+50 sao" },
    { icon: "🥇", text: "Người đầu tiên hoàn thành KS", stars: "+100 sao" },
    { icon: "🎯", text: "Tham gia khảo sát", stars: "+20-50 sao" },
    { icon: "👥", text: "Có người tham gia KS của bạn", stars: "+10 sao/người" },
    { icon: "🔥", text: "Streak 7 ngày", stars: "x2 bonus!" },
  ];

  const filterOptions = [
    { value: "ALL", label: "Tất cả" },
    { value: "DAILY_CHECKIN", label: "📅 Điểm danh" },
    { value: "CREATE_SURVEY", label: "📝 Tạo KS" },
    { value: "FIRST_RESPONDER", label: "🥇 Người đầu" },
    { value: "RESPOND_SURVEY", label: "🎯 Tham gia" },
    { value: "ACHIEVEMENT_REWARD", label: "🏅 Huy hiệu" },
    { value: "STREAK_BONUS", label: "🔥 Streak" },
    { value: "PENALTY", label: "⚠️ Thu hồi" },
  ];

  const comparisonPeriods = [
    { key: "weekly", label: "📅 Tuần", data: comparison?.weekly },
    { key: "monthly", label: "🗓️ Tháng", data: comparison?.monthly },
    { key: "all_time", label: "🏆 All-time", data: comparison?.all_time },
  ];

  const txList = historyLoading
    ? [1, 2, 3, 4, 5].map(i => React.createElement("div", { key: i, className: "h-16 bg-gray-100 rounded-xl animate-pulse" }))
    : history.length === 0
      ? [
          React.createElement("div", { key: "empty", className: "text-center py-12 text-gray-400" },
            React.createElement(Star, { className: "w-12 h-12 mx-auto mb-3 opacity-30" }),
            React.createElement("div", { className: "font-semibold" }, "Chưa có giao dịch nào"),
            React.createElement("div", { className: "text-sm mt-1" }, "Hãy bắt đầu điểm danh để nhận sao!")
          )
        ]
      : [
          ...history.map(tx => React.createElement(TransactionItem, { key: tx.id, tx })),
          hasMore ? React.createElement("button", {
            key: "load-more",
            onClick: () => loadHistory(historyPage + 1),
            className: "w-full py-3 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors"
          }, "Xem thêm giao dịch") : null
        ];

  return React.createElement("div", { className: "min-h-screen bg-gray-50" },
    // Header
    React.createElement("div", { className: "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white" },
      React.createElement("div", { className: "max-w-2xl mx-auto px-6 py-8" },
        React.createElement("div", { className: "flex items-center gap-3 mb-6" },
          React.createElement("button", {
            onClick: () => navigate(-1),
            className: "w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          }, React.createElement(ChevronRight, { className: "w-5 h-5 rotate-180" })),
          React.createElement("div", null,
            React.createElement("h1", { className: "text-2xl font-bold" }, "💰 Ví Sao"),
            React.createElement("p", { className: "text-white/80 text-sm" }, "Quản lý sao của bạn")
          )
        ),
        React.createElement("div", { className: "bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-center" },
          React.createElement("div", { className: "flex items-center justify-center gap-2 mb-1" },
            React.createElement(Star, { className: "w-6 h-6 text-yellow-300 fill-yellow-300" }),
            React.createElement("span", { className: "text-white/60 text-sm" }, "Số dư hiện tại")
          ),
          React.createElement("div", { className: "text-6xl font-black text-white mb-2" },
            (balance?.star_balance || 0).toLocaleString("vi-VN")
          ),
          React.createElement("div", { className: "flex items-center justify-center gap-2" },
            React.createElement("span", { className: "text-white/60 text-sm" }, "Rank"),
            React.createElement("span", { className: "text-xl font-bold" }, `${rankIcon} ${rankLabel}`)
          )
        )
      )
    ),

    // Body
    React.createElement("div", { className: "max-w-2xl mx-auto px-6 py-6 space-y-5" },

      // Streak + Balance quick info
      React.createElement("div", { className: "grid grid-cols-2 gap-3" },
        React.createElement("div", { className: "flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl" },
          React.createElement("div", { className: "text-2xl" }, "🔥"),
          React.createElement("div", null,
            React.createElement("div", { className: "font-bold text-red-700 text-lg" }, balance?.active_streak ?? 0),
            React.createElement("div", { className: "text-xs text-red-500" }, "Streak ngày")
          )
        ),
        React.createElement("div", { className: "flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl" },
          React.createElement("div", { className: "text-2xl" }, "🏆"),
          React.createElement("div", null,
            React.createElement("div", { className: "font-bold text-amber-700 text-lg" }, balance?.highest_streak ?? 0),
            React.createElement("div", { className: "text-xs text-amber-500" }, "Kỷ lục streak")
          )
        )
      ),

      // Stats
      React.createElement("div", { className: "grid grid-cols-3 gap-3" },
        ...statCards.map(stat =>
          React.createElement("div", { key: stat.label, className: `text-center p-3 rounded-xl border ${stat.bg}` },
            React.createElement("div", { className: "text-lg" }, stat.icon),
            React.createElement("div", { className: `font-bold text-lg ${stat.color}` }, stat.value ?? 0),
            React.createElement("div", { className: "text-xs text-gray-500 mt-0.5" }, stat.label)
          )
        )
      ),

      // Rank Progress
      balance?.rank_info ? React.createElement("div", { className: "bg-white rounded-2xl border border-gray-200 p-4" },
        React.createElement("div", { className: "flex items-center gap-2 mb-3" },
          React.createElement(Trophy, { className: "w-4 h-4 text-amber-500" }),
          React.createElement("span", { className: "font-semibold text-sm text-gray-700" }, "Tiến độ rank")
        ),
        React.createElement(RankProgress, {
          currentRank: balance.rank_info,
          nextRank: balance.rank_info.next,
          progress: balance.rank_info.progress_to_next || 0,
          starsNeeded: balance.rank_info.stars_needed,
        })
      ) : null,

      // Leaderboard Comparison
      !loadingComp && comparison ? React.createElement("div", { className: "bg-white rounded-2xl border border-gray-200 p-4" },
        React.createElement("div", { className: "flex items-center gap-2 mb-3" },
          React.createElement(TrendingUp, { className: "w-4 h-4 text-indigo-500" }),
          React.createElement("span", { className: "font-semibold text-sm text-gray-700" }, "So sánh xếp hạng")
        ),
        React.createElement("div", { className: "grid grid-cols-3 gap-3" },
          ...comparisonPeriods.filter(p => p.data).map(p =>
            React.createElement("div", { key: p.key, className: "text-center p-3 bg-gray-50 rounded-xl" },
              React.createElement("div", { className: "text-sm" }, p.label),
              React.createElement("div", { className: "font-bold text-indigo-600 text-lg" }, "#" + p.data.rank),
              React.createElement("div", { className: "text-xs text-gray-500" }, "Top " + p.data.percentile + "%"),
              React.createElement("div", { className: "text-xs text-gray-400 mt-1" },
                (p.data.stars || 0).toLocaleString("vi-VN") + " sao"
              )
            )
          )
        )
      ) : null,

      // History header + filter
      React.createElement("div", { className: "flex items-center justify-between" },
        React.createElement("div", { className: "flex items-center gap-2" },
          React.createElement(History, { className: "w-4 h-4 text-gray-500" }),
          React.createElement("span", { className: "font-semibold text-sm text-gray-700" }, "Lịch sử giao dịch")
        ),
        React.createElement("select", {
          value: filterType,
          onChange: e => setFilterType(e.target.value),
          className: "text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-amber-400"
        },
          ...filterOptions.map(opt =>
            React.createElement("option", { key: opt.value, value: opt.value }, opt.label)
          )
        )
      ),

      // Summary chips
      React.createElement("div", { className: "flex gap-2 flex-wrap" },
        React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full" },
          React.createElement(TrendingUp, { className: "w-3.5 h-3.5 text-green-600" }),
          React.createElement("span", { className: "text-xs font-semibold text-green-700" },
            `+${earnedTotal.toLocaleString("vi-VN")} sao`
          )
        ),
        spentTotal > 0 ? React.createElement("div", { className: "flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full" },
          React.createElement(TrendingUp, { className: "w-3.5 h-3.5 text-red-600 rotate-180" }),
          React.createElement("span", { className: "text-xs font-semibold text-red-700" },
            `-${spentTotal.toLocaleString("vi-VN")} sao`
          )
        ) : null
      ),

      // Transaction list
      React.createElement("div", { className: "space-y-2" }, ...txList),

      // Quick actions
      React.createElement("div", { className: "grid grid-cols-2 gap-3" },
        React.createElement("button", {
          onClick: () => navigate("/user/achievements"),
          className: "flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
        },
          React.createElement(Award, { className: "w-5 h-5 text-amber-600" }),
          React.createElement("div", { className: "text-left" },
            React.createElement("div", { className: "text-sm font-semibold text-amber-700" }, "Huy hiệu"),
            React.createElement("div", { className: "text-xs text-amber-600" }, "Xem thành tựu")
          )
        ),
        React.createElement("button", {
          onClick: () => navigate("/user/leaderboard"),
          className: "flex items-center gap-2 p-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        },
          React.createElement(Trophy, { className: "w-5 h-5 text-indigo-600" }),
          React.createElement("div", { className: "text-left" },
            React.createElement("div", { className: "text-sm font-semibold text-indigo-700" }, "Bảng xếp hạng"),
            React.createElement("div", { className: "text-xs text-indigo-600" }, "Xem top")
          )
        )
      ),

      // How to earn
      React.createElement("div", { className: "bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4" },
        React.createElement("h3", { className: "font-bold text-amber-800 text-sm mb-3 flex items-center gap-2" },
          React.createElement(Zap, { className: "w-4 h-4" }), "Cách kiếm sao"
        ),
        React.createElement("div", { className: "space-y-2" },
          ...howToEarn.map((item, i) =>
            React.createElement("div", { key: i, className: "flex items-center justify-between text-sm" },
              React.createElement("span", { className: "text-gray-700" }, `${item.icon} ${item.text}`),
              React.createElement("span", { className: "font-bold text-amber-600 text-xs" }, item.stars)
            )
          )
        )
      )
    )
  );
}
