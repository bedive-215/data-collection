import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Link2, Copy, Check, Globe, X, FileQuestion,
  Plus, Trash2, Calendar, Mail, Users, ListChecks, ChevronDown,
} from "lucide-react";
import { useSurvey } from "@/providers/SurveyProvider";
import { ROUTERS } from "@/utils/constants";
import { toast } from "react-toastify";

/* Đồng bộ SurveysLayout / Home — không clone màu Google Form */
const C = {
  surface: "rgba(255,255,255,0.82)",
  surfaceSoft: "rgba(255,255,255,0.55)",
  glassBorder: "rgba(255,255,255,0.55)",
  primary: "#4f46e5",
  primarySoft: "rgba(79,70,229,0.12)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  font: "'DM Sans','Inter',sans-serif",
};

const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];

const QUESTION_TYPES = [
  { value: "TEXT", label: "Trả lời ngắn" },
  { value: "PARAGRAPH", label: "Đoạn văn" },
  { value: "EMAIL", label: "Email" },
  { value: "DATE", label: "Ngày" },
  { value: "NUMBER", label: "Số" },
  { value: "RATING", label: "Đánh giá (sao)" },
  { value: "SINGLE_CHOICE", label: "Một lựa chọn" },
  { value: "MULTIPLE_CHOICE", label: "Nhiều lựa chọn" },
  { value: "DROPDOWN", label: "Danh sách thả xuống" },
];

const PROGRESS_LABEL = {
  create: "Đang tạo khảo sát…",
  questions: "Đang thêm câu hỏi…",
  invite: "Đang gửi lời mời…",
  publish: "Đang công khai…",
  share: "Đang tạo link chia sẻ…",
  done: "",
};

function parseEmails(text) {
  return [...new Set(String(text).split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean))];
}

const ROLES = [
  { value: "viewer", label: "Viewer", desc: "Chỉ xem" },
  { value: "respondent", label: "Người trả lời", desc: "Điền form" },
  { value: "editor", label: "Editor", desc: "Sửa form" },
];

function newQuestionId() {
  return `dq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultOptions() {
  return [
    { label: "Tùy chọn 1", value: `opt_${Date.now()}_a` },
    { label: "Tùy chọn 2", value: `opt_${Date.now()}_b` },
  ];
}

function emptyDraft() {
  return {
    id: newQuestionId(),
    content: "",
    type: "TEXT",
    required: false,
    settings: null,
    options: defaultOptions(),
  };
}

function GlassPanel({ children, style = {} }) {
  return (
    <div
      style={{
        background: C.surface,
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        border: `1px solid ${C.glassBorder}`,
        borderRadius: 20,
        boxShadow: "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function fieldIn() {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: 11,
    border: "1px solid rgba(0,0,0,0.1)",
    fontSize: 13,
    fontFamily: C.font,
    color: C.text,
    outline: "none",
    background: "rgba(255,255,255,0.72)",
  };
}

export default function CreateSurveyComposer({ onCancel, onSuccess }) {
  const navigate = useNavigate();
  const { createSurveyFlow } = useSurvey();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [drafts, setDrafts] = useState([emptyDraft()]);
  const [emailsRaw, setEmailsRaw] = useState("");
  const [inviteRole, setInviteRole] = useState("respondent");
  const [publishNow, setPublishNow] = useState(false);
  const [createShareLink, setCreateShareLink] = useState(false);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState(null);
  const [copied, setCopied] = useState(false);

  const emailList = useMemo(() => parseEmails(emailsRaw), [emailsRaw]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartAt("");
    setEndAt("");
    setDrafts([emptyDraft()]);
    setEmailsRaw("");
    setInviteRole("respondent");
    setPublishNow(false);
    setCreateShareLink(false);
    setDone(null);
    setCopied(false);
  }, []);

  const updateDraft = (id, patch) => {
    setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const setDraftType = (id, type) => {
    setDrafts((list) => list.map((d) => {
      if (d.id !== id) return d;
      const next = { ...d, type };
      if (CHOICE_TYPES.includes(type) && (!d.options || d.options.length < 2)) {
        next.options = defaultOptions();
      }
      if (type === "NUMBER") {
        next.settings = { min: "", max: "" };
      } else if (type === "RATING") {
        next.settings = { min: 1, max: 5 };
      } else {
        next.settings = null;
      }
      return next;
    }));
  };

  const addDraft = () => setDrafts((list) => [...list, emptyDraft()]);
  const removeDraft = (id) => {
    setDrafts((list) => (list.length <= 1 ? list : list.filter((d) => d.id !== id)));
  };

  const updateOption = (draftId, optIndex, key, val) => {
    setDrafts((list) => list.map((d) => {
      if (d.id !== draftId) return d;
      const options = (d.options || []).map((o, i) => (i === optIndex ? { ...o, [key]: val } : o));
      return { ...d, options };
    }));
  };

  const addOption = (draftId) => {
    setDrafts((list) => list.map((d) => {
      if (d.id !== draftId) return d;
      const n = (d.options?.length || 0) + 1;
      return {
        ...d,
        options: [...(d.options || []), { label: `Tùy chọn ${n}`, value: `opt_${Date.now()}_${n}` }],
      };
    }));
  };

  const removeOption = (draftId, optIndex) => {
    setDrafts((list) => list.map((d) => {
      if (d.id !== draftId) return d;
      const opts = (d.options || []).filter((_, i) => i !== optIndex);
      return { ...d, options: opts.length >= 2 ? opts : d.options };
    }));
  };

  const validateDrafts = (filled) => {
    for (const q of filled) {
      if (CHOICE_TYPES.includes(q.type)) {
        const opts = (q.options || [])
          .map((o) => ({ label: String(o.label || "").trim(), value: String(o.value || "").trim() }))
          .filter((o) => o.label && o.value);
        const values = new Set(opts.map((o) => o.value));
        if (opts.length < 2 || values.size < opts.length) {
          toast.error(`Câu "${(q.content || "").slice(0, 48)}…" cần ít nhất 2 lựa chọn (label + value, value không trùng).`);
          return false;
        }
      }
      if (q.type === "NUMBER" && q.settings) {
        const { min, max } = q.settings;
        if (min !== "" && max !== "" && Number(min) > Number(max)) {
          toast.error("Câu số: min phải nhỏ hơn hoặc bằng max.");
          return false;
        }
      }
      if (q.type === "RATING" && q.settings) {
        const min = Number(q.settings.min ?? 1);
        const max = Number(q.settings.max ?? 5);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
          toast.error("Thang đánh giá: min phải nhỏ hơn max.");
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      toast.error("Nhập tiêu đề khảo sát.");
      return;
    }
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    const filled = drafts
      .map((d) => ({
        content: d.content.trim(),
        type: d.type,
        required: d.required,
        settings: d.settings,
        options: d.options,
      }))
      .filter((d) => d.content);

    if (!validateDrafts(filled)) return;

    const payload = {
      title: t,
      description: description.trim() || null,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
    };

    const extras = {
      draftQuestions: filled,
      inviteEmails: emailList,
      inviteRole,
      publishNow,
      createShareLink,
    };

    setBusy(true);
    setProgress(PROGRESS_LABEL.create);
    try {
      const result = await createSurveyFlow(payload, extras, (step) => {
        setProgress(PROGRESS_LABEL[step] || "");
      });
      setDone(result);
    } catch {
      /* provider */
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const scrollToQuestions = () => {
    const el = document.getElementById("create-survey-questions-anchor");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopy = async () => {
    if (!done?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(done.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleFinish = () => {
    onSuccess?.(done);
    resetForm();
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 22px",
    borderRadius: 11,
    border: "none",
    background: busy || !title.trim() ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg,#4361ee,#6c7ef7)",
    color: busy || !title.trim() ? C.textDim : "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: busy || !title.trim() ? "not-allowed" : "pointer",
    fontFamily: C.font,
    boxShadow: busy || !title.trim() ? "none" : "0 4px 14px rgba(67,97,238,0.35)",
  };

  if (done?.survey) {
    const editPath = ROUTERS.USER.MY_SURVEY_DETAIL.replace(":surveyId", done.survey.id);
    return (
      <GlassPanel style={{ padding: 22, borderLeft: "4px solid rgba(67,97,238,0.85)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Check size={20} color="#059669" />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: C.font }}>Đã tạo xong</span>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: C.textSub, lineHeight: 1.55, fontFamily: C.font }}>
          <strong style={{ color: C.text }}>{done.survey.title}</strong>
        </p>
        {done.shareUrl && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontFamily: C.font }}>Link chia sẻ</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input readOnly value={done.shareUrl} style={{ ...fieldIn(), flex: "1 1 200px", fontSize: 12 }} />
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  ...fieldIn(),
                  width: "auto",
                  cursor: "pointer",
                  fontWeight: 700,
                  background: copied ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.9)",
                  color: copied ? "#059669" : C.primary,
                }}
              >
                {copied ? <Check size={16} style={{ verticalAlign: "middle" }} /> : <Copy size={16} style={{ verticalAlign: "middle" }} />}
                {" "}
                {copied ? "Đã copy" : "Copy"}
              </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => navigate(editPath)} style={{ ...fieldIn(), width: "auto", cursor: "pointer", fontWeight: 700, color: C.primary, borderColor: "rgba(79,70,229,0.35)" }}>
            <FileQuestion size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Chỉnh sửa chi tiết
          </button>
          <button type="button" onClick={handleFinish} style={btnPrimary}>
            Xong
          </button>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        fontFamily: C.font,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Tạo khảo sát mới</h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.textSub, lineHeight: 1.5, maxWidth: 560 }}>
            Điền thông tin → kéo xuống phần <strong>câu hỏi</strong> (khối cuộn riêng) → tiếp tục xuống <strong>mời người</strong>. Một lần bấm <strong>Lưu &amp; áp dụng</strong> sẽ gọi API theo thứ tự.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.08)",
            background: C.surfaceSoft,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.textSub,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={scrollToQuestions}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
          padding: "6px 12px",
          borderRadius: 999,
          border: `1px solid rgba(79,70,229,0.25)`,
          background: C.primarySoft,
          color: C.primary,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: C.font,
        }}
      >
        <ChevronDown size={14} />
        Tới phần câu hỏi
      </button>

      <form onSubmit={handleSubmit}>
        {/* —— Thông tin khảo sát —— */}
        <GlassPanel style={{ padding: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.textSub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Thông tin
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề khảo sát *"
            required
            style={{ ...fieldIn(), fontSize: 16, fontWeight: 700, marginBottom: 10 }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả (tuỳ chọn)"
            rows={2}
            style={{ ...fieldIn(), resize: "vertical", minHeight: 64, marginBottom: 12 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textSub, display: "block", marginBottom: 4 }}>Bắt đầu</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} style={fieldIn()} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textSub, display: "block", marginBottom: 4 }}>Kết thúc</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} style={fieldIn()} />
            </div>
          </div>
        </GlassPanel>

        {/* —— Câu hỏi: khối riêng, cuộn —— */}
        <div
          id="create-survey-questions-anchor"
          style={{ scrollMarginTop: 12 }}
        >
          <GlassPanel
            style={{
              padding: 0,
              marginBottom: 14,
              display: "flex",
              flexDirection: "column",
              maxHeight: "min(52vh, 440px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "14px 18px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.88))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ListChecks size={18} color={C.primary} />
                <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Câu hỏi</span>
                <span style={{ fontSize: 11, color: C.textDim, fontWeight: 600 }}>(cuộn trong khung này)</span>
              </div>
              <button
                type="button"
                onClick={addDraft}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: C.font,
                  boxShadow: "0 3px 10px rgba(67,97,238,0.3)",
                }}
              >
                <Plus size={14} />
                Thêm câu
              </button>
            </div>
            <div
              style={{
                overflowY: "auto",
                padding: "14px 18px 18px",
                flex: 1,
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {drafts.map((d, idx) => (
                  <div
                    key={d.id}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: "1px solid rgba(99,102,241,0.15)",
                      background: "rgba(255,255,255,0.65)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.primary }}>Câu {idx + 1}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{ fontSize: 11, color: C.textSub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                          <input type="checkbox" checked={d.required} onChange={(e) => updateDraft(d.id, { required: e.target.checked })} style={{ accentColor: C.primary }} />
                          Bắt buộc
                        </label>
                        <button
                          type="button"
                          disabled={drafts.length <= 1}
                          onClick={() => removeDraft(d.id)}
                          style={{
                            padding: 6,
                            border: "none",
                            borderRadius: 8,
                            background: drafts.length <= 1 ? "transparent" : "rgba(239,68,68,0.1)",
                            color: drafts.length <= 1 ? C.textDim : "#dc2626",
                            cursor: drafts.length <= 1 ? "not-allowed" : "pointer",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: C.textSub, display: "block", marginBottom: 4 }}>Loại</label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={d.type}
                          onChange={(e) => setDraftType(d.id, e.target.value)}
                          style={{ ...fieldIn(), appearance: "none", paddingRight: 36, cursor: "pointer" }}
                        >
                          {QUESTION_TYPES.map((qt) => (
                            <option key={qt.value} value={qt.value}>{qt.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} color={C.textSub} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: CHOICE_TYPES.includes(d.type) ? 10 : 0 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: C.textSub, display: "block", marginBottom: 4 }}>Nội dung câu hỏi</label>
                      <input
                        value={d.content}
                        onChange={(e) => updateDraft(d.id, { content: e.target.value })}
                        placeholder="Nhập câu hỏi…"
                        style={fieldIn()}
                      />
                    </div>

                    {d.type === "NUMBER" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: C.textSub }}>Min (tuỳ chọn)</label>
                          <input
                            type="number"
                            value={d.settings?.min ?? ""}
                            onChange={(e) => updateDraft(d.id, { settings: { ...d.settings, min: e.target.value } })}
                            style={{ ...fieldIn(), marginTop: 4 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: C.textSub }}>Max (tuỳ chọn)</label>
                          <input
                            type="number"
                            value={d.settings?.max ?? ""}
                            onChange={(e) => updateDraft(d.id, { settings: { ...d.settings, max: e.target.value } })}
                            style={{ ...fieldIn(), marginTop: 4 }}
                          />
                        </div>
                      </div>
                    )}

                    {d.type === "RATING" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: C.textSub }}>Từ</label>
                          <input
                            type="number"
                            min={1}
                            value={d.settings?.min ?? 1}
                            onChange={(e) => updateDraft(d.id, { settings: { ...d.settings, min: e.target.value } })}
                            style={{ ...fieldIn(), marginTop: 4 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: C.textSub }}>Đến</label>
                          <input
                            type="number"
                            min={2}
                            value={d.settings?.max ?? 5}
                            onChange={(e) => updateDraft(d.id, { settings: { ...d.settings, max: e.target.value } })}
                            style={{ ...fieldIn(), marginTop: 4 }}
                          />
                        </div>
                      </div>
                    )}

                    {CHOICE_TYPES.includes(d.type) && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>Lựa chọn (ít nhất 2, value không trùng)</div>
                        {(d.options || []).map((opt, oi) => (
                          <div key={`${d.id}-opt-${oi}`} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                            <input
                              value={opt.label}
                              onChange={(e) => updateOption(d.id, oi, "label", e.target.value)}
                              placeholder="Nhãn"
                              style={{ ...fieldIn(), flex: 1 }}
                            />
                            <input
                              value={opt.value}
                              onChange={(e) => updateOption(d.id, oi, "value", e.target.value)}
                              placeholder="Giá trị"
                              style={{ ...fieldIn(), flex: "0 0 120px" }}
                            />
                            <button
                              type="button"
                              disabled={(d.options || []).length <= 2}
                              onClick={() => removeOption(d.id, oi)}
                              style={{
                                padding: 8,
                                border: "none",
                                borderRadius: 8,
                                background: (d.options || []).length <= 2 ? "transparent" : "rgba(0,0,0,0.05)",
                                cursor: (d.options || []).length <= 2 ? "not-allowed" : "pointer",
                                color: C.textSub,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(d.id)}
                          style={{
                            marginTop: 4,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: `1px dashed rgba(79,70,229,0.35)`,
                            background: "transparent",
                            color: C.primary,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: C.font,
                          }}
                        >
                          + Thêm lựa chọn
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* —— Mời & tuỳ chọn —— */}
        <GlassPanel style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Mail size={17} color={C.primary} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Mời qua email</span>
            {emailList.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, background: C.primarySoft, color: C.primary }}>
                {emailList.length}
              </span>
            )}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>
            Cuộn xuống đây sau khi xong câu hỏi. Mời chạy <strong>trước</strong> bước công khai.
          </p>
          <textarea
            rows={4}
            value={emailsRaw}
            onChange={(e) => setEmailsRaw(e.target.value)}
            placeholder={"email@domain.com (mỗi dòng hoặc cách nhau bằng dấu phẩy)"}
            style={{ ...fieldIn(), resize: "vertical", lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textSub, marginBottom: 6 }}>Vai trò</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setInviteRole(r.value)}
                  style={{
                    flex: "1 1 92px",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1.5px solid ${inviteRole === r.value ? "rgba(79,70,229,0.45)" : "rgba(0,0,0,0.08)"}`,
                    background: inviteRole === r.value ? C.primarySoft : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontFamily: C.font,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: inviteRole === r.value ? C.primary : C.text }}>{r.label}</div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Users size={17} color={C.primary} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Sau khi tạo</span>
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 8, fontSize: 13, color: C.text, lineHeight: 1.45 }}>
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} style={{ marginTop: 3, accentColor: C.primary }} />
            <Globe size={16} color={C.textSub} style={{ flexShrink: 0, marginTop: 2 }} />
            Công khai khảo sát
          </label>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: C.text, lineHeight: 1.45 }}>
            <input type="checkbox" checked={createShareLink} onChange={(e) => setCreateShareLink(e.target.checked)} style={{ marginTop: 3, accentColor: C.primary }} />
            <Link2 size={16} color={C.textSub} style={{ flexShrink: 0, marginTop: 2 }} />
            Tạo link chia sẻ có token
          </label>
        </GlassPanel>

        {busy && progress && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: C.surfaceSoft, border: "1px solid rgba(0,0,0,0.06)", fontSize: 12, fontWeight: 700, color: C.primary }}>
            <Loader2 size={16} style={{ animation: "composerSpin 0.85s linear infinite" }} />
            {progress}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onCancel} disabled={busy} style={{ ...fieldIn(), width: "auto", cursor: busy ? "not-allowed" : "pointer", fontWeight: 700, color: C.textSub, background: "transparent", border: "1px solid rgba(0,0,0,0.1)" }}>
            Huỷ
          </button>
          <button type="submit" disabled={busy || !title.trim()} style={btnPrimary}>
            {busy ? (
              <>
                <Loader2 size={16} style={{ animation: "composerSpin 0.85s linear infinite" }} />
                Đang xử lý…
              </>
            ) : (
              <>
                <FileQuestion size={16} />
                Lưu &amp; áp dụng
              </>
            )}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes composerSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
