import { create } from "zustand";
import surveyService from "@/services/surveyService";

const initialState = {
  surveys: [],
  currentSurvey: null,
  publicSurveys: [],
  invitedSurveys: [],
  participants: [],
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  count: 0,
};

export const useSurveyStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  setCurrentSurvey: (survey) => set({ currentSurvey: survey }),

  fetchMySurveys: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await surveyService.getMySurveys(params);
      const data = res?.data ?? res;
      set({
        surveys: data?.data ?? [],
        count: data?.count ?? 0,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchPublicSurveys: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await surveyService.getPublicSurveys(params);
      const data = res?.data ?? res;
      set({
        publicSurveys: data?.data ?? [],
        count: data?.count ?? 0,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchInvitedSurveys: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await surveyService.getInvitedSurveys(params);
      const data = res?.data ?? res;
      set({
        invitedSurveys: data?.data?.surveys ?? data?.data ?? [],
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchSurveyById: async (surveyId, accessToken) => {
    set({ loading: true, error: null });
    try {
      const res = accessToken
        ? await surveyService.getSurveyByAccessToken(surveyId, accessToken)
        : await surveyService.getSurveyById(surveyId);
      const data = res?.data ?? res;
      set({
        currentSurvey: data?.data ?? data?.survey ?? null,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  createSurvey: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await surveyService.createSurvey(payload);
      const data = res?.data ?? res;
      set({ loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  updateSurvey: async (surveyId, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await surveyService.updateSurvey(surveyId, payload);
      const data = res?.data ?? res;
      const updated = data?.data ?? data?.survey ?? null;
      set((state) => ({
        currentSurvey: state.currentSurvey?.id === surveyId ? updated : state.currentSurvey,
        loading: false,
      }));
      return data;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  deleteSurvey: async (surveyId) => {
    set({ loading: true, error: null });
    try {
      await surveyService.deleteSurveyById(surveyId);
      set((state) => ({
        surveys: state.surveys.filter((s) => s.id !== surveyId),
        loading: false,
      }));
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  closeSurvey: async (surveyId) => {
    try {
      const res = await surveyService.closeSurvey(surveyId);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },

  publishSurvey: async (surveyId, payload = {}) => {
    try {
      const res = await surveyService.publishSurvey(surveyId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },

  shareSurveyLink: async (surveyId) => {
    try {
      const res = await surveyService.shareSurveyLink(surveyId);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },

  inviteUser: async (surveyId, payload) => {
    try {
      const res = await surveyService.inviteSurvey(surveyId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },

  bulkInvite: async (surveyId, payload) => {
    try {
      const res = await surveyService.bulkInviteSurvey(surveyId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },

  fetchParticipants: async (surveyId) => {
    try {
      const res = await surveyService.getParticipants(surveyId);
      const data = res?.data ?? res;
      set({ participants: data?.participants ?? [] });
      return data;
    } catch (err) {
      throw err;
    }
  },

  deleteParticipant: async (surveyId, pid) => {
    try {
      await surveyService.deleteParticipant(surveyId, pid);
      set((state) => ({
        participants: state.participants.filter((p) => p.id !== pid),
      }));
    } catch (err) {
      throw err;
    }
  },

  extendSurvey: async (surveyId, payload) => {
    try {
      const res = await surveyService.extendSurvey(surveyId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },
}));
