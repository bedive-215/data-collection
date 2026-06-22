import { create } from "zustand";
import optionService from "@/services/optionService";

const initialState = {
  options: {},
  loading: false,
  error: null,
};

export const useOptionStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchOptions: async (questionId, surveyId) => {
    set((state) => ({ loading: true, error: null }));
    try {
      const res = await optionService.getOptionsByQuestion(questionId, surveyId);
      const data = res?.data ?? res;
      const options = data?.data ?? data?.options ?? [];
      set((state) => ({
        options: { ...state.options, [questionId]: options },
        loading: false,
      }));
      return options;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  createOption: async (questionId, surveyId, payload) => {
    try {
      const res = await optionService.createOption(questionId, surveyId, payload);
      const data = res?.data ?? res;
      const option = data?.data ?? data?.option ?? null;
      if (option) {
        set((state) => ({
          options: {
            ...state.options,
            [questionId]: [...(state.options[questionId] || []), option],
          },
        }));
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  updateOption: async (optionId, surveyId, payload) => {
    try {
      const res = await optionService.updateOption(optionId, surveyId, payload);
      const data = res?.data ?? res;
      const updated = data?.data ?? data?.option ?? null;
      if (updated) {
        set((state) => {
          const newOptions = { ...state.options };
          Object.keys(newOptions).forEach((qId) => {
            newOptions[qId] = newOptions[qId].map((o) =>
              o.id === optionId ? { ...o, ...updated } : o
            );
          });
          return { options: newOptions };
        });
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  deleteOption: async (optionId, surveyId) => {
    try {
      await optionService.deleteOption(optionId, surveyId);
      set((state) => {
        const newOptions = { ...state.options };
        Object.keys(newOptions).forEach((qId) => {
          newOptions[qId] = newOptions[qId].filter((o) => o.id !== optionId);
        });
        return { options: newOptions };
      });
    } catch (err) {
      throw err;
    }
  },

  bulkCreateOptions: async (questionId, surveyId, payload) => {
    try {
      const res = await optionService.bulkCreateOptions(questionId, surveyId, payload);
      const data = res?.data ?? res;
      const created = data?.data ?? data?.options ?? [];
      if (created.length > 0) {
        set((state) => ({
          options: {
            ...state.options,
            [questionId]: [...(state.options[questionId] || []), ...created],
          },
        }));
      }
      return data;
    } catch (err) {
      throw err;
    }
  },
}));
