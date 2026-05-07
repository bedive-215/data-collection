// src/providers/ResponseProvider.jsx  (React Native)
//
// Thay đổi so với web:
//   - import từ "react-toastify" → Alert từ "react-native"
//   - @/ alias → relative imports
//   - toast.error() / toast.success() → Alert.alert() + showToast helper
//
// Nếu bạn dùng thư viện toast cho RN (react-native-toast-message, sonner-native…)
// thì thay Alert.alert() trong showToast bằng Toast.show() tương ứng.

import React, { createContext, useContext, useState } from "react";
import { Alert } from "react-native";
import responseService from "../services/responseService";

export const ResponseContext = createContext();

export const useResponse = () => {
  const context = useContext(ResponseContext);
  if (!context) {
    throw new Error("useResponse must be used within a ResponseProvider");
  }
  return context;
};

// ── Toast helper ─────────────────────────────────────────────────────────────
// Đổi thành Toast.show() nếu bạn cài react-native-toast-message
const showToast = (type, message) => {
  if (type === "error") {
    Alert.alert("Lỗi", message);
  } else {
    Alert.alert("Thành công", message);
  }
};

const ResponseProvider = ({ children }) => {
  // 🔹 states
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(false);

  const [myResponses, setMyResponses]       = useState([]);
  const [mySubmission, setMySubmission]     = useState(null);
  const [userResponses, setUserResponses]   = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);

  const [error, setError] = useState(null);

  // 🔹 helper handle error
  const handleError = (err, defaultMsg) => {
    const msg =
      err.response?.data?.message ||
      err.message ||
      defaultMsg;

    setError(msg);
    showToast("error", msg);
    throw err;
  };

  // =========================================
  // 🟢 SUBMIT SURVEY
  // =========================================
  const submitSurvey = async (surveyId, payload) => {
    setSubmitting(true);
    setError(null);

    try {
      if (!payload || !Array.isArray(payload.answers)) {
        throw new Error("Payload không hợp lệ");
      }

      const data = await responseService.submitSurvey(surveyId, payload);

      showToast("success", "Gửi khảo sát thành công!");
      return data;
    } catch (err) {
      handleError(err, "Gửi khảo sát thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================
  // 🟢 GET MY SUBMISSION (1 survey)
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
  // 🟢 GET ALL MY RESPONSES
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
  // 🔴 ADMIN - GET USER SUBMISSION
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
  // 🔴 ADMIN - GET ALL USER RESPONSES
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

  // =========================================
  // 🧹 CLEAR ERROR
  // =========================================
  const clearError = () => setError(null);

  return (
    <ResponseContext.Provider
      value={{
        // states
        submitting,
        loading,
        error,

        myResponses,
        mySubmission,
        userResponses,
        userSubmission,

        // actions
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