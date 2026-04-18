// ─── QuestionPage.jsx ─────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Inbox,
  X,
  MessageSquare,
  CheckSquare,
  CircleDot,
  ChevronDown,
} from "lucide-react";

/* ── Type config ──────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  TEXT: {
    label: "Văn bản",
    Icon: MessageSquare,
    bg: "#1e2540",
    color: "#6c7ef7",
    border: "#2e3d70",
  },
  MULTIPLE_CHOICE: {
    label: "Nhiều lựa chọn",
    Icon: CheckSquare,
    bg: "#0d2318",
    color: "#22c55e",
    border: "#14532d",
  },
  SINGLE_CHOICE: {
    label: "Một lựa chọn",
    Icon: CircleDot,
    bg: "#1f1508",
    color: "#f97316",
    border: "#7c2d12",
  },
};

/* ── TypeBadge ────────────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, bg, color, border } = cfg;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 11,
        fontWeight: 700,
        color,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

/* ── OptionTag ────────────────────────────────────────────────────── */
function OptionTag({ label }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 20,
        background: "#1a1f30",
        border: "1px solid #2a3050",
        fontSize: 12,
        color: "#9ca3af",
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

/* ── QuestionPage ─────────────────────────────────────────────────── */
export default function QuestionPage() {
  const { surveyId } = useParams();
  const { questions, createQuestion, fetchQuestionsBySurvey, deleteQuestion, loading } =
    useQuestion();

  const [content, setContent] = useState("");
  const [type, setType] = useState("TEXT");
  const [options, setOptions] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (surveyId) fetchQuestionsBySurvey(surveyId);
  }, [surveyId]);

  /* ── Create ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setFormError("Nội dung câu hỏi không được để trống."); return; }
    if (type !== "TEXT" && !options.trim()) { setFormError("Vui lòng nhập ít nhất một lựa chọn."); return; }
    setFormError("");
    try {
      await createQuestion(surveyId, {
        content,
        type,
        required: true,
        order_index: questions.length + 1,
        options:
          type === "TEXT"
            ? []
            : options.split(",").map((o) => o.trim()).filter(Boolean),
      });
      setContent(""); setOptions(""); setType("TEXT");
      setShowForm(false);
      fetchQuestionsBySurvey(surveyId);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const ok = await deleteQuestion(id);
      if (ok) fetchQuestionsBySurvey(surveyId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        padding: "2.5rem 2rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#f9fafb",
                margin: "0 0 4px",
              }}
            >
              Câu hỏi khảo sát
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  fontFamily: "monospace",
                  background: "#161b2e",
                  padding: "2px 8px",
                  borderRadius: 6,
                  border: "1px solid #1f2740",
                }}
              >
                {surveyId}
              </span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                · {questions.length} câu hỏi
              </span>
            </div>
          </div>

          <button
            onClick={() => { setShowForm((v) => !v); setFormError(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: showForm ? "#1a1f30" : "#4f6ef7",
              color: showForm ? "#9ca3af" : "#fff",
              border: showForm ? "1px solid #2a3050" : "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Huỷ" : "Thêm câu hỏi"}
          </button>
        </div>

        {/* ── Create Form ── */}
        {showForm && (
          <div
            style={{
              background: "#161b2e",
              border: "1px solid #1f2740",
              borderRadius: 16,
              padding: "1.75rem",
              marginBottom: "1.5rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#f9fafb",
                margin: "0 0 16px",
              }}
            >
              Câu hỏi mới
            </h2>

            <form onSubmit={handleAdd}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Content */}
                <textarea
                  placeholder="Nội dung câu hỏi *"
                  value={content}
                  rows={2}
                  onChange={(e) => { setContent(e.target.value); setFormError(""); }}
                  style={{
                    padding: "10px 14px",
                    border: `1.5px solid ${formError && !content.trim() ? "#ef4444" : "#2a3050"}`,
                    borderRadius: 10,
                    fontSize: 14,
                    color: "#f9fafb",
                    outline: "none",
                    resize: "vertical",
                    background: "#0f1117",
                    fontFamily: "inherit",
                  }}
                />

                {/* Type selector */}
                <div style={{ position: "relative" }}>
                  <select
                    value={type}
                    onChange={(e) => { setType(e.target.value); setOptions(""); setFormError(""); }}
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 14px",
                      border: "1.5px solid #2a3050",
                      borderRadius: 10,
                      fontSize: 14,
                      color: "#f9fafb",
                      background: "#0f1117",
                      outline: "none",
                      appearance: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <option value="TEXT">Văn bản tự do</option>
                    <option value="MULTIPLE_CHOICE">Nhiều lựa chọn</option>
                    <option value="SINGLE_CHOICE">Một lựa chọn</option>
                  </select>
                  <ChevronDown
                    size={16}
                    color="#6b7280"
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                </div>

                {/* Options (if not TEXT) */}
                {type !== "TEXT" && (
                  <div>
                    <input
                      placeholder="Các lựa chọn, cách nhau bằng dấu phẩy: A, B, C"
                      value={options}
                      onChange={(e) => { setOptions(e.target.value); setFormError(""); }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: `1.5px solid ${formError && !options.trim() ? "#ef4444" : "#2a3050"}`,
                        borderRadius: 10,
                        fontSize: 14,
                        color: "#f9fafb",
                        background: "#0f1117",
                        outline: "none",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                    {/* Live option preview */}
                    {options.trim() && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {options.split(",").map((o) => o.trim()).filter(Boolean).map((o, i) => (
                          <OptionTag key={i} label={o} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {formError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle size={14} />
                    {formError}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(""); }}
                    style={{
                      padding: "9px 18px",
                      background: "transparent",
                      border: "1.5px solid #2a3050",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 20px",
                      background: loading ? "#3a4f9e" : "#4f6ef7",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {loading
                      ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                      : <Plus size={15} />
                    }
                    {loading ? "Đang thêm..." : "Thêm câu hỏi"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Question List ── */}
        {questions.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "5rem 0",
              color: "#4b5563",
              gap: 12,
            }}
          >
            <Inbox size={48} strokeWidth={1.2} />
            <p style={{ fontSize: 15, margin: 0, color: "#6b7280" }}>Chưa có câu hỏi nào.</p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#6c7ef7",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "inherit",
              }}
            >
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {questions.map((q, index) => {
              const cfg = TYPE_CONFIG[q.type] ?? TYPE_CONFIG.TEXT;
              const { bg, color } = cfg;

              return (
                <div
                  key={q.id}
                  style={{
                    background: "#161b2e",
                    border: "1px solid #1f2740",
                    borderRadius: 14,
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    transition: "box-shadow .15s, transform .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 16px rgba(79,110,247,0.12)";
                    e.currentTarget.style.transform = "translateX(2px)";
                    e.currentTarget.style.borderColor = "#2e3d70";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.borderColor = "#1f2740";
                  }}
                >
                  {/* Number badge */}
                  <div
                    style={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: 8,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#f9fafb",
                        margin: "0 0 6px",
                        lineHeight: 1.5,
                      }}
                    >
                      {q.content}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <TypeBadge type={q.type} />

                      {/* Options preview */}
                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <>
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#4b5563" }} />
                          {q.options.slice(0, 3).map((o, i) => (
                            <OptionTag key={i} label={typeof o === "object" ? o.content ?? o.label ?? JSON.stringify(o) : o} />
                          ))}
                          {q.options.length > 3 && (
                            <span style={{ fontSize: 11, color: "#6b7280" }}>
                              +{q.options.length - 3} nữa
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid #3a1a1a",
                      background: "transparent",
                      cursor: deletingId === q.id ? "not-allowed" : "pointer",
                      color: "#ef4444",
                      transition: "background .12s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1f1010")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {deletingId === q.id
                      ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}