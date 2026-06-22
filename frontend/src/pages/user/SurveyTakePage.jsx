import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "@/api/apiClient";
import { useQuestion } from "@/providers/QuestionProvider";
import { useResponse } from "@/providers/ResponseProvider";
import { useOption } from "@/providers/OptionProvider";
import { useSurvey } from "@/providers/SurveyProvider";
import { useUser } from "@/providers/UserProvider";
import responseService from "@/services/responseService";
import { toast } from "react-toastify";
import { ChevronLeft, Clock, AlertCircle, BarChart3, Edit3 } from "lucide-react";
import {
  TextAnswer, ParagraphAnswer, DateAnswer, NumberAnswer, TimeAnswer} from "@/components/take/AnswerInput";
import { RadioInput, CheckboxInput } from "@/components/take/ChoiceInput";
import { RatingInput, ScaleInput } from "@/components/take/RatingScale";
import { DropdownInput } from "@/components/take/DropdownInput";
import { ProgressBar } from "@/components/take/ProgressBar";

const BG = "#F4F3F8";
const WHITE = "#FFFFFF";
const TEXT = "#111827";
const TEXT_SEC = "#374151";
const TEXT_TER = "#9CA3AF";
const BORDER = "#E8E6F0";
const ERROR = "#D93025";

const DEFAULT_ACCENT = "#5B4EE8";
const FONT = "'Google Sans', Roboto, 'Segoe UI', system-ui, sans-serif";

function normalizeOption(opt, index = 0) {
  const display = (typeof opt.label === "string" && opt.label.trim()) || (typeof opt.content === "string" && opt.content.trim()) || (typeof opt.value === "string" && opt.value.trim()) || `Lựa chọn ${index + 1}`;
  return {
    id: opt.id || opt.option_id,
    content: display,
    order_index: opt.order_index ?? index,
    image_url: opt.image_url || null,
    media_type: opt.media_type || null};
}

function resolveOptions(question, optionsMap) {
  const raw = optionsMap?.[question.id];
  let list;
  if (Array.isArray(raw)) list = raw;
  else if (raw && Array.isArray(raw.data)) list = raw.data;
  else if (raw && Array.isArray(raw.options)) list = raw.options;
  else if (Array.isArray(question.options)) list = question.options;
  else list = [];
  return list.map(normalizeOption).filter((o) => o.content !== "").sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function OwnerBlockedScreen({ survey, onGoHome, onViewAnalytics, onEditSurvey, accentColor }) {
  const c = accentColor || DEFAULT_ACCENT;
  return (
    <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT }}>
      <div style={{ maxWidth: 440, width: "100%", background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT, margin: "0 0 8px" }}>{survey?.title || "Khảo sát"}</h2>
        <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 24px", lineHeight: 1.6, fontWeight: 400 }}>
          Bạn là chủ sở hữu của khảo sát này. Bạn không thể tự làm khảo sát của mình.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onViewAnalytics} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: WHITE, color: c, border: `1px solid ${c}`, borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
            <BarChart3 size={14} /> Xem thống kê
          </button>
          <button onClick={onEditSurvey} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: WHITE, color: c, border: `1px solid ${c}`, borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
            <Edit3 size={14} /> Chỉnh sửa
          </button>
          <button onClick={onGoHome} style={{ background: c, color: WHITE, border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
            Về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}

function AlreadySubmittedScreen({ survey, submissionData, questions, onGoHome, accentColor }) {
  const c = accentColor || DEFAULT_ACCENT;
  const submittedAt = submissionData?.submitted_at ? new Date(submissionData.submitted_at) : null;
  const answerMap = {};
  (submissionData?.answers || []).forEach((a) => {
    const qid = a.question_id ?? a.questionId;
    if (!answerMap[qid]) answerMap[qid] = [];
    answerMap[qid].push(a);
  });

  const fmtDate = (d) => d ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  const renderAnswerValue = (question, answers) => {
    if (!answers || answers.length === 0) return <span style={{ color: TEXT_TER, fontStyle: "italic" }}>(Chưa trả lời)</span>;
    switch (question.type) {
      case "TEXT":
      case "PARAGRAPH":
      case "EMAIL":
      case "TIME":
      case "DATE":
        return <span>{answers[0]?.answer_text || answers[0]?.value || ""}</span>;
      case "NUMBER":
      case "RATING":
      case "LINEAR_SCALE":
        return <span>{answers[0]?.answer_number ?? answers[0]?.value ?? ""}</span>;
      case "SINGLE_CHOICE":
      case "DROPDOWN": {
        const optId = answers[0]?.option_id ?? answers[0]?.value;
        const opt = (question.options || []).find((o) => String(o.id) === String(optId));
        return <span>{opt?.label || opt?.content || optId || ""}</span>;
      }
      case "MULTIPLE_CHOICE": {
        const ids = answers[0]?.option_ids || (Array.isArray(answers[0]?.value) ? answers[0].value : []);
        const labels = ids.map((id) => {
          const opt = (question.options || []).find((o) => String(o.id) === String(id));
          return opt?.label || opt?.content || id;
        }).filter(Boolean);
        return labels.length > 0 ? <span>{labels.join(", ")}</span> : <span style={{ color: TEXT_TER, fontStyle: "italic" }}>(Không chọn)</span>;
      }
      default:
        return <span style={{ color: TEXT_TER }}>{JSON.stringify(answers[0])}</span>;
    }
  };

  const sorted = [...questions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{
          background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", borderLeft: `8px solid ${c}`,
          padding: 20, marginBottom: 24}}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: TEXT, margin: 0 }}>{survey?.title || "Khảo sát"}</h1>
          </div>
          {survey?.description && (
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: "8px 0 0", fontWeight: 400, lineHeight: 1.5 }}>{survey.description}</p>
          )}
          {submittedAt && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#188038", fontWeight: 400 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#188038" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 4 }}><polyline points="20 6 9 17 4 12"/></svg>
              Đã nộp lúc {fmtDate(submittedAt)}
            </div>
          )}
        </div>

        {sorted.map((q, i) => {
          const ans = answerMap[q.id];
          return (
            <div key={q.id} style={{
              background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, marginBottom: 12}}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 16, color: TEXT_SEC, fontWeight: 400, flexShrink: 0 }}>{i + 1}.</span>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: TEXT, lineHeight: 1.5, margin: 0 }}>{q.content}</h2>
              </div>
              <div style={{ padding: "10px 14px", background: "#F4F3F8", borderRadius: 6, fontSize: 14, color: TEXT, fontWeight: 400 }}>
                {renderAnswerValue(q, ans)}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <button onClick={onGoHome} style={{ background: c, color: WHITE, border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
            Về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}

function SuccessScreen({ onGoHome, thankYouMessage, logoUrl, redirectUrl, rewardInfo, accentColor }) {
  const c = accentColor || DEFAULT_ACCENT;
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => { window.location.href = redirectUrl; }, 5000);
      const iv = setInterval(() => {
        setCountdown((prev) => { if (prev <= 1) { clearInterval(iv); return 0; } return prev - 1; });
      }, 1000);
      return () => { clearTimeout(timer); clearInterval(iv); };
    }
  }, [redirectUrl]);

  const message = thankYouMessage || "Câu trả lời của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.";
  const stars = rewardInfo?.stars ?? 0;

  return (
    <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT }}>
      <div style={{ maxWidth: 440, width: "100%", background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, textAlign: "center" }}>
        {logoUrl && <img src={logoUrl} alt="" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 16 }} />}
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#188038" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT, margin: "0 0 12px" }}>Gửi thành công!</h2>
        <p style={{ fontSize: 13, color: TEXT_SEC, margin: "0 0 20px", lineHeight: 1.6, fontWeight: 400 }}>{message}</p>
        {stars > 0 && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fef3c7", borderRadius: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "#92400e" }}>+{stars} sao</span>
          </div>
        )}
        {redirectUrl && (
          <div style={{ padding: "10px 14px", background: "#f1f3f4", borderRadius: 4, fontSize: 12, color: TEXT_SEC, marginBottom: 20, fontWeight: 400 }}>
            Đang chuyển hướng đến trang đích sau {countdown}s...
          </div>
        )}
        <button onClick={onGoHome} style={{ background: c, color: WHITE, border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
          Về trang chủ
        </button>
      </div>
    </main>
  );
}

function QuestionCard({ question, answer, onChange, index, hasError }) {
  const opts = question.options ?? [];
  const settings = question.settings ?? {};
  const placeholder = question.placeholder || "";
  const description = question.description || null;

  const renderAnswer = () => {
    switch (question.type) {
      case "TEXT":
        return <TextAnswer value={answer} onChange={(v) => onChange(question.id, v)} placeholder={placeholder} maxLength={settings.max_chars} />;
      case "PARAGRAPH":
        return <ParagraphAnswer value={answer} onChange={(v) => onChange(question.id, v)} placeholder={placeholder} maxLength={settings.max_chars} />;
      case "EMAIL":
        return <TextAnswer type="email" value={answer} onChange={(v) => onChange(question.id, v)} placeholder={placeholder || "example@email.com"} />;
      case "DATE":
        return <DateAnswer value={answer} onChange={(v) => onChange(question.id, v)} minDate={settings.min_date} maxDate={settings.max_date} />;
      case "NUMBER":
        return <NumberAnswer value={answer} onChange={(v) => onChange(question.id, v)} min={settings.min} max={settings.max} placeholder={placeholder} />;
      case "TIME":
        return <TimeAnswer value={answer} onChange={(v) => onChange(question.id, v)} placeholder={placeholder} />;
      case "RATING":
        return <RatingInput settings={settings} value={answer} onChange={(v) => onChange(question.id, v)} />;
      case "LINEAR_SCALE":
        return <ScaleInput settings={settings} value={answer} onChange={(v) => onChange(question.id, v)} />;
      case "SINGLE_CHOICE":
        return opts.length > 0
          ? <RadioInput options={opts} value={answer} onChange={(v) => onChange(question.id, v)} />
          : <p style={{ fontSize: 13, color: TEXT_TER, fontStyle: "italic", fontWeight: 400 }}>Đang tải lựa chọn...</p>;
      case "MULTIPLE_CHOICE":
        return opts.length > 0
          ? <CheckboxInput options={opts} value={answer} onChange={(v) => onChange(question.id, v)} />
          : <p style={{ fontSize: 13, color: TEXT_TER, fontStyle: "italic", fontWeight: 400 }}>Đang tải lựa chọn...</p>;
      case "DROPDOWN":
        return opts.length > 0
          ? <DropdownInput options={opts} value={answer} onChange={(v) => onChange(question.id, v)} />
          : <p style={{ fontSize: 13, color: TEXT_TER, fontStyle: "italic", fontWeight: 400 }}>Đang tải lựa chọn...</p>;
      default:
        return <p style={{ fontSize: 13, color: TEXT_TER, fontWeight: 400 }}>Loại câu hỏi không được hỗ trợ</p>;
    }
  };

  return (
    <div style={{
      background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20,
      borderLeft: hasError ? `4px solid ${ERROR}` : "1px solid #E8E6F0"}}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: description ? 8 : 16 }}>
        <span style={{ fontSize: 16, color: TEXT_SEC, fontWeight: 400, flexShrink: 0 }}>{index}.</span>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: TEXT, lineHeight: 1.5, margin: 0 }}>
          {question.content}{question.required && <span style={{ color: ERROR }}>*</span>}
        </h2>
      </div>

      {description && <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 16px 20px", lineHeight: 1.5, fontWeight: 400 }}>{description}</p>}

      {question.media_url && (
        question.media_type === "video"
          ? <video src={question.media_url} controls style={{ width: "100%", borderRadius: 4, marginBottom: 16, maxHeight: 280, objectFit: "contain" }} />
          : <img src={question.media_url} alt="" style={{ width: "100%", borderRadius: 4, marginBottom: 16, maxHeight: 280, objectFit: "cover" }} />
      )}

      <div>
        {renderAnswer()}
      </div>
    </div>
  );
}

export default function SurveyTakePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get("access_token");

  const { questions, fetchQuestionsBySurvey, loading: qLoading } = useQuestion();
  const { options, fetchOptions } = useOption();
  const { startSurvey, submitSurvey, submitting } = useResponse();
  const { fetchSurveyById, currentSurvey } = useSurvey();
  const { user } = useUser();

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [submissionLoaded, setSubmissionLoaded] = useState(false);
  const autoSaveRef = useRef(null);

  const isOwner = user?.user_id && currentSurvey?.created_by && String(user.user_id) === String(currentSurvey.created_by);
  const accent = currentSurvey?.accent_color || DEFAULT_ACCENT;

  // Pass survey access_token to all API calls via header (LINK-type surveys)
  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common['x-access-token'] = accessToken;
    }
    return () => {
      delete apiClient.defaults.headers.common['x-access-token'];
    };
  }, [accessToken]);

  const checkExistingSubmission = useCallback(async () => {
    if (!surveyId) return;
    try {
      const data = await responseService.getMySubmission(surveyId);
      if (data?.submitted_at || data?.data?.submitted_at) {
        const submission = data.data || data;
        setMySubmission(submission);
      }
    } catch { /* 404 = no submission yet, ignore */ }
    finally { setSubmissionLoaded(true); }
  }, [surveyId]);

  useEffect(() => {
    if (!surveyId) return;
    fetchSurveyById(surveyId, accessToken);
  }, [surveyId, accessToken]);

  useEffect(() => {
    if (!surveyId || !currentSurvey) return;
    checkExistingSubmission();
  }, [surveyId, currentSurvey, checkExistingSubmission]);

  useEffect(() => {
    if (!currentSurvey) { setSurveyStatus("expired"); return; }
    const now = new Date();
    const start = currentSurvey.start_at ? new Date(currentSurvey.start_at) : null;
    const end = currentSurvey.end_at ? new Date(currentSurvey.end_at) : null;
    if (start && now < start) setSurveyStatus("not_started");
    else if (end && now > end) setSurveyStatus("expired");
    else setSurveyStatus("active");
  }, [currentSurvey]);

  useEffect(() => {
    if (surveyStatus === "active" && !started) setStarted(false);
  }, [surveyStatus]);

  useEffect(() => {
    if (!surveyId) return;
    fetchQuestionsBySurvey(surveyId).then(async (list) => {
      if (!Array.isArray(list)) return;
      const choiceQs = list.filter((q) => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type));
      if (!choiceQs.length) return;
      setOptionsLoading(true);
      try { await Promise.all(choiceQs.map((q) => fetchOptions(q.id, surveyId))); }
      finally { setOptionsLoading(false); }
    });
  }, [surveyId]);

  useEffect(() => {
    if (!currentSurvey?.time_limit_seconds || submitted || timeUp) return;
    setTimeLeft(currentSurvey.time_limit_seconds);
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(iv); setTimeUp(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [currentSurvey?.time_limit_seconds, submitted]);

  useEffect(() => {
    if (!surveyId || submitted || !Object.keys(answers).length) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      const payload = buildPayloadForAutoSave(answers);
      if (!payload.length) return;
      try {
        await fetch(`/api/v1/responses/surveys/${surveyId}/autosave`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`},
          body: JSON.stringify({ answers: payload })});
      } catch (e) { console.warn("[Auto-save]", e); }
    }, 30000);
    return () => clearTimeout(autoSaveRef.current);
  }, [answers, surveyId, submitted]);

  const sorted = [...questions]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((q) => ({ ...q, options: resolveOptions(q, options) }));

  const visibleQuestions = sorted.filter((q) => {
    if (!q.condition) return true;
    const { source_question_id, operator, value } = q.condition;
    const ans = answers[source_question_id];
    if (ans === undefined) return false;
    switch (operator) {
      case "equals":        return String(ans) === String(value);
      case "not_equals":   return String(ans) !== String(value);
      case "contains":      return String(ans).includes(String(value));
      case "not_contains":  return !String(ans).includes(String(value));
      case "greater":       return Number(ans) > Number(value);
      case "less":          return Number(ans) < Number(value);
      case "answered":      return ans !== undefined && ans !== null && ans !== "";
      case "not_answered":  return ans === undefined || ans === null || ans === "";
      case "is_selected":   return ans instanceof Set ? ans.has(value) : ans === value;
      default: return true;
    }
  });

  const total = visibleQuestions.length;
  const current = visibleQuestions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = total - 1 === currentIndex;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setAttemptedNext(false);
  };

  const canProceed = () => {
    if (!current) return false;
    if (!current.required) return true;
    const ans = answers[current.id];
    const s = current.settings ?? {};
    switch (current.type) {
      case "TEXT":
      case "PARAGRAPH": {
        const t = typeof ans === "string" ? ans.trim() : "";
        if (s.min_chars && t.length < s.min_chars) return false;
        if (s.max_chars && t.length > s.max_chars) return false;
        return t.length > 0;
      }
      case "EMAIL":  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typeof ans === "string" ? ans.trim() : "");
      case "DATE":   return typeof ans === "string" && ans.length > 0;
      case "NUMBER": {
        if (ans === "" || ans == null) return false;
        const n = Number(ans);
        if (isNaN(n)) return false;
        if (s.min !== undefined && n < s.min) return false;
        if (s.max !== undefined && n > s.max) return false;
        return true;
      }
      case "RATING":
      case "LINEAR_SCALE": return ans != null;
      case "SINGLE_CHOICE":
      case "DROPDOWN":     return !!ans;
      case "MULTIPLE_CHOICE": return ans instanceof Set && ans.size > 0;
      default: return true;
    }
  };

  const getValidationHint = () => {
    if (!current?.required) return null;
    const ans = answers[current.id];
    const s = current.settings ?? {};
    if (current.type === "EMAIL" && typeof ans === "string" && ans.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim())) return "Email không hợp lệ";
    if (current.type === "NUMBER" && ans !== "" && ans != null) {
      const n = Number(ans);
      if (!isNaN(n)) {
        if (s.min !== undefined && n < s.min) return `Giá trị tối thiểu là ${s.min}`;
        if (s.max !== undefined && n > s.max) return `Giá trị tối đa là ${s.max}`;
      }
    }
    if ((current.type === "TEXT" || current.type === "PARAGRAPH") && typeof ans === "string" && s.max_chars && ans.length > s.max_chars) {
      return `Tối đa ${s.max_chars} ký tự`;
    }
    return null;
  };

  const buildPayloadForAutoSave = (allAnswers) => {
    const r = [];
    sorted.forEach((q) => {
      const val = allAnswers[q.id];
      if (["TEXT", "PARAGRAPH", "EMAIL", "TIME", "FILE_UPLOAD"].includes(q.type)) {
        if (typeof val === "string" && val.trim()) r.push({ question_id: q.id, answer_text: val.trim() });
      } else if (["NUMBER", "RATING", "LINEAR_SCALE"].includes(q.type)) {
        if (val != null && !isNaN(Number(val))) r.push({ question_id: q.id, answer_number: Number(val) });
      } else if (["SINGLE_CHOICE", "DROPDOWN"].includes(q.type)) {
        if (val) r.push({ question_id: q.id, option_id: val });
      } else if (q.type === "MULTIPLE_CHOICE") {
        const sel = val instanceof Set ? [...val] : [];
        if (sel.length > 0) r.push({ question_id: q.id, option_ids: sel });
      } else if (q.type === "DATE") {
        if (val) r.push({ question_id: q.id, answer_text: val });
      }
    });
    return r;
  };

  const buildPayload = () => buildPayloadForAutoSave(answers);

  const handleSubmit = async () => {
    if (!canProceed() || submitting) return;
    const payload = buildPayload();
    if (!payload.length) {
      toast.error("Vui lòng trả lời ít nhất một câu hỏi trước khi gửi.");
      return;
    }
    try {
      const result = await submitSurvey(surveyId, { answers: payload });
      const stars = result?.stars_earned ?? 0;
      setRewardInfo({ stars, reward_type: result?.reward_type || "" });
      setSubmitted(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Gửi khảo sát thất bại. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try { await startSurvey(surveyId); setStarted(true); }
    catch (err) { console.error("[Start]", err); }
    finally { setStarting(false); }
  };

  const handleNext = () => {
    if (!canProceed()) {
      setAttemptedNext(true);
      return;
    }
    setAttemptedNext(false);
    setCurrentIndex((i) => i + 1);
  };

  const fmtTime = (secs) => {
    if (!secs && secs !== 0) return null;
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (isOwner) {
    return (
      <OwnerBlockedScreen
        survey={currentSurvey}
        onGoHome={() => navigate("/user/home")}
        onViewAnalytics={() => navigate(`/user/analytics/${surveyId}`)}
        onEditSurvey={() => navigate(`/user/studio/${surveyId}`)}
        accentColor={accent}
      />
    );
  }

  if (submissionLoaded && mySubmission?.submitted_at) {
    return (
      <AlreadySubmittedScreen
        survey={currentSurvey}
        submissionData={mySubmission}
        questions={questions}
        onGoHome={() => navigate("/user/home")}
        accentColor={accent}
      />
    );
  }

  if (surveyStatus === "active" && !started) {
    return (
      <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT }}>
        <div style={{ maxWidth: 480, width: "100%", background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, textAlign: "center" }}>
          {currentSurvey?.logo_url && (
            <img src={currentSurvey.logo_url} alt="" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 16 }} />
          )}
          <h2 style={{ fontSize: 24, fontWeight: 600, color: TEXT, margin: "0 0 8px" }}>{currentSurvey?.title || "Khảo sát"}</h2>
          {currentSurvey?.description && (
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 20px", lineHeight: 1.6, fontWeight: 400 }}>{currentSurvey.description}</p>
          )}
          {currentSurvey?.time_limit_seconds && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fef3c7", borderRadius: 4, fontSize: 12, fontWeight: 400, color: "#92400e", marginBottom: 16 }}>
              <Clock size={13} /> Thời gian: {Math.floor(currentSurvey.time_limit_seconds / 60)} phút
            </div>
          )}
          <div style={{ fontSize: 14, color: TEXT_SEC, marginBottom: 24, fontWeight: 400 }}>{questions.length} câu hỏi</div>
          <button
            onClick={handleStart}
            disabled={starting}
            style={{
              background: starting ? "#D1D5DB" : accent,
              color: WHITE, border: "none", borderRadius: 8,
              height: 36, padding: "0 16px",
              fontSize: 14, fontWeight: 400, cursor: starting ? "not-allowed" : "pointer",
              fontFamily: "inherit"}}
          >
            {starting ? "Đang bắt đầu..." : "Bắt đầu làm khảo sát"}
          </button>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", color: "#9CA3AF", border: "none", borderRadius: 8, height: 36, padding: "0 12px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
              <ChevronLeft size={14} /> Quay lại
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (submitted || timeUp) {
    return (
      <SuccessScreen
        onGoHome={() => navigate("/user/home")}
        thankYouMessage={currentSurvey?.thank_you_message}
        logoUrl={currentSurvey?.logo_url}
        redirectUrl={currentSurvey?.thank_you_redirect_url}
        rewardInfo={rewardInfo}
        accentColor={accent}
      />
    );
  }

  if (surveyStatus === "not_started" || surveyStatus === "expired") {
    return (
      <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT }}>
        <div style={{ maxWidth: 440, width: "100%", background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 12px" }}>
            {surveyStatus === "not_started" ? "Khảo sát chưa bắt đầu" : "Khảo sát đã kết thúc"}
          </h2>
          <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 24px", lineHeight: 1.6, fontWeight: 400 }}>
            {surveyStatus === "not_started"
              ? `Khảo sát này sẽ mở vào ngày ${currentSurvey?.start_at ? new Date(currentSurvey.start_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }) : ""}.`
              : "Khảo sát này đã kết thúc."
            }
          </p>
          <button onClick={() => navigate("/user/home")} style={{ background: accent, color: WHITE, border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}>
            Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  const loading = qLoading || optionsLoading;
  const hint = getValidationHint();
  const showError = attemptedNext && current?.required && !canProceed();
  const timeWarning = timeLeft !== null && timeLeft <= 60;

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 16px" }}>
        {/* Header card */}
        <div style={{
          background: WHITE, borderRadius: 12,
          border: "1px solid #E8E6F0", borderLeft: `8px solid ${accent}`,
          padding: 20,
          marginBottom: 0}}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: TEXT, margin: 0 }}>{currentSurvey?.title || "Làm khảo sát"}</h1>
            {timeLeft !== null && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 400, color: timeWarning ? ERROR : "#188038", fontFamily: "monospace", flexShrink: 0, marginLeft: 12 }}>
                <Clock size={12} />{fmtTime(timeLeft)}
              </span>
            )}
          </div>
          {currentSurvey?.description && (
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: "8px 0 0", fontWeight: 400, lineHeight: 1.5 }}>{currentSurvey.description}</p>
          )}
          <p style={{ fontSize: 12, color: ERROR, margin: "16px 0 0", fontWeight: 400 }}>* Biểu thị câu hỏi bắt buộc</p>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginTop: 0 }}>
            <ProgressBar current={currentIndex + 1} total={total} />
          </div>
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <div style={{ background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, textAlign: "center", marginTop: 16 }}>
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0, fontWeight: 400 }}>Khảo sát này chưa có câu hỏi nào.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ background: WHITE, borderRadius: 12, border: "1px solid #E8E6F0", padding: 20, marginTop: 16 }}>
            <div style={{ height: 12, width: "60%", background: "#E8DEF8", borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 12, width: "80%", background: "#E8DEF8", borderRadius: 4, marginBottom: 20 }} />
            <div style={{ height: 36, width: "100%", background: "#F0EBF8", borderRadius: 4 }} />
          </div>
        )}

        {/* Question */}
        {!loading && total > 0 && current && (
          <div style={{ marginTop: 16 }}>
            <QuestionCard
              key={current.id}
              question={current}
              answer={answers[current.id]}
              onChange={handleChange}
              index={currentIndex + 1}
              hasError={showError}
            />

            {showError && (
              <p style={{ fontSize: 12, color: ERROR, margin: "8px 0 0", display: "flex", alignItems: "center", gap: 4, fontWeight: 400 }}>
                <AlertCircle size={12} />{hint || "* Câu hỏi này bắt buộc phải trả lời"}
              </p>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
              {currentSurvey?.allow_back !== false && !isFirst && (
                <button
                  onClick={() => { setCurrentIndex((i) => i - 1); setAttemptedNext(false); }}
                  disabled={submitting}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", color: "#9CA3AF", border: "none", borderRadius: 8, height: 36, padding: "0 12px", fontSize: 14, fontWeight: 400, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  <ChevronLeft size={15} /> Quay lại
                </button>
              )}
              {!isLast ? (
                <button
                  onClick={handleNext}
                  style={{ background: accent, color: WHITE, border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Tiếp theo
                </button>
              ) : (
                <button
                  onClick={() => { if (!canProceed()) { setAttemptedNext(true); return; } handleSubmit(); }}
                  disabled={submitting}
                  style={{ background: submitting ? "#D1D5DB" : accent, color: WHITE, border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 400, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  {submitting ? "Đang gửi..." : "Nộp khảo sát"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
