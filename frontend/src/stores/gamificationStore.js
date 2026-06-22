import { create } from "zustand";
import starService from "@/services/starService";
import checkinService from "@/services/checkinService";
import achievementService from "@/services/achievementService";
import leaderboardService from "@/services/leaderboardService";

const initialState = {
  balance: 0,
  transactions: [],
  rankInfo: null,
  achievements: [],
  recentAchievements: [],
  leaderboard: [],
  top5: [],
  myRank: null,
  userComparison: null,
  checkinStatus: null,
  checkinStreak: 0,
  checkinHistory: [],
  loading: false,
  error: null,
};

export const useGamificationStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchBalance: async () => {
    try {
      const res = await starService.getBalance();
      const data = res?.data ?? res;
      set({ balance: data?.balance ?? data?.data?.balance ?? 0 });
      return data;
    } catch {
      // silent fail for balance
    }
  },

  fetchTransactions: async (params = {}) => {
    try {
      const res = await starService.getHistory(params);
      const data = res?.data ?? res;
      set({ transactions: data?.data ?? data?.transactions ?? [] });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchRankInfo: async () => {
    try {
      const res = await starService.getRankInfo();
      const data = res?.data ?? res;
      set({ rankInfo: data?.data ?? data ?? null });
      return data;
    } catch {
      // silent fail
    }
  },

  checkin: async () => {
    try {
      const res = await checkinService.checkin();
      const data = res?.data ?? res;
      const newBalance = data?.balance ?? data?.data?.balance;
      if (newBalance !== undefined) set({ balance: newBalance });
      set({ checkinStatus: data?.data ?? data });
      return data;
    } catch (err) {
      throw err;
    }
  },

  fetchCheckinStatus: async () => {
    try {
      const res = await checkinService.getStatus();
      const data = res?.data ?? res;
      set({ checkinStatus: data?.data ?? data });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchCheckinStreak: async () => {
    try {
      const res = await checkinService.getStreak();
      const data = res?.data ?? res;
      set({ checkinStreak: data?.streak ?? data?.data?.streak ?? 0 });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchCheckinHistory: async (params = {}) => {
    try {
      const res = await checkinService.getHistory(params);
      const data = res?.data ?? res;
      set({ checkinHistory: data?.data ?? data?.history ?? [] });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchAchievements: async () => {
    try {
      const res = await achievementService.getUserAchievements();
      const data = res?.data ?? res;
      set({ achievements: data?.data ?? data?.achievements ?? [] });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchRecentAchievements: async () => {
    try {
      const res = await achievementService.getRecentUnlocks();
      const data = res?.data ?? res;
      set({ recentAchievements: data?.data ?? data?.achievements ?? [] });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchLeaderboard: async (period = "WEEKLY", limit = 10) => {
    set({ loading: true });
    try {
      const res = await leaderboardService.getLeaderboard(period, limit);
      const data = res?.data ?? res;
      set({ leaderboard: data?.data ?? data?.leaderboard ?? [], loading: false });
      return data;
    } catch {
      set({ loading: false });
    }
  },

  fetchMyRank: async (period = "WEEKLY") => {
    try {
      const res = await leaderboardService.getUserRank(period);
      const data = res?.data ?? res;
      set({ myRank: data?.data ?? data?.rank ?? null });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchTop5: async () => {
    try {
      const res = await leaderboardService.getTop5WithPrizes();
      const data = res?.data ?? res;
      set({ top5: data?.data ?? data?.top5 ?? [] });
      return data;
    } catch {
      // silent fail
    }
  },

  fetchComparison: async () => {
    try {
      const res = await leaderboardService.getComparison();
      const data = res?.data ?? res;
      set({ userComparison: data?.data ?? data ?? null });
      return data;
    } catch {
      // silent fail
    }
  },
}));
