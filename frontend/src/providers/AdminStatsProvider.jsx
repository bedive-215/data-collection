// src/providers/AdminStatsProvider.jsx
import React, { createContext, useState, useContext } from "react";
import adminStatsService from "@/services/adminStatsService";
import { toast } from "react-toastify";

export const AdminStatsContext = createContext();

export const useAdminStats = () => {
  const ctx = useContext(AdminStatsContext);
  if (!ctx) throw new Error("useAdminStats must be used within AdminStatsProvider");
  return ctx;
};

const AdminStatsProvider = ({ children }) => {
  const [overview, setOverview]           = useState(null);
  const [surveyByDay, setSurveyByDay]     = useState([]);
  const [dashboard, setDashboard]         = useState(null);
  const [totalAnswered, setTotalAnswered] = useState(null);
  const [answeredBySurvey, setAnsweredBySurvey] = useState({});
  const [loading, setLoading]             = useState(false);

  /* ========= OVERVIEW ========= */
  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getOverview();
      const raw = res.data ?? res;
      const data = raw.data ?? raw;

      setOverview(data);
      return data;
    } catch (err) {
      toast.error("Không lấy được tổng quan hệ thống");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ========= SURVEY BY DAY ========= */
  const fetchSurveyByDay = async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getSurveyByDay();
      const raw = res.data ?? res;
      const data = raw.data ?? [];

      setSurveyByDay(data);
      return data;
    } catch (err) {
      toast.error("Không lấy được thống kê theo ngày");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ========= DASHBOARD ========= */
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getDashboard();
      const raw = res.data ?? res;
      const data = raw.data ?? raw;

      setDashboard(data);
      // Sync luôn các state con nếu cần dùng riêng lẻ
      if (data.overview)    setOverview(data.overview);
      if (data.surveyByDay) setSurveyByDay(data.surveyByDay);
      return data;
    } catch (err) {
      toast.error("Không lấy được dashboard");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ========= TOTAL USERS ANSWERED ========= */
  const fetchTotalUsersAnswered = async () => {
    setLoading(true);
    try {
      const res = await adminStatsService.getTotalUsersAnswered();
      const raw = res.data ?? res;
      const data = raw.data ?? raw;

      setTotalAnswered(data);
      return data;
    } catch (err) {
      toast.error("Không lấy được tổng số người đã trả lời");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ========= USERS ANSWERED BY SURVEY ========= */
  const fetchUsersAnsweredBySurvey = async (surveyId) => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminStatsContext.Provider
      value={{
        overview,
        surveyByDay,
        dashboard,
        totalAnswered,
        answeredBySurvey,
        loading,

        fetchOverview,
        fetchSurveyByDay,
        fetchDashboard,
        fetchTotalUsersAnswered,
        fetchUsersAnsweredBySurvey,

        setOverview,
        setSurveyByDay,
        setDashboard,
        setTotalAnswered,
        setAnsweredBySurvey,
      }}
    >
      {children}
    </AdminStatsContext.Provider>
  );
};

export default AdminStatsProvider;