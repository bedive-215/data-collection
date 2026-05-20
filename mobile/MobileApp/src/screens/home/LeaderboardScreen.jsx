// src/screens/home/LeaderboardScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Star } from "lucide-react-native";
import leaderboardService from "../../services/leaderboardService";
import { useAuth } from "../../providers/AuthProvider";
import { COLORS } from "../../utils/constants";

const C = {
  primary: COLORS.primary || "#6366f1",
  success: COLORS.success || "#22c55e",
  warning: COLORS.warning || "#f59e0b",
  surface: "#ffffff",
  bg: "#f5f7fb",
  textSub: "#64748b",
  textDim: "#94a3b8",
  border: "#e2e8f0",
};

const PERIODS = [
  { key: "WEEKLY", label: "📅 Tuần" },
  { key: "MONTHLY", label: "🗓️ Tháng" },
  { key: "ALL_TIME", label: "🏆 All-time" },
];

const PRIZES = [
  { rank: 1, label: "Thẻ 500.000đ", color: "#fbbf24" },
  { rank: 2, label: "Thẻ 300.000đ", color: "#94a3b8" },
  { rank: 3, label: "Thẻ 150.000đ", color: "#f97316" },
  { rank: 4, label: "Thẻ 70.000đ", color: "#6366f1" },
  { rank: 5, label: "Thẻ 30.000đ", color: "#a855f7" },
];

const RankBadge = ({ rank }) => {
  const configs = {
    1: { bg: "#fbbf24" },
    2: { bg: "#94a3b8" },
    3: { bg: "#f97316" },
    4: { bg: "#6366f1" },
    5: { bg: "#a855f7" },
  };
  const cfg = configs[rank] || { bg: "#e2e8f0" };

  return (
    <View style={{
      position: "absolute", top: -8, left: -8,
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: cfg.bg, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#fff",
    }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 11 }}>{rank}</Text>
    </View>
  );
};

const AvatarItem = ({ name, avatar, size = 40 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: "#fff",
    }}>
      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
};

const LeaderboardItem = ({ user, rank, isCurrentUser, showPrize }) => {
  if (!user) return null;
  const { full_name, stars, streak_count, weekly_prize } = user;

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      padding: 12, marginBottom: 8,
      backgroundColor: isCurrentUser ? "#eef2ff" : "#fff",
      borderRadius: 16, borderWidth: 1,
      borderColor: isCurrentUser ? "#c7d2fe" : C.border,
      position: "relative",
    }}>
      <RankBadge rank={rank} />
      <View style={{ marginLeft: 16 }}>
        <AvatarItem name={full_name} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontWeight: "600", fontSize: 14, color: "#1e293b" }} numberOfLines={1}>
          {full_name || "Người dùng"}
        </Text>
        {streak_count > 0 && (
          <Text style={{ fontSize: 11, color: C.warning, marginTop: 2 }}>
            🔥 {streak_count} ngày
          </Text>
        )}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Star size={13} color="#f59e0b" fill="#f59e0b" />
          <Text style={{ fontWeight: "bold", fontSize: 14, color: "#d97706" }}>
            {stars ? stars.toLocaleString("vi-VN") : "0"}
          </Text>
        </View>
        {showPrize && weekly_prize && (
          <Text style={{ fontSize: 10, color: C.success, marginTop: 2 }}>
            🎁 {weekly_prize.prize}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("WEEKLY");

  const loadData = async (p) => {
    try {
      const [lbRes, rankRes] = await Promise.allSettled([
        leaderboardService.getLeaderboard(p || period, 10),
        leaderboardService.getUserRank(p || period),
      ]);
      if (lbRes.status === "fulfilled") setLeaderboard(lbRes.value.data);
      if (rankRes.status === "fulfilled") setMyRank(rankRes.value.data);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(period);
  };

  const onPeriodChange = (p) => {
    setPeriod(p);
    setLoading(true);
    loadData(p);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: C.primary, paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>🏆 Bảng xếp hạng</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>
          Đua top nhận thẻ điện thoại - hoàn toàn miễn phí!
        </Text>
      </View>

      {/* Period Tabs */}
      <View style={{ flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border }}>
        {PERIODS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onPeriodChange(tab.key)}
            style={{
              flex: 1, paddingVertical: 12, alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: period === tab.key ? C.primary : "transparent",
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: period === tab.key ? "bold" : "600",
              color: period === tab.key ? C.primary : C.textSub,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Rank */}
      {myRank && (
        <View style={{
          marginHorizontal: 16, marginTop: 16,
          backgroundColor: C.primary, borderRadius: 16, padding: 16,
          flexDirection: "row", alignItems: "center",
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Xếp hạng của bạn</Text>
            <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold", marginTop: 2 }}>
              #{myRank.rank}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
              Top {myRank.percentile}% người chơi
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Star size={18} color="#fbbf24" fill="#fbbf24" />
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
                {myRank.stars ? myRank.stars.toLocaleString("vi-VN") : "0"}
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
              {period === "WEEKLY" ? "Tuần này" : period === "MONTHLY" ? "Tháng này" : "Tổng cộng"}
            </Text>
          </View>
        </View>
      )}

      {/* Weekly Prizes */}
      {period === "WEEKLY" && (
        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#92400e", marginBottom: 8 }}>
            🎁 Phần thưởng Top 5 tuần này
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PRIZES.map((prize) => (
              <View key={prize.rank} style={{
                width: 80, marginRight: 8,
                backgroundColor: prize.color, borderRadius: 12,
                padding: 10, alignItems: "center",
              }}>
                <Text style={{ fontSize: 20 }}>
                  {prize.rank === 1 ? "🥇" : prize.rank === 2 ? "🥈" : prize.rank === 3 ? "🥉" : `${prize.rank}️⃣`}
                </Text>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold", marginTop: 4, textAlign: "center" }}>
                  {prize.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* List */}
      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
        }
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : leaderboard && leaderboard.top && leaderboard.top.length > 0 ? (
          leaderboard.top.map((item, index) => (
            <LeaderboardItem
              key={item.user_id}
              user={item}
              rank={index + 1}
              isCurrentUser={item.user_id === user?.id}
              showPrize={period === "WEEKLY"}
            />
          ))
        ) : (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>🏆</Text>
            <Text style={{ fontWeight: "bold", color: C.textSub, marginTop: 12 }}>Chưa có dữ liệu</Text>
            <Text style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>Hãy tích cực tham gia để lên top!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
