// src/screens/home/GamificationHomeScreen.jsx
// Main gamification hub screen — accessed via bottom tab
import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Star, Trophy, Award, ChevronRight } from "lucide-react-native";
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

const RANK_ICONS = { BRONZE: "🥉", SILVER: "🥈", GOLD: "🥇", PLATINUM: "💎", DIAMOND: "💠" };
const RANK_NAMES = { BRONZE: "Đồng", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch Kim", DIAMOND: "Kim Cương" };

function NavCard({ icon, emoji, title, sub, value, valueColor, bgColor, borderColor, onPress }) {
  return (
    <TouchableOpacity style={[styles.navCard, { backgroundColor: bgColor, borderColor }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.navCardLeft}>
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
        <View style={styles.navCardText}>
          <Text style={styles.navCardTitle}>{title}</Text>
          <Text style={styles.navCardSub}>{sub}</Text>
        </View>
      </View>
      <View style={styles.navCardRight}>
        {value != null && (
          <Text style={[styles.navCardValue, { color: valueColor }]}>{value}</Text>
        )}
        <ChevronRight size={18} color={C.textDim} />
      </View>
    </TouchableOpacity>
  );
}

export default function GamificationHomeScreen() {
  const navigation = useNavigation();
  const { balance, achievements, myRank, loading } = useGamification();

  const stars = balance?.star_balance ?? 0;
  const streak = balance?.streak_count ?? 0;
  const rankName = balance?.rank_info?.name || "BRONZE";
  const rankIcon = RANK_ICONS[rankName] || "🥉";
  const rankLabel = RANK_NAMES[rankName] || "Đồng";

  const allAchievements = achievements
    ? Object.values(achievements.categories || {}).flat()
    : [];
  const unlockedCount = allAchievements.filter(a => a.is_unlocked).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>🎮 Phần thưởng</Text>
        <Text style={styles.screenSub}>Theo dõi thành tựu và xếp hạng của bạn</Text>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#fef3c7", borderColor: "#fcd34d" }]}>
            <Star size={22} color="#f59e0b" fill="#f59e0b" />
            <Text style={[styles.statValue, { color: "#92400e" }]}>{stars.toLocaleString("vi-VN")}</Text>
            <Text style={styles.statLabel}>Sao</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
            <Text style={{ fontSize: 22 }}>🔥</Text>
            <Text style={[styles.statValue, { color: "#991b1b" }]}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#e0e7ff", borderColor: "#c7d2fe" }]}>
            <Text style={{ fontSize: 22 }}>{rankIcon}</Text>
            <Text style={[styles.statValue, { color: "#4338ca" }]}>{rankLabel}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>

        {/* Navigation Cards */}
        <View style={styles.navSection}>
          <NavCard
            emoji="💰"
            title="Ví Sao"
            sub="Số dư & lịch sử giao dịch"
            value={stars.toLocaleString("vi-VN")}
            valueColor="#d97706"
            bgColor="#fffbeb"
            borderColor="#fde68a"
            onPress={() => navigation.navigate("StarWallet")}
          />
          <NavCard
            emoji="🏆"
            title="Bảng xếp hạng"
            sub="Đua top nhận thẻ điện thoại"
            value={myRank ? "#" + String(myRank.rank) : null}
            valueColor="#6366f1"
            bgColor="#eef2ff"
            borderColor="#c7d2fe"
            onPress={() => navigation.navigate("Leaderboard")}
          />
          <NavCard
            emoji="🏅"
            title="Huy hiệu & Thành tựu"
            sub={`${unlockedCount}/${allAchievements.length} đã mở khóa`}
            value={null}
            bgColor="#faf5ff"
            borderColor="#e9d5ff"
            onPress={() => navigation.navigate("Achievements")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: C.text,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 13,
    color: C.textSub,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: "600",
  },
  navSection: {
    gap: 10,
  },
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  navCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  navCardText: {
    flex: 1,
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: C.text,
  },
  navCardSub: {
    fontSize: 12,
    color: C.textSub,
    marginTop: 2,
  },
  navCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navCardValue: {
    fontSize: 16,
    fontWeight: "900",
  },
});
