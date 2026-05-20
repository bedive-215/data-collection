// src/contexts/GamificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import starService from "@/services/starService";
import checkinService from "@/services/checkinService";
import achievementService from "@/services/achievementService";
import leaderboardService from "@/services/leaderboardService";
import { useAuth } from "@/hooks/useAuth";

const GAMIFICATION_REFRESH_EVENT = "gamification:refresh";

export const emitGamificationRefresh = () => {
  window.dispatchEvent(new CustomEvent(GAMIFICATION_REFRESH_EVENT));
};

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
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
      if (checkinRes.status === "fulfilled") setCheckinStatus(checkinRes.value.data.data);
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

  // Chỉ refresh balance (nhẹ, không reload toàn bộ leaderboard/achievements)
  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const res = await starService.getBalance();
      setBalance(res.data);
    } catch (err) {
      console.error("refreshBalance error:", err);
    }
  }, [user]);

  // Lắng nghe event refresh từ các action khác (tạo survey, submit survey)
  useEffect(() => {
    const handler = () => refreshBalance();
    window.addEventListener(GAMIFICATION_REFRESH_EVENT, handler);
    return () => window.removeEventListener(GAMIFICATION_REFRESH_EVENT, handler);
  }, [refreshBalance]);

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

      // Show reward toast
      const stars = data?.stars_earned ?? 0;
      const streak = data?.streak_count ?? 0;
      const multiplier = data?.multiplier ?? 1;
      const emoji = stars >= 100 ? "💠" : stars >= 75 ? "⭐" : "✨";
      const streakEmoji = streak >= 7 ? "🔥🔥" : streak >= 4 ? "🔥" : "";

      toast.success(
        `${emoji} Điểm danh thành công! Bạn nhận được +${stars} sao${multiplier > 1 ? ` (x${multiplier})` : ""}${streakEmoji ? ` — Streak ${streak} ngày ${streakEmoji}` : ""}`,
        { position: "bottom-right", autoClose: 5000, theme: "light" }
      );

      return data;
    } catch (err) {
      toast.error("Điểm danh thất bại. Vui lòng thử lại.");
      throw err;
    } finally {
      setCheckinLoading(false);
    }
  }, [user, loadAll]);

  // Đổi period leaderboard
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
    doCheckin,
    changeLeaderboardPeriod,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}
