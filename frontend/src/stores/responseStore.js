import { create } from "zustand";
import responseService from "@/services/responseService";

const initialState = {
  currentResponse: null,
  myResponses: [],
  loading: false,
  error: null,
};

export const useResponseStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  startSurvey: async (surveyId) => {
    set({ loading: true, error: null });
    try {
      const data = await responseService.startSurvey(surveyId);
      set({ currentResponse: data?.data ?? data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  submitSurvey: async (surveyId, payload) => {
    set({ loading: true, error: null });
    try {
      const data = await responseService.submitSurvey(surveyId, payload);
      set({ currentResponse: data?.data ?? data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchMyResponse: async (surveyId) => {
    set({ loading: true, error: null });
    try {
      const data = await responseService.getMySubmission(surveyId);
      set({ currentResponse: data?.data ?? data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchMyResponses: async () => {
    set({ loading: true, error: null });
    try {
      const data = await responseService.getAllMyResponses();
      set({ myResponses: data?.data ?? data ?? [], loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchUserResponse: async (surveyId, userId) => {
    set({ loading: true, error: null });
    try {
      const data = await responseService.getUserSubmission(surveyId, userId);
      set({ currentResponse: data?.data ?? data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },
}));
