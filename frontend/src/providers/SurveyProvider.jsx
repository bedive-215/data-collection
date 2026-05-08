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
  // ─────────────────────────────
  // STATE — tách riêng my vs public
  // ─────────────────────────────
  const [mySurveys, setMySurveys] = useState([]);       // ← surveys của user
  const [publicSurveys, setPublicSurveys] = useState([]); // ← surveys công khai

  // "surveys" vẫn giữ để các trang cũ (SurveysPage, MySurveysPage) không bị break
  const [surveys, setSurveys] = useState([]);

  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  const startLoading = () => { setLoading(true); setError(null); };
  const stopLoading  = () => { setLoading(false); };

  const handleError = (err, fallbackMessage) => {
    console.error(err);
    const message = err?.response?.data?.message || err?.message || fallbackMessage;
    setError(message);
    toast.error(message);
    throw err;
  };

  const clearError = () => setError(null);

  // ─────────────────────────────
  // CREATE SURVEY
  // ─────────────────────────────
  const createSurvey = useCallback(async (payload) => {
    try {
      startLoading();
      const res = await surveyService.createSurvey(payload);
      const data = res?.data ?? res;
      const survey = normalizeSurvey(data?.survey ?? data);

      // thêm vào cả mySurveys lẫn surveys (backward compat)
      setMySurveys((prev) => [survey, ...prev]);
      setSurveys((prev) => [survey, ...prev]);

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

      // ← set vào mySurveys riêng, KHÔNG ghi đè publicSurveys
      setMySurveys(list);
      setSurveys(list); // backward compat cho MySurveysPage

      return { list, count: data?.count ?? list.length };
    } catch (err) {
      handleError(err, "Không lấy được khảo sát của bạn");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // PUBLIC SURVEYS
  // ─────────────────────────────
  const fetchPublicSurveys = useCallback(async (params = {}) => {
    try {
      startLoading();
      const res = await surveyService.getPublicSurveys(params);
      const data = res?.data ?? res;

      const list = (data?.surveys || data?.data || []).map(normalizeSurvey);

      // ← set vào publicSurveys riêng, KHÔNG ghi đè mySurveys
      setPublicSurveys(list);

      return { list, count: data?.count ?? list.length };
    } catch (err) {
      handleError(err, "Không thể tải khảo sát công khai");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // SURVEY DETAIL
  // ─────────────────────────────
  const fetchSurveyById = useCallback(async (surveyId, accessToken = null) => {
    try {
      startLoading();
      const res = accessToken
        ? await surveyService.getSurveyByAccessToken(surveyId, accessToken)
        : await surveyService.getSurveyById(surveyId);
      const data = res?.data ?? res;
      const survey = normalizeSurvey(data?.survey ?? data);
      setCurrentSurvey(survey);
      return { survey, role: data?.role || "viewer" };
    } catch (err) {
      handleError(err, "Không tìm thấy khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // SURVEYS BY USER ID
  // ─────────────────────────────
  const fetchSurveyByUserId = useCallback(async (userId, page = 1, limit = 10) => {
    try {
      startLoading();
      const res = await surveyService.getSurveyByUserId(userId, { page, limit });
      const data = res?.data ?? res;
      const list = (data?.surveys || []).map(normalizeSurvey);
      setSurveys(list);
      return { list, count: data?.count ?? list.length };
    } catch (err) {
      handleError(err, "Không lấy được khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // ALL SURVEYS (admin)
  // ─────────────────────────────
  const fetchAllSurveys = useCallback(async (page = 1, limit = 10) => {
    try {
      startLoading();
      const res = await surveyService.getAllSurveys({ page, limit });
      const data = res?.data ?? res;
      const list = (data?.surveys || []).map(normalizeSurvey);
      setSurveys(list);
      return { list, count: data?.count ?? list.length, page: data?.page || 1, totalPages: data?.totalPages || 1 };
    } catch (err) {
      handleError(err, "Không thể tải danh sách khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // UPDATE SURVEY
  // ─────────────────────────────
  const updateSurvey = useCallback(async (surveyId, payload) => {
    try {
      startLoading();
      const res = await surveyService.updateSurvey(surveyId, payload);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);

      const updater = (prev) => prev.map((s) => s.id === surveyId ? updated : s);
      setMySurveys(updater);
      setSurveys(updater);
      setCurrentSurvey((prev) => prev?.id === surveyId ? updated : prev);

      toast.success("Cập nhật khảo sát thành công");
      return updated;
    } catch (err) {
      handleError(err, "Cập nhật khảo sát thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // DELETE SURVEY
  // ─────────────────────────────
  const deleteSurvey = useCallback(async (surveyId) => {
    try {
      const confirmed = window.confirm("Bạn có chắc muốn xóa khảo sát này?");
      if (!confirmed) return false;

      startLoading();
      await surveyService.deleteSurveyById(surveyId);

      const remover = (prev) => prev.filter((s) => s.id !== surveyId);
      setMySurveys(remover);
      setSurveys(remover);
      setCurrentSurvey((prev) => prev?.id === surveyId ? null : prev);

      toast.success("Xóa khảo sát thành công");
      return true;
    } catch (err) {
      handleError(err, "Xóa khảo sát thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // CLOSE SURVEY
  // ─────────────────────────────
  const closeSurvey = useCallback(async (surveyId) => {
    try {
      startLoading();
      const res = await surveyService.closeSurvey(surveyId);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);

      const updater = (prev) => prev.map((s) => s.id === surveyId ? updated : s);
      setMySurveys(updater);
      setSurveys(updater);

      toast.success("Đóng khảo sát thành công");
      return updated;
    } catch (err) {
      handleError(err, "Không thể đóng khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // PUBLISH SURVEY
  // ─────────────────────────────
  const publishSurvey = useCallback(async (surveyId, payload = { is_published: true }) => {
    try {
      startLoading();
      const res = await surveyService.publishSurvey(surveyId, payload);
      const data = res?.data ?? res;
      const updated = normalizeSurvey(data?.survey ?? data);

      const updater = (prev) => prev.map((s) => s.id === surveyId ? updated : s);
      setMySurveys(updater);
      setSurveys(updater);

      toast.success("Publish survey thành công");
      return updated;
    } catch (err) {
      handleError(err, "Không thể publish survey");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // SHARE LINK
  // ─────────────────────────────
  const shareLink = useCallback(async (surveyId) => {
    try {
      startLoading();
      const res = await surveyService.shareSurveyLink(surveyId);
      const data = res?.data ?? res;
      toast.success("Tạo link chia sẻ thành công");
      return data?.url || null;
    } catch (err) {
      handleError(err, "Không thể tạo link chia sẻ");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // INVITE USER
  // ─────────────────────────────
  const inviteSurvey = useCallback(async (surveyId, payload) => {
    try {
      startLoading();
      const res = await surveyService.inviteSurvey(surveyId, payload);
      const data = res?.data ?? res;
      toast.success("Mời người dùng thành công");
      return data;
    } catch (err) {
      handleError(err, "Không thể mời người dùng");
    } finally {
      stopLoading();
    }
  }, []);

  // ─────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────
  const value = useMemo(
    () => ({
      // ← expose cả 3: surveys (backward compat), mySurveys, publicSurveys
      surveys,
      mySurveys,
      publicSurveys,
      currentSurvey,
      loading,
      error,

      setSurveys,
      setCurrentSurvey,
      clearError,

      createSurvey,
      fetchPublicSurveys,
      fetchSurveyById,
      fetchMySurveys,
      fetchSurveyByUserId,
      fetchAllSurveys,
      updateSurvey,
      deleteSurvey,
      closeSurvey,
      publishSurvey,
      shareLink,
      inviteSurvey,
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