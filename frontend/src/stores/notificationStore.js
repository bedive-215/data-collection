import { create } from "zustand";
import notificationService from "@/services/notificationService";

const normalizeNotification = (n) => ({
  ...n,
  type: (n.type || "").toUpperCase(),
  title: n.title || "",
  message: n.message || null,
  createdAt: n.createdAt || n.created_at || null,
  data: {
    ...(n.data || {}),
    surveyId: n.surveyId || n.data?.surveyId || n.data?.survey_id || null,
    surveyTitle: n.surveyTitle || n.data?.surveyTitle || n.data?.title || null,
    surveyEndAt: n.surveyEndAt || n.data?.surveyEndAt || n.data?.end_at || null,
    responseCount: n.responseCount ?? n.data?.responseCount ?? n.data?.response_count ?? null,
    inviterName: n.inviterName || n.data?.inviterName || n.data?.inviter_name || null,
    responderName: n.responderName || n.data?.responderName || n.data?.responder_name || null,
    amount: n.amount ?? n.data?.amount ?? null,
    multiplier: n.multiplier ?? n.data?.multiplier ?? null,
    balance_after: n.balance_after ?? n.data?.balance_after ?? null,
    streak_count: n.streak_count ?? n.data?.streak_count ?? null,
    achievement_name: n.achievement_name || n.data?.achievement_name || null,
    achievement_icon: n.achievement_icon || n.data?.achievement_icon || null,
    star_reward: n.star_reward ?? n.data?.star_reward ?? null,
    rank_name: n.rank_name || n.data?.rank_name || null,
    rank_emoji: n.rank_emoji || n.data?.rank_emoji || null,
  },
});

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const useNotificationStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchNotifications: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await notificationService.getNotifications(params);
      const data = res?.data ?? res;
      const fetched = (data?.notifications ?? data?.data ?? []).map(normalizeNotification);
      set({
        notifications: fetched,
        unreadCount: data?.unreadCount ?? 0,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },

  addNotification: (notification) => {
    const normalized = normalizeNotification(notification);
    set((state) => ({
      notifications: [normalized, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silent fail
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent fail
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      set((state) => {
        const deleted = state.notifications.find((n) => n.id === notificationId);
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: deleted && !deleted.read ? state.unreadCount - 1 : state.unreadCount,
        };
      });
    } catch {
      // silent fail
    }
  },
}));
