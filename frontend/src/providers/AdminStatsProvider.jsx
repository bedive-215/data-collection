import React, { createContext, useState, useContext, useCallback } from "react";
import adminStatsService from "../services/adminStatsService";
import { toast } from "react-toastify";

export const AdminStatsContext = createContext();

export const useAdminStats = () => {
  const ctx = useContext(AdminStatsContext);
  if (!ctx) throw new Error("useAdminStats must be used within AdminStatsProvider");
  return ctx;
};

const AdminStatsProvider = ({ children }) => {
  const [overview, setOverview] = useState(null);
  const [surveyByDay, setSurveyByDay] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [totalAnswered, setTotalAnswered] = useState(null);
  const [answeredBySurvey, setAnsweredBySurvey] = useState({});
  const [loading, setLoading] = useState(false);

  // New state
  const [fullDashboard, setFullDashboard] = useState(null);
  const [responseTrend, setResponseTrend] = useState([]);
  const [surveyStatusDist, setSurveyStatusDist] = useState([]);
  const [questionTypeDist, setQuestionTypeDist] = useState([]);
  const [recentResponses, setRecentResponses] = useState([]);
  const [quickStats, setQuickStats] = useState(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getOverview();
      const raw = res.data ?? res;
      setOverview(raw.data ?? raw);
      return raw.data ?? raw;
    } catch (err) {
      toast.error("Không lấy được tổng quan hệ thống");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const fetchSurveyByDay = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getSurveyByDay();
      const raw = res.data ?? res;
      setSurveyByDay(raw.data ?? []);
      return raw.data ?? [];
    } catch (err) {
      toast.error("Không lấy được thống kê theo ngày");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getDashboard();
      const raw = res.data ?? res;
      const data = raw.data ?? raw;
      setDashboard(data);
      if (data.overview) setOverview(data.overview);
      if (data.surveyByDay) setSurveyByDay(data.surveyByDay);
      return data;
    } catch (err) {
      toast.error("Không lấy được dashboard");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const fetchFullDashboard = useCallback(async (period = "week") => {
    setLoading(true);
    try {
      const res = await adminStatsService.getFullDashboard(period);
      const raw = res.data ?? res;
      const data = raw.data ?? raw;
      setFullDashboard(data);
      if (data.overview) setOverview(data.overview);
      if (data.surveyByDay) setSurveyByDay(data.surveyByDay);
      if (data.responseTrend) setResponseTrend(data.responseTrend);
      if (data.surveyStatusDistribution) setSurveyStatusDist(data.surveyStatusDistribution);
      if (data.questionTypeDistribution) setQuestionTypeDist(data.questionTypeDistribution);
      if (data.recentResponses) setRecentResponses(data.recentResponses);
      if (data.quickStats) setQuickStats(data.quickStats);
      return data;
    } catch (err) {
      toast.error("Không lấy được dữ liệu dashboard");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const fetchTotalUsersAnswered = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getTotalUsersAnswered();
      const raw = res.data ?? res;
      setTotalAnswered(raw.data ?? raw);
      return raw.data ?? raw;
    } catch (err) {
      toast.error("Không lấy được tổng số người đã trả lời");
      throw err;
    } finally { setLoading(false); }
  }, []);

  const fetchUsersAnsweredBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    try {
      const res = await adminStatsService.getUsersAnsweredBySurvey(surveyId);
      const raw = res.data ?? res;
      const data = raw.data ?? raw;
      setAnsweredBySurvey((prev) => ({ ...prev, [surveyId]: data }));
      return data;
    } catch (err) {
      toast.error("Không lấy được số người trả lời theo survey");
      throw err;
    } finally { setLoading(false); }
  }, []);

  return (
    <AdminStatsContext.Provider
      value={{
        overview,
        surveyByDay,
        dashboard,
        totalAnswered,
        answeredBySurvey,
        loading,
        fullDashboard,
        responseTrend,
        surveyStatusDist,
        questionTypeDist,
        recentResponses,
        quickStats,

        fetchOverview,
        fetchSurveyByDay,
        fetchDashboard,
        fetchFullDashboard,
        fetchTotalUsersAnswered,
        fetchUsersAnsweredBySurvey,
      }}
    >
      {children}
    </AdminStatsContext.Provider>
  );
};

export default AdminStatsProvider;
