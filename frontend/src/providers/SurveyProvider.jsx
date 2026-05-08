import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";

import surveyService from "@/services/surveyService";
import { toast } from "react-toastify";

export const SurveyContext = createContext(null);

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within SurveyProvider");
  }
  return context;
};

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
  const [mySurveys, setMySurveys] = useState([]);
  const [publicSurveys, setPublicSurveys] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = () => { setLoading(true); setError(null); };
  const stopLoading  = () => setLoading(false);
  const clearError   = () => setError(null);

  const handleError = (err, fallback) => {
    console.error(err);
    const message = err?.response?.data?.message || err?.message || fallback;
    setError(message);
    toast.error(message);
    throw err;
  };

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

  const updateSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.updateSurvey(id, payload);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);
      const update = (prev) => prev.map((s) => (s.id === id ? updated : s));
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

  const closeSurvey = useCallback(async (id) => {
    try {
      startLoading();
      const res = await surveyService.closeSurvey(id);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);
      const update = (prev) => prev.map((s) => (s.id === id ? updated : s));
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
      const update = (prev) => prev.map((s) => (s.id === id ? updated : s));
      setSurveys(update);
      setMySurveys(update);
      return updated;
    } catch (err) {
      handleError(err, "Publish thất bại");
    } finally {
      stopLoading();
    }
  }, []);

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

  // ─── QUAN TRỌNG: KHÔNG dùng startLoading/stopLoading ở đây ───
  // Lý do: gọi setLoading sẽ khiến toàn bộ context re-render,
  // làm mới object getParticipants → trigger useEffect trong modal → infinite loop
  const getParticipants = useCallback(async (id, params = {}) => {
    try {
      const res = await surveyService.getParticipants(id, params);
      const data = res?.data ?? res;
      return {
        count:        data?.count        ?? 0,
        participants: data?.participants ?? data?.data ?? [],
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  // ─── QUAN TRỌNG: KHÔNG dùng startLoading/stopLoading ở đây ───
  const deleteParticipant = useCallback(async (id, pid) => {
    try {
      await surveyService.deleteParticipant(id, pid);
      toast.success("Xóa participant thành công");
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  // ─── QUAN TRỌNG: thêm ĐẦY ĐỦ tất cả callbacks vào deps ───
  // Nếu thiếu, useMemo sẽ tạo ra object mới mỗi lần loading thay đổi
  // → các component con nhận prop mới → re-render không cần thiết
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
    ]
  );

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider;