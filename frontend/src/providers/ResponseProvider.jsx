import React, { createContext, useContext, useState } from "react";
import responseService from "@/services/responseService";
import { toast } from "react-toastify";
import { emitGamificationRefresh } from "@/contexts/GamificationContext";

export const ResponseContext = createContext();

export const useResponse = () => {
  const context = useContext(ResponseContext);
  if (!context) {
    throw new Error("useResponse must be used within a ResponseProvider");
  }
  return context;
};

const ResponseProvider = ({ children }) => {
  // 🔹 states
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [myResponses, setMyResponses] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [userResponses, setUserResponses] = useState([]);
  const [userSubmission, setUserSubmission] = useState(null);

  const [error, setError] = useState(null);

  // 🔹 helper unwrap API envelope { message, data }
  const unwrap = (res) => res?.data ?? res;

  // 🔹 helper handle error
  const handleError = (err, defaultMsg) => {
    const msg =
      err.response?.data?.message ||
      err.message ||
      defaultMsg;

    setError(msg);
    toast.error(msg);
    throw err;
  };

  // =========================================
  // 🟢 START SURVEY SESSION
  // =========================================
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

      const res = await responseService.submitSurvey(surveyId, payload);
      const data = unwrap(res);

      // Show gamification notification
      const stars = data?.stars_earned ?? 0;
      const rewardType = data?.reward_type || "";
      if (stars > 0) {
        const emoji = stars >= 100 ? "💠" : stars >= 50 ? "⭐" : "✨";
        const typeLabel = rewardType === "FIRST_RESPONDER" ? "Người đầu tiên"
          : rewardType === "SECOND_RESPONDER" ? "Người thứ 2"
          : rewardType === "THIRD_RESPONDER" ? "Người thứ 3"
          : "Tham gia khảo sát";
        toast.success(
          `${emoji} Hoàn thành khảo sát! Bạn nhận được +${stars} sao (${typeLabel})`,
          { position: "bottom-right", autoClose: 5000, theme: "light" }
        );
      } else {
        toast.success("Gửi khảo sát thành công!");
      }

      // Refresh gamification balance in header/dashboard
      emitGamificationRefresh();

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
      const res = await responseService.getMySubmission(surveyId);
      // API trả về { message: "...", data: { response_id, survey_id, submitted_at, answers[] } }
      const data = unwrap(res);
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

  // =========================================
  // 🔴 ADMIN - GET USER SUBMISSION
  // =========================================
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

  // =========================================
  // 🔴 ADMIN - GET ALL USER RESPONSES
  // =========================================
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