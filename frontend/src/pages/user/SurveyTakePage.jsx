// ─── SurveyTakePage.jsx ─── Survey taking page with advanced features ──
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import { useResponse } from "@/providers/ResponseProvider";
import { useOption } from "@/providers/OptionProvider";
import { useSurvey } from "@/providers/SurveyProvider";
import {
  ChevronLeft, ChevronRight, CheckCircle2, CircleDot,
  AlignLeft, CheckSquare, Loader2, Send, Home,
  FileText, Mail, Calendar, Hash, Star, ChevronDown, Clock,
  AlertTriangle,
} from "lucide-react";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

/* ── Type config ──────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản ngắn",   Icon: AlignLeft,  color: "#4f6ef7", bg: "#eef2ff", border: "#c7d2fe" },
  PARAGRAPH:       { label: "Đoạn văn",        Icon: FileText,   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  EMAIL:           { label: "Email",            Icon: Mail,       color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  DATE:            { label: "Ngày tháng",        Icon: Calendar,   color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  NUMBER:          { label: "Số",               Icon: Hash,       color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  RATING:          { label: "Xếp hạng",        Icon: Star,       color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  SINGLE_CHOICE:   { label: "Một lựa chọn",    Icon: CircleDot,  color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn",  Icon: CheckSquare, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  DROPDOWN:        { label: "Danh sách thả",    Icon: ChevronDown, color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  LINEAR_SCALE:    { label: "Phạm vi tuyến tính",Icon: Hash,       color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  TIME:            { label: "Giờ",              Icon: Clock,      color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
};

const inputStyle = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #e5e7eb", borderRadius: 12,
  fontSize: 14, color: "#111827", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color .15s", background: "#fafafa",
};

/* ── SuccessScreen ────────────────────────────────────────────────── */
function SuccessScreen({ onGoHome, thankYouMessage, logoUrl, redirectUrl }) {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => { window.location.href = redirectUrl; }, 5000);
      const iv = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { clearInterval(iv); return 0; } return prev - 1; });
      }, 1000);
      return () => { clearTimeout(timer); clearInterval(iv); };
    }
  }, [redirectUrl]);

  const message = thankYouMessage || "Câu trả lời của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.";
  return (
    <div style={{ minHeight: "100vh", background: "transparent", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Inter',sans-serif", padding: "2rem" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 22, padding: "3rem 2.5rem", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 18px 48px rgba(15,23,42,0.1)", animation: "fadeUp .4s ease" }}>
        {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "contain", marginBottom: "1rem" }} />}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 4px 16px rgba(22,163,74,0.20)" }}>
          <CheckCircle2 size={40} color="#16a34a" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Gửi thành công! 🎉</h2>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 2rem", lineHeight: 1.7 }}>{message}</p>
        {redirectUrl && (
          <div style={{ marginBottom: "1.5rem", padding: "10px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: "#2563eb", margin: "0 0 4px" }}>Đang chuyển hướng đến trang đích...</p>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>{redirectUrl}</p>
            <p style={{ fontSize: 12, color: "#2563eb", margin: "6px 0 0", fontWeight: 600 }}>Tự động chuyển sau {countdown}s</p>
          </div>
        )}
        <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 1.75rem" }} />
        <button onClick={onGoHome} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 32px", background: "linear-gradient(135deg,#4361ee,#6c7ef7)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", boxShadow: "0 4px 14px rgba(79,110,247,0.30)", transition: "opacity .15s" }}>
          <Home size={16} />Về trang chủ
        </button>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ── ProgressBar ─────────────────────────────────────────────────── */
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>Câu hỏi {current} / {total}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(15,23,42,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#6366f1,#4f46e5)", borderRadius: 99, transition: "width .4s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ width: i === current - 1 ? 20 : 8, height: 8, borderRadius: 99, background: i < current ? "#4f46e5" : "rgba(15,23,42,0.1)", transition: "all .3s ease" }} />
        ))}
      </div>
    </div>
  );
}

/* ── RatingInput ────────────────────────────────────────────────── */
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
            <button key={star} onClick={() => onChange(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, transition: "transform .12s", transform: active ? "scale(1.15)" : "scale(1)" }}>
              <Star size={32} fill={active ? "#f59e0b" : "transparent"} color={active ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
      {value != null && <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Bạn chọn: <strong style={{ color: "#d97706" }}>{value} / {max}</strong></p>}
    </div>
  );
}

/* ── DropdownInput ──────────────────────────────────────────────── */
function DropdownInput({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: "100%", padding: "13px 16px", border: `1.5px solid ${open ? "#6d28d9" : "#e5e7eb"}`, borderRadius: 12, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: selected ? "#111827" : "#9ca3af", fontWeight: selected ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selected?.image_url && (
            <img src={selected.image_url} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 5, border: "1px solid #e5e7eb", flexShrink: 0 }}/>
          )}
          {selected ? selected.content : "Chọn một lựa chọn..."}
        </span>
        <ChevronDown size={16} color="#6b7280" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", animation: "fadeUp .15s ease" }}>
          {options.map((opt) => {
            const sel = opt.id === value;
            return (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }}
                style={{ width: "100%", padding: "13px 16px", textAlign: "left", background: sel ? "#f5f3ff" : "transparent", border: "none", borderBottom: "1px solid #f3f4f6", fontSize: 14, color: sel ? "#6d28d9" : "#374151", fontWeight: sel ? 700 : 400, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background .1s", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {opt.image_url && (
                    <img src={opt.image_url} alt="" style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 5, border: `1px solid ${sel ? "#ddd6fe" : "#e5e7eb"}`, flexShrink: 0 }}/>
                  )}
                  {opt.content}
                </span>
                {sel && <CheckCircle2 size={15} color="#6d28d9" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── resolveOptions ──────────────────────────────────────────────── */
function normalizeOption(opt, index = 0) {
  const display = (typeof opt.label === "string" && opt.label.trim()) || (typeof opt.content === "string" && opt.content.trim()) || (typeof opt.value === "string" && opt.value.trim()) || `Lựa chọn ${index + 1}`;
  return {
    id: opt.id || opt.option_id,
    content: display,
    order_index: opt.order_index ?? index,
    image_url: opt.image_url || null,
    media_type: opt.media_type || null,
  };
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

/* ── QuestionCard ───────────────────────────────────────────────── */
function QuestionCard({ question, answer, onChange }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, color, bg, border } = cfg;
  const opts = question.options ?? [];
  const settings = question.settings ?? {};
  const placeholder = question.placeholder || "";
  const description = question.description || null;

  const toggleMulti = (optId) => {
    const current = answer instanceof Set ? new Set(answer) : new Set();
    if (current.has(optId)) current.delete(optId); else current.add(optId);
    onChange(question.id, current);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "2rem", boxShadow: "0 2px 0 rgba(255,255,255,0.85) inset, 0 14px 40px rgba(15,23,42,0.08)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: bg, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, color, marginBottom: 16 }}>
        <Icon size={11} />{label}
        {question.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </span>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.5, marginBottom: description ? "0.5rem" : "1.5rem" }}>{question.content}</h2>

      {description && <p style={{ fontSize: 13, color: "#6b7280", marginBottom: "1rem", lineHeight: 1.6, fontStyle: "italic" }}>{description}</p>}

      {question.media_url && (
        question.media_type === "video"
          ? <video src={question.media_url} controls style={{ width: "100%", borderRadius: 12, marginBottom: "1rem", maxHeight: 320, objectFit: "contain" }} />
          : <img src={question.media_url} alt="Media" style={{ width: "100%", borderRadius: 12, marginBottom: "1rem", maxHeight: 320, objectFit: "cover" }} />
      )}

      {/* TEXT */}
      {question.type === "TEXT" && (
        <input type="text" placeholder={placeholder || "Nhập câu trả lời ngắn..."} value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)} maxLength={settings.max_chars || undefined}
          style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#4f6ef7")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
      )}

      {/* PARAGRAPH */}
      {question.type === "PARAGRAPH" && (
        <textarea rows={5} placeholder={placeholder || "Nhập đoạn văn trả lời..."} value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)} maxLength={settings.max_chars || undefined}
          style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
      )}

      {/* EMAIL */}
      {question.type === "EMAIL" && (
        <input type="email" placeholder={placeholder || "example@email.com"} value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#0891b2")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
      )}

      {/* DATE */}
      {question.type === "DATE" && (
        <div>
          <input type="date" value={answer ?? ""} min={settings.min_date} max={settings.max_date}
            onChange={(e) => onChange(question.id, e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 200 }}
            onFocus={(e) => (e.target.style.borderColor = "#b45309")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
          {(settings.min_date || settings.max_date) && (
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
              {settings.min_date && `Từ: ${settings.min_date}`}{settings.min_date && settings.max_date && " — "}{settings.max_date && `Đến: ${settings.max_date}`}
            </p>
          )}
        </div>
      )}

      {/* NUMBER */}
      {question.type === "NUMBER" && (
        <input type="number" placeholder={settings.min !== undefined && settings.max !== undefined ? `Nhập số từ ${settings.min} đến ${settings.max}` : "Nhập số..."}
          value={answer ?? ""} onChange={(e) => onChange(question.id, e.target.value)} min={settings.min} max={settings.max}
          style={inputStyle} onFocus={(e) => (e.target.style.borderColor = "#059669")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
      )}

      {/* RATING */}
      {question.type === "RATING" && <RatingInput settings={settings} value={answer} onChange={(v) => onChange(question.id, v)} />}

      {/* SINGLE_CHOICE */}
      {question.type === "SINGLE_CHOICE" && (
        opts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opts.map((opt) => {
              const sel = opt.id === answer;
              return (
                <button key={opt.id} onClick={() => onChange(question.id, opt.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `2px solid ${sel ? "#4f46e5" : "#e5e7eb"}`, borderRadius: 12, background: sel ? "#eef2ff" : "transparent", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel ? "#4f46e5" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4f46e5" }} />}
                  </div>
                  {opt.image_url && (
                    <img src={opt.image_url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: `1px solid ${sel ? "#c7d2fe" : "#e5e7eb"}`, flexShrink: 0 }}/>
                  )}
                  <span style={{ fontSize: 14, fontWeight: sel ? 600 : 400, color: sel ? "#3730a3" : "#374151" }}>{opt.content}</span>
                </button>
              );
            })}
          </div>
        ) : <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Đang tải lựa chọn...</p>
      )}

      {/* MULTIPLE_CHOICE */}
      {question.type === "MULTIPLE_CHOICE" && (
        opts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {opts.map((opt) => {
              const sel = answer instanceof Set ? answer.has(opt.id) : false;
              return (
                <button key={opt.id} onClick={() => toggleMulti(opt.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: `2px solid ${sel ? "#16a34a" : "#d1d5db"}`, borderRadius: 12, background: sel ? "#f0fdf4" : "transparent", cursor: "pointer", textAlign: "left", transition: "all .15s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? "#16a34a" : "#d1d5db"}`, background: sel ? "#16a34a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {sel && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  {opt.image_url && (
                    <img src={opt.image_url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: `1px solid ${sel ? "#bbf7d0" : "#e5e7eb"}`, flexShrink: 0 }}/>
                  )}
                  <span style={{ fontSize: 14, fontWeight: sel ? 600 : 400, color: sel ? "#14532d" : "#374151" }}>{opt.content}</span>
                </button>
              );
            })}
          </div>
        ) : <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Đang tải lựa chọn...</p>
      )}

      {/* DROPDOWN */}
      {question.type === "DROPDOWN" && (
        opts.length > 0
          ? <DropdownInput options={opts} value={answer} onChange={(val) => onChange(question.id, val)} />
          : <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Đang tải lựa chọn...</p>
      )}

      {/* LINEAR_SCALE */}
      {question.type === "LINEAR_SCALE" && (() => {
        const min = settings?.min ?? 1;
        const max = settings?.max ?? 5;
        const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(settings.min_label || settings.max_label) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280" }}>
                <span>{settings.min_label || `Từ ${min}`}</span>
                <span>{settings.max_label || `Đến ${max}`}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {steps.map((v) => {
                const sel = answer === v;
                return (
                  <button key={v} onClick={() => onChange(question.id, v)} style={{ minWidth: 44, padding: "10px 8px", borderRadius: 10, border: `2px solid ${sel ? "#7c3aed" : "#e5e7eb"}`, background: sel ? "#f5f3ff" : "transparent", color: sel ? "#6d28d9" : "#374151", fontWeight: sel ? 700 : 400, fontSize: 15, cursor: "pointer", transition: "all .15s" }}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TIME */}
      {question.type === "TIME" && (
        <input type="time" placeholder={placeholder || "Chọn giờ..."} value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)} style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#0891b2")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
      )}
    </div>
  );
}

/* ── SurveyTakePage ──────────────────────────────────────────────── */
export default function SurveyTakePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { questions, fetchQuestionsBySurvey, loading: qLoading } = useQuestion();
  const { options, fetchOptions } = useOption();
  const { startSurvey, submitSurvey, submitting } = useResponse();
  const { fetchSurveyById, currentSurvey } = useSurvey();

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState(null); // "not_started" | "active" | "expired"
  const [started, setStarted] = useState(false);          // user clicked "Bắt đầu"
  const [starting, setStarting] = useState(false);        // loading when starting
  const autoSaveRef = useRef(null);

  // Check survey scheduling
  useEffect(() => {
    if (!currentSurvey) return;
    const now = new Date();
    const start = currentSurvey.start_at ? new Date(currentSurvey.start_at) : null;
    const end = currentSurvey.end_at ? new Date(currentSurvey.end_at) : null;
    if (start && now < start) {
      setSurveyStatus("not_started");
    } else if (end && now > end) {
      setSurveyStatus("expired");
    } else {
      setSurveyStatus("active");
    }
  }, [currentSurvey]);

  // When survey becomes active, prompt user to start
  useEffect(() => {
    if (surveyStatus === "active" && !started) {
      setStarted(false);
    }
  }, [surveyStatus]);

  // Fetch survey settings
  useEffect(() => {
    if (!surveyId) return;
    fetchSurveyById(surveyId);
  }, [surveyId]);

  // Fetch questions + options
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

  // Time limit countdown
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

  // Auto-save every 30s
  useEffect(() => {
    if (!surveyId || submitted || !Object.keys(answers).length) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      const payload = buildPayloadForAutoSave(answers);
      if (!payload.length) return;
      try {
        await fetch(`/api/v1/responses/${surveyId}/autosave`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({ answers: payload }),
        });
      } catch (e) { console.warn("[Auto-save]", e); }
    }, 30000);
    return () => clearTimeout(autoSaveRef.current);
  }, [answers, surveyId, submitted]);

  // Merge options into questions
  const sorted = [...questions]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((q) => ({ ...q, options: resolveOptions(q, options) }));

  // Filter by conditional logic
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
    if (current.type === "EMAIL" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typeof ans === "string" ? ans.trim() : "")) return "Email không hợp lệ";
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
    try {
      await submitSurvey(surveyId, { answers: buildPayload() });
      setSubmitted(true);
    } catch (err) { console.error("[Submit]", err); }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await startSurvey(surveyId);
      setStarted(true);
    } catch (err) {
      console.error("[Start]", err);
    } finally {
      setStarting(false);
    }
  };

  // Survey active — show intro screen with "Bắt đầu" button
  if (surveyStatus === "active" && !started) {
    const accent = currentSurvey?.accent_color || "#4f46e5";
    return (
      <div style={{ minHeight: "100vh", background: "transparent", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Inter',sans-serif", padding: "2rem" }}>
        <AnimatedSurveyBackdrop />
        <div style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 22, padding: "3rem 2.5rem", maxWidth: 520, width: "100%", textAlign: "center", boxShadow: "0 2px 0 rgba(255,255,255,0.85) inset, 0 18px 48px rgba(15,23,42,0.08)", animation: "fadeUp .4s ease" }}>
          {currentSurvey?.logo_url && (
            <img src={currentSurvey.logo_url} alt="Logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "contain", marginBottom: "1rem" }} />
          )}
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${accent}22,${accent}44)`, border: `2px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <FileText size={32} color={accent} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>{currentSurvey?.title || "Khảo sát"}</h2>
          {currentSurvey?.description && (
            <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 2rem", lineHeight: 1.7 }}>{currentSurvey.description}</p>
          )}
          {currentSurvey?.time_limit_seconds && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: "#fef3c7", border: "1px solid #fde68a", fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: "1.5rem" }}>
              <Clock size={13} />Thời gian: {Math.floor(currentSurvey.time_limit_seconds / 60)} phút
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", justifyContent: "center" }}>
              <FileText size={13} color="#9ca3af" />
              {questions.length} câu hỏi
            </div>
            {currentSurvey?.is_anonymous && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", justifyContent: "center" }}>
                <AlertTriangle size={13} color="#d97706" />
                Khảo sát ẩn danh
              </div>
            )}
          </div>
          <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 1.75rem" }} />
          <button
            onClick={handleStart}
            disabled={starting}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 40px",
              background: starting ? "rgba(0,0,0,0.1)" : `linear-gradient(135deg,${accent},${accent}cc)`,
              color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: starting ? "not-allowed" : "pointer", fontFamily: "inherit",
              boxShadow: starting ? "none" : `0 4px 14px ${accent}44`,
              transition: "all .15s", width: "100%",
            }}
          >
            {starting ? (
              <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Đang bắt đầu...</>
            ) : (
              <><FileText size={16} />Bắt đầu làm khảo sát</>
            )}
          </button>
          <button onClick={() => navigate(-1)} style={{ marginTop: "0.75rem", background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: "inherit" }}>
            ← Quay lại
          </button>
        </div>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  if (submitted || timeUp) {
    return <SuccessScreen
      onGoHome={() => navigate("/user/home")}
      thankYouMessage={currentSurvey?.thank_you_message}
      logoUrl={currentSurvey?.logo_url}
      redirectUrl={currentSurvey?.thank_you_redirect_url}
    />;
  }

  // Survey not started yet or expired
  if (surveyStatus === "not_started" || surveyStatus === "expired") {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Inter',sans-serif", padding: "2rem" }}>
        <AnimatedSurveyBackdrop />
        <div style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.86)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 22, padding: "3rem 2.5rem", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 18px 48px rgba(15,23,42,0.1)", animation: "fadeUp .4s ease" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: surveyStatus === "not_started" ? "linear-gradient(135deg,#dbeafe,#bfdbfe)" : "linear-gradient(135deg,#fef3c7,#fde68a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 4px 16px rgba(59,130,246,0.20)" }}>
            <Calendar size={36} color={surveyStatus === "not_started" ? "#2563eb" : "#d97706"} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
            {surveyStatus === "not_started" ? "Khảo sát chưa bắt đầu" : "Khảo sát đã kết thúc"}
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 2rem", lineHeight: 1.7 }}>
            {surveyStatus === "not_started"
              ? `Khảo sát này sẽ mở vào ngày ${currentSurvey?.start_at ? new Date(currentSurvey.start_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }) : ""}. Hãy quay lại sau nhé!`
              : "Khảo sát này đã kết thúc. Cảm ơn bạn đã quan tâm!"
            }
          </p>
          <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 1.75rem" }} />
          <button onClick={() => navigate("/user/home")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 32px", background: "linear-gradient(135deg,#4361ee,#6c7ef7)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", boxShadow: "0 4px 14px rgba(79,110,247,0.30)" }}>
            <Home size={16} />Về trang chủ
          </button>
        </div>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  const loading = qLoading || optionsLoading;
  const hint = getValidationHint();

  const fmtTime = (secs) => {
    if (!secs && secs !== 0) return null;
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const timeWarning = timeLeft !== null && timeLeft <= 60;

  return (
    <main style={{ minHeight: "100vh", background: "transparent", position: "relative", fontFamily: "'DM Sans','Inter',sans-serif", padding: "2.5rem 1.5rem", overflowX: "hidden" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.75rem" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", cursor: "pointer", color: "#334155", flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: 0 }}>{currentSurvey?.title || "Làm khảo sát"}</h1>
            {currentSurvey?.description && <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0", lineHeight: 1.5 }}>{currentSurvey.description}</p>}
          </div>
          {timeLeft !== null && (
            <div style={{ padding: "4px 12px", borderRadius: 999, background: timeWarning ? "#fef2f2" : "#f0fdf4", border: `1px solid ${timeWarning ? "#fecaca" : "#bbf7d0"}`, color: timeWarning ? "#dc2626" : "#16a34a", fontSize: 13, fontWeight: 800, fontFamily: "monospace", animation: timeWarning ? "pulse 1s infinite" : "none" }}>
              ⏱ {fmtTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: 14, color: "#9ca3af" }}>
            <Loader2 size={32} color="#4f46e5" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, margin: 0 }}>{qLoading ? "Đang tải câu hỏi..." : "Đang tải lựa chọn..."}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <div style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(14px)", borderRadius: 20, padding: "3rem", textAlign: "center", color: "#64748b", border: "1px solid rgba(255,255,255,0.55)", boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}>
            <p style={{ fontSize: 15, margin: 0 }}>Khảo sát này chưa có câu hỏi nào.</p>
          </div>
        )}

        {/* Main */}
        {!loading && total > 0 && current && (
          <>
            <ProgressBar current={currentIndex + 1} total={total} />
            <QuestionCard key={current.id} question={current} answer={answers[current.id]} onChange={handleChange} />
            {current.required && !canProceed() && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                {hint ?? "* Câu hỏi này bắt buộc phải trả lời"}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: "1.5rem" }}>
              {currentSurvey?.allow_back !== false && !isFirst && (
                <button onClick={() => setCurrentIndex((i) => i - 1)} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 20px", background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#374151", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  <ChevronLeft size={16} />Quay lại
                </button>
              )}
              {!isLast ? (
                <button onClick={() => { if (canProceed()) setCurrentIndex((i) => i + 1); }} disabled={!canProceed()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: canProceed() ? "linear-gradient(135deg,#4361ee,#6c7ef7)" : "rgba(15,23,42,0.08)", color: canProceed() ? "#fff" : "#94a3b8", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed", transition: "all .15s", fontFamily: "inherit" }}>
                  Câu tiếp theo<ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!canProceed() || submitting} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: canProceed() && !submitting ? "linear-gradient(135deg,#059669,#10b981)" : "rgba(15,23,42,0.08)", color: canProceed() && !submitting ? "#fff" : "#94a3b8", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: canProceed() && !submitting ? "pointer" : "not-allowed", transition: "all .15s", fontFamily: "inherit" }}>
                  {submitting ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Đang gửi...</> : <><Send size={15} />Nộp khảo sát</>}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}
