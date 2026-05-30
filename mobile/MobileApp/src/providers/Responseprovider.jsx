// src/providers/ResponseProvider.jsx
import React, { createContext, useContext, useState } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";
import responseService from "../services/responseService";

export const ResponseContext = createContext();

export const useResponse = () => {
  const context = useContext(ResponseContext);
  if (!context) {
    throw new Error("useResponse must be used within a ResponseProvider");
  }
  return context;
};

// ─── Helper thay thế toast ───────────────────────────────────────────
const showToast = (message, type = "success") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(type === "error" ? "Lỗi" : "Thông báo", message);
  }
};

const ResponseProvider = ({ children }) => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [myResponses, setMyResponses] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [userResponses, setUserResponses] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);

  const [error, setError] = useState(null);

  const unwrap = (res) => res?.data ?? res;

  const handleError = (err, defaultMsg) => {
    const status = err?.response?.status;
    if (status === 403 || status === 404 || status === 410) return;
    const msg = err.response?.data?.message || err.message || defaultMsg;
    setError(msg);
    showToast(msg, "error");
  };

  // ─── START SURVEY SESSION ────────────────────────────────────────
  const startSurvey = async (surveyId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await responseService.startSurvey(surveyId);
      return unwrap(res);
    } catch (err) {
      handleError(err, "Không thể bắt đầu khảo sát");
    } finally {
      setLoading(false);
    }
  };

  // ─── SUBMIT SURVEY ───────────────────────────────────────────────
  const submitSurvey = async (surveyId, payload) => {
    setSubmitting(true);
    setError(null);
    try {
      if (!payload || !Array.isArray(payload.answers)) {
        throw new Error("Payload không hợp lệ");
      }
      const res = await responseService.submitSurvey(surveyId, payload);
      showToast("Gửi khảo sát thành công!");
      return unwrap(res);
    } catch (err) {
      handleError(err, "Gửi khảo sát thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── GET MY SUBMISSION ───────────────────────────────────────────
  const getMySubmission = async (surveyId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await responseService.getMySubmission(surveyId);
      const data = unwrap(res);
      setMySubmission(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được bài đã submit");
    } finally {
      setLoading(false);
    }
  };

  // ─── GET ALL MY RESPONSES ────────────────────────────────────────
  const getAllMyResponses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await responseService.getAllMyResponses();
      const data = unwrap(res);
      setMyResponses(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được danh sách response");
    } finally {
      setLoading(false);
    }
  };

  // ─── ADMIN: GET USER SUBMISSION ──────────────────────────────────
  const getUserSubmission = async (surveyId, userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await responseService.getUserSubmission(surveyId, userId);
      const data = unwrap(res);
      setUserSubmission(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được submission của user");
    } finally {
      setLoading(false);
    }
  };

  // ─── ADMIN: GET ALL USER RESPONSES ──────────────────────────────
  const getAllUserResponses = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await responseService.getAllUserResponses(userId);
      const data = unwrap(res);
      setUserResponses(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được response của user");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <ResponseContext.Provider
      value={{
        submitting,
        loading,
        error,
        myResponses,
        mySubmission,
        userResponses,
        userSubmission,
        startSurvey,
        submitSurvey,
        getMySubmission,
        getAllMyResponses,
        getUserSubmission,
        getAllUserResponses,
        clearError,
      }}
    >
      {children}
    </ResponseContext.Provider>
  );
};

export default ResponseProvider;