// src/providers/SurveyProvider.jsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { Alert, Linking, Platform, ToastAndroid } from "react-native";
import surveyService from "../services/surveyService";
import questionService from "../services/questionService";

export const SurveyContext = createContext(null);

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) throw new Error("useSurvey must be used within SurveyProvider");
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

// ─── Helpers ────────────────────────────────────────────────────────

function extractShareUrlFromBody(body) {
  if (body == null) return null;
  if (typeof body === "string") return body;
  return (
    body.url ??
    body.share_url ??
    body.shareUrl ??
    body.link ??
    body?.data?.url ??
    body?.data?.share_url ??
    null
  );
}

/**
 * React Native không có window.location.
 * Trả nguyên URL từ BE (deep link hoặc web URL).
 * Nếu BE trả path tương đối thì ghép với BASE_URL của apiClient.
 */
function normalizeShareUrlForRN(rawUrl, _surveyId) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  // Nếu là absolute URL thì dùng thẳng
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  // Nếu là path tương đối → ghép domain (đổi thành domain thật)
  return `https://your-api-domain.com${rawUrl}`;
}

function pickSurveyFromResponseBody(body) {
  if (body == null || typeof body !== "object") return null;
  if (body.survey != null && typeof body.survey === "object" && !Array.isArray(body.survey)) {
    return body.survey;
  }
  if (body.data != null && typeof body.data === "object" && !Array.isArray(body.data)) {
    const d = body.data;
    if (d.id != null || d.title != null) return d;
  }
  if (body.id != null || body.title != null) return body;
  return null;
}

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
  is_anonymous: survey.is_anonymous ?? false,
  max_responses: survey.max_responses ?? null,
  randomize_questions: survey.randomize_questions ?? false,
  randomize_options: survey.randomize_options ?? false,
  time_limit_seconds: survey.time_limit_seconds ?? null,
  show_progress_bar: survey.show_progress_bar ?? true,
  allow_back: survey.allow_back ?? true,
  one_question_per_page: survey.one_question_per_page ?? true,
  thank_you_message: survey.thank_you_message ?? null,
  logo_url: survey.logo_url ?? null,
  background_url: survey.background_url ?? null,
  accent_color: survey.accent_color ?? "#6366f1",
  show_correct_answers: survey.show_correct_answers ?? false,
  sections: (survey.sections || []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    order_index: s.order_index,
    icon: s.icon,
    cover_url: s.cover_url,
    min_required: s.min_required,
    show_progress: s.show_progress ?? true,
    question_count: s.questions ? s.questions.length : 0,
  })),
  questions: (survey.questions || []).map((q) => ({
    id: q.id,
    section_id: q.section_id || null,
    content: q.content || "",
    description: q.description || null,
    placeholder: q.placeholder || null,
    type: q.type || "TEXT",
    required: q.required || false,
    order_index: q.order_index || 0,
    settings: q.settings || {},
    media_url: q.media_url || null,
    media_type: q.media_type || null,
    condition: q.condition || null,
    hidden_from_analytics: q.hidden_from_analytics ?? false,
    next_question_id: q.next_question_id || null,
    next_section_id: q.next_section_id || null,
    options: (q.options || []).map((o) => ({
      id: o.id,
      label: o.label || "",
      value: o.value || "",
      order_index: o.order_index || 0,
      is_other: o.is_other ?? false,
    })),
  })),
});

// ─── Provider ───────────────────────────────────────────────────────

