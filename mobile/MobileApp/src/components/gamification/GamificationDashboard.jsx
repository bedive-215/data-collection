// src/components/gamification/GamificationDashboard.jsx
// Dashboard component for mobile Home screen — shows quick gamification stats
import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Star, Trophy, ChevronRight, Award } from "lucide-react-native";
import { useGamification } from "../../providers/GamificationProvider";
import { COLORS } from "../../utils/constants";

const C = {
  primary: COLORS.primary || "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
  surface: "#ffffff",
  bg: "#f5f7fb",
  text: COLORS.text || "#1e293b",
  textSub: "#64748b",
  textDim: "#94a3b8",
  border: "#e2e8f0",
};

const RANK_ORDER = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
const RANK_COLORS = {
  BRONZE:  { bg: "#fef3c7", border: "#fcd34d", color: "#92400e" },
  SILVER:  { bg: "#f3f4f6", border: "#d1d5db", color: "#374151" },
  GOLD:    { bg: "#fefce8", border: "#fde047", color: "#a16207" },
  PLATINUM:{ bg: "#f8fafc", border: "#94a3b8", color: "#475569" },
  DIAMOND: { bg: "#f0f9ff", border: "#7dd3fc", color: "#0369a1" },
};
const RANK_ICONS = { BRONZE: "🥉", SILVER: "🥈", GOLD: "🥇", PLATINUM: "💎", DIAMOND: "💠" };
const RANK_NAMES = { BRONZE: "Đồng", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch Kim", DIAMOND: "Kim Cương" };

/* ── Avatar Item ────────────────────────────────────────────── */
function AvatarItem({ name, size = 36 }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.primary,
      alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#fff",
    }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}

/* ── Rank Badge ─────────────────────────────────────────────── */
function RankBadge({ rank }) {
  const configs = {
    1: { bg: "#fbbf24" }, 2: { bg: "#94a3b8" }, 3: { bg: "#f97316" },
    4: { bg: "#6366f1" }, 5: { bg: "#a855f7" },
  };
  const cfg = configs[rank] || { bg: "#e2e8f0" };
  return (
    <View style={{
      position: "absolute", top: -8, left: -8,
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: cfg.bg, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#fff",
    }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 10 }}>{rank}</Text>
    </View>
  );
}

