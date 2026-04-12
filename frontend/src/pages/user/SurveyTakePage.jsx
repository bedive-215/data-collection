// ─── SurveyTakePage.jsx ───────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import { useResponse } from "@/providers/ResponseProvider";
import {
  ChevronLeft, ChevronRight, CheckCircle2, CircleDot,
  AlignLeft, CheckSquare, Loader2, Send, Home,
} from "lucide-react";

/* ── Type config ───────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản",        Icon: AlignLeft,   color: "#4f6ef7", bg: "#eef2ff", border: "#c7d2fe" },
  SINGLE_CHOICE:   { label: "Một lựa chọn",   Icon: CircleDot,   color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", Icon: CheckSquare, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
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
        {/* Icon vòng tròn xanh lá */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
          boxShadow: "0 4px 16px rgba(22,163,74,0.20)",
        }}>
          <CheckCircle2 size={40} color="#16a34a" />
        </div>

        {/* Tiêu đề */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
          Gửi thành công! 🎉
        </h2>

        {/* Mô tả */}
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 2rem", lineHeight: 1.7 }}>
          Câu trả lời của bạn đã được ghi nhận.<br />
          Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 1.75rem" }} />

        {/* Nút về trang chủ */}
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

/* ── QuestionCard ──────────────────────────────────────────────────── */
function QuestionCard({ question, answer, onChange }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, color, bg, border } = cfg;
  const sorted = [...(question.options ?? [])].sort((a, b) =>
    (a.content ?? "").localeCompare(b.content ?? "")
  );

  const toggleMulti = (optId) => {
    const current = answer instanceof Set ? new Set(answer) : new Set();
    if (current.has(optId)) current.delete(optId); else current.add(optId);
    onChange(question.id, current);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "2rem", boxShadow: "0 2px 16px rgba(79,110,247,0.06)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: bg, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, color, marginBottom: 16 }}>
        <Icon size={11} />{label}
        {question.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </span>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        {question.content}
      </h2>

      {question.type === "TEXT" && (
        <textarea rows={4} placeholder="Nhập câu trả lời của bạn..." value={answer ?? ""}
          onChange={(e) => onChange(question.id, e.target.value)}
          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 14, color: "#111827", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .15s" }}
          onFocus={(e) => (e.target.style.borderColor = "#4f6ef7")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      )}

      {question.type === "SINGLE_CHOICE" && sorted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((opt) => {
            const selected = answer === opt.id;
            return (
              <button key={opt.id} onClick={() => onChange(question.id, opt.id)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${selected ? "#4f6ef7" : "#e5e7eb"}`, background: selected ? "#eef2ff" : "#fafafa", cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#a5b4fc"; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? "#4f6ef7" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4f6ef7" }} />}
                </div>
                <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? "#1e3a8a" : "#374151" }}>{opt.content}</span>
                {selected && <CheckCircle2 size={16} color="#4f6ef7" style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "MULTIPLE_CHOICE" && sorted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 4px" }}>Có thể chọn nhiều đáp án</p>
          {sorted.map((opt) => {
            const selected = answer instanceof Set && answer.has(opt.id);
            return (
              <button key={opt.id} onClick={() => toggleMulti(opt.id)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${selected ? "#16a34a" : "#e5e7eb"}`, background: selected ? "#f0fdf4" : "#fafafa", cursor: "pointer", textAlign: "left", transition: "all .15s", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#86efac"; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${selected ? "#16a34a" : "#d1d5db"}`, background: selected ? "#16a34a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                  {selected && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? "#14532d" : "#374151" }}>{opt.content}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── SurveyTakePage ────────────────────────────────────────────────── */
export default function SurveyTakePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { questions, fetchQuestionsBySurvey, loading } = useQuestion();
  const { submitSurvey, submitting } = useResponse();

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);   // ← hiện màn hình thành công

  useEffect(() => {
    if (surveyId) fetchQuestionsBySurvey(surveyId);
  }, [surveyId]);

  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index);
  const total   = sorted.length;
  const current = sorted[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === total - 1;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    if (!current) return false;
    if (!current.required) return true;
    const ans = answers[current.id];
    if (current.type === "TEXT")            return typeof ans === "string" && ans.trim().length > 0;
    if (current.type === "SINGLE_CHOICE")   return !!ans;
    if (current.type === "MULTIPLE_CHOICE") return ans instanceof Set && ans.size > 0;
    return true;
  };

  /* ── Build payload & gọi API ── */
  const handleSubmit = async () => {
    if (!canProceed() || submitting) return;

    const formattedAnswers = [];
    sorted.forEach((q) => {
      const val = answers[q.id];
      if (q.type === "TEXT") {
        formattedAnswers.push({ question_id: q.id, answer_text: val || null, option_id: null });
      }
      if (q.type === "SINGLE_CHOICE") {
        formattedAnswers.push({ question_id: q.id, answer_text: null, option_id: val || null });
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const selected = val instanceof Set ? [...val] : [];
        selected.forEach((optId) => {
          formattedAnswers.push({ question_id: q.id, answer_text: null, option_id: optId });
        });
      }
    });

    try {
      await submitSurvey(surveyId, { answers: formattedAnswers });
      setSubmitted(true);   // ← API thành công → hiện màn hình hoàn thành
    } catch {
      // toast đã xử lý trong ResponseProvider
    }
  };

  /* ── Màn hình hoàn thành ── */
  if (submitted) {
    return <SuccessScreen onGoHome={() => navigate("/user/home")} />;
  }

  /* ── Main render ── */
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.75rem" }}>
          <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#374151", flexShrink: 0 }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>Làm khảo sát</h1>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, fontFamily: "monospace" }}>{surveyId}</p>
          </div>
        </div>

        {/* Loading questions */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: 14, color: "#9ca3af" }}>
            <Loader2 size={32} color="#4f6ef7" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, margin: 0 }}>Đang tải câu hỏi...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "3rem", textAlign: "center", color: "#9ca3af", border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 15, margin: 0 }}>Khảo sát này chưa có câu hỏi nào.</p>
          </div>
        )}

        {/* Main */}
        {!loading && total > 0 && (
          <>
            <ProgressBar current={currentIndex + 1} total={total} />

            <QuestionCard
              key={current.id}
              question={current}
              answer={answers[current.id]}
              onChange={handleChange}
            />

            {current.required && !canProceed() && (
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
                * Câu hỏi này bắt buộc phải trả lời
              </p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: "1.5rem" }}>
              {!isFirst && (
                <button
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  disabled={submitting}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 20px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#374151", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  <ChevronLeft size={16} />Quay lại
                </button>
              )}

              {!isLast ? (
                <button
                  onClick={() => { if (canProceed()) setCurrentIndex((i) => i + 1); }}
                  disabled={!canProceed()}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: canProceed() ? "#4f6ef7" : "#e5e7eb", color: canProceed() ? "#fff" : "#9ca3af", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed", transition: "all .15s", fontFamily: "inherit" }}
                >
                  Câu tiếp theo<ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 20px", background: canProceed() && !submitting ? "#16a34a" : "#e5e7eb", color: canProceed() && !submitting ? "#fff" : "#9ca3af", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: canProceed() && !submitting ? "pointer" : "not-allowed", transition: "all .15s", fontFamily: "inherit" }}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}