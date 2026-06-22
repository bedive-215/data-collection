import { create } from "zustand";
import userService from "@/services/userService";

const initialState = {
  user: null,
  loading: false,
  error: null,
};

export const useUserStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchUserInfo: async () => {
    set({ loading: true, error: null });
    try {
      const res = await userService.getUserInfo();
      const data = res?.data ?? res;
      const user = data?.data ?? data?.user ?? data;
      set({ user, loading: false });
      return user;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  updateProfile: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await userService.updateUserInfo(payload);
      const data = res?.data ?? res;
      const updated = data?.data ?? data?.user ?? null;
      if (updated) {
        set((state) => ({
          user: { ...state.user, ...updated },
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  updateAvatar: async (file) => {
    set({ loading: true, error: null });
    try {
      const res = await userService.updateAvatar(file);
      const data = res?.data ?? res;
      const updated = data?.data ?? data?.user ?? null;
      if (updated) {
        set((state) => ({
          user: { ...state.user, ...updated },
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },
}));
