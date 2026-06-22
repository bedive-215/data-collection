import { create } from "zustand";
import questionService from "@/services/questionService";

const initialState = {
  questions: [],
  loading: false,
  error: null,
};

export const useQuestionStore = create((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchQuestions: async (surveyId) => {
    set({ loading: true, error: null });
    try {
      const res = await questionService.getQuestionsBySurvey(surveyId);
      const data = res?.data ?? res;
      const questions = data?.data ?? data?.questions ?? [];
      set({ questions, loading: false });
      return questions;
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
      throw err;
    }
  },

  createQuestion: async (surveyId, payload) => {
    try {
      const res = await questionService.createQuestions(surveyId, payload);
      const data = res?.data ?? res;
      const question = data?.data ?? data?.question ?? null;
      if (question) {
        set((state) => ({ questions: [...state.questions, question] }));
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  updateQuestion: async (questionId, surveyId, payload) => {
    try {
      const res = await questionService.updateQuestion(questionId, surveyId, payload);
      const data = res?.data ?? res;
      const updated = data?.data ?? data?.question ?? null;
      if (updated) {
        set((state) => ({
          questions: state.questions.map((q) => (q.id === questionId ? { ...q, ...updated } : q)),
        }));
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  deleteQuestion: async (questionId, surveyId) => {
    try {
      await questionService.deleteQuestion(questionId, surveyId);
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
      }));
    } catch (err) {
      throw err;
    }
  },

  reorderQuestions: async (surveyId, payload) => {
    try {
      const res = await questionService.reorderQuestions(surveyId, payload);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },

  bulkCreateQuestions: async (surveyId, payload) => {
    try {
      const res = await questionService.bulkCreateQuestions(surveyId, payload);
      const data = res?.data ?? res;
      const created = data?.data ?? data?.questions ?? [];
      if (created.length > 0) {
        set((state) => ({ questions: [...state.questions, ...created] }));
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  aiSuggestQuestions: async (surveyId, body) => {
    try {
      const res = await questionService.aiSuggestQuestions(surveyId, body);
      return res?.data ?? res;
    } catch (err) {
      throw err;
    }
  },
}));
