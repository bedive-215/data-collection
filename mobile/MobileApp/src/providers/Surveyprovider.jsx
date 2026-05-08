import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { Alert } from "react-native";

import surveyService from "../services/surveyService";

export const SurveyContext = createContext(null);

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within SurveyProvider");
  }
  return context;
};

// ─────────────────────────────
// TOAST HELPER
// ─────────────────────────────
const toast = {
  success: (message) => Alert.alert("Thành công", message),
  error: (message) => Alert.alert("Lỗi", message),
};

// ─────────────────────────────
// NORMALIZE
// ─────────────────────────────
const normalizeSurvey = (survey = {}) => ({
  id: survey.id,
  title: survey.title || "",
  description: survey.description || "",
  start_at: survey.start_at || null,
  end_at: survey.end_at || null,
  created_at: survey.created_at || null,
  status: survey.status || null,
  access_type: survey.access_type || "PRIVATE",
  access_token: survey.access_token || null,
  created_by: survey.created_by || null,
  is_published: survey.is_published || false,
  questions: (survey.questions || []).map((q) => ({
    id: q.id,
    content: q.content || "",
    type: q.type || "TEXT",
    required: q.required || false,
    order_index: q.order_index || 0,
    options: (q.options || []).map((o) => ({
      id: o.id,
      label: o.label || "",
      value: o.value || "",
      order_index: o.order_index || 0,
    })),
  })),
});

