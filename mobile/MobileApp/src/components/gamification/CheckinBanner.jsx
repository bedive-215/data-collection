// src/components/gamification/CheckinBanner.jsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { useGamification } from "../../providers/GamificationProvider";
import { COLORS } from "../../utils/constants";

const C = {
  primary: COLORS.primary || "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
};

function getStreakEmoji(streak) {
  if (streak >= 7) return "🔥🔥";
  if (streak >= 4) return "🔥";
  if (streak > 0) return "✨";
  return "";
}

function getStarsToEarn(streak) {
  if (streak >= 7) return 100;
  if (streak >= 4) return 75;
  return 50;
}

export function CheckinBanner({ compact = false }) {
  const { balance, checkinStatus, loading, checkinLoading, doCheckin } = useGamification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [result, setResult] = useState(null);

  const streak = balance?.streak_count ?? 0;
  const canCheckin = checkinStatus?.checked_in === false || checkinStatus?.can_checkin === true;
  const multiplier = checkinStatus?.current_multiplier ?? 1;
  const nextBonusTier = checkinStatus?.next_bonus_tier;
  const streakEmoji = getStreakEmoji(streak);
  const starsToEarn = getStarsToEarn(streak);

  const handleCheckin = async () => {
    try {
      const res = await doCheckin();
      setResult(res);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (_) {}
  };

  if (loading) {
    return (
      <View style={[styles.banner, styles.bannerLoading, { height: compact ? 72 : 90 }]}>
        <Animated.View style={[styles.loadingPulse, { opacity: 0.6 }]} />
      </View>
    );
  }

  // Already checked in today
  if (!canCheckin && !showSuccess) {
    return (
      <View style={[styles.banner, styles.bannerDone, compact && styles.bannerCompact]}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerEmoji}>✅</Text>
          <View>
            <Text style={styles.bannerTitleDone}>Đã điểm danh hôm nay!</Text>
            <Text style={styles.bannerSubDone}>
              Streak {streak} ngày {streakEmoji} · Hẹn gặp bạn ngày mai
            </Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeNum}>{streak}</Text>
          <Text style={styles.streakBadgeLabel}>ngày</Text>
        </View>
      </View>
    );
  }

  // Success state
  if (showSuccess && result) {
    return (
      <View style={[styles.banner, styles.bannerSuccess, compact && styles.bannerCompact]}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerEmoji}>🎉</Text>
          <View>
            <Text style={styles.bannerTitleSuccess}>Điểm danh thành công!</Text>
            <Text style={styles.bannerSubSuccess}>
              Streak {result.streak_count} ngày {getStreakEmoji(result.streak_count)}
            </Text>
          </View>
        </View>
        <View>
          <Text style={styles.successStars}>+{result.stars_earned}</Text>
          <Text style={styles.successStarsLabel}>sao ⭐</Text>
          {result.is_new_streak_record && (
            <Text style={styles.newRecord}>🏆 Kỷ lục mới!</Text>
          )}
        </View>
      </View>
    );
  }

  // Can check in
  return (
    <View style={[styles.banner, styles.bannerCanCheckin, compact && styles.bannerCompact]}>
      <View style={styles.bannerLeft}>
        <Text style={styles.bannerEmoji}>📅</Text>
        <View>
          <Text style={styles.bannerTitle}>Điểm danh hôm nay</Text>
          <Text style={styles.bannerSub}>
            {streak > 0
              ? `Streak ${streak} ngày → nhận +${starsToEarn} sao`
              : "Nhận ngay +50 sao khi điểm danh!"}
            {multiplier > 1 && (
              <Text style={styles.multiplierText}> x{multiplier}</Text>
            )}
          </Text>
          {nextBonusTier && (
            <Text style={styles.nextTier}>
              Còn {nextBonusTier.days_needed} ngày nữa để đạt x{nextBonusTier.next_multiplier}!
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={handleCheckin}
        disabled={checkinLoading}
        style={[styles.checkinBtn, checkinLoading && styles.checkinBtnDisabled]}
        activeOpacity={0.8}
      >
        {checkinLoading ? (
          <Text style={styles.checkinBtnTextLoading}>...</Text>
        ) : (
          <Text style={styles.checkinBtnText}>✊ +{starsToEarn}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  bannerLoading: {
    backgroundColor: "#fef3c7",
    height: 90,
    overflow: "hidden",
  },
  loadingPulse: {
    flex: 1,
    backgroundColor: "#fde68a",
    borderRadius: 8,
  },
  bannerCompact: {
    marginBottom: 0,
    borderRadius: 14,
    paddingVertical: 12,
  },

  // Done state
  bannerDone: {
    backgroundColor: "#dcfce7",
    borderWidth: 1.5,
    borderColor: "#86efac",
  },
  bannerTitleDone: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#065f46",
  },
  bannerSubDone: {
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
  },

  // Success state
  bannerSuccess: {
    backgroundColor: "#bbf7d0",
    borderWidth: 1.5,
    borderColor: "#34d399",
  },
  bannerTitleSuccess: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#065f46",
  },
  bannerSubSuccess: {
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
  },
  successStars: {
    fontSize: 28,
    fontWeight: "900",
    color: "#065f46",
    textAlign: "right",
    lineHeight: 32,
  },
  successStarsLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    textAlign: "right",
  },
  newRecord: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#dc2626",
    marginTop: 4,
    textAlign: "right",
  },

  // Can check in state
  bannerCanCheckin: {
    backgroundColor: "#fef3c7",
    borderWidth: 1.5,
    borderColor: "#fcd34d",
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#92400e",
  },
  bannerSub: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 2,
  },
  multiplierText: {
    fontWeight: "bold",
    color: "#dc2626",
  },
  nextTier: {
    fontSize: 11,
    color: "#d97706",
    fontWeight: "600",
    marginTop: 3,
  },

  // Shared
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  bannerEmoji: {
    fontSize: 32,
  },
  streakBadge: {
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  streakBadgeNum: {
    fontSize: 22,
    fontWeight: "900",
    color: "#065f46",
    lineHeight: 26,
  },
  streakBadgeLabel: {
    fontSize: 11,
    color: "#059669",
    fontWeight: "600",
  },
  checkinBtn: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  checkinBtnDisabled: {
    backgroundColor: "#d1d5db",
    elevation: 0,
    shadowOpacity: 0,
  },
  checkinBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
  },
  checkinBtnTextLoading: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default CheckinBanner;
