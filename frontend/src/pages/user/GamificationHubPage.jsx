import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, Trophy, TrendingUp, History, ChevronRight, Award, Zap,
  Medal, Flame, Target, Globe, ClipboardList, Gift, Sparkles,
  CalendarDays, Wallet, BarChart3, Settings} from "lucide-react";
import { RankProgress } from "@/components/gamification/StarDisplay";
import { LeaderboardCard, LeaderboardSkeleton } from "@/components/gamification/LeaderboardCard";
import { AchievementCard } from "@/components/gamification/AchievementBadge";
import starService from "@/services/starService";
import leaderboardService from "@/services/leaderboardService";
import { useGamification } from "@/contexts/GamificationContext";
import { getRankLabel, getRankStyle, CATEGORY_CONFIG } from "@/utils/gamification";

const TABS = [
  { key: "wallet", label: "Ví Sao", icon: Wallet },
  { key: "leaderboard", label: "Xếp hạng", icon: Trophy },
  { key: "achievements", label: "Huy hiệu", icon: Medal },
];

const TYPE_CONFIG = {
  DAILY_CHECKIN: { icon: CalendarDays, label: "Điểm danh", color: "text-green-600", bg: "bg-green-50" },
  STREAK_BONUS: { icon: Flame, label: "Streak Bonus", color: "text-red-600", bg: "bg-red-50" },
  CREATE_SURVEY: { icon: ClipboardList, label: "Tạo khảo sát", color: "text-indigo-600", bg: "bg-indigo-50" },
  FIRST_RESPONDER: { icon: Medal, label: "Người đầu tiên", color: "text-yellow-600", bg: "bg-yellow-50" },
  SECOND_RESPONDER: { icon: Medal, label: "Người thứ 2", color: "text-gray-600", bg: "bg-gray-50" },
  THIRD_RESPONDER: { icon: Medal, label: "Người thứ 3", color: "text-orange-600", bg: "bg-orange-50" },
  RESPOND_SURVEY: { icon: Target, label: "Tham gia KS", color: "text-blue-600", bg: "bg-blue-50" },
  SURVEY_CREATOR_BONUS: { icon: Globe, label: "Có người tham gia", color: "text-purple-600", bg: "bg-purple-50" },
  ACHIEVEMENT_REWARD: { icon: Award, label: "Huy hiệu", color: "text-amber-600", bg: "bg-amber-50" },
  RANK_UP_BONUS: { icon: TrendingUp, label: "Thăng rank", color: "text-emerald-600", bg: "bg-emerald-50" },
  PENALTY: { icon: Zap, label: "Thu hồi", color: "text-red-700", bg: "bg-red-100" },
  ADMIN_ADJUST: { icon: Settings, label: "Admin điều chỉnh", color: "text-gray-600", bg: "bg-gray-50" },
  BONUS: { icon: Sparkles, label: "Bonus", color: "text-violet-600", bg: "bg-violet-50" }};

const PERIOD_TABS = [
  { key: "WEEKLY", label: "Tuần này", sub: "Top 5 nhận thẻ điện thoại" },
  { key: "MONTHLY", label: "Tháng này", sub: "Bảng xếp hạng tháng" },
  { key: "ALL_TIME", label: "All-time", sub: "Các huyền thoại" },
];

const WEEKLY_PRIZES = [
  { rank: 1, prize: "Thẻ điện thoại 500.000đ", color: "from-yellow-400 to-amber-500" },
  { rank: 2, prize: "Thẻ điện thoại 300.000đ", color: "from-gray-300 to-gray-400" },
  { rank: 3, prize: "Thẻ điện thoại 150.000đ", color: "from-orange-300 to-orange-500" },
  { rank: 4, prize: "Thẻ điện thoại 70.000đ", color: "from-blue-300 to-blue-500" },
  { rank: 5, prize: "Thẻ điện thoại 30.000đ", color: "from-purple-300 to-purple-500" },
];

const CATEGORY_ORDER = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
  key,
  label: cfg.label || key,
  color: `${cfg.bg} ${cfg.color} ${cfg.border}`}));

const TIER_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
const TIER_ICON = [Medal, Medal, Medal, Medal, Medal];

const TIER_COLORS = {
  BRONZE: { bg: "bg-amber-50", border: "border-amber-300", badge: "bg-amber-500" },
  SILVER: { bg: "bg-gray-50", border: "border-gray-300", badge: "bg-gray-500" },
  GOLD: { bg: "bg-yellow-50", border: "border-yellow-300", badge: "bg-yellow-500" },
  PLATINUM: { bg: "bg-slate-50", border: "border-slate-300", badge: "bg-slate-500" },
  DIAMOND: { bg: "bg-sky-50", border: "border-sky-300", badge: "bg-sky-500" }};

function getTypeInfo(type) {
  const cfg = TYPE_CONFIG[type];
  if (cfg) return cfg;
  return { icon: Star, label: type || "Khác", color: "text-gray-600", bg: "bg-gray-50" };
}

function TransactionItem({ tx }) {
  const { amount, type, description, balance_after, created_at } = tx;
  const typeInfo = getTypeInfo(type);
  const isPositive = amount > 0;
  const time = new Date(created_at).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"});
  const Icon = typeInfo.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all hover:shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeInfo.bg}`}>
        <Icon size={16} className={typeInfo.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-bold text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{amount.toLocaleString("vi-VN")} <Star size={10} className="inline fill-current" />
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
        </div>
        <div className={`text-xs font-medium ${typeInfo.color} mt-0.5`}>{typeInfo.label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</div>}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs text-gray-400">Sau</div>
        <div className="text-xs font-semibold text-gray-600 flex items-center gap-0.5 justify-end">
          {(balance_after || 0).toLocaleString("vi-VN")} <Star size={8} className="fill-current" />
        </div>
      </div>
    </div>
  );
}

function WalletTab() {
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
    if (reset === undefined) reset = page === 1;
    if (reset) setHistoryLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterType !== "ALL") params.type = filterType;
      const res = await starService.getHistory(params);
      const txs = res.data?.transactions || [];
      setHistory(reset ? txs : prev => [...prev, ...txs]);
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

  const rankKey = balance?.rank_info?.name || "BRONZE";
  const rankStyle = getRankStyle(rankKey);

  const statCards = [
    { label: "Tuần này", value: balance?.weekly_stars, icon: CalendarDays, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Tháng này", value: balance?.monthly_stars, icon: BarChart3, bg: "bg-indigo-50", color: "text-indigo-600" },
    { label: "Tổng cộng", value: balance?.total_stars_earned, icon: Star, bg: "bg-amber-50", color: "text-amber-600" },
  ];

  const howToEarn = [
    { icon: CalendarDays, text: "Điểm danh hằng ngày", stars: "+50-100 sao" },
    { icon: ClipboardList, text: "Tạo khảo sát mới", stars: "+50 sao" },
    { icon: Trophy, text: "Người đầu tiên hoàn thành KS", stars: "+100 sao" },
    { icon: Target, text: "Tham gia khảo sát", stars: "+20-50 sao" },
    { icon: Globe, text: "Có người tham gia KS của bạn", stars: "+10 sao/người" },
    { icon: Flame, text: "Streak 7 ngày", stars: "x2 bonus!" },
  ];

  const filterOptions = [
    { value: "ALL", label: "Tất cả", icon: null },
    { value: "DAILY_CHECKIN", label: "Điểm danh", icon: CalendarDays },
    { value: "CREATE_SURVEY", label: "Tạo KS", icon: ClipboardList },
    { value: "FIRST_RESPONDER", label: "Người đầu", icon: Medal },
    { value: "RESPOND_SURVEY", label: "Tham gia", icon: Target },
    { value: "ACHIEVEMENT_REWARD", label: "Huy hiệu", icon: Award },
    { value: "STREAK_BONUS", label: "Streak", icon: Flame },
    { value: "PENALTY", label: "Thu hồi", icon: Zap },
  ];

  const comparisonPeriods = [
    { key: "weekly", label: "Tuần", data: comparison?.weekly },
    { key: "monthly", label: "Tháng", data: comparison?.monthly },
    { key: "all_time", label: "All-time", data: comparison?.all_time },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star size={24} className="text-yellow-300 fill-yellow-300" />
          <span className="text-white/60 text-sm">Số dư hiện tại</span>
        </div>
        <div className="text-6xl font-black text-white mb-2">
          {(balance?.star_balance || 0).toLocaleString("vi-VN")}
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-white/60 text-sm">Rank</span>
          <span className="flex items-center gap-1 text-xl font-bold">
            <rankStyle.icon {...rankStyle.iconProps} />
            {getRankLabel(rankKey)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <Flame size={24} className="text-red-500" />
          <div>
            <div className="font-bold text-red-700 text-lg">{balance?.active_streak ?? 0}</div>
            <div className="text-xs text-red-500">Streak ngày</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Trophy size={24} className="text-amber-600" />
          <div>
            <div className="font-bold text-amber-700 text-lg">{balance?.highest_streak ?? 0}</div>
            <div className="text-xs text-amber-500">Kỷ lục streak</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`text-center p-3 rounded-xl border ${stat.bg}`}>
              <Icon size={20} className={`mx-auto ${stat.color}`} />
              <div className={`font-bold text-lg ${stat.color}`}>{stat.value ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {balance?.rank_info && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-amber-500" />
            <span className="font-semibold text-sm text-gray-700">Tiến độ rank</span>
          </div>
          <RankProgress
            currentRank={balance.rank_info}
            nextRank={balance.rank_info.next}
            progress={balance.rank_info.progress_to_next || 0}
            starsNeeded={balance.rank_info.stars_needed}
          />
        </div>
      )}

      {!loadingComp && comparison && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-indigo-500" />
            <span className="font-semibold text-sm text-gray-700">So sánh xếp hạng</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {comparisonPeriods.filter(p => p.data).map(p => (
              <div key={p.key} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600">{p.label}</div>
                <div className="font-bold text-indigo-600 text-lg">#{p.data.rank}</div>
                <div className="text-xs text-gray-500">Top {p.data.percentile}%</div>
                <div className="text-xs text-gray-400 mt-1">{(p.data.stars || 0).toLocaleString("vi-VN")} sao</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-gray-500" />
          <span className="font-semibold text-sm text-gray-700">Lịch sử giao dịch</span>
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-indigo-400"
        >
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <TrendingUp size={14} className="text-green-600" />
          <span className="text-xs font-semibold text-green-700">+{earnedTotal.toLocaleString("vi-VN")} sao</span>
        </div>
        {spentTotal > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
            <TrendingUp size={14} className="text-red-600 rotate-180" />
            <span className="text-xs font-semibold text-red-700">-{spentTotal.toLocaleString("vi-VN")} sao</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {historyLoading
          ? [1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
          : history.length === 0
            ? (
              <div className="text-center py-12 text-gray-400">
                <History size={48} className="mx-auto mb-3 opacity-30" />
                <div className="font-semibold">Chưa có giao dịch nào</div>
                <div className="text-sm mt-1">Hãy bắt đầu điểm danh để nhận sao!</div>
              </div>
            )
            : (
              <>
                {history.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
                {hasMore && (
                  <button
                    onClick={() => loadHistory(historyPage + 1)}
                    className="w-full py-3 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-colors"
                  >
                    Xem thêm giao dịch
                  </button>
                )}
              </>
            )
        }
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
        <h3 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
          <Sparkles size={16} /> Cách kiếm sao
        </h3>
        <div className="space-y-2">
          {howToEarn.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Icon size={14} className="text-amber-600" /> {item.text}
                </span>
                <span className="font-bold text-amber-600 text-xs">{item.stars}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const { leaderboard, myRank, loading, changeLeaderboardPeriod } = useGamification();
  const [activePeriod, setActivePeriod] = useState("WEEKLY");

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
    changeLeaderboardPeriod(period);
  };

  const periodLabel = PERIOD_TABS.find(t => t.key === activePeriod);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex">
        {PERIOD_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handlePeriodChange(tab.key)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-200 rounded-lg ${
              activePeriod === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div>{tab.label}</div>
            <div className={`text-xs font-normal ${activePeriod === tab.key ? "text-indigo-200" : "opacity-60"}`}>{tab.sub}</div>
          </button>
        ))}
      </div>

      {activePeriod === "WEEKLY" && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4">
          <h3 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
            <Gift size={16} /> Phần thưởng Top 5 tuần này
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {WEEKLY_PRIZES.map((prize, idx) => (
              <div key={prize.rank} className={`text-center p-2 rounded-xl border bg-gradient-to-b ${prize.color} text-white`}>
                <div className="flex justify-center mb-1">
                  <Medal size={20} className={idx < 3 ? "text-white" : "text-white/80"} />
                </div>
                <div className="text-xs font-bold leading-tight">{prize.prize}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {myRank && (
        <div className="bg-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">Xếp hạng của bạn</div>
              <div className="text-4xl font-black mt-1">#{myRank.rank}</div>
              <div className="text-xs opacity-70 mt-1">Top {myRank.percentile}% người chơi</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl">
                <Star size={20} fill="currentColor" />
                <span className="font-bold">{myRank.stars?.toLocaleString("vi-VN")}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {activePeriod === "WEEKLY" ? "Tuần này" : activePeriod === "MONTHLY" ? "Tháng này" : "Tổng cộng"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="font-bold text-gray-800 mb-3">{periodLabel?.sub}</div>
        {loading ? (
          <LeaderboardSkeleton />
        ) : leaderboard?.top?.length > 0 ? (
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
            <Trophy size={48} className="mx-auto mb-3 opacity-30" />
            <div className="font-semibold">Chưa có dữ liệu</div>
            <div className="text-sm mt-1">Hãy tích cực tham gia để lên top!</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Sparkles size={16} /> Cách kiếm sao
        </h3>
        <div className="space-y-2 text-sm">
          {[
            { icon: CalendarDays, action: "Điểm danh hằng ngày", stars: "+50-100 sao" },
            { icon: ClipboardList, action: "Tạo khảo sát mới", stars: "+50 sao" },
            { icon: Target, action: "Tham gia khảo sát", stars: "+20-100 sao" },
            { icon: Globe, action: "Có người tham gia khảo sát của bạn", stars: "+10 sao/người" },
            { icon: Flame, action: "Điểm danh 7 ngày liên tiếp", stars: "x2 bonus!" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-gray-500" />
                  <span className="text-gray-700">{item.action}</span>
                </div>
                <span className="font-bold text-amber-600">{item.stars}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AchievementsTab() {
  const { achievements } = useGamification();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  const categories = achievements?.categories || {};
  const allAchievements = Object.values(categories).flat();
  const unlockedCount = allAchievements.filter(a => a.is_unlocked).length;
  const totalCount = allAchievements.length;

  let filtered = allAchievements;
  if (activeCategory !== "ALL") {
    filtered = categories[activeCategory] || [];
  }
  if (tierFilter !== "ALL") {
    filtered = filtered.filter(a => a.tier === tierFilter);
  }

  const tierRank = Object.fromEntries(TIER_ORDER.map((t, i) => [t, i]));
  filtered.sort((a, b) => {
    if (a.is_unlocked !== b.is_unlocked) return b.is_unlocked - a.is_unlocked;
    return (tierRank[a.tier] || 99) - (tierRank[b.tier] || 99);
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Tiến độ mở khóa</span>
          <span className="text-sm font-bold text-gray-800">{unlockedCount}/{totalCount} huy hiệu</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-bold text-gray-500 uppercase mb-3">Danh mục</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              activeCategory === "ALL"
                ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-200"
            }`}
          >
            Tất cả
          </button>
          {CATEGORY_ORDER.map(cat => {
            const CatIcon = CATEGORY_CONFIG[cat.key]?.icon;
            const label = CATEGORY_CONFIG[cat.key]?.label || cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                  activeCategory === cat.key
                    ? `${cat.color} border-current`
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-200"
                }`}
              >
                {CatIcon && <CatIcon size={12} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-bold text-gray-500 uppercase mb-3">Hạng</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTierFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              tierFilter === "ALL"
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            Tất cả
          </button>
          {TIER_ORDER.map((tier, idx) => {
            const TierIcon = TIER_ICON[idx] || Medal;
            return (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                  tierFilter === tier
                    ? `${TIER_COLORS[tier].badge} text-white border-transparent`
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                <TierIcon size={12} />
                {getRankLabel(tier)}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((ach) => (
            <AchievementCard key={ach.code} achievement={ach} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <Medal size={48} className="mx-auto mb-3 opacity-30" />
          <div className="font-semibold">Không có huy hiệu nào</div>
          <div className="text-sm mt-1">Thử chọn danh mục hoặc hạng khác</div>
        </div>
      )}
    </div>
  );
}

export default function GamificationHubPage() {
  const [activeTab, setActiveTab] = useState("wallet");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Phần thưởng</h1>
          <p className="text-white/80 text-sm">Sao, xếp hạng và huy hiệu của bạn</p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 flex">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2 flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {activeTab === "wallet" && <WalletTab />}
        {activeTab === "leaderboard" && <LeaderboardTab />}
        {activeTab === "achievements" && <AchievementsTab />}
      </div>
    </div>
  );
}