/* ── Leaderboard mini list ───────────────────────────────────── */
function LeaderboardMini({ leaderboard, userId }) {
  if (!leaderboard?.top || leaderboard.top.length === 0) {
    return (
      <View style={styles.lbEmpty}>
        <Text style={styles.lbEmptyText}>Chưa có dữ liệu</Text>
      </View>
    );
  }

  return (
    <View>
      {leaderboard.top.slice(0, 5).map((item, index) => {
        const isMe = item.user_id === userId;
        return (
          <View key={item.user_id} style={[styles.lbItem, isMe && styles.lbItemMe]}>
            <RankBadge rank={index + 1} />
            <View style={{ marginLeft: 14 }}>
              <AvatarItem name={item.full_name} size={32} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.lbName, isMe && styles.lbNameMe]} numberOfLines={1}>
                {isMe ? "Bạn" : (item.full_name || "Người dùng")}
              </Text>
              {item.streak_count > 0 && (
                <Text style={styles.lbStreak}>🔥 {item.streak_count}</Text>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Star size={11} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.lbStars}>
                {item.stars ? item.stars.toLocaleString("vi-VN") : "0"}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ── Achievement Mini ────────────────────────────────────────── */
function AchievementsMini({ achievements }) {
  const allAchievements = achievements
    ? Object.values(achievements.categories || {}).flat()
    : [];
  const unlocked = allAchievements.filter(a => a.is_unlocked);
  const recent = unlocked.slice(0, 6);

  if (recent.length === 0) {
    return (
      <View style={styles.lbEmpty}>
        <Text style={styles.lbEmptyText}>Chưa có huy hiệu nào</Text>
      </View>
    );
  }

  return (
    <View style={styles.achGrid}>
      {recent.map(ach => {
        const tierStyle = {
          BRONZE: { bg: "#fef3c7", border: "#fcd34d" },
          SILVER: { bg: "#f3f4f6", border: "#d1d5db" },
          GOLD:   { bg: "#fefce8", border: "#fde047" },
          PLATINUM:{ bg: "#f8fafc", border: "#94a3b8" },
          DIAMOND: { bg: "#f0f9ff", border: "#7dd3fc" },
        }[ach.tier] || { bg: "#f1f5f9", border: "#e2e8f0" };

        return (
          <View key={ach.code} style={[styles.achBadge, { backgroundColor: tierStyle.bg, borderColor: tierStyle.border }]}>
            <Text style={{ fontSize: 18 }}>{ach.icon || "🏅"}</Text>
          </View>
        );
      })}
      <Text style={styles.achCount}>
        {unlocked.length}/{allAchievements.length} đã mở
      </Text>
    </View>
  );
}

/* ── Main Dashboard Component ───────────────────────────────── */
export function GamificationDashboard({ compact = false }) {
  const navigation = useNavigation();
  const {
    balance,
    achievements,
    leaderboard,
    myRank,
    loading,
    user,
  } = useGamification();

  const stars = balance?.star_balance ?? 0;
  const streak = balance?.streak_count ?? 0;
  const rankInfo = balance?.rank_info;
  const rankName = rankInfo?.name || "BRONZE";
  const rankIcon = RANK_ICONS[rankName] || "🥉";
  const rankLabel = RANK_NAMES[rankName] || "Đồng";
  const rankCfg = RANK_COLORS[rankName] || RANK_COLORS.BRONZE;
  const userId = user?.user_id;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Star balance */}
        <View style={[styles.compactCard, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }]}>
          <Text style={styles.compactEmoji}>⭐</Text>
          <Text style={[styles.compactValue, { color: "#92400e" }]}>
            {stars.toLocaleString("vi-VN")}
          </Text>
          <Text style={[styles.compactLabel, { color: "#d97706" }]}>Sao</Text>
        </View>

        {/* Rank */}
        <View style={[styles.compactCard, { backgroundColor: "#e0e7ff", borderColor: "#c7d2fe" }]}>
          <Text style={styles.compactEmoji}>{rankIcon}</Text>
          <Text style={[styles.compactValue, { color: "#4338ca" }]}>{rankLabel}</Text>
          <Text style={[styles.compactLabel, { color: "#6366f1" }]}>Rank</Text>
        </View>

        {/* Streak */}
        <View style={[styles.compactCard, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
          <Text style={styles.compactEmoji}>🔥</Text>
          <Text style={[styles.compactValue, { color: "#991b1b" }]}>{streak}</Text>
          <Text style={[styles.compactLabel, { color: "#dc2626" }]}>Streak</Text>
        </View>
      </View>
    );
  }

  // Full dashboard
  return (
    <View style={styles.container}>
      {/* Section title */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>🎮 Phần thưởng & Xếp hạng</Text>
        <View style={styles.navBtns}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }]}
            onPress={() => navigation.navigate("StarWallet")}
          >
            <Text style={styles.navBtnText}>💰 Ví</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: "#e0e7ff", borderColor: "#c7d2fe" }]}
            onPress={() => navigation.navigate("Leaderboard")}
          >
            <Text style={[styles.navBtnText, { color: "#4338ca" }]}>🏆 Xếp hạng</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top stats */}
      <View style={styles.topStatsRow}>
        {/* Star Balance Card */}
        <View style={[styles.topStatCard, { backgroundColor: "#fffbeb", borderColor: "#fde68a" }]}>
          <View style={styles.topStatHeader}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.topStatHeaderLabel}>Ví Sao</Text>
            {rankInfo && (
              <View style={[styles.rankBadgePill, { backgroundColor: rankCfg.bg, borderColor: rankCfg.border }]}>
                <Text style={[styles.rankBadgePillText, { color: rankCfg.color }]}>
                  {rankIcon} {rankLabel}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.topStatAmount}>{stars.toLocaleString("vi-VN")}</Text>
          <Text style={styles.topStatSub}>sao hiện có</Text>

          {balance?.total_stars_earned > 0 && (
            <Text style={styles.topStatExtra}>
              Tổng: {balance.total_stars_earned.toLocaleString("vi-VN")} ⭐
            </Text>
          )}
        </View>

        {/* Streak Card */}
        <View style={[styles.topStatCard, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
          <View style={styles.topStatHeader}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={styles.topStatHeaderLabel}>Streak</Text>
          </View>
          <Text style={styles.topStatAmount}>{streak}</Text>
          <Text style={styles.topStatSub}>ngày liên tiếp</Text>
          {balance?.highest_streak > 0 && (
            <Text style={styles.topStatExtra}>
              Kỷ lục: {balance.highest_streak} 🔥
            </Text>
          )}
        </View>
      </View>

      {/* Leaderboard Preview */}
      <View style={styles.previewCard}>
        <View style={styles.previewCardHeader}>
          <View style={styles.previewCardTitle}>
            <Trophy size={14} color="#f59e0b" />
            <Text style={styles.previewCardTitleText}>Bảng xếp hạng</Text>
          </View>
          {myRank && (
            <Text style={styles.myRankLabel}>
              Bạn: <Text style={styles.myRankValue}>#{myRank.rank}</Text>
            </Text>
          )}
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <LeaderboardMini leaderboard={leaderboard} userId={userId} />
        )}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate("Leaderboard")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Xem bảng xếp hạng đầy đủ</Text>
          <ChevronRight size={14} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Achievements Preview */}
      <View style={styles.previewCard}>
        <View style={styles.previewCardHeader}>
          <View style={styles.previewCardTitle}>
            <Award size={14} color="#a855f7" />
            <Text style={styles.previewCardTitleText}>Huy hiệu & Thành tựu</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllLink}
            onPress={() => navigation.navigate("Achievements")}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllLinkText}>Xem tất cả</Text>
            <ChevronRight size={12} color={C.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <AchievementsMini achievements={achievements} />
        )}
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  // Compact
  compactContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  compactCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  compactEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  compactLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },

  // Full
  container: {
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: C.text,
  },
  navBtns: {
    flexDirection: "row",
    gap: 6,
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
  },

  // Top stats
  topStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  topStatCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  topStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  topStatHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  rankBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  rankBadgePillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  topStatAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: C.text,
    lineHeight: 32,
  },
  topStatSub: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
  },
  topStatExtra: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 6,
    fontWeight: "600",
  },

  // Preview cards
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    padding: 14,
  },
  previewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  previewCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewCardTitleText: {
    fontSize: 13,
    fontWeight: "bold",
    color: C.text,
  },
  myRankLabel: {
    fontSize: 12,
    color: C.textSub,
  },
  myRankValue: {
    fontWeight: "bold",
    color: "#6366f1",
  },
  viewAllLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.primary,
  },

  // Leaderboard mini
  lbEmpty: {
    alignItems: "center",
    paddingVertical: 12,
  },
  lbEmptyText: {
    fontSize: 12,
    color: C.textDim,
  },
  lbItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    position: "relative",
  },
  lbItemMe: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  lbName: {
    fontSize: 13,
    fontWeight: "600",
    color: C.text,
  },
  lbNameMe: {
    color: "#4338ca",
  },
  lbStreak: {
    fontSize: 10,
    color: C.warning,
    marginTop: 2,
  },
  lbStars: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#d97706",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.primary,
  },

  // Achievements mini
  achGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  achBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  achCount: {
    width: "100%",
    fontSize: 11,
    color: C.textDim,
    textAlign: "center",
    marginTop: 4,
  },
});

export default GamificationDashboard;
