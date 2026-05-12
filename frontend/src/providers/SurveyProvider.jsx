import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
} from "react";

import surveyService from "@/services/surveyService";
import questionService from "@/services/questionService";
import { toast } from "react-toastify";

export const SurveyContext = createContext(null);

export const useSurvey = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within SurveyProvider");
  }
  return context;
};

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

/** BE trả full URL (đôi khi path `/surveys/...`); SPA dùng `/user/survey/:id`. */
function normalizeShareUrlForSpa(rawUrl, surveyId) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  if (typeof window === "undefined") return rawUrl;
  try {
    const u = new URL(rawUrl, window.location.origin);
    const token = u.searchParams.get("access_token");
    const segments = u.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    const idFromPath = segments.length ? segments[segments.length - 1] : null;
    const id = surveyId ?? idFromPath;
    if (token && id) {
      return `${window.location.origin}/user/survey/${id}?access_token=${encodeURIComponent(token)}`;
    }
  } catch {
    /* ignore */
  }
  return rawUrl;
}

/**
 * BE thường trả { message, data: <một survey> }; một số route dùng { survey }.
 * Axios: res.data là object JSON gốc.
 */
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
  questions: (survey.questions || []).map((q) => ({
    id: q.id,
    content: q.content || "",
    type: q.type || "TEXT",
    required: q.required || false,
    order_index: q.order_index || 0,
    options: (q.options || []).map((o) => ({
      id: o.id,
      label: o.label || "",
      value: o.value || "",
      order_index: o.order_index || 0,
    })),
  })),
});

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
    console.error(err);
    const message = err?.response?.data?.message || err?.message || fallback;
    setError(message);
    toast.error(message);
    throw err;
  };

  const createSurvey = useCallback(async (payload) => {
    try {
      startLoading();
      const res = await surveyService.createSurvey(payload);
      const data = res?.data ?? res;
      const raw = pickSurveyFromResponseBody(data);
      const survey = normalizeSurvey(raw || {});
      if (!survey.id) {
        console.error("[SurveyProvider] createSurvey: missing id", data);
        throw new Error("Phản hồi tạo khảo sát không có id");
      }
      setMySurveys((p) => [survey, ...p]);
      setSurveys((p) => [survey, ...p]);
      toast.success("Tạo khảo sát thành công");
      return survey;
    } catch (err) {
      handleError(err, "Tạo khảo sát thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  /**
   * Tuần tự: tạo survey → (tuỳ chọn) thêm câu hỏi → mời (PRIVATE) → publish → share.
   * Lưu ý BE: bulk invite chỉ khi PRIVATE — nên mời TRƯỚC publish.
   * onProgress?.("create"|"questions"|"invite"|"publish"|"share"|"done")
   */
  const createSurveyFlow = useCallback(async (payload, extras = {}, onProgress) => {
    const {
      inviteEmails = [],
      inviteRole = "viewer",
      publishNow = false,
      createShareLink = false,
      /** Mảng object: { content, type, required?, settings?, options? } — đã validate ở UI */
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
        console.error("[SurveyProvider] createSurveyFlow: missing id after create", data);
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
        const row = {
          content,
          type,
          required: !!d?.required,
          order_index: questionPayload.length,
        };
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
          if (d.settings.min !== "" && d.settings.min != null && Number.isFinite(Number(d.settings.min))) {
            out.min = Number(d.settings.min);
          }
          if (d.settings.max !== "" && d.settings.max != null && Number.isFinite(Number(d.settings.max))) {
            out.max = Number(d.settings.max);
          }
          if (Object.keys(out).length) row.settings = out;
        } else if (type === "RATING") {
          const min = Number(d?.settings?.min ?? 1);
          const max = Number(d?.settings?.max ?? 5);
          row.settings = { min, max };
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
        toast.warn(err?.response?.data?.message || "Không thêm được câu hỏi — khảo sát vẫn đã được tạo.");
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
        toast.warn(err?.response?.data?.message || "Gửi lời mời thất bại — khảo sát vẫn đã được tạo.");
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
        toast.warn(err?.response?.data?.message || "Không publish được — khảo sát vẫn đã được tạo.");
      }
    }

    if (createShareLink && survey.id) {
      onProgress?.("share");
      try {
        const shRes = await surveyService.shareSurveyLink(survey.id);
        const body = shRes?.data ?? shRes;
        shareUrl = normalizeShareUrlForSpa(extractShareUrlFromBody(body), survey.id);
        didShare = !!shareUrl;
      } catch (err) {
        console.error(err);
        toast.warn(err?.response?.data?.message || "Không tạo được link chia sẻ.");
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
    toast.success(parts.join(" · "));

    return { survey, shareUrl, inviteResult, didQuestions };
  }, []);

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
      toast.success("Cập nhật thành công");
      return updated;
    } catch (err) {
      handleError(err, "Cập nhật thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  const deleteSurvey = useCallback(async (id) => {
    try {
      startLoading();
      await surveyService.deleteSurveyById(id);
      const remove = (prev) => prev.filter((s) => s.id !== id);
      setMySurveys(remove);
      setSurveys(remove);
      toast.success("Xóa thành công");
      return true;
    } catch (err) {
      handleError(err, "Xóa thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  const closeSurvey = useCallback(async (id) => {
    try {
      startLoading();
      await surveyService.closeSurvey(id);
      const endAt = new Date().toISOString();
      const patch = (prev) => prev.map((s) => (s.id === id ? { ...s, end_at: endAt } : s));
      setSurveys(patch);
      setMySurveys(patch);
      toast.success("Đã đóng khảo sát");
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
      return updated;
    } catch (err) {
      handleError(err, "Publish thất bại");
    } finally {
      stopLoading();
    }
  }, []);

  // Không dùng startLoading/stopLoading: SurveysLayout gán `loading` vào UI "My Surveys"
  // → spinner thay cả grid → MySurveyCard + ShareLinkModal bị unmount → mất shareUrl dù API OK.
  const shareLink = useCallback(async (id) => {
    try {
      const res = await surveyService.shareSurveyLink(id);
      const body = res?.data ?? res;
      let url = extractShareUrlFromBody(body);
      url = normalizeShareUrlForSpa(url, id);
      if (url) {
        toast.success("Tạo link thành công");
        return url;
      }
      toast.error("Không lấy được link chia sẻ");
      return undefined;
    } catch (err) {
      handleError(err, "Share thất bại");
    }
  }, []);

  const inviteSurvey = useCallback(async (id, payload) => {
    try {
      const res = await surveyService.inviteSurvey(id, payload);
      toast.success("Mời thành công");
      return res?.data ?? res;
    } catch (err) {
      handleError(err, "Invite thất bại");
    }
  }, []);

  const bulkInviteSurvey = useCallback(async (id, payload) => {
    try {
      const res = await surveyService.bulkInviteSurvey(id, payload);
      toast.success("Mời hàng loạt thành công");
      return res?.data ?? res;
    } catch (err) {
      handleError(err, "Bulk invite thất bại");
    }
  }, []);

  // ─── QUAN TRỌNG: KHÔNG dùng startLoading/stopLoading ở đây ───
  // Lý do: gọi setLoading sẽ khiến toàn bộ context re-render,
  // làm mới object getParticipants → trigger useEffect trong modal → infinite loop
  const getParticipants = useCallback(async (id, params = {}) => {
    try {
      const res = await surveyService.getParticipants(id, params);
      const data = res?.data ?? res;
      return {
        count:        data?.count        ?? 0,
        participants: data?.participants ?? data?.data ?? [],
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  // ─── QUAN TRỌNG: KHÔNG dùng startLoading/stopLoading ở đây ───
  const deleteParticipant = useCallback(async (id, pid) => {
    try {
      await surveyService.deleteParticipant(id, pid);
      toast.success("Xóa participant thành công");
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  // ─── QUAN TRỌNG: thêm ĐẦY ĐỦ tất cả callbacks vào deps ───
  // Nếu thiếu, useMemo sẽ tạo ra object mới mỗi lần loading thay đổi
  // → các component con nhận prop mới → re-render không cần thiết
  const value = useMemo(
    () => ({
      surveys,
      mySurveys,
      publicSurveys,
      currentSurvey,
      loading,
      error,
      createSurvey,
      createSurveyFlow,
      fetchMySurveys,
      fetchPublicSurveys,
      fetchSurveyById,
      updateSurvey,
      deleteSurvey,
      closeSurvey,
      publishSurvey,
      shareLink,
      inviteSurvey,
      bulkInviteSurvey,
      getParticipants,
      deleteParticipant,
      setCurrentSurvey,
      clearError,
    }),
    [
      surveys,
      mySurveys,
      publicSurveys,
      currentSurvey,
      loading,
      error,
      createSurvey,
      createSurveyFlow,
      fetchMySurveys,
      fetchPublicSurveys,
      fetchSurveyById,
      updateSurvey,
      deleteSurvey,
      closeSurvey,
      publishSurvey,
      shareLink,
      inviteSurvey,
      bulkInviteSurvey,
      getParticipants,
      deleteParticipant,
    ]
  );

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};

export default SurveyProvider;