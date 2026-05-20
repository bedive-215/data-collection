// src/providers/GamificationProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import starService from "../services/starService";
import checkinService from "../services/checkinService";
import achievementService from "../services/achievementService";
import leaderboardService from "../services/leaderboardService";
import { useAuth } from "./AuthProvider";

export const GamificationContext = createContext(null);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
};

export default function GamificationProvider({ children }) {
  const { user } = useAuth();

  // State
  const [balance, setBalance] = useState(null);
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [top5WithPrizes, setTop5WithPrizes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Load all gamification data
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [balanceRes, checkinRes, achievementsRes, leaderboardRes, rankRes, top5Res] =
        await Promise.allSettled([
          starService.getBalance(),
          checkinService.getStatus(),
          achievementService.getUserAchievements(),
          leaderboardService.getLeaderboard("WEEKLY", 10),
          leaderboardService.getUserRank("WEEKLY"),
          leaderboardService.getTop5WithPrizes(),
        ]);

      if (balanceRes.status === "fulfilled") setBalance(balanceRes.value.data);
      if (checkinRes.status === "fulfilled") setCheckinStatus(checkinRes.value.data?.data ?? checkinRes.value.data);
      if (achievementsRes.status === "fulfilled") setAchievements(achievementsRes.value.data);
      if (leaderboardRes.status === "fulfilled") setLeaderboard(leaderboardRes.value.data);
      if (rankRes.status === "fulfilled") setMyRank(rankRes.value.data);
      if (top5Res.status === "fulfilled") setTop5WithPrizes(top5Res.value.data);
    } catch (err) {
      console.error("Gamification load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Lightweight refresh of balance only
  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const res = await starService.getBalance();
      setBalance(res.data);
    } catch (err) {
      console.error("refreshBalance error:", err);
    }
  }, [user]);

  // Reload checkin status separately (lightweight)
  const refreshCheckinStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await checkinService.getStatus();
      setCheckinStatus(res.data?.data ?? res.data);
    } catch (err) {
      console.error("refreshCheckinStatus error:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  // Điểm danh
  const doCheckin = useCallback(async () => {
    if (!user) return;
    setCheckinLoading(true);
    try {
      const res = await checkinService.checkin();
      const data = res.data?.data ?? res.data ?? {};

      // Reload to get updated balance
      await loadAll();
      await refreshCheckinStatus();

      const stars = data?.stars_earned ?? 0;
      const streak = data?.streak_count ?? 0;
      const multiplier = data?.multiplier ?? 1;
      const streakEmoji = streak >= 7 ? "🔥🔥" : streak >= 4 ? "🔥" : "";

      Alert.alert(
        "Điểm danh thành công!",
        `${stars >= 100 ? "💠 " : stars >= 75 ? "⭐ " : "✨ "}+${stars} sao${multiplier > 1 ? ` (x${multiplier})` : ""}${streakEmoji ? ` — Streak ${streak} ngày ${streakEmoji}` : ""}`,
        [{ text: "OK" }]
      );

      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Điểm danh thất bại. Vui lòng thử lại.";
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setCheckinLoading(false);
    }
  }, [user, loadAll, refreshCheckinStatus]);

  // Change leaderboard period
  const changeLeaderboardPeriod = useCallback(async (period) => {
    if (!user) return;
    try {
      const [lbRes, rankRes] = await Promise.allSettled([
        leaderboardService.getLeaderboard(period, 10),
        leaderboardService.getUserRank(period),
      ]);

      if (lbRes.status === "fulfilled") setLeaderboard(lbRes.value.data);
      if (rankRes.status === "fulfilled") setMyRank(rankRes.value.data);
    } catch (err) {
      console.error("Change period error:", err);
    }
  }, [user]);

  const value = {
    // Data
    balance,
    checkinStatus,
    achievements,
    leaderboard,
    myRank,
    top5WithPrizes,
    loading,
    checkinLoading,

    // Actions
    loadAll,
    refreshBalance,
    refreshCheckinStatus,
    doCheckin,
    changeLeaderboardPeriod,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}
