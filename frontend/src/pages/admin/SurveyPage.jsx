// ─── SurveyPage.jsx ─── Google Forms style, dark theme ───────────
import React, { useEffect, useState, useRef } from "react";
import surveyService from "@/services/surveyService";
import { useSurvey } from "@/providers/SurveyProvider";
import { useAdminStats } from "@/providers/AdminStatsProvider";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, FileText, ClipboardList,
  Loader2, AlertCircle, X, Pencil, Check,
  Users, MoreVertical, Copy, Search, Calendar,
} from "lucide-react";

/* ─── Token ──────────────────────────────────────────────────────── */
const C = {
  bg:            "#080b14",
  surface:       "#0d1120",
  surfaceHigh:   "#111827",
  border:        "#1a2035",
  borderHover:   "#2e3d70",
  primary:       "#6c7ef7",
  primaryGrad:   "linear-gradient(135deg,#4f6ef7,#6c7ef7)",
  primaryDim:    "rgba(108,126,247,0.10)",
  primaryBorder: "#2a3464",
  text:          "#f1f5f9",
  textSub:       "#64748b",
  textDim:       "#334155",
  error:         "#ef4444",
  success:       "#22c55e",
  warning:       "#f59e0b",
  font:          "'DM Sans','Plus Jakarta Sans',sans-serif",
  thumbColors: [
    "linear-gradient(135deg,#1b2244,#2a3464)",
    "linear-gradient(135deg,#1a2e1a,#1e4620)",
    "linear-gradient(135deg,#2a1a1a,#461e1e)",
    "linear-gradient(135deg,#1a2a2a,#1e3d46)",
    "linear-gradient(135deg,#2a1a2e,#3d1e46)",
    "linear-gradient(135deg,#2a2a1a,#46461e)",
  ],
};

/* ─── Status badge ───────────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",   color: C.success,  bg: "rgba(34,197,94,0.12)" },
  DRAFT:     { label: "Nháp",      color: C.textSub,  bg: "rgba(100,116,139,0.12)" },
  SCHEDULED: { label: "Lên lịch",  color: C.warning,  bg: "rgba(245,158,11,0.12)" },
  EXPIRED:   { label: "Hết hạn",   color: C.error,    bg: "rgba(239,68,68,0.12)" },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] ?? STATUS_MAP.DRAFT;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 7px",
      borderRadius: 20, color: s.color, background: s.bg,
      letterSpacing: "0.04em",
    }}>
      {s.label}
    </span>
  );
}

/* ─── Reusable styles ────────────────────────────────────────────── */
const inp = (err) => ({
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  background: C.bg, border: `1.5px solid ${err ? C.error : C.border}`,
  borderRadius: 10, color: C.text, fontSize: 14,
  fontFamily: C.font, outline: "none", transition: "border-color .15s",
});
const textareaStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  border: `1.5px solid ${C.border}`, borderRadius: 10,
  fontSize: 14, color: C.text, background: C.bg,
  outline: "none", resize: "vertical", fontFamily: C.font,
};
const dateInp = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  background: C.bg, border: `1.5px solid ${C.border}`,
  borderRadius: 10, color: C.text, fontSize: 13,
  fontFamily: C.font, outline: "none",
  colorScheme: "dark",
};

/* ─── ParticipantBadge ───────────────────────────────────────────── */
function ParticipantBadge({ surveyId }) {
  const { answeredBySurvey, fetchUsersAnsweredBySurvey } = useAdminStats();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (answeredBySurvey[surveyId] !== undefined) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try { await fetchUsersAnsweredBySurvey(surveyId); }
      catch {}
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [surveyId]);

  const count = answeredBySurvey[surveyId]?.count;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, color: C.primary,
    }}>
      <Users size={11} />
      {loading ? "..." : count !== undefined ? count : "—"}
    </span>
  );
}

/* ─── SurveyCard ─────────────────────────────────────────────────── */
function SurveyCard({ s, index, onDelete, onUpdate, onOpen, deletingId, updatingId }) {
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [title,        setTitle]        = useState(s.title);
  const [description,  setDescription]  = useState(s.description || "");
  const [startAt,      setStartAt]      = useState(
    s.start_at ? s.start_at.slice(0, 16) : ""
  );
  const [endAt,        setEndAt]        = useState(
    s.end_at ? s.end_at.slice(0, 16) : ""
  );
  const [dateError,    setDateError]    = useState("");
  const [hovered,      setHovered]      = useState(false);
  const menuRef  = useRef(null);
  const titleRef = useRef(null);

  const thumb = C.thumbColors[index % C.thumbColors.length];

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }) : "";

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const startEdit = (e) => {
    e?.stopPropagation();
    setMenuOpen(false);
    setEditing(true);
    setDateError("");
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const cancel = () => {
    setEditing(false);
    setTitle(s.title);
    setDescription(s.description || "");
    setStartAt(s.start_at ? s.start_at.slice(0, 16) : "");
    setEndAt(s.end_at ? s.end_at.slice(0, 16) : "");
    setDateError("");
  };

  const save = async () => {
    if (!title.trim()) return;
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      setDateError("end_at phải sau start_at");
      return;
    }
    setDateError("");
    await onUpdate(s.id, {
      title:       title.trim(),
      description: description.trim() || null,
      start_at:    startAt ? new Date(startAt).toISOString() : null,
      end_at:      endAt   ? new Date(endAt).toISOString()   : null,
    });
    setEditing(false);
  };

  const isDeleting = deletingId === s.id;
  const isSaving   = updatingId === s.id;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    C.surface,
        border:        `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius:  12,
        overflow:      "hidden",
        cursor:        "pointer",
        transition:    "border-color .15s, box-shadow .15s, transform .15s",
        boxShadow:     hovered ? "0 4px 20px rgba(79,110,247,0.15)" : "none",
        transform:     hovered ? "translateY(-2px)" : "none",
        display:       "flex",
        flexDirection: "column",
      }}
      onClick={() => !editing && onOpen(s.id)}
    >
      {/* Thumbnail */}
      <div style={{
        height: 140, background: thumb, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Decorative lines */}
        <div style={{ width: 110, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ height: 6,  borderRadius: 3, background: "rgba(108,126,247,0.5)", width: "80%" }} />
          <div style={{ height: 4,  borderRadius: 3, background: "rgba(255,255,255,0.10)", width: "100%" }} />
          <div style={{ height: 4,  borderRadius: 3, background: "rgba(255,255,255,0.07)", width: "65%" }} />
          <div style={{ height: 1,  background: "rgba(255,255,255,0.10)", marginTop: 4 }} />
          <div style={{ height: 4,  borderRadius: 3, background: "rgba(255,255,255,0.08)", width: "90%" }} />
          <div style={{ height: 4,  borderRadius: 3, background: "rgba(255,255,255,0.06)", width: "75%" }} />
        </div>

        {/* Status badge over thumbnail */}
        {s.status && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <StatusBadge status={s.status} />
          </div>
        )}

        {/* 3-dot menu */}
        <div ref={menuRef} style={{ position: "absolute", top: 8, right: 8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: menuOpen ? "rgba(108,126,247,0.2)" : "rgba(0,0,0,0.3)",
              border: "none", cursor: "pointer", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div style={{
              position: "absolute", top: 34, right: 0, zIndex: 10,
              background: C.surfaceHigh, border: `1px solid ${C.border}`,
              borderRadius: 10, overflow: "hidden", minWidth: 160,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              {[
                { icon: <Pencil size={13} />, label: "Đổi tên / chỉnh sửa", action: startEdit },
                { icon: <Copy size={13} />,   label: "Tạo bản sao",          action: () => setMenuOpen(false) },
                { icon: <Trash2 size={13} />, label: "Xóa",   danger: true,
                  action: () => { setMenuOpen(false); onDelete(s.id); } },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "9px 14px",
                    background: "transparent", border: "none",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    color: item.danger ? C.error : C.text, fontFamily: C.font,
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {isDeleting && item.danger
                    ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    : item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div
        style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
        onClick={e => editing && e.stopPropagation()}
      >
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Title */}
            <input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Tiêu đề *"
              style={{ ...inp(!title.trim()), fontSize: 13, padding: "7px 10px" }}
              onKeyDown={e => { if (e.key === "Escape") cancel(); }}
            />
            {/* Description */}
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả"
              rows={2}
              style={{ ...textareaStyle, fontSize: 13, padding: "7px 10px" }}
            />
            {/* start_at / end_at */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div>
                <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 3 }}>
                  Bắt đầu
                </label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={e => { setStartAt(e.target.value); setDateError(""); }}
                  style={dateInp}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 3 }}>
                  Kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={e => { setEndAt(e.target.value); setDateError(""); }}
                  style={dateInp}
                />
              </div>
            </div>
            {dateError && (
              <div style={{ fontSize: 11, color: C.error, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={11} /> {dateError}
              </div>
            )}
            {/* Actions */}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={cancel}
                style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.textSub, cursor: "pointer", fontFamily: C.font }}>
                Huỷ
              </button>
              <button onClick={save} disabled={isSaving}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: C.primaryGrad, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>
                {isSaving ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={11} />}
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {s.title}
            </div>

            {/* Dates */}
            {(s.start_at || s.end_at) && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSub, marginTop: 2 }}>
                <Calendar size={10} />
                {s.start_at && (
                  <span>{new Date(s.start_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
                )}
                {s.start_at && s.end_at && <span>→</span>}
                {s.end_at && (
                  <span>{new Date(s.end_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                )}
              </div>
            )}

            <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>
              {s.created_at
                ? new Date(s.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                : ""}
            </div>
          </>
        )}

        {!editing && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <ParticipantBadge surveyId={s.id} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <StatusBadge status={s.status} />
              <FileText size={14} color={C.textDim} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SurveyPage ─────────────────────────────────────────────────── */
export default function SurveyPage() {
  const { createSurvey, deleteSurvey, updateSurvey } = useSurvey();
  const navigate = useNavigate();

  const [surveys,     setSurveys]     = useState([]);
  const [fetchError,  setFetchError]  = useState(null);
  const [fetching,    setFetching]    = useState(false);

  // form fields — khớp với payload BE
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [startAt,     setStartAt]     = useState("");  // datetime-local string
  const [endAt,       setEndAt]       = useState("");  // datetime-local string

  const [formError,   setFormError]   = useState("");
  const [dateError,   setDateError]   = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search,      setSearch]      = useState("");

  /**
   * Khớp với _mapSurvey + _mapSurveyDetail:
   *   id, title, description, is_published,
   *   start_at, end_at, status, created_at
   */
  const normalize = (s) => ({
    id:           s.id,
    title:        s.title,
    description:  s.description ?? null,
    is_published: s.is_published,
    start_at:     s.start_at ?? null,
    end_at:       s.end_at   ?? null,
    status:       s.status   ?? null,
    created_at:   s.created_at ?? null,   // snake_case từ BE
  });

  const fetchAll = async () => {
    setFetchError(null); setFetching(true);
    try {
      const res  = await surveyService.getAllSurveys();  // có "s"
      const data = res.data ?? res;
      setSurveys((data.surveys || []).map(normalize));
    } catch { setFetchError("Không thể tải danh sách khảo sát."); }
    finally   { setFetching(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setTitle(""); setDescription(""); setStartAt(""); setEndAt("");
    setFormError(""); setDateError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setFormError("Tiêu đề không được để trống."); return; }
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      setDateError("end_at phải sau start_at"); return;
    }

    // ── payload đúng với BE ──
    const payload = {
      title:       title.trim(),
      description: description.trim() || null,
      start_at:    startAt ? new Date(startAt).toISOString() : null,
      end_at:      endAt   ? new Date(endAt).toISOString()   : null,
    };

    const snapPayload = { ...payload };
    setShowForm(false); resetForm(); setFormLoading(true);

    try {
      await createSurvey(snapPayload);
      await fetchAll();
    } catch {
      setShowForm(true);
      setTitle(snapPayload.title);
      setDescription(snapPayload.description || "");
      setStartAt(snapPayload.start_at ? snapPayload.start_at.slice(0, 16) : "");
      setEndAt(snapPayload.end_at   ? snapPayload.end_at.slice(0, 16)   : "");
    } finally { setFormLoading(false); }
  };

  const handleUpdate = async (id, payload) => {
    setUpdatingId(id);
    try {
      // updateSurvey trong provider trả về object đã normalize
      const updated = await updateSurvey(id, payload);
      if (!updated?.id) { await fetchAll(); return; }
      setSurveys(prev => prev.map(s => s.id === id ? normalize(updated) : s));
    } catch {}
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  };

  const filtered = surveys.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.font }}>

      {/* ── Top bar ── */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: C.primaryGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ClipboardList size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
            Biểu mẫu
          </span>
        </div>

        {/* Search */}
        <div style={{
          flex: 1, maxWidth: 520,
          display: "flex", alignItems: "center", gap: 10,
          background: C.surfaceHigh, border: `1px solid ${C.border}`,
          borderRadius: 24, padding: "0 16px", height: 40,
        }}>
          <Search size={15} color={C.textSub} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm"
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", fontSize: 14, color: C.text, fontFamily: C.font,
            }}
          />
        </div>

        {/* Create btn */}
        <button
          onClick={() => { setShowForm(v => !v); resetForm(); }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 18px",
            background: showForm ? C.surfaceHigh : C.primaryGrad,
            color:      showForm ? C.textSub     : "#fff",
            border:     showForm ? `1px solid ${C.border}` : "none",
            borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
            boxShadow: showForm ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
            fontFamily: C.font,
          }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Huỷ" : "Biểu mẫu mới"}
        </button>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Create form ── */}
        {showForm && (
          <div style={{
            background: C.surface, border: `1px solid ${C.borderHover}`,
            borderRadius: 16, padding: "1.5rem", marginBottom: "2rem",
            boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
            borderLeft: `4px solid ${C.primary}`,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 16px" }}>
              Biểu mẫu mới
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Title */}
                <input
                  placeholder="Tiêu đề biểu mẫu *"
                  value={title} autoFocus
                  onChange={e => { setTitle(e.target.value); setFormError(""); }}
                  style={inp(!!formError)}
                />

                {/* Description */}
                <textarea
                  placeholder="Mô tả (tuỳ chọn)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  style={textareaStyle}
                />

                {/* start_at / end_at — khớp với payload BE */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 5 }}>
                      Ngày bắt đầu <span style={{ color: C.textDim }}>(tuỳ chọn)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={startAt}
                      onChange={e => { setStartAt(e.target.value); setDateError(""); }}
                      style={dateInp}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: C.textSub, display: "block", marginBottom: 5 }}>
                      Ngày kết thúc <span style={{ color: C.textDim }}>(tuỳ chọn)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={endAt}
                      onChange={e => { setEndAt(e.target.value); setDateError(""); }}
                      style={dateInp}
                    />
                  </div>
                </div>

                {/* Errors */}
                {formError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.error }}>
                    <AlertCircle size={14} /> {formError}
                  </div>
                )}
                {dateError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.error }}>
                    <AlertCircle size={14} /> {dateError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    style={{
                      padding: "8px 16px", background: "transparent",
                      border: `1.5px solid ${C.border}`, borderRadius: 9,
                      fontSize: 13, fontWeight: 600, color: C.textSub,
                      cursor: "pointer", fontFamily: C.font,
                    }}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit" disabled={formLoading}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 18px",
                      background: formLoading ? C.surfaceHigh : C.primaryGrad,
                      color:      formLoading ? C.textSub     : "#fff",
                      border:     formLoading ? `1px solid ${C.border}` : "none",
                      borderRadius: 11, fontSize: 13, fontWeight: 700,
                      cursor: formLoading ? "not-allowed" : "pointer",
                      fontFamily: C.font,
                      boxShadow: formLoading ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
                    }}
                  >
                    {formLoading
                      ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <Plus size={14} />}
                    {formLoading ? "Đang tạo..." : "Tạo biểu mẫu"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Section title ── */}
        {!search && surveys.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 700, color: C.textSub,
              textTransform: "uppercase", letterSpacing: "0.06em", margin: 0,
            }}>
              Biểu mẫu gần đây
            </h2>
            <span style={{ fontSize: 12, color: C.textDim }}>{surveys.length} biểu mẫu</span>
          </div>
        )}

        {/* ── Error ── */}
        {fetchError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 18px", background: "#150f0f",
            border: "1px solid #2a1010", borderRadius: 12,
            marginBottom: "1.5rem", fontSize: 14, color: "#fca5a5",
          }}>
            <AlertCircle size={16} color={C.error} />
            {fetchError}
            <button onClick={fetchAll}
              style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: C.primary, background: "none", border: "none", cursor: "pointer" }}>
              Thử lại
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {fetching && surveys.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0", color: C.textDim }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {/* ── Empty ── */}
        {!fetching && surveys.length === 0 && !fetchError && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "6rem 0", gap: 14 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: "linear-gradient(135deg,#1b2244,#222d5a)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ClipboardList size={32} color={C.primary} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.textSub, margin: 0 }}>Chưa có biểu mẫu nào</p>
            <p style={{ fontSize: 13, color: C.textDim, margin: 0 }}>Tạo biểu mẫu đầu tiên để bắt đầu thu thập câu trả lời</p>
            <button onClick={() => setShowForm(true)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px", background: C.primaryGrad,
              color: "#fff", border: "none", borderRadius: 11,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: C.font, boxShadow: "0 2px 12px rgba(79,110,247,0.35)",
            }}>
              <Plus size={15} /> Tạo biểu mẫu mới
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
            {filtered.map((s, i) => (
              <SurveyCard
                key={s.id} s={s} index={i}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onOpen={(id) => navigate(`/admin/surveys/${id}`)}
                deletingId={deletingId}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}

        {/* ── No search results ── */}
        {search && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0", color: C.textSub }}>
            <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0 }}>
              Không tìm thấy biểu mẫu nào cho "<strong>{search}</strong>"
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}