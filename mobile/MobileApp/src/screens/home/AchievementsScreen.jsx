// src/screens/home/AchievementsScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Star } from "lucide-react-native";
import achievementService from "../../services/achievementService";
import { COLORS } from "../../utils/constants";

const C = {
  primary: COLORS.primary || "#6366f1",
  success: COLORS.success || "#22c55e",
  surface: "#ffffff",
  bg: "#f5f7fb",
  textSub: "#64748b",
  textDim: "#94a3b8",
  border: "#e2e8f0",
};

const CATEGORY_ORDER = [
  { key: "STREAK", label: "🔥 Streak" },
  { key: "SURVEY_CREATION", label: "📝 Tạo KS" },
  { key: "PARTICIPATION", label: "🎯 Tham gia" },
  { key: "SOCIAL", label: "🌐 Cộng đồng" },
  { key: "SPECIAL", label: "⭐ Đặc biệt" },
  { key: "RANK", label: "🏅 Rank" },
];

const TIER_STYLES = {
  BRONZE: { bg: "#fef3c7", border: "#fcd34d", color: "#92400e" },
  SILVER: { bg: "#f3f4f6", border: "#d1d5db", color: "#374151" },
  GOLD: { bg: "#fefce8", border: "#fde047", color: "#a16207" },
  PLATINUM: { bg: "#f8fafc", border: "#94a3b8", color: "#475569" },
  DIAMOND: { bg: "#f0f9ff", border: "#7dd3fc", color: "#0369a1" },
};

const TierIcon = ({ tier }) => {
  const icons = { BRONZE: "🥉", SILVER: "🥈", GOLD: "🥇", PLATINUM: "💎", DIAMOND: "💠" };
  return <Text style={{ fontSize: 18 }}>{icons[tier] || "🏅"}</Text>;
};

const AchievementCard = ({ achievement }) => {
  if (!achievement) return null;
  const {
    icon, name, description, tier = "BRONZE",
    star_reward, is_unlocked = false,
    progress = 0, progress_percent = 0, condition_value,
  } = achievement;

  const style = TIER_STYLES[tier] || TIER_STYLES.BRONZE;

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      padding: 14, marginBottom: 10,
      backgroundColor: is_unlocked ? "#fff" : "#f8fafc",
      borderRadius: 14, borderWidth: 1,
      borderColor: is_unlocked ? style.border : C.border,
      opacity: is_unlocked ? 1 : 0.6,
    }}>
      {/* Icon */}
      <View style={{
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: style.bg,
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: style.border,
      }}>
        <Text style={{ fontSize: 22 }}>{icon || "🏅"}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontWeight: "bold", fontSize: 14, color: "#1e293b", flex: 1 }} numberOfLines={1}>
            {name}
          </Text>
          {is_unlocked && (
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: C.success, alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 10, color: "#fff" }}>✓</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 11, color: C.textSub, marginTop: 2 }} numberOfLines={1}>
          {description}
        </Text>

        {/* Progress */}
        {!is_unlocked && (
          <View style={{ marginTop: 8 }}>
            <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2, overflow: "hidden" }}>
              <View style={{
                width: `${Math.min(100, progress_percent)}%`,
                height: 4, backgroundColor: style.border, borderRadius: 2,
              }} />
            </View>
            <Text style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>
              {progress}/{condition_value}
            </Text>
          </View>
        )}
      </View>

      {/* Star reward */}
      <View style={{ alignItems: "center", marginLeft: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Star size={12} color="#f59e0b" fill="#f59e0b" />
          <Text style={{ fontWeight: "bold", fontSize: 13, color: "#d97706" }}>
            {star_reward}
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>sao</Text>
      </View>
    </View>
  );
};

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const loadData = async () => {
    try {
      const res = await achievementService.getUserAchievements();
      setAchievements(res.data);
    } catch (err) {
      console.error("Achievements error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const categories = achievements?.categories || {};
  const allAchievements = Object.values(categories).flat();
  const unlockedCount = allAchievements.filter(a => a.is_unlocked).length;
  const totalCount = allAchievements.length;

  let filtered = activeCategory === "ALL"
    ? allAchievements
    : (categories[activeCategory] || []);

  filtered.sort((a, b) => {
    if (a.is_unlocked !== b.is_unlocked) return b.is_unlocked ? 1 : -1;
    return 0;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ backgroundColor: "#7c3aed", paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
          🏅 Huy hiệu & Thành tựu
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>
          Mở khóa huy hiệu để nhận thêm sao!
        </Text>

        {/* Progress bar */}
        <View style={{ marginTop: 14, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Tiến độ mở khóa</Text>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
              {unlockedCount}/{totalCount}
            </Text>
          </View>
          <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3 }}>
            <View style={{
              height: 6,
              width: `${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%`,
              backgroundColor: "#fbbf24", borderRadius: 3,
            }} />
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "#fff", maxHeight: 36 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}
      >
        <TouchableOpacity
          onPress={() => setActiveCategory("ALL")}
          style={{
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, marginRight: 6,
            backgroundColor: activeCategory === "ALL" ? C.primary : "#f1f5f9",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: activeCategory === "ALL" ? "#fff" : C.textSub }}>
            Tất cả
          </Text>
        </TouchableOpacity>
        {CATEGORY_ORDER.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setActiveCategory(cat.key)}
            style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, marginRight: 6,
              backgroundColor: activeCategory === cat.key ? C.primary : "#f1f5f9",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: activeCategory === cat.key ? "#fff" : C.textSub }}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />
        }
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : filtered.length > 0 ? (
          filtered.map((ach) => (
            <AchievementCard key={ach.code} achievement={ach} />
          ))
        ) : (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>🏅</Text>
            <Text style={{ fontWeight: "bold", color: C.textSub, marginTop: 12 }}>Không có huy hiệu nào</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