const SurveyProvider = ({ children }) => {
  // ─────────────────────────────
  // STATE
  // ─────────────────────────────
  const [mySurveys, setMySurveys] = useState([]);
  const [publicSurveys, setPublicSurveys] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => setLoading(false);

  const handleError = (err, fallback) => {
    console.error(err);
    const message =
      err?.response?.data?.message || err?.message || fallback;
    setError(message);
    toast.error(message);
    throw err;
  };

  const clearError = () => setError(null);

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  const createSurvey = useCallback(async (payload) => {
    try {
      startLoading();
      const res = await surveyService.createSurvey(payload);
      const data = res?.data ?? res;
      const survey = normalizeSurvey(data?.survey ?? data);

      setMySurveys((p) => [survey, ...p]);
      setSurveys((p) => [survey, ...p]);

      toast.success("Tạo khảo sát thành công");
      return survey;
    } catch (err) {
      handleError(err, "Tạo khảo sát thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // MY SURVEYS
  // ─────────────────────────────
  const fetchMySurveys = useCallback(async (page = 1, limit = 10) => {
    try {
      startLoading();
      const res = await surveyService.getMySurveys({ page, limit });
      const data = res?.data ?? res;

      const list = (data?.data || data?.surveys || []).map(normalizeSurvey);

      setMySurveys(list);
      setSurveys(list);

      return list;
    } catch (err) {
      handleError(err, "Không lấy được khảo sát của bạn");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // PUBLIC
  // ─────────────────────────────
  const fetchPublicSurveys = useCallback(async (params = {}) => {
    try {
      startLoading();
      const res = await surveyService.getPublicSurveys(params);
      const data = res?.data ?? res;

      const list = (data?.data || data?.surveys || []).map(normalizeSurvey);

      setPublicSurveys(list);
      return list;
    } catch (err) {
      handleError(err, "Không tải được khảo sát công khai");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // DETAIL
  // ─────────────────────────────
  const fetchSurveyById = useCallback(async (id, token = null) => {
    try {
      startLoading();
      const res = token
        ? await surveyService.getSurveyByAccessToken(id, token)
        : await surveyService.getSurveyById(id);

      const data = res?.data ?? res;
      const survey = normalizeSurvey(data?.survey ?? data);

      setCurrentSurvey(survey);
      return survey;
    } catch (err) {
      handleError(err, "Không tìm thấy khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  const updateSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.updateSurvey(id, payload);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);

      const update = (prev) =>
        prev.map((s) => (s.id === id ? updated : s));

      setMySurveys(update);
      setSurveys(update);

      toast.success("Cập nhật thành công");
      return updated;
    } catch (err) {
      handleError(err, "Cập nhật thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  const deleteSurvey = useCallback(async (id) => {
    try {
      startLoading();
      await surveyService.deleteSurveyById(id);

      const remove = (prev) => prev.filter((s) => s.id !== id);

      setMySurveys(remove);
      setSurveys(remove);

      toast.success("Xóa thành công");
      return true;
    } catch (err) {
      handleError(err, "Xóa thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // CLOSE / PUBLISH
  // ─────────────────────────────
  const closeSurvey = useCallback(async (id) => {
    try {
      startLoading();
      const res = await surveyService.closeSurvey(id);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);

      const update = (prev) =>
        prev.map((s) => (s.id === id ? updated : s));

      setSurveys(update);
      setMySurveys(update);

      return updated;
    } catch (err) {
      handleError(err, "Không thể đóng khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  const publishSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.publishSurvey(id, payload);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);

      const update = (prev) =>
        prev.map((s) => (s.id === id ? updated : s));

      setSurveys(update);
      setMySurveys(update);

      return updated;
    } catch (err) {
      handleError(err, "Publish thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // SHARE / INVITE
  // ─────────────────────────────
  const shareLink = useCallback(async (id) => {
    try {
      startLoading();
      const res = await surveyService.shareSurveyLink(id);
      const data = res?.data ?? res;

      toast.success("Tạo link thành công");
      return data?.url;
    } catch (err) {
      handleError(err, "Share thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  const inviteSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.inviteSurvey(id, payload);

      toast.success("Mời thành công");
      return res?.data ?? res;
    } catch (err) {
      handleError(err, "Invite thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // BULK INVITE
  // ─────────────────────────────
  const bulkInviteSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.bulkInviteSurvey(id, payload);

      toast.success("Mời hàng loạt thành công");
      return res?.data ?? res;
    } catch (err) {
      handleError(err, "Bulk invite thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // PARTICIPANTS
  // FIX: Không dùng startLoading/stopLoading ở đây vì nó sẽ trigger
  // global loading=true → re-render toàn bộ danh sách → reset state
  // modal → modal bị đóng ngay lập tức
  // ─────────────────────────────
  const getParticipants = useCallback(async (id, params = {}) => {
    try {
      const res = await surveyService.getParticipants(id, params);
      const data = res?.data ?? res;

      return {
        participants: Array.isArray(data?.participants)
          ? data.participants
          : [],
        count: data?.count || 0,
      };
    } catch (err) {
      console.error("getParticipants error:", err);
      const message =
        err?.response?.data?.message || err?.message || "Không lấy được participants";
      throw new Error(message);
    }
  }, []);

  // ─────────────────────────────
  // DELETE PARTICIPANT
  // FIX: Tương tự, không dùng global loading để tránh re-render
  // ─────────────────────────────
  const deleteParticipant = useCallback(async (id, pid) => {
    try {
      await surveyService.deleteParticipant(id, pid);
      toast.success("Xóa participant thành công");
      return true;
    } catch (err) {
      console.error("deleteParticipant error:", err);
      const message =
        err?.response?.data?.message || err?.message || "Xóa participant thất bại";
      throw new Error(message);
    }
  }, []);

  // ─────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────
  const value = useMemo(
    () => ({
      surveys,
      mySurveys,
      publicSurveys,
      currentSurvey,
      loading,
      error,

      createSurvey,
      fetchMySurveys,
      fetchPublicSurveys,
      fetchSurveyById,
      updateSurvey,
      deleteSurvey,
      closeSurvey,
      publishSurvey,
      shareLink,
      inviteSurvey,

      bulkInviteSurvey,
      getParticipants,
      deleteParticipant,

      setCurrentSurvey,
      clearError,
    }),
    [
      surveys,
      mySurveys,
      publicSurveys,
      currentSurvey,
      loading,
      error,
    ]
  );

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider;