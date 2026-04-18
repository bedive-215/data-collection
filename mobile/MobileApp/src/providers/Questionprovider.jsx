// ─── QuestionProvider.native.jsx ─────────────────────────────────
// React Native version of QuestionProvider
//
// Thay đổi so với bản web:
//   - window.confirm  → Alert.alert (React Native built-in)
//   - react-toastify  → react-native-toast-message
//
// Cài dependency:
//   npm install react-native-toast-message
//
// Thêm <Toast /> vào root layout (App.jsx hoặc NavigationContainer):
//   import Toast from "react-native-toast-message";
//   ...
//   <NavigationContainer>
//     ...
//   </NavigationContainer>
//   <Toast />   ← đặt NGOÀI NavigationContainer, cuối cùng

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

import questionService from "../services/questionService";

export const QuestionContext = createContext();

export const useQuestion = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error("useQuestion must be used within a QuestionProvider");
  }
  return context;
};

const QuestionProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  /* =========================
        NORMALIZE
  ========================= */
  const normalize = (q) => ({
    id:          q.id,
    survey_id:   q.survey_id,
    content:     q.content,
    type:        q.type,
    required:    q.required,
    order_index: q.order_index,
    options:     q.options || [],
  });

  /* =========================
        CREATE QUESTION
  ========================= */
  const createQuestion = async (surveyId, payload) => {
    setLoading(true);
    setError(null);

    try {
      const res  = await questionService.createQuestion(surveyId, payload);
      const data = res.data ?? res;

      const created = normalize(data.question);
      setQuestions((prev) => [...prev, created]);

      Toast.show({ type: "success", text1: "Tạo câu hỏi thành công!" });
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo câu hỏi thất bại";
      setError(msg);
      Toast.show({ type: "error", text1: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* =========================
        GET QUESTIONS BY SURVEY
  ========================= */
  const fetchQuestionsBySurvey = useCallback(async (surveyId) => {
    setLoading(true);
    setError(null);

    try {
      const res  = await questionService.getQuestionsBySurvey(surveyId);
      const data = res.data ?? res;

      const list = (data.questions || []).map(normalize);
      setQuestions(list);

      return list;
    } catch (err) {
      const msg = err.response?.data?.message || "Không lấy được danh sách câu hỏi";
      setError(msg);
      Toast.show({ type: "error", text1: msg });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================
        DELETE QUESTION
  ========================= */
  const deleteQuestion = (questionId) => {
    // window.confirm không tồn tại trong React Native → dùng Alert.alert
    return new Promise((resolve) => {
      Alert.alert(
        "Xác nhận xóa",
        "Bạn có chắc chắn muốn xóa câu hỏi này?",
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
                await questionService.deleteQuestion(questionId);
                setQuestions((prev) => prev.filter((q) => q.id !== questionId));
                Toast.show({ type: "success", text1: "Xóa câu hỏi thành công!" });
                resolve(true);
              } catch (err) {
                const msg = err.response?.data?.message || "Xóa câu hỏi thất bại";
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

  /* =========================
        CLEAR ERROR
  ========================= */
  const clearError = () => setError(null);

  return (
    <QuestionContext.Provider
      value={{
        questions,
        loading,
        error,

        createQuestion,
        fetchQuestionsBySurvey,
        deleteQuestion,

        setQuestions,
        clearError,
      }}
    >
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionProvider;