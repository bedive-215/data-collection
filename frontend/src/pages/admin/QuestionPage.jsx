// src/pages/QuestionPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuestion } from "@/providers/QuestionProvider";
import { useOption } from "@/providers/OptionProvider";
import {
  Plus, Trash2, Loader2, AlertCircle, Inbox, X,
  Pencil, Check, ChevronUp, ChevronDown, GripVertical, PlusCircle,
} from "lucide-react";

/* ── Design tokens — synced to SurveyPage ────────────────────────── */
const C = {
  bg:            "#080b14",          // ← same as SurveyPage
  surfaceLow:    "#0d1120",          // card background
  surface:       "#0d1120",          // active card
  surfaceHigh:   "#111827",          // elevated surface
  border:        "#1a2035",          // default border
  borderHover:   "#2e3d70",          // hover border
  primary:       "#6c7ef7",          // accent (SurveyPage uses #6c7ef7)
  primaryGrad:   "linear-gradient(135deg,#4f6ef7,#6c7ef7)",
  primaryDim:    "rgba(108,126,247,0.10)",
  primaryBorder: "#2a3464",
  primaryDark:   "#fff",             // text on primary button
  text:          "#f1f5f9",
  textSub:       "#64748b",
  textDim:       "#334155",
  error:         "#ef4444",
  errorBg:       "#150f0f",
  errorBorder:   "#2a1010",
  font:          "'DM Sans','Plus Jakarta Sans',sans-serif",
};

/* ── Shared style helpers ─────────────────────────────────────────── */
const inp = (err) => ({
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px",
  background: C.bg,
  border: `1.5px solid ${err ? C.error : C.border}`,
  borderRadius: 10,
  color: C.text, fontSize: 14,
  fontFamily: C.font, outline: "none",
  transition: "border-color .15s",
});

const sel = { ...inp(false), appearance: "none", paddingRight: 36, cursor: "pointer" };

const lbl = {
  display: "block", fontSize: 11, fontWeight: 700,
  letterSpacing: "0.04em", textTransform: "uppercase",
  color: C.textSub, marginBottom: 7,
};

function iconBtn(color, borderColor) {
  return {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 7,
    border: `1px solid ${borderColor ?? C.border}`,
    background: "transparent", cursor: "pointer", color,
    transition: "background .12s", flexShrink: 0,
  };
}

/* ── Toggle ───────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: C.textSub, textTransform: "uppercase" }}>
        Bắt buộc
      </span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 999,
          background: checked ? C.primary : C.surfaceHigh,
          position: "relative", transition: "background .2s", cursor: "pointer",
          border: `1px solid ${checked ? C.primaryBorder : C.border}`,
        }}
      >
        <div style={{
          position: "absolute", top: 3,
          left: checked ? 22 : 3,
          width: 16, height: 16, borderRadius: "50%",
          background: "#fff",
          transition: "left .2s",
        }} />
      </div>
    </label>
  );
}

/* ── OptionRow ────────────────────────────────────────────────────── */
function OptionRow({ opt, questionId, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [val,      setVal]      = useState("");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const text = typeof opt === "object" ? (opt.content ?? "") : opt;
  const id   = typeof opt === "object" ? opt.id : null;

  const startEdit = () => { setVal(text); setEditing(true); };
  const saveEdit  = async () => {
    const v = val.trim();
    if (!v || v === text) { setEditing(false); return; }
    setSaving(true);
    try { await onUpdate(id, questionId, { content: v }); setEditing(false); }
    finally { setSaving(false); }
  };
  const handleDel = async () => {
    if (!id) return;
    setDeleting(true);
    try { await onDelete(id, questionId); } finally { setDeleting(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        border: `1.5px solid ${C.textDim}`, flexShrink: 0,
      }} />

      {editing ? (
        <input
          autoFocus value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
          style={{ ...inp(false), flex: 1, padding: "6px 10px", fontSize: 14 }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{text}</span>
      )}

      <div style={{ display: "flex", gap: 4 }}>
        {editing ? (
          <>
            <button onClick={saveEdit} disabled={saving}
              style={{ ...iconBtn("#22c55e", "#14532d") }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a1a0a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {saving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            </button>
            <button onClick={() => setEditing(false)}
              style={iconBtn(C.textSub)}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHigh)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button onClick={startEdit} style={iconBtn(C.primary)} title="Sửa"
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHigh)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Pencil size={13} />
            </button>
            <button onClick={handleDel} disabled={deleting}
              style={iconBtn(C.error, C.errorBorder)} title="Xóa"
              onMouseEnter={(e) => (e.currentTarget.style.background = C.errorBg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {deleting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── AddOptionRow ────────────────────────────────────────────────── */
function AddOptionRow({ questionId, onAdd }) {
  const [val, setVal]         = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const submit = async () => {
    const v = val.trim();
    if (!v) return;
    setLoading(true);
    try { await onAdd(questionId, { content: v }); setVal(""); ref.current?.focus(); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 32, paddingTop: 8 }}>
      {loading
        ? <Loader2 size={16} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
        : <PlusCircle size={16} color={C.primary} />}
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder="Thêm tùy chọn"
        style={{
          background: "transparent", border: "none", outline: "none",
          color: C.primary, fontSize: 14, fontWeight: 600,
          fontFamily: C.font, cursor: "text", flex: 1,
        }}
      />
    </div>
  );
}

/* ── InactiveCard ────────────────────────────────────────────────── */
function InactiveCard({ q, index, total, onEdit, onDelete, onMoveUp, onMoveDown, deletingId }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onEdit(q)}
      style={{
        background: C.surfaceLow,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 18,
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 14,
        opacity: hovered ? 1 : 0.65,
        transition: "all .2s",
        cursor: "pointer", position: "relative",
        boxShadow: hovered ? "0 6px 28px rgba(79,110,247,0.12)" : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Left accent */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        borderRadius: "18px 0 0 18px",
        background: hovered ? C.primary : "transparent",
        transition: "background .2s",
      }} />

      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
        color: hovered ? C.primary : C.textDim,
        minWidth: 24, transition: "color .2s",
      }}>
        {String(index + 1).padStart(2, "0")}
      </span>

      <p style={{ flex: 1, margin: 0, fontSize: 14, fontWeight: 600, color: hovered ? C.text : "#64748b" }}>
        {q.content}
      </p>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onMoveUp(index)} disabled={index === 0}
          style={{ ...iconBtn(C.textSub), opacity: index === 0 ? 0.25 : 0.7 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHigh)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <ChevronUp size={13} />
        </button>
        <button onClick={() => onMoveDown(index)} disabled={index === total - 1}
          style={{ ...iconBtn(C.textSub), opacity: index === total - 1 ? 0.25 : 0.7 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHigh)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <ChevronDown size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(q.id); }}
          disabled={deletingId === q.id}
          style={iconBtn(C.textSub)}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHigh)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {deletingId === q.id
            ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            : <GripVertical size={13} />}
        </button>
      </div>
    </div>
  );
}

/* ── ActiveCard ───────────────────────────────────────────────────── */
function ActiveCard({ q, index, onSave, onCancel }) {
  const { options: allOptions, fetchOptions, createOption, updateOption, deleteOption } = useOption();

  const [content,     setContent]     = useState(q.content);
  const [type,        setType]        = useState(q.type);
  const [required,    setRequired]    = useState(q.required ?? true);
  const [saving,      setSaving]      = useState(false);
  const [optsFetched, setOptsFetched] = useState(false);

  const opts = allOptions[q.id] ?? q.options ?? [];
  const isChoiceType = ["MULTIPLE_CHOICE", "SINGLE_CHOICE"].includes(type);

  useEffect(() => {
    if (isChoiceType && !optsFetched) {
      fetchOptions(q.id).then(() => setOptsFetched(true)).catch(() => {});
    }
  }, [isChoiceType]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try { await onSave(q.id, { content: content.trim(), type, required }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.borderHover}`,
      borderLeft: `4px solid ${C.primary}`,
      borderRadius: 18,
      boxShadow: "0 6px 28px rgba(79,110,247,0.18)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 24px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg,#1b2244,#222d5a)",
            border: `1px solid ${C.primaryBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: C.primary,
            boxShadow: `0 0 0 1px ${C.primaryBorder}`,
          }}>
            {String(index + 1).padStart(2, "0")}
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
            Chỉnh sửa câu hỏi
          </span>
        </div>
        <Toggle checked={required} onChange={setRequired} />
      </div>

      {/* Body */}
      <div style={{ padding: "24px" }}>
        {/* Row 1: content + type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, marginBottom: 20, alignItems: "end" }}>
          <div>
            <span style={lbl}>Nội dung câu hỏi</span>
            <input value={content} onChange={(e) => setContent(e.target.value)} style={inp(!content.trim())} />
          </div>
          <div>
            <span style={lbl}>Loại câu hỏi</span>
            <div style={{ position: "relative" }}>
              <select value={type} onChange={(e) => setType(e.target.value)} style={sel}>
                <option value="TEXT">Văn bản</option>
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              </select>
              <ChevronDown size={16} color={C.textSub} style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none",
              }} />
            </div>
          </div>
        </div>

        {/* Row 2: Options */}
        {isChoiceType && (
          <div style={{ marginBottom: 4 }}>
            <span style={lbl}>Các tùy chọn trả lời</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {opts.map((opt, i) => (
                <OptionRow
                  key={typeof opt === "object" ? opt.id : i}
                  opt={opt}
                  questionId={q.id}
                  onDelete={deleteOption}
                  onUpdate={updateOption}
                />
              ))}
              <AddOptionRow questionId={q.id} onAdd={createOption} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          marginTop: 20, paddingTop: 20,
          display: "flex", justifyContent: "flex-end", gap: 12,
        }}>
          <button onClick={onCancel} style={{
            padding: "9px 18px", background: "transparent",
            border: `1.5px solid ${C.border}`, borderRadius: 9,
            fontSize: 13, fontWeight: 600, color: C.textSub,
            cursor: "pointer", fontFamily: C.font,
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !content.trim()} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "9px 20px",
            background: saving || !content.trim() ? C.surfaceHigh : C.primaryGrad,
            color: saving || !content.trim() ? C.textSub : "#fff",
            border: saving || !content.trim() ? `1px solid ${C.border}` : "none",
            borderRadius: 11, fontSize: 13, fontWeight: 700,
            cursor: saving || !content.trim() ? "not-allowed" : "pointer",
            fontFamily: C.font,
            boxShadow: saving || !content.trim() ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
            transition: "all .15s",
          }}>
            {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── QuestionPage ─────────────────────────────────────────────────── */
export default function QuestionPage() {
  const { surveyId } = useParams();
  const { questions, loading, createQuestion, fetchQuestionsBySurvey, updateQuestion, deleteQuestion, reorderQuestions } = useQuestion();
  const { setOptions } = useOption();

  const [activeId,     setActiveId]     = useState(null);
  const [showForm,     setShowForm]     = useState(false);
  const [content,      setContent]      = useState("");
  const [type,         setType]         = useState("TEXT");
  const [required,     setRequired]     = useState(true);
  const [optionsInput, setOptionsInput] = useState("");
  const [formError,    setFormError]    = useState("");
  const [deletingId,   setDeletingId]   = useState(null);

  useEffect(() => { if (surveyId) fetchQuestionsBySurvey(surveyId); }, [surveyId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setFormError("Nội dung câu hỏi không được để trống."); return; }
    if (type !== "TEXT" && !optionsInput.trim()) { setFormError("Vui lòng nhập ít nhất một lựa chọn."); return; }
    setFormError("");
    const parsedOptions = type === "TEXT" ? [] : optionsInput.split(",").map((o) => o.trim()).filter(Boolean);
    try {
      const created = await createQuestion(surveyId, {
        content: content.trim(), type, required,
        order_index: questions.length + 1, options: parsedOptions,
      });
      if (created?.options?.length > 0) setOptions((prev) => ({ ...prev, [created.id]: created.options }));
      setContent(""); setOptionsInput(""); setType("TEXT"); setRequired(true); setShowForm(false);
    } catch { /* toast */ }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await deleteQuestion(id); if (activeId === id) setActiveId(null); }
    finally { setDeletingId(null); }
  };

  const moveQuestion = async (index, direction) => {
    const list = [...questions];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    [list[index], list[swapIdx]] = [list[swapIdx], list[index]];
    try { await reorderQuestions(surveyId, list.map((q, i) => ({ id: q.id, order_index: i + 1 }))); }
    catch { /* toast */ }
  };

  const handleUpdate = useCallback(async (id, payload) => {
    await updateQuestion(id, payload);
    setActiveId(null);
  }, [updateQuestion]);

  const hasChoice = type !== "TEXT";
  const previewOpts = optionsInput.split(",").map((o) => o.trim()).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "2.5rem 2rem", fontFamily: C.font, position: "relative" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "linear-gradient(135deg,#1b2244,#222d5a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 1px ${C.primaryBorder}`,
            }}>
              {/* question mark icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
              </svg>
            </div>
            <div>
              <nav style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: C.textDim, marginBottom: 3, textTransform: "uppercase", display: "flex", gap: 6 }}>
                <span>PROJECTS</span><span style={{ opacity: 0.4 }}>/</span><span>CUSTOMER FEEDBACK Q3</span>
              </nav>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                Câu hỏi khảo sát
              </h1>
              <p style={{ fontSize: 13, color: C.textSub, margin: "3px 0 0" }}>
                {questions.length} câu hỏi
              </p>
            </div>
          </div>

          <button
            onClick={() => { setShowForm((v) => !v); setFormError(""); setActiveId(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px",
              background: showForm ? C.surfaceHigh : C.primaryGrad,
              color: showForm ? C.textSub : "#fff",
              border: showForm ? `1px solid ${C.border}` : "none",
              borderRadius: 11, fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all .15s",
              boxShadow: showForm ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
              fontFamily: C.font,
            }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Huỷ" : "Tạo mới"}
          </button>
        </div>

        {/* ── New question form ── */}
        {showForm && (
          <div style={{
            background: C.surfaceLow, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: "1.75rem", marginBottom: "1.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>
              Câu hỏi mới
            </h2>
            <form onSubmit={handleAdd}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span style={lbl}>Nội dung câu hỏi *</span>
                  <textarea
                    placeholder="Nhập nội dung câu hỏi..."
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setFormError(""); }}
                    rows={2} autoFocus
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "10px 14px",
                      border: `1.5px solid ${formError && !content.trim() ? C.error : C.border}`,
                      borderRadius: 10, fontSize: 14, color: C.text,
                      background: C.bg, outline: "none", resize: "vertical",
                      fontFamily: C.font,
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <span style={lbl}>Loại câu hỏi</span>
                    <div style={{ position: "relative" }}>
                      <select value={type} onChange={(e) => { setType(e.target.value); setFormError(""); }} style={sel}>
                        <option value="TEXT">Văn bản tự do</option>
                        <option value="SINGLE_CHOICE">Một lựa chọn</option>
                        <option value="MULTIPLE_CHOICE">Nhiều lựa chọn</option>
                      </select>
                      <ChevronDown size={16} color={C.textSub} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                    <Toggle checked={required} onChange={setRequired} />
                  </div>
                </div>

                {hasChoice && (
                  <div>
                    <span style={lbl}>Các lựa chọn (cách nhau bằng dấu phẩy) *</span>
                    <input
                      placeholder="VD: Rất đồng ý, Đồng ý, Không đồng ý"
                      value={optionsInput}
                      onChange={(e) => { setOptionsInput(e.target.value); setFormError(""); }}
                      style={inp(formError && !optionsInput.trim())}
                    />
                    {previewOpts.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {previewOpts.map((o, i) => (
                          <span key={i} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "3px 10px", borderRadius: 20,
                            background: C.surfaceHigh, border: `1px solid ${C.border}`,
                            fontSize: 12, color: C.textSub, fontWeight: 500,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary, flexShrink: 0 }} />
                            {o}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.error }}>
                    <AlertCircle size={14} />{formError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" onClick={() => { setShowForm(false); setFormError(""); }}
                    style={{
                      padding: "8px 16px", background: "transparent",
                      border: `1.5px solid ${C.border}`, borderRadius: 9,
                      fontSize: 13, fontWeight: 600, color: C.textSub,
                      cursor: "pointer", fontFamily: C.font,
                    }}>
                    Huỷ
                  </button>
                  <button type="submit" disabled={loading} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px",
                    background: loading ? C.surfaceHigh : C.primaryGrad,
                    color: loading ? C.textSub : "#fff",
                    border: loading ? `1px solid ${C.border}` : "none",
                    borderRadius: 11, fontSize: 13, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: C.font,
                    boxShadow: loading ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
                  }}>
                    {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
                    {loading ? "Đang thêm..." : "Thêm câu hỏi"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Question list ── */}
        {questions.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 0", color: C.textDim, gap: 12 }}>
            <Inbox size={48} strokeWidth={1.2} />
            <p style={{ fontSize: 15, margin: 0, color: C.textSub }}>Chưa có câu hỏi nào.</p>
            <button onClick={() => setShowForm(true)} style={{
              fontSize: 13, fontWeight: 600, color: C.primary, background: "none",
              border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: C.font,
            }}>
              Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {questions.map((q, index) =>
              activeId === q.id ? (
                <ActiveCard
                  key={q.id} q={q} index={index}
                  onSave={handleUpdate}
                  onCancel={() => setActiveId(null)}
                />
              ) : (
                <InactiveCard
                  key={q.id} q={q} index={index} total={questions.length}
                  onEdit={(q) => { setActiveId(q.id); setShowForm(false); }}
                  onDelete={handleDelete}
                  onMoveUp={(i) => moveQuestion(i, -1)}
                  onMoveDown={(i) => moveQuestion(i, 1)}
                  deletingId={deletingId}
                />
              )
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}