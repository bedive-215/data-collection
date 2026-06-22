import { create } from "zustand";
import authService from "@/services/authService";

const ACCESS_TOKEN_KEY = "access_token";

const decodeJWT = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const buildUserFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded) return null;
  return {
    user_id: decoded.user_id || decoded.id || decoded.sub || null,
    email: decoded.email || null,
    full_name: decoded.full_name || decoded.name || null,
    role: decoded.role || null,
    gender: decoded.gender || null,
    phone_number: decoded.phone_number || null,
  };
};

const extractAccessToken = (data) =>
  data?.access_token ?? data?.accessToken ?? data?.token ?? data?.data?.access_token ?? null;

const getPersistedToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

const persistToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const useAuthStore = create((set, get) => {
  const initialToken = getPersistedToken();
  const initialUser = initialToken ? buildUserFromToken(initialToken) : null;

  return {
    user: initialUser,
    accessToken: initialToken,
    loading: !initialToken,
    isBlocked: false,
    isRefreshing: false,

    setUser: (user) => set({ user }),

    setLoading: (loading) => set({ loading }),

    setBlocked: (isBlocked) => set({ isBlocked }),

    login: async (payload) => {
      const res = await authService.login(payload);
      const data = res?.data ?? res;
      const newAccess = extractAccessToken(data);
      persistToken(newAccess);

      const tokenUser = newAccess ? buildUserFromToken(newAccess) : null;
      const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
      const user = fromBody
        ? { ...tokenUser, ...fromBody, user_id: fromBody.user_id ?? tokenUser?.user_id }
        : tokenUser;

      set({ user, accessToken: newAccess, loading: false });
      return data;
    },

    loginWithOAuth: async (payload) => {
      const res = await authService.loginWithOAuth(payload);
      const data = res?.data ?? res;
      const newAccess = extractAccessToken(data);
      persistToken(newAccess);

      const tokenUser = newAccess ? buildUserFromToken(newAccess) : null;
      const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
      const user = fromBody
        ? { ...tokenUser, ...fromBody, user_id: fromBody.user_id ?? tokenUser?.user_id }
        : tokenUser;

      set({ user, accessToken: newAccess, loading: false });
      return data;
    },

    loginFromOAuthData: (data) => {
      const newAccess = extractAccessToken(data);
      persistToken(newAccess);

      const tokenUser = newAccess ? buildUserFromToken(newAccess) : null;
      const fromBody = data?.user ?? data?.data?.user ?? data?.profile;
      const user = fromBody
        ? { ...tokenUser, ...fromBody, user_id: fromBody.user_id ?? tokenUser?.user_id }
        : tokenUser;

      set({ user, accessToken: newAccess, loading: false });
    },

    logout: async () => {
      try {
        await authService.logout().catch(() => {});
      } finally {
        persistToken(null);
        set({ user: null, accessToken: null, isBlocked: false, loading: false });
      }
    },

    register: (payload) =>
      authService.register(payload).then((r) => r?.data ?? r),

    verifyEmail: (payload) =>
      authService.verifyEmail(payload).then((r) => r?.data ?? r),

    resendVerifyCode: (payload) =>
      authService.resendVerifyCode(payload).then((r) => r?.data ?? r),

    forgotPassword: (payload) =>
      authService.forgotPassword(payload).then((r) => r?.data ?? r),

    verifyResetCode: (payload) =>
      authService.verifyResetCode(payload).then((r) => r?.data ?? r),

    resetPassword: (payload) =>
      authService.resetPassword(payload).then((r) => r?.data ?? r),

    refreshTokens: async () => {
      if (get().isRefreshing) return;
      set({ isRefreshing: true });
      try {
        const res = await authService.refreshToken();
        const body = res?.data ?? res;
        const newAccess = extractAccessToken(body);
        if (newAccess) {
          persistToken(newAccess);
          const newUser = buildUserFromToken(newAccess);
          set({ user: newUser, accessToken: newAccess, isRefreshing: false, loading: false });
          return { access_token: newAccess };
        }
        throw new Error("No access token in refresh response");
      } catch {
        persistToken(null);
        set({ user: null, accessToken: null, isRefreshing: false, loading: false });
        return { expired: true };
      }
    },

    initFromStorage: () => {
      const token = getPersistedToken();
      if (token) {
        const userObj = buildUserFromToken(token);
        set({ user: userObj, accessToken: token, loading: false });
      } else {
        set({ loading: false });
      }
    },
  };
});