const SurveyProvider = ({ children }) => {
  const [mySurveys, setMySurveys] = useState([]);
  const [publicSurveys, setPublicSurveys] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = () => { setLoading(true); setError(null); };
  const stopLoading  = () => setLoading(false);
  const clearError   = () => setError(null);

  const handleError = (err, fallback) => {
    const status = err?.response?.status;
    if (status === 403 || status === 404 || status === 410) return;
    console.error(err);
    const message = err?.response?.data?.message || err?.message || fallback;
    setError(message);
    showToast(message, "error");
  };

  // ─── CREATE ──────────────────────────────────────────────────────
  const createSurvey = useCallback(async (payload) => {
    try {
      startLoading();
      const res = await surveyService.createSurvey(payload);
      const data = res?.data ?? res;
      const raw = pickSurveyFromResponseBody(data);
      const survey = normalizeSurvey(raw || {});
      if (!survey.id) throw new Error("Phản hồi tạo khảo sát không có id");
      setMySurveys((p) => [survey, ...p]);
      setSurveys((p) => [survey, ...p]);
      showToast("Tạo khảo sát thành công");
      return survey;
    } catch (err) {
      handleError(err, "Tạo khảo sát thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─── CREATE FLOW ─────────────────────────────────────────────────
  const createSurveyFlow = useCallback(async (payload, extras = {}, onProgress) => {
    const {
      inviteEmails = [],
      inviteRole = "viewer",
      publishNow = false,
      createShareLink = false,
      draftQuestions = [],
    } = extras;

    onProgress?.("create");
    let survey;
    try {
      const res = await surveyService.createSurvey(payload);
      const data = res?.data ?? res;
      const raw = pickSurveyFromResponseBody(data);
      survey = normalizeSurvey(raw || {});
      if (!survey.id) {
        const err = new Error("Phản hồi tạo khảo sát không có id");
        handleError(err, "Tạo khảo sát thất bại");
        onProgress?.("done");
        throw err;
      }
      setMySurveys((p) => [survey, ...p.filter((s) => s.id !== survey.id)]);
      setSurveys((p) => [survey, ...p.filter((s) => s.id !== survey.id)]);
    } catch (err) {
      handleError(err, "Tạo khảo sát thất bại");
      onProgress?.("done");
      throw err;
    }

    const emails = [...new Set(inviteEmails.map((e) => String(e).trim()).filter(Boolean))];
    const CHOICE = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];
    const questionPayload = [];

    if (Array.isArray(draftQuestions)) {
      for (const d of draftQuestions) {
        const content = String(d?.content ?? "").trim();
        if (!content) continue;
        const type = d?.type || "TEXT";
        const row = { content, type, required: !!d?.required, order_index: questionPayload.length };

        if (CHOICE.includes(type)) {
          const rawOpts = Array.isArray(d?.options) ? d.options : [];
          const seen = new Set();
          const options = [];
          for (let i = 0; i < rawOpts.length; i += 1) {
            const label = String(rawOpts[i]?.label ?? "").trim();
            const value = String(rawOpts[i]?.value ?? "").trim();
            if (!label || !value || seen.has(value)) continue;
            seen.add(value);
            options.push({ label, value, order_index: options.length });
          }
          if (options.length < 2) continue;
          row.options = options;
        } else if (type === "NUMBER" && d?.settings && typeof d.settings === "object") {
          const out = {};
          if (d.settings.min !== "" && d.settings.min != null && Number.isFinite(Number(d.settings.min))) out.min = Number(d.settings.min);
          if (d.settings.max !== "" && d.settings.max != null && Number.isFinite(Number(d.settings.max))) out.max = Number(d.settings.max);
          if (Object.keys(out).length) row.settings = out;
        } else if (type === "RATING") {
          row.settings = { min: Number(d?.settings?.min ?? 1), max: Number(d?.settings?.max ?? 5) };
        } else if (type === "DATE" && d?.settings && typeof d.settings === "object") {
          row.settings = d.settings;
        }
        questionPayload.push(row);
      }
    }

    let shareUrl = null;
    let inviteResult = null;
    let didPublish = false;
    let didInvite = false;
    let didShare = false;
    let didQuestions = false;

    if (questionPayload.length && survey.id) {
      onProgress?.("questions");
      try {
        await questionService.bulkCreateQuestions(survey.id, questionPayload);
        didQuestions = true;
      } catch (err) {
        console.error(err);
        showToast(err?.response?.data?.message || "Không thêm được câu hỏi — khảo sát vẫn đã được tạo.", "error");
      }
    }

    if (emails.length && survey.id) {
      onProgress?.("invite");
      try {
        const invRes = await surveyService.bulkInviteSurvey(survey.id, { emails, role: inviteRole });
        inviteResult = invRes?.data ?? invRes;
        didInvite = true;
      } catch (err) {
        console.error(err);
        showToast(err?.response?.data?.message || "Gửi lời mời thất bại — khảo sát vẫn đã được tạo.", "error");
      }
    }

    if (publishNow && survey.id) {
      onProgress?.("publish");
      try {
        const pubRes = await surveyService.publishSurvey(survey.id, {});
        const pubData = pubRes?.data ?? pubRes;
        const pubRaw = pickSurveyFromResponseBody(pubData) || survey;
        survey = normalizeSurvey(pubRaw);
        setMySurveys((p) => p.map((s) => (s.id === survey.id ? survey : s)));
        setSurveys((p) => p.map((s) => (s.id === survey.id ? survey : s)));
        didPublish = true;
      } catch (err) {
        console.error(err);
        showToast(err?.response?.data?.message || "Không publish được — khảo sát vẫn đã được tạo.", "error");
      }
    }

    if (createShareLink && survey.id) {
      onProgress?.("share");
      try {
        const shRes = await surveyService.shareSurveyLink(survey.id);
        const body = shRes?.data ?? shRes;
        shareUrl = normalizeShareUrlForRN(extractShareUrlFromBody(body), survey.id);
        didShare = !!shareUrl;
      } catch (err) {
        console.error(err);
        showToast(err?.response?.data?.message || "Không tạo được link chia sẻ.", "error");
      }
    }

    onProgress?.("done");

    const parts = ["Đã tạo khảo sát thành công"];
    if (didQuestions) parts.push(`đã thêm ${questionPayload.length} câu hỏi`);
    if (didInvite) {
      const n = inviteResult?.created ?? inviteResult?.success ?? emails.length;
      parts.push(`đã mời ${n} email`);
    }
    if (didPublish) parts.push("đã công khai");
    if (didShare) parts.push("đã có link chia sẻ");
    showToast(parts.join(" · "));

    return { survey, shareUrl, inviteResult, didQuestions };
  }, []);

  // ─── FETCH ───────────────────────────────────────────────────────
  const fetchMySurveys = useCallback(async (page = 1, limit = 10) => {
    try {
      startLoading();
      const res = await surveyService.getMySurveys({ page, limit });
      const data = res?.data ?? res;
      const list = (data?.data || data?.surveys || []).map(normalizeSurvey);
      setMySurveys(list);
      setSurveys(list);
      return list;
    } catch (err) {
      handleError(err, "Không lấy được khảo sát của bạn");
    } finally {
      stopLoading();
    }
  }, []);

  const fetchPublicSurveys = useCallback(async (params = {}) => {
    try {
      startLoading();
      const res = await surveyService.getPublicSurveys(params);
      const data = res?.data ?? res;
      const list = (data?.data || data?.surveys || []).map(normalizeSurvey);
      setPublicSurveys(list);
      return list;
    } catch (err) {
      handleError(err, "Không tải được khảo sát công khai");
    } finally {
      stopLoading();
    }
  }, []);

  const fetchSurveyById = useCallback(async (id, token = null) => {
    try {
      startLoading();
      const res = token
        ? await surveyService.getSurveyByAccessToken(id, token)
        : await surveyService.getSurveyById(id);
      const data = res?.data ?? res;
      const raw = pickSurveyFromResponseBody(data);
      const survey = normalizeSurvey(raw || {});
      setCurrentSurvey(survey);
      return survey;
    } catch (err) {
      handleError(err, "Không tìm thấy khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  // ─── UPDATE / DELETE ─────────────────────────────────────────────
  const updateSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.updateSurvey(id, payload);
      const data = res?.data ?? res;
      const raw = pickSurveyFromResponseBody(data);
      const updated = normalizeSurvey(raw || {});
      const update = (prev) => prev.map((s) => (s.id === id ? updated : s));
      setMySurveys(update);
      setSurveys(update);
      setCurrentSurvey(updated);
      showToast("Cập nhật thành công");
      return updated;
    } catch (err) {
      handleError(err, "Cập nhật thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  const deleteSurvey = useCallback(
    (id) =>
      new Promise((resolve, reject) => {
        Alert.alert(
          "Xác nhận xóa",
          "Bạn có chắc muốn xóa khảo sát này?",
          [
            { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Xóa",
              style: "destructive",
              onPress: async () => {
                try {
                  startLoading();
                  await surveyService.deleteSurveyById(id);
                  const remove = (prev) => prev.filter((s) => s.id !== id);
                  setMySurveys(remove);
                  setSurveys(remove);
                  showToast("Xóa thành công");
                  resolve(true);
                } catch (err) {
                  handleError(err, "Xóa thất bại");
                  reject(err);
                } finally {
                  stopLoading();
                }
              },
            },
          ]
        );
      }),
    []
  );

  // ─── STATUS ──────────────────────────────────────────────────────
  const closeSurvey = useCallback(async (id) => {
    try {
      startLoading();
      await surveyService.closeSurvey(id);
      const endAt = new Date().toISOString();
      const patch = (prev) => prev.map((s) => (s.id === id ? { ...s, end_at: endAt, status: "CLOSED" } : s));
      setSurveys(patch);
      setMySurveys(patch);
      setCurrentSurvey(prev => prev?.id === id ? { ...prev, end_at: endAt, status: "CLOSED" } : prev);
      showToast("Đã đóng khảo sát");
      return true;
    } catch (err) {
      handleError(err, "Không thể đóng khảo sát");
    } finally {
      stopLoading();
    }
  }, []);

  const publishSurvey = useCallback(async (id, payload) => {
    try {
      startLoading();
      const res = await surveyService.publishSurvey(id, payload);
      const data = res?.data ?? res;
      const raw = pickSurveyFromResponseBody(data);
      const updated = normalizeSurvey(raw || {});
      const update = (prev) => prev.map((s) => (s.id === id ? updated : s));
      setSurveys(update);
      setMySurveys(update);
      setCurrentSurvey(updated);
      return updated;
    } catch (err) {
      handleError(err, "Publish thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // ─── SHARE LINK ──────────────────────────────────────────────────
  // Không dùng startLoading/stopLoading (tránh re-render toàn bộ grid → unmount modal)
  const shareLink = useCallback(async (id) => {
    try {
      const res = await surveyService.shareSurveyLink(id);
      const body = res?.data ?? res;
      const url = normalizeShareUrlForRN(extractShareUrlFromBody(body), id);
      if (url) {
        showToast("Tạo link thành công");
        return url;
      }
      showToast("Không lấy được link chia sẻ", "error");
      return undefined;
    } catch (err) {
      handleError(err, "Share thất bại");
    }
  }, []);

  // ─── INVITE ──────────────────────────────────────────────────────
  const inviteSurvey = useCallback(async (id, payload) => {
    try {
      const res = await surveyService.inviteSurvey(id, payload);
      showToast("Mời thành công");
      return res?.data ?? res;
    } catch (err) {
      handleError(err, "Invite thất bại");
    }
  }, []);

  const bulkInviteSurvey = useCallback(async (id, payload) => {
    try {
      const res = await surveyService.bulkInviteSurvey(id, payload);
      showToast("Mời hàng loạt thành công");
      return res?.data ?? res;
    } catch (err) {
      handleError(err, "Bulk invite thất bại");
    }
  }, []);

  // ─── PARTICIPANTS ─────────────────────────────────────────────────
  // Không dùng startLoading/stopLoading để tránh infinite loop trong modal
  const getParticipants = useCallback(async (id, params = {}) => {
    try {
      const res = await surveyService.getParticipants(id, params);
      const data = res?.data ?? res;
      return {
        count: data?.count ?? 0,
        participants: data?.participants ?? data?.data ?? [],
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const deleteParticipant = useCallback(async (id, pid) => {
    try {
      await surveyService.deleteParticipant(id, pid);
      showToast("Xóa participant thành công");
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  // ─── MEMO ────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      surveys, mySurveys, publicSurveys, currentSurvey, loading, error,
      createSurvey, createSurveyFlow,
      fetchMySurveys, fetchPublicSurveys, fetchSurveyById,
      updateSurvey, deleteSurvey, closeSurvey, publishSurvey,
      shareLink, inviteSurvey, bulkInviteSurvey,
      getParticipants, deleteParticipant,
      setCurrentSurvey, clearError,
    }),
    [
      surveys, mySurveys, publicSurveys, currentSurvey, loading, error,
      createSurvey, createSurveyFlow,
      fetchMySurveys, fetchPublicSurveys, fetchSurveyById,
      updateSurvey, deleteSurvey, closeSurvey, publishSurvey,
      shareLink, inviteSurvey, bulkInviteSurvey,
      getParticipants, deleteParticipant,
    ]
  );

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider;