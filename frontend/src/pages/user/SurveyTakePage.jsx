// ─── SurveyTakePage.jsx ───────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import { useResponse } from "@/providers/ResponseProvider";
import { useOption } from "@/providers/OptionProvider";
import {
  ChevronLeft, ChevronRight, CheckCircle2, CircleDot,
  AlignLeft, CheckSquare, Loader2, Send, Home,
  FileText, Mail, Calendar, Hash, Star, ChevronDown,
} from "lucide-react";

/* ── Type config ───────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản ngắn",   Icon: AlignLeft,   color: "#4f6ef7", bg: "#eef2ff", border: "#c7d2fe" },
  PARAGRAPH:       { label: "Đoạn văn",       Icon: FileText,    color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  EMAIL:           { label: "Email",           Icon: Mail,        color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  DATE:            { label: "Ngày tháng",      Icon: Calendar,    color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  NUMBER:          { label: "Số",              Icon: Hash,        color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  RATING:          { label: "Đánh giá",        Icon: Star,        color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  SINGLE_CHOICE:   { label: "Một lựa chọn",   Icon: CircleDot,   color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", Icon: CheckSquare, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  DROPDOWN:        { label: "Danh sách thả",  Icon: ChevronDown, color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
};

/* ── ProgressBar ───────────────────────────────────────────────────── */
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Câu hỏi {current} / {total}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4f6ef7" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg,#6a8fff,#4f6ef7)",
          borderRadius: 99, transition: "width .4s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: i === current - 1 ? 20 : 8, height: 8, borderRadius: 99,
            background: i < current ? "#4f6ef7" : "#e5e7eb", transition: "all .3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

/* ── SuccessScreen ─────────────────────────────────────────────────── */
function SuccessScreen({ onGoHome }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#f4f5f7",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "2rem",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 24,
        padding: "3rem 2.5rem", maxWidth: 440, width: "100%",
        textAlign: "center", boxShadow: "0 4px 32px rgba(79,110,247,0.12)",
        animation: "fadeUp .4s ease",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
          boxShadow: "0 4px 16px rgba(22,163,74,0.20)",
        }}>
          <CheckCircle2 size={40} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
          Gửi thành công! 🎉
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 2rem", lineHeight: 1.7 }}>
          Câu trả lời của bạn đã được ghi nhận.<br />
          Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.
        </p>
        <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 1.75rem" }} />
        <button
          onClick={onGoHome}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            gap: 8, padding: "13px 32px",
            background: "linear-gradient(135deg,#4f6ef7,#6a8fff)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", width: "100%",
            boxShadow: "0 4px 14px rgba(79,110,247,0.30)",
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Home size={16} />
          Về trang chủ
        </button>
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * normalizeOption
 *
 * BE (QuestionOption model) trả về: { id, label, value, order_index, ... }
 * FE cũ dùng opt.content — không tồn tại trên BE → hiển thị rỗng.
 * Fix: ưu tiên label → value → fallback index.
 * ───────────────────────────────────────────────────────────────────── */
function normalizeOption(opt, index = 0) {
  const display =
    (typeof opt.label   === "string" && opt.label.trim())   ||
    (typeof opt.content === "string" && opt.content.trim()) ||
    (typeof opt.value   === "string" && opt.value.trim())   ||
    `Lựa chọn ${index + 1}`;

  return {
    id:          opt.id || opt.option_id,
    content:     display,
    order_index: opt.order_index ?? index,
  };
}

/* ─────────────────────────────────────────────────────────────────────
 * resolveOptions
 *
 * Ưu tiên optionsMap (đã fetch riêng qua OptionProvider) → fallback
 * về question.options nếu BE trả kèm trong GET questions.
 * Sort theo order_index (đúng thứ tự BE tạo).
 * ───────────────────────────────────────────────────────────────────── */
function resolveOptions(question, optionsMap) {
  const raw = optionsMap?.[question.id];

  let list;
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.data)) {
    list = raw.data;
  } else if (raw && Array.isArray(raw.options)) {
    list = raw.options;
  } else if (Array.isArray(question.options)) {
    list = question.options;
  } else {
    list = [];
  }

  return list
    .map(normalizeOption)
    .filter((o) => o.content !== "")
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)); // giữ thứ tự BE
}

