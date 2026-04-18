// ─── ResponseProvider.native.jsx ─────────────────────────────────
import React, { createContext, useContext, useState } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

import responseService from "../services/responseService";

export const ResponseContext = createContext();

export const useResponse = () => {
  const context = useContext(ResponseContext);
  if (!context) {
    throw new Error("useResponse must be used within a ResponseProvider");
  }
  return context;
};

const ResponseProvider = ({ children }) => {
  const [submitting, setSubmitting]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const [myResponses, setMyResponses]     = useState([]);
  const [mySubmission, setMySubmission]   = useState(null);
  const [userResponses, setUserResponses] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);
  const [error, setError]                 = useState(null);

  const handleError = (err, defaultMsg) => {
    const msg = err.response?.data?.message || err.message || defaultMsg;
    setError(msg);
    Toast.show({ type: "error", text1: msg });
    throw err;
  };

  // =========================================
  // SUBMIT SURVEY
  // =========================================
  const submitSurvey = async (surveyId, payload) => {
    setSubmitting(true);
    setError(null);
    try {
      if (!payload || !Array.isArray(payload.answers)) {
        throw new Error("Payload không hợp lệ");
      }
      const data = await responseService.submitSurvey(surveyId, payload);
      Toast.show({ type: "success", text1: "Gửi khảo sát thành công!" });
      return data;
    } catch (err) {
      handleError(err, "Gửi khảo sát thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================
  // GET MY SUBMISSION (1 survey)
  // =========================================
  const getMySubmission = async (surveyId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await responseService.getMySubmission(surveyId);
      setMySubmission(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được bài đã submit");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // GET ALL MY RESPONSES
  // =========================================
  const getAllMyResponses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await responseService.getAllMyResponses();
      setMyResponses(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được danh sách response");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ADMIN - GET USER SUBMISSION
  // =========================================
  const getUserSubmission = async (surveyId, userId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await responseService.getUserSubmission(surveyId, userId);
      setUserSubmission(data);
      return data;
    } catch (err) {
      handleError(err, "Không lấy được submission của user");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ADMIN - GET ALL USER RESPONSES
  // =========================================
  const getAllUserResponses = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await responseService.getAllUserResponses(userId);
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