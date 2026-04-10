// src/services/tokenService.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const tokenService = {
  getAccess: async () => {
    return await AsyncStorage.getItem(ACCESS_KEY);
  },

  getRefresh: async () => {
    return await AsyncStorage.getItem(REFRESH_KEY);
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    const tasks = [];

    if (accessToken) {
      tasks.push(AsyncStorage.setItem(ACCESS_KEY, accessToken));
    }

    if (refreshToken) {
      tasks.push(AsyncStorage.setItem(REFRESH_KEY, refreshToken));
    }

    await Promise.all(tasks);
  },

  clear: async () => {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  },
};