/* ── RatingInput ───────────────────────────────────────────────────── */
function RatingInput({ settings, value, onChange }) {
  const min = settings?.min ?? 1;
  const max = settings?.max ?? 5;
  const [hovered, setHovered] = useState(null);
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {steps.map((star) => {
          const active = hovered !== null ? star <= hovered : star <= (value ?? 0);
          return (
            <button
              key={star}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 2,
                transition: "transform .12s",
                transform: active ? "scale(1.15)" : "scale(1)",
              }}
            >
              <Star
                size={32}
                fill={active ? "#f59e0b" : "transparent"}
                color={active ? "#f59e0b" : "#d1d5db"}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {value != null && (
        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
          Bạn chọn: <strong style={{ color: "#d97706" }}>{value} / {max}</strong>
        </p>
      )}
    </div>
  );
}

/* ── DropdownInput ─────────────────────────────────────────────────── */
function DropdownInput({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", padding: "13px 16px",
          border: `1.5px solid ${open ? "#6d28d9" : "#e5e7eb"}`,
          borderRadius: 12, background: "#fafafa",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 14, color: selected ? "#111827" : "#9ca3af",
          cursor: "pointer", fontFamily: "inherit", fontWeight: selected ? 600 : 400,
          transition: "border-color .15s",
        }}
      >
        {selected ? selected.content : "Chọn một lựa chọn..."}
        <ChevronDown
          size={16}
          color="#6b7280"
          style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden",
          animation: "fadeUp .15s ease",
        }}>
          {options.length === 0 && (
            <p style={{ padding: "14px 16px", fontSize: 13, color: "#9ca3af", margin: 0 }}>Không có lựa chọn</p>
          )}
          {options.map((opt) => {
            const sel = opt.id === value;
            return (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                style={{
                  width: "100%", padding: "13px 16px", textAlign: "left",
                  background: sel ? "#f5f3ff" : "transparent",
                  border: "none", borderBottom: "1px solid #f3f4f6",
                  fontSize: 14, color: sel ? "#6d28d9" : "#374151",
                  fontWeight: sel ? 700 : 400, cursor: "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center",
                  justifyContent: "space-between", transition: "background .1s",
                }}
                onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
              >
                {opt.content}
                {sel && <CheckCircle2 size={15} color="#6d28d9" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── shared input style ────────────────────────────────────────────── */
const inputStyle = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #e5e7eb", borderRadius: 12,
  fontSize: 14, color: "#111827", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color .15s", background: "#fafafa",
};

/* ── QuestionCard ──────────────────────────────────────────────────── */
function QuestionCard({ question, answer, onChange }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, color, bg, border } = cfg;

  /* options đã được resolve + sort theo order_index từ resolveOptions */
  const opts = question.options ?? [];

  const toggleMulti = (optId) => {
    const current = answer instanceof Set ? new Set(answer) : new Set();
    if (current.has(optId)) current.delete(optId); else current.add(optId);
    onChange(question.id, current);
  };

  const settings = question.settings ?? {};

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20,
      padding: "2rem", boxShadow: "0 2px 16px rgba(79,110,247,0.06)",
    }}>
      {/* Type badge */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20, background: bg,
        border: `1px solid ${border}`, fontSize: 11, fontWeight: 700,
        color, marginBottom: 16,
      }}>
        <Icon size={11} />{label}
        {question.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </span>

      {/* Content */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        {question.content}
      </h2>

      {/* ── TEXT ── */}
      {question.type === "TEXT" && (
        <input
          type="text"
          placeholder="Nhập câu trả lời ngắn..."
          value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#4f6ef7")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      )}

      {/* ── PARAGRAPH ── */}
      {question.type === "PARAGRAPH" && (
        <textarea
          rows={5}
          placeholder="Nhập đoạn văn trả lời của bạn..."
          value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      )}

      {/* ── EMAIL ── */}
      {question.type === "EMAIL" && (
        <input
          type="email"
          placeholder="example@email.com"
          value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#0891b2")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      )}

      {/* ── DATE ── */}
      {question.type === "DATE" && (
        <div>
          <input
            type="date"
            value={answer ?? ""}
            min={settings.min_date}
            max={settings.max_date}
            onChange={(e) => onChange(question.id, e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: 200 }}
            onFocus={(e) => (e.target.style.borderColor = "#b45309")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
          {(settings.min_date || settings.max_date) && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
              {settings.min_date && `Từ: ${settings.min_date}`}
              {settings.min_date && settings.max_date && " — "}
              {settings.max_date && `Đến: ${settings.max_date}`}
            </p>
          )}
        </div>
      )}

      {/* ── NUMBER ── */}
      {question.type === "NUMBER" && (
        <div>
          <input
            type="number"
            placeholder={
              settings.min !== undefined && settings.max !== undefined
                ? `Nhập số từ ${settings.min} đến ${settings.max}`
                : "Nhập số..."
            }
            value={answer ?? ""}
            min={settings.min}
            max={settings.max}
            onChange={(e) => onChange(question.id, e.target.value === "" ? "" : Number(e.target.value))}
            style={{ ...inputStyle, width: "auto", minWidth: 200 }}
            onFocus={(e) => (e.target.style.borderColor = "#059669")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
          {(settings.min !== undefined || settings.max !== undefined) && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
              {settings.min !== undefined && `Min: ${settings.min}`}
              {settings.min !== undefined && settings.max !== undefined && " · "}
              {settings.max !== undefined && `Max: ${settings.max}`}
            </p>
          )}
        </div>
      )}

      {/* ── RATING ── */}
      {question.type === "RATING" && (
        <RatingInput
          settings={settings}
          value={answer}
          onChange={(val) => onChange(question.id, val)}
        />
      )}

      {/* ── SINGLE_CHOICE ── */}
      {question.type === "SINGLE_CHOICE" && (
        opts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opts.map((opt) => {
              const selected = answer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChange(question.id, opt.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12,
                    border: `1.5px solid ${selected ? "#4f6ef7" : "#e5e7eb"}`,
                    background: selected ? "#eef2ff" : "#fafafa",
                    cursor: "pointer", textAlign: "left",
                    transition: "all .15s", fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#a5b4fc"; }}
                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${selected ? "#4f6ef7" : "#d1d5db"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all .15s",
                  }}>
                    {selected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4f6ef7" }} />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? "#1e3a8a" : "#374151" }}>
                    {opt.content}
                  </span>
                  {selected && <CheckCircle2 size={16} color="#4f6ef7" style={{ marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Đang tải lựa chọn...</p>
        )
      )}

      {/* ── MULTIPLE_CHOICE ── */}
      {question.type === "MULTIPLE_CHOICE" && (
        opts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>Có thể chọn nhiều đáp án</p>
            {opts.map((opt) => {
              const selected = answer instanceof Set && answer.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleMulti(opt.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12,
                    border: `1.5px solid ${selected ? "#16a34a" : "#e5e7eb"}`,
                    background: selected ? "#f0fdf4" : "#fafafa",
                    cursor: "pointer", textAlign: "left",
                    transition: "all .15s", fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#86efac"; }}
                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    border: `2px solid ${selected ? "#16a34a" : "#d1d5db"}`,
                    background: selected ? "#16a34a" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all .15s",
                  }}>
                    {selected && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? "#14532d" : "#374151" }}>
                    {opt.content}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Đang tải lựa chọn...</p>
        )
      )}

      {/* ── DROPDOWN ── */}
      {question.type === "DROPDOWN" && (
        opts.length > 0 ? (
          <DropdownInput
            options={opts}
            value={answer}
            onChange={(val) => onChange(question.id, val)}
          />
        ) : (
          <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Đang tải lựa chọn...</p>
        )
      )}
    </div>
  );
}

/* ── SurveyTakePage ────────────────────────────────────────────────── */
export default function SurveyTakePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { questions, fetchQuestionsBySurvey, loading } = useQuestion();
  const { options, fetchOptions } = useOption();
  const { submitSurvey, submitting } = useResponse();

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  /* ── Fetch questions → fetch options song song ── */
  useEffect(() => {
    if (!surveyId) return;

    fetchQuestionsBySurvey(surveyId).then(async (list) => {
      if (!Array.isArray(list)) return;

      const choiceQuestions = list.filter(
        (q) => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type)
      );
      if (choiceQuestions.length === 0) return;

      setOptionsLoading(true);
      try {
        await Promise.all(choiceQuestions.map((q) => fetchOptions(q.id)));
      } finally {
        setOptionsLoading(false);
      }
    });
  }, [surveyId]);

  /* ── Merge + normalize options vào questions, sort theo order_index ── */
  const sorted = [...questions]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((q) => ({
      ...q,
      options: resolveOptions(q, options),
    }));

  const total   = sorted.length;
  const current = sorted[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === total - 1;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  /* ── Validate per type ── */
  const canProceed = () => {
    if (!current) return false;
    if (!current.required) return true;
    const ans = answers[current.id];
    const settings = current.settings ?? {};

    switch (current.type) {
      case "TEXT":
      case "PARAGRAPH":
        return typeof ans === "string" && ans.trim().length > 0;
      case "EMAIL": {
        if (typeof ans !== "string" || !ans.trim()) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim());
      }
      case "DATE":
        return typeof ans === "string" && ans.length > 0;
      case "NUMBER": {
        if (ans === "" || ans == null) return false;
        const n = Number(ans);
        if (isNaN(n)) return false;
        if (settings.min !== undefined && n < settings.min) return false;
        if (settings.max !== undefined && n > settings.max) return false;
        return true;
      }
      case "RATING":
        return ans != null;
      case "SINGLE_CHOICE":
      case "DROPDOWN":
        return !!ans;
      case "MULTIPLE_CHOICE":
        return ans instanceof Set && ans.size > 0;
      default:
        return true;
    }
  };

  /* ── Inline validation message ── */
  const getValidationHint = () => {
    if (!current || !current.required) return null;
    const ans = answers[current.id];
    const settings = current.settings ?? {};

    if (current.type === "EMAIL" && typeof ans === "string" && ans.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim())) return "Email không hợp lệ";
    }
    if (current.type === "NUMBER" && ans !== "" && ans != null) {
      const n = Number(ans);
      if (!isNaN(n)) {
        if (settings.min !== undefined && n < settings.min) return `Giá trị tối thiểu là ${settings.min}`;
        if (settings.max !== undefined && n > settings.max) return `Giá trị tối đa là ${settings.max}`;
      }
    }
    return null;
  };

  /* ─────────────────────────────────────────────────────────────────
   * buildPayload
   *
   * Map đúng với BE ResponseService.submitSurvey():
   *
   *   TEXT / PARAGRAPH / EMAIL / DATE
   *     → { question_id, answer_text }
   *
   *   NUMBER / RATING
   *     → { question_id, answer_number: Number }
   *     BE: `const value = ans.answer_number ?? ans.answer_text`
   *     Dùng answer_number để rõ ràng, tránh phụ thuộc vào fallback.
   *
   *   SINGLE_CHOICE / DROPDOWN
   *     → { question_id, option_id }
   *
   *   MULTIPLE_CHOICE
   *     → { question_id, option_ids: string[] }
   *     BE: `if (!Array.isArray(ans.option_ids) || !ans.option_ids.length)`
   * ───────────────────────────────────────────────────────────────── */
  const buildPayload = () => {
    const formattedAnswers = [];

    sorted.forEach((q) => {
      const val = answers[q.id];

      /* TEXT / PARAGRAPH / EMAIL */
      if (["TEXT", "PARAGRAPH", "EMAIL"].includes(q.type)) {
        if (typeof val === "string" && val.trim()) {
          formattedAnswers.push({
            question_id: q.id,
            answer_text: val.trim(),
          });
        }
        return;
      }

      /* DATE — BE: new Date(ans.answer_text) */
      if (q.type === "DATE") {
        if (val) {
          formattedAnswers.push({
            question_id: q.id,
            answer_text: val, // "YYYY-MM-DD" string, BE parse với new Date()
          });
        }
        return;
      }

      /* NUMBER — BE branch: answer_number ?? answer_text, Number(value) */
      if (q.type === "NUMBER") {
        if (val !== "" && val != null && !isNaN(Number(val))) {
          formattedAnswers.push({
            question_id:   q.id,
            answer_number: Number(val), // gửi đúng field BE expect
          });
        }
        return;
      }

      /* RATING — cùng branch với NUMBER trong BE */
      if (q.type === "RATING") {
        if (val != null) {
          formattedAnswers.push({
            question_id:   q.id,
            answer_number: Number(val), // BE: answer_number ?? answer_text → Number(value)
          });
        }
        return;
      }

      /* SINGLE_CHOICE / DROPDOWN — BE: option_id (uuid) */
      if (q.type === "SINGLE_CHOICE" || q.type === "DROPDOWN") {
        if (val) {
          formattedAnswers.push({
            question_id: q.id,
            option_id:   val,
          });
        }
        return;
      }

      /* MULTIPLE_CHOICE — BE: option_ids (string[]) */
      if (q.type === "MULTIPLE_CHOICE") {
        const selected = val instanceof Set ? [...val] : [];
        if (selected.length > 0) {
          formattedAnswers.push({
            question_id: q.id,
            option_ids:  selected,
          });
        }
        return;
      }
    });

    return formattedAnswers;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!canProceed() || submitting) return;

    const formattedAnswers = buildPayload();

    console.log("[SurveyTakePage] payload →", formattedAnswers);

    try {
      await submitSurvey(surveyId, { answers: formattedAnswers });
      setSubmitted(true);
    } catch (err) {
      console.error("[SurveyTakePage] submit error:", err);
    }
  };

  if (submitted) {
    return <SuccessScreen onGoHome={() => navigate("/user/home")} />;
  }

  const isPageLoading  = loading || optionsLoading;
  const validationHint = getValidationHint();

  return (
    <div style={{
      minHeight: "100vh", background: "#f4f5f7",
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "2.5rem 1.5rem",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.75rem" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 38, borderRadius: 10,
              border: "1px solid #e5e7eb", background: "#fff",
              cursor: "pointer", color: "#374151", flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>Làm khảo sát</h1>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, fontFamily: "monospace" }}>{surveyId}</p>
          </div>
        </div>

        {/* Loading */}
        {isPageLoading && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "5rem 0", gap: 14, color: "#9ca3af",
          }}>
            <Loader2 size={32} color="#4f6ef7" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, margin: 0 }}>
              {loading ? "Đang tải câu hỏi..." : "Đang tải lựa chọn..."}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isPageLoading && total === 0 && (
          <div style={{
            background: "#fff", borderRadius: 20, padding: "3rem",
            textAlign: "center", color: "#9ca3af", border: "1px solid #e5e7eb",
          }}>
            <p style={{ fontSize: 15, margin: 0 }}>Khảo sát này chưa có câu hỏi nào.</p>
          </div>
        )}

        {/* Main */}
        {!isPageLoading && total > 0 && (
          <>
            <ProgressBar current={currentIndex + 1} total={total} />

            <QuestionCard
              key={current.id}
              question={current}
              answer={answers[current.id]}
              onChange={handleChange}
            />

            {/* Required warning */}
            {current.required && !canProceed() && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                {validationHint ?? "* Câu hỏi này bắt buộc phải trả lời"}
              </p>
            )}

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: "1.5rem" }}>
              {!isFirst && (
                <button
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  disabled={submitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "13px 20px", background: "#fff",
                    border: "1.5px solid #e5e7eb", borderRadius: 12,
                    fontSize: 14, fontWeight: 600, color: "#374151",
                    cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
                  }}
                >
                  <ChevronLeft size={16} />Quay lại
                </button>
              )}

              {!isLast ? (
                <button
                  onClick={() => { if (canProceed()) setCurrentIndex((i) => i + 1); }}
                  disabled={!canProceed()}
                  style={{
                    flex: 1, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, padding: "13px 20px",
                    background: canProceed() ? "#4f6ef7" : "#e5e7eb",
                    color: canProceed() ? "#fff" : "#9ca3af",
                    border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    cursor: canProceed() ? "pointer" : "not-allowed",
                    transition: "all .15s", fontFamily: "inherit",
                  }}
                >
                  Câu tiếp theo<ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  style={{
                    flex: 1, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, padding: "13px 20px",
                    background: canProceed() && !submitting ? "#16a34a" : "#e5e7eb",
                    color: canProceed() && !submitting ? "#fff" : "#9ca3af",
                    border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    cursor: canProceed() && !submitting ? "pointer" : "not-allowed",
                    transition: "all .15s", fontFamily: "inherit",
                  }}
                >
                  {submitting
                    ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Đang gửi...</>
                    : <><Send size={15} />Nộp khảo sát</>
                  }
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}