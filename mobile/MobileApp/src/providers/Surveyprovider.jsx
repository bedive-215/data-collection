// ─── SurveyProvider.native.jsx ───────────────────────────────────
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

import surveyService from "../services/surveyService";

export const SurveyContext = createContext();

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within a SurveyProvider");
  }
  return context;
};

const SurveyProvider = ({ children }) => {
  const [surveys, setSurveys]           = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const normalizeSurvey = (s) => ({
    id:          s.id,
    title:       s.title,
    description: s.description,
    created_by:  s.created_by,
    createdAt:   s.createdAt,
    updatedAt:   s.updatedAt,
  });

  // ================= CREATE =================
  const createSurvey = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await surveyService.createSurvey(payload);
      const data = res.data ?? res;

      const created = normalizeSurvey(data.survey);
      setSurveys((prev) => [created, ...prev]);

      Toast.show({ type: "success", text1: "Tạo survey thành công!" });
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo survey thất bại";
      setError(msg);
      Toast.show({ type: "error", text1: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ================= GET BY ID =================
  const fetchSurveyById = useCallback(async (surveyId) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await surveyService.getSurveyById(surveyId);
      const data = res.data ?? res;

      const survey = normalizeSurvey(data.survey);
      setCurrentSurvey(survey);
      return survey;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy survey";
      setError(msg);
      Toast.show({ type: "error", text1: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= GET BY USER =================
  const fetchSurveyByUserId = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await surveyService.getSurveyByUserId(userId);
      const data = res.data ?? res;

      const list = (data.surveys || []).map(normalizeSurvey);
      setSurveys(list);
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Không lấy được danh sách survey";
      setError(msg);
      Toast.show({ type: "error", text1: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= GET ALL =================
  const fetchAllSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await surveyService.getAllSurveys();
      const data = res.data ?? res;

      const list = (data.surveys || []).map(normalizeSurvey);
      setSurveys(list);
      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Không lấy được surveys";
      setError(msg);
      Toast.show({ type: "error", text1: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= DELETE =================
  // window.confirm → Alert.alert, wrap Promise để vẫn trả true/false
  const deleteSurvey = (surveyId) => {
    return new Promise((resolve) => {
      Alert.alert(
        "Xác nhận xóa",
        "Bạn có chắc chắn muốn xóa survey này?",
        [
          {
            text: "Hủy",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              setError(null);
              try {
                await surveyService.deleteSurveyById(surveyId);

                setSurveys((prev) => prev.filter((item) => item.id !== surveyId));

                if (currentSurvey?.id === surveyId) {
                  setCurrentSurvey(null);
                }

                Toast.show({ type: "success", text1: "Xóa survey thành công!" });
                resolve(true);
              } catch (err) {
                const msg = err.response?.data?.message || "Xóa survey thất bại";
                setError(msg);
                Toast.show({ type: "error", text1: msg });
                resolve(false);
                throw err;
              } finally {
                setLoading(false);
              }
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  };

  const clearError = () => setError(null);

  return (
    <SurveyContext.Provider
      value={{
        surveys,
        currentSurvey,
        loading,
        error,
        createSurvey,
        fetchSurveyById,
        fetchSurveyByUserId,
        fetchAllSurveys,
        deleteSurvey,
        setSurveys,
        setCurrentSurvey,
        clearError,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider;