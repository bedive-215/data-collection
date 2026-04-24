import React, { createContext, useState, useContext, useCallback } from "react";
import surveyService from "@/services/surveyService";
import { toast } from "react-toastify";

export const SurveyContext = createContext();

export const useSurvey = () => {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within a SurveyProvider");
  return ctx;
};

const SurveyProvider = ({ children }) => {
  const [surveys, setSurveys]               = useState([]);
  const [currentSurvey, setCurrentSurvey]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  const normalizeSurvey = (s) => ({
    id:          s.id,
    title:       s.title,
    description: s.description,
    created_by:  s.created_by,
    createdAt:   s.createdAt,
    updatedAt:   s.updatedAt,
  });

  const handleError = (err, fallback) => {
    const msg = err.response?.data?.message || fallback;
    setError(msg);
    toast.error(msg);
    throw err;
  };

  // ── CREATE ──
  const createSurvey = async (payload) => {
    setLoading(true); setError(null);
    try {
      const res     = await surveyService.createSurvey(payload);
      const data    = res.data ?? res;
      const created = normalizeSurvey(data.survey ?? data);
      setSurveys((prev) => [created, ...prev]);
      toast.success("Tạo survey thành công!");
      return created;
    } catch (err) { handleError(err, "Tạo survey thất bại"); }
    finally { setLoading(false); }
  };

  // ── GET BY ID ──
  const fetchSurveyById = useCallback(async (surveyId) => {
    setLoading(true); setError(null);
    try {
      const res    = await surveyService.getSurveyById(surveyId);
      const data   = res.data ?? res;
      const survey = normalizeSurvey(data.survey ?? data);
      setCurrentSurvey(survey);
      return survey;
    } catch (err) { handleError(err, "Không tìm thấy survey"); }
    finally { setLoading(false); }
  }, []);

  // ── GET BY USER ──
  const fetchSurveyByUserId = useCallback(async (userId) => {
    setLoading(true); setError(null);
    try {
      const res  = await surveyService.getSurveyByUserId(userId);
      const data = res.data ?? res;
      const list = (data.surveys ?? []).map(normalizeSurvey);
      setSurveys(list);
      return list;
    } catch (err) { handleError(err, "Không lấy được danh sách survey"); }
    finally { setLoading(false); }
  }, []);

  // ── GET ALL ──
  const fetchAllSurveys = useCallback(async (params) => {
    setLoading(true); setError(null);
    try {
      const res  = await surveyService.getAllSurveys(params);
      const data = res.data ?? res;
      const list = (data.surveys ?? []).map(normalizeSurvey);
      setSurveys(list);
      return list;
    } catch (err) { handleError(err, "Không lấy được surveys"); }
    finally { setLoading(false); }
  }, []);

  // ── UPDATE ──
const updateSurvey = async (surveyId, payload) => {
  setLoading(true);
  setError(null);

  try {
    const res = await surveyService.updateSurvey(surveyId, payload);

    console.log("DATA:", res.data);

    const data = res.data;

    // fallback mạnh hơn
    const surveyData =
      data.survey ||
      data.data ||
      data;

    // ⚠️ nếu vẫn không có id → giữ id cũ
    const updated = normalizeSurvey({
      ...surveyData,
      id: surveyData.id || surveyId,
    });

    setSurveys((prev) =>
      prev.map((s) => (s.id === surveyId ? updated : s))
    );

    if (currentSurvey?.id === surveyId) {
      setCurrentSurvey(updated);
    }

    toast.success("Cập nhật survey thành công!");
    return updated;

  } catch (err) {
    handleError(err, "Cập nhật survey thất bại");
  } finally {
    setLoading(false);
  }
};

  // ── DELETE ──
  const deleteSurvey = async (surveyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa survey này?")) return false;
    setLoading(true); setError(null);
    try {
      await surveyService.deleteSurveyById(surveyId);
      setSurveys((prev) => prev.filter((s) => s.id !== surveyId));
      if (currentSurvey?.id === surveyId) setCurrentSurvey(null);
      toast.success("Xóa survey thành công!");
      return true;
    } catch (err) { handleError(err, "Xóa survey thất bại"); }
    finally { setLoading(false); }
  };

  const clearError = () => setError(null);

  return (
    <SurveyContext.Provider value={{
      surveys, currentSurvey, loading, error,
      createSurvey, fetchSurveyById, fetchSurveyByUserId,
      fetchAllSurveys, updateSurvey, deleteSurvey,
      setSurveys, setCurrentSurvey, clearError,
    }}>
      {children}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider;