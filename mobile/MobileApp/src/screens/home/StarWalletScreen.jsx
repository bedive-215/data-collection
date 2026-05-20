// src/screens/home/StarWalletScreen.jsx
// Full Star Wallet screen for mobile — matching web StarWalletPage
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Star, Trophy, ChevronLeft, TrendingUp } from "lucide-react-native";
import { useGamification } from "../../providers/GamificationProvider";
import starService from "../../services/starService";
import leaderboardService from "../../services/leaderboardService";
import { COLORS } from "../../utils/constants";

const C = {
  primary: COLORS.primary || "#6366f1",
  success: COLORS.success || "#22c55e",
  surface: "#ffffff",
  bg: "#f5f7fb",
  text: COLORS.text || "#1e293b",
  textSub: "#64748b",
  textDim: "#94a3b8",
  border: "#e2e8f0",
  warning: "#f59e0b",
};

const TYPE_CONFIG = {
  DAILY_CHECKIN:          { icon: "📅", label: "Điểm danh",        bg: "#dcfce7" },
  STREAK_BONUS:           { icon: "🔥", label: "Streak Bonus",     bg: "#fee2e2" },
  CREATE_SURVEY:          { icon: "📝", label: "Tạo khảo sát",     bg: "#e0e7ff" },
  FIRST_RESPONDER:        { icon: "🥇", label: "Người đầu tiên",    bg: "#fef9c3" },
  SECOND_RESPONDER:       { icon: "🥈", label: "Người thứ 2",       bg: "#f1f5f9" },
  THIRD_RESPONDER:        { icon: "🥉", label: "Người thứ 3",       bg: "#fef3c7" },
  LATER_RESPONDER:        { icon: "🎯", label: "Tham gia KS",        bg: "#dbeafe" },
  RESPOND_SURVEY:         { icon: "🎯", label: "Tham gia KS",        bg: "#dbeafe" },
  SURVEY_CREATOR_BONUS:   { icon: "👥", label: "Có người tham gia", bg: "#f3e8ff" },
  ACHIEVEMENT_REWARD:     { icon: "🏅", label: "Huy hiệu",          bg: "#fef3c7" },
  RANK_UP_BONUS:          { icon: "⬆️", label: "Thăng rank",         bg: "#d1fae5" },
  PENALTY:                { icon: "⚠️", label: "Thu hồi",             bg: "#fee2e2" },
  ADMIN_ADJUST:           { icon: "🔧", label: "Admin điều chỉnh",   bg: "#f1f5f9" },
  BONUS:                  { icon: "✨", label: "Bonus",               bg: "#f5f3ff" },
};

const getTypeInfo = (type) => TYPE_CONFIG[type] || { icon: "⭐", label: type || "Khác", bg: "#f1f5f9" };

const FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "DAILY_CHECKIN", label: "📅 Điểm danh" },
  { value: "CREATE_SURVEY", label: "📝 Tạo KS" },
  { value: "FIRST_RESPONDER", label: "🥇 Người đầu" },
  { value: "RESPOND_SURVEY", label: "🎯 Tham gia" },
  { value: "ACHIEVEMENT_REWARD", label: "🏅 Huy hiệu" },
  { value: "STREAK_BONUS", label: "🔥 Streak" },
  { value: "PENALTY", label: "⚠️ Thu hồi" },
];

const HOW_TO_EARN = [
  { icon: "📅", text: "Điểm danh hằng ngày", stars: "+50-100 sao" },
  { icon: "📝", text: "Tạo khảo sát mới", stars: "+50 sao" },
  { icon: "🥇", text: "Người đầu tiên hoàn thành KS", stars: "+100 sao" },
  { icon: "🎯", text: "Tham gia khảo sát", stars: "+20-50 sao" },
  { icon: "👥", text: "Có người tham gia KS của bạn", stars: "+10 sao/người" },
  { icon: "🔥", text: "Streak 7 ngày", stars: "x2 bonus!" },
];

/* ── Transaction Item ─────────────────────────────────────── */
function TransactionItem({ tx }) {
  const { amount, type, description, balance_after, created_at } = tx;
  const typeInfo = getTypeInfo(type);
  const isPositive = amount > 0;
  const parsed = created_at ? new Date(created_at) : null;
  const isValidDate = parsed && !isNaN(parsed.getTime());
  const time = isValidDate
    ? `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`
    : "--:--";

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: typeInfo.bg }]}>
        <Text style={{ fontSize: 18 }}>{typeInfo.icon}</Text>
      </View>
      <View style={styles.txInfo}>
        <View style={styles.txTopRow}>
          <Text style={[styles.txAmount, { color: isPositive ? "#16a34a" : "#dc2626" }]}>
            {isPositive ? "+" : ""}{amount.toLocaleString("vi-VN")} ⭐
          </Text>
          <Text style={styles.txTime}>{time}</Text>
        </View>
        <Text style={[styles.txTypeLabel, { color: typeInfo.bg === "#fee2e2" ? "#dc2626" : C.textSub }]}>
          {typeInfo.label}
        </Text>
        {description ? (
          <Text style={styles.txDesc} numberOfLines={2}>{description}</Text>
        ) : null}
      </View>
      <View style={styles.txAfter}>
        <Text style={styles.txAfterLabel}>Sau</Text>
        <Text style={styles.txAfterValue}>{(balance_after || 0).toLocaleString("vi-VN")}</Text>
      </View>
    </View>
  );
}

/* ── Rank Progress Bar ─────────────────────────────────────── */
const RANK_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
const RANK_COLORS = {
  BRONZE: { bar: "#f59e0b", text: "#92400e" },
  SILVER: { bar: "#9ca3af", text: "#374151" },
  GOLD:   { bar: "#fbbf24", text: "#92400e" },
  PLATINUM:{ bar: "#94a3b8", text: "#475569" },
  DIAMOND: { bar: "#38bdf8", text: "#0369a1" },
};
const RANK_ICONS = { BRONZE: "🥉", SILVER: "🥈", GOLD: "🥇", PLATINUM: "💎", DIAMOND: "💠" };
const RANK_NAMES = { BRONZE: "Đồng", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch Kim", DIAMOND: "Kim Cương" };

function RankProgressBar({ currentRank, progress, starsNeeded }) {
  const cfg = RANK_COLORS[currentRank?.name] || RANK_COLORS.BRONZE;
  const icon = RANK_ICONS[currentRank?.name] || "🥉";
  const name = RANK_NAMES[currentRank?.name] || "Đồng";
  const nextIdx = RANK_ORDER.indexOf(currentRank?.name) + 1;
  const nextName = nextIdx < RANK_ORDER.length ? RANK_NAMES[RANK_ORDER[nextIdx]] : null;
  const nextIcon = nextIdx < RANK_ORDER.length ? RANK_ICONS[RANK_ORDER[nextIdx]] : null;

  return (
    <View style={styles.rankProgress}>
      <View style={styles.rankLabels}>
        <Text style={[styles.rankCurrent, { color: cfg.text }]}>{icon} {name}</Text>
        {nextName && (
          <Text style={styles.rankNext}>{nextIcon} {nextName}</Text>
        )}
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%`, backgroundColor: cfg.bar }]} />
      </View>
      {nextName && (
        <Text style={styles.rankHint}>Cần thêm {starsNeeded?.toLocaleString("vi-VN")} sao để lên {nextName}</Text>
      )}
    </View>
  );
}

/* ── Comparison Card ───────────────────────────────────────── */
function ComparisonCard({ period, data }) {
  if (!data) return null;
  return (
    <View style={styles.compCard}>
      <Text style={styles.compPeriod}>{period}</Text>
      <Text style={styles.compRank}>#{data.rank}</Text>
      <Text style={styles.compPct}>Top {data.percentile}%</Text>
      <Text style={styles.compStars}>{(data.stars || 0).toLocaleString("vi-VN")} sao</Text>
    </View>
  );
}

/* ── Main Screen ────────────────────────────────────────────── */
export default function StarWalletScreen() {
  const navigation = useNavigation();
  const { balance, loading: gLoading } = useGamification();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [comparison, setComparison] = useState(null);
  const [compLoading, setCompLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async (page, reset = false) => {
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
      if (reset) setRefreshing(false);
    }
  }, [filterType]);

  useEffect(() => { loadHistory(1, true); }, [filterType, loadHistory]);

  useEffect(() => {
    leaderboardService.getComparison()
      .then(res => setComparison(res.data))
      .catch(err => console.error("Comparison error:", err))
      .finally(() => setCompLoading(false));
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory(1, true);
    leaderboardService.getComparison()
      .then(res => setComparison(res.data))
      .catch(() => {});
  };

  const earnedTotal = history.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spentTotal  = history.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const starBalance = balance?.star_balance ?? 0;
  const rankInfo = balance?.rank_info;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>💰 Ví Sao</Text>
          <Text style={styles.headerSub}>Quản lý sao của bạn</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
        }
      >
        {/* ── Balance Hero ── */}
        <View style={styles.balanceHero}>
          <View style={styles.balanceRow}>
            <Star size={20} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {starBalance.toLocaleString("vi-VN")}
          </Text>
          <Text style={styles.balanceUnit}>sao</Text>
          {rankInfo && (
            <Text style={styles.rankBadge}>{rankInfo.icon || "🥉"} {RANK_NAMES[rankInfo.name] || "Đồng"}</Text>
          )}
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsGrid}>
          <View style={styles.streakCard}>
            <Text style={{ fontSize: 24 }}>🔥</Text>
            <Text style={styles.streakValue}>{balance?.active_streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Streak ngày</Text>
          </View>
          <View style={styles.streakCard}>
            <Text style={{ fontSize: 24 }}>🏆</Text>
            <Text style={styles.streakValue}>{balance?.highest_streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Kỷ lục streak</Text>
          </View>
        </View>

        {/* ── Star Stats ── */}
        <View style={styles.starStatsRow}>
          <View style={[styles.starStat, { backgroundColor: "#dbeafe" }]}>
            <Text style={styles.starStatEmoji}>📅</Text>
            <Text style={[styles.starStatValue, { color: "#2563eb" }]}>
              {balance?.weekly_stars ?? 0}
            </Text>
            <Text style={styles.starStatLabel}>Tuần này</Text>
          </View>
          <View style={[styles.starStat, { backgroundColor: "#e0e7ff" }]}>
            <Text style={styles.starStatEmoji}>🗓️</Text>
            <Text style={[styles.starStatValue, { color: "#4f46e5" }]}>
              {balance?.monthly_stars ?? 0}
            </Text>
            <Text style={styles.starStatLabel}>Tháng này</Text>
          </View>
          <View style={[styles.starStat, { backgroundColor: "#fef3c7" }]}>
            <Text style={styles.starStatEmoji}>⭐</Text>
            <Text style={[styles.starStatValue, { color: "#d97706" }]}>
              {balance?.total_stars_earned ?? 0}
            </Text>
            <Text style={styles.starStatLabel}>Tổng cộng</Text>
          </View>
        </View>

        {/* ── Rank Progress ── */}
        {rankInfo && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Trophy size={16} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Tiến độ rank</Text>
            </View>
            <RankProgressBar
              currentRank={rankInfo}
              progress={rankInfo.progress_to_next || 0}
              starsNeeded={rankInfo.stars_needed}
            />
          </View>
        )}

        {/* ── Leaderboard Comparison ── */}
        {!compLoading && comparison && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={16} color="#6366f1" />
              <Text style={styles.sectionTitle}>So sánh xếp hạng</Text>
            </View>
            <View style={styles.compRow}>
              <ComparisonCard period="📅 Tuần" data={comparison.weekly} />
              <ComparisonCard period="🗓️ Tháng" data={comparison.monthly} />
              <ComparisonCard period="🏆 All-time" data={comparison.all_time} />
            </View>
          </View>
        )}

        {/* ── Transaction History ── */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>📜 Lịch sử giao dịch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {FILTER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setFilterType(opt.value)}
                    style={[
                      styles.filterChip,
                      filterType === opt.value && styles.filterChipActive,
                    ]}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filterType === opt.value && styles.filterChipTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryChip, { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}>
              <TrendingUp size={12} color="#16a34a" />
              <Text style={styles.summaryText}>+{earnedTotal.toLocaleString("vi-VN")} sao</Text>
            </View>
            {spentTotal > 0 && (
              <View style={[styles.summaryChip, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
                <Text style={[styles.summaryText, { color: "#dc2626" }]}>-{spentTotal.toLocaleString("vi-VN")} sao</Text>
              </View>
            )}
          </View>
        </View>

        {/* Transaction list */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          {historyLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={C.primary} />
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Star size={36} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Chưa có giao dịch nào</Text>
              <Text style={styles.emptySub}>Hãy bắt đầu điểm danh để nhận sao!</Text>
            </View>
          ) : (
            <>
              {history.map(tx => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => loadHistory(historyPage + 1)}
                >
                  <Text style={styles.loadMoreText}>Xem thêm giao dịch</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: "#fef3c7", borderColor: "#fde68a" }]}
            onPress={() => navigation.navigate("Achievements")}
          >
            <Text style={{ fontSize: 20 }}>🏅</Text>
            <View>
              <Text style={[styles.quickActionTitle, { color: "#92400e" }]}>Huy hiệu</Text>
              <Text style={[styles.quickActionSub, { color: "#d97706" }]}>Xem thành tựu</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: "#e0e7ff", borderColor: "#c7d2fe" }]}
            onPress={() => navigation.navigate("Leaderboard")}
          >
            <Text style={{ fontSize: 20 }}>🏆</Text>
            <View>
              <Text style={[styles.quickActionTitle, { color: "#4338ca" }]}>Bảng xếp hạng</Text>
              <Text style={[styles.quickActionSub, { color: "#6366f1" }]}>Xem top</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── How to earn ── */}
        <View style={styles.howToCard}>
          <Text style={styles.howToTitle}>⚡ Cách kiếm sao</Text>
          {HOW_TO_EARN.map((item, i) => (
            <View key={i} style={styles.howToRow}>
              <Text style={styles.howToText}>{item.icon} {item.text}</Text>
              <Text style={styles.howToStars}>{item.stars}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: C.primary,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  // Balance Hero
  balanceHero: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: C.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 60,
  },
  balanceUnit: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginTop: -4,
  },
  rankBadge: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  // Quick Stats
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: -20,
    marginBottom: 12,
  },
  streakCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    marginTop: 4,
  },
  streakLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: "600",
    marginTop: 2,
  },

  // Star Stats
  starStatsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  starStat: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
  },
  starStatEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  starStatValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  starStatLabel: {
    fontSize: 10,
    color: C.textSub,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },

  // Section card
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e8ecf0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: C.text,
  },

  // Rank Progress
  rankProgress: {
    marginTop: 2,
  },
  rankLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rankCurrent: {
    fontSize: 14,
    fontWeight: "bold",
  },
  rankNext: {
    fontSize: 14,
    color: C.textSub,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  rankHint: {
    fontSize: 11,
    color: C.textDim,
    textAlign: "right",
    marginTop: 4,
  },

  // Comparison
  compRow: {
    flexDirection: "row",
    gap: 8,
  },
  compCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
  },
  compPeriod: {
    fontSize: 11,
    color: C.textSub,
    marginBottom: 4,
  },
  compRank: {
    fontSize: 20,
    fontWeight: "900",
    color: "#6366f1",
  },
  compPct: {
    fontSize: 10,
    color: C.textDim,
    marginTop: 2,
  },
  compStars: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textSub,
    marginTop: 4,
  },

  // History
  historyHeader: {
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textSub,
  },
  filterChipTextActive: {
    color: "#fff",
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16a34a",
  },

  // Transaction item
  txItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8ecf0",
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  txInfo: {
    flex: 1,
  },
  txTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  txTime: {
    fontSize: 11,
    color: C.textDim,
  },
  txTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  txDesc: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 2,
  },
  txAfter: {
    alignItems: "flex-end",
    marginLeft: 8,
    flexShrink: 0,
  },
  txAfterLabel: {
    fontSize: 10,
    color: C.textDim,
  },
  txAfterValue: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginTop: 2,
  },

  // Empty
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: C.textSub,
  },
  emptySub: {
    fontSize: 12,
    color: C.textDim,
    textAlign: "center",
  },

  // Load more
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  quickActionSub: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // How to earn
  howToCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  howToTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 12,
  },
  howToRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
  },
  howToText: {
    fontSize: 13,
    color: "#1e293b",
  },
  howToStars: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#d97706",
  },
});
