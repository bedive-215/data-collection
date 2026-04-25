// ─── SurveyPage.jsx ───────────────────────────────────────────────
import React, { useEffect, useState, useRef } from "react";
import surveyService from "@/services/surveyService";
import { useSurvey } from "@/providers/SurveyProvider";
import { useAdminStats } from "@/providers/AdminStatsProvider";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, FileText, ClipboardList,
  Loader2, Inbox, AlertCircle, X, Pencil, Check, ChevronRight,
  Users,
} from "lucide-react";

/* ─── Styles ─────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "#080b14",
    padding: "2.5rem 2rem",
    fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
  },
  wrap: { maxWidth: 1020, margin: "0 auto" },

  pageHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "2rem",
  },
  iconBox: {
    width: 46, height: 46, borderRadius: 14,
    background: "linear-gradient(135deg,#1b2244,#222d5a)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 0 1px #2a3464",
  },
  h1: { fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" },
  subtext: { fontSize: 13, color: "#475569", margin: "3px 0 0" },

  btnPrimary: (active) => ({
    display: "flex", alignItems: "center", gap: 7,
    padding: "9px 18px",
    background: active ? "#111827" : "linear-gradient(135deg,#4f6ef7,#6c7ef7)",
    color: active ? "#64748b" : "#fff",
    border: active ? "1px solid #1e293b" : "none",
    borderRadius: 11, fontSize: 13, fontWeight: 700,
    cursor: "pointer", transition: "all .15s",
    boxShadow: active ? "none" : "0 2px 12px rgba(79,110,247,0.35)",
  }),
  btnGhost: {
    padding: "8px 16px", background: "transparent",
    border: "1.5px solid #1e293b", borderRadius: 9,
    fontSize: 13, fontWeight: 600, color: "#64748b",
    cursor: "pointer", fontFamily: "inherit",
  },
  btnDanger: (spinning) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 7,
    border: "1px solid #1f1a2e", background: "transparent",
    cursor: spinning ? "not-allowed" : "pointer",
    color: "#ef4444", transition: "background .12s", flexShrink: 0,
  }),
  btnIcon: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 7,
    border: "1px solid #1e293b", background: "transparent",
    cursor: "pointer", color: "#6c7ef7",
    transition: "background .12s", flexShrink: 0,
  },

  formCard: {
    background: "#0d1120",
    border: "1px solid #1a2035",
    borderRadius: 18, padding: "1.75rem",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  formTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: "0 0 16px" },
  input: (err) => ({
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    border: `1.5px solid ${err ? "#ef4444" : "#1e293b"}`,
    borderRadius: 10, fontSize: 14, color: "#f1f5f9",
    background: "#080b14", outline: "none", fontFamily: "inherit",
    transition: "border-color .15s",
  }),
  textarea: {
    width: "100%", padding: "10px 14px", boxSizing: "border-box",
    border: "1.5px solid #1e293b", borderRadius: 10,
    fontSize: 14, color: "#f1f5f9", background: "#080b14",
    outline: "none", resize: "vertical", fontFamily: "inherit",
  },
  errRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#ef4444" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: 10 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: "1rem" },

  card: {
    background: "#0d1120", border: "1px solid #1a2035",
    borderRadius: 18, padding: "1.25rem",
    cursor: "pointer", transition: "box-shadow .15s,transform .15s,border-color .15s",
    display: "flex", flexDirection: "column", gap: 10, position: "relative",
  },
  cardIconBox: {
    width: 38, height: 38, borderRadius: 10,
    background: "linear-gradient(135deg,#1b2244,#222d5a)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "0 0 0 1px #2a3464",
  },
  cardTitle: {
    fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: "0 0 5px", lineHeight: 1.4,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  cardDesc: {
    fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  cardFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    paddingTop: 10, borderTop: "1px solid #1a2035", gap: 8,
  },
  cardDate: { fontSize: 11, color: "#334155" },
  cardLink: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#6c7ef7", flexShrink: 0 },

  participantBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 9px",
    background: "rgba(79,110,247,0.10)",
    border: "1px solid rgba(79,110,247,0.18)",
    borderRadius: 20, fontSize: 11, fontWeight: 700,
    color: "#6c7ef7", flexShrink: 0,
  },

  errBanner: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 18px", background: "#150f0f",
    border: "1px solid #2a1010", borderRadius: 12,
    marginBottom: "1.5rem", fontSize: 14, color: "#fca5a5",
  },
  empty: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "5rem 0", color: "#334155", gap: 12,
  },
};

/* ─── Participant Badge ───────────────────────────────────────────── */
function ParticipantBadge({ surveyId }) {
  const { answeredBySurvey, fetchUsersAnsweredBySurvey } = useAdminStats();
  const [loadingCount, setLoadingCount] = useState(false);

  useEffect(() => {
    if (answeredBySurvey[surveyId] !== undefined) return;
    let cancelled = false;
    const load = async () => {
      setLoadingCount(true);
      try {
        await fetchUsersAnsweredBySurvey(surveyId);
      } catch { /* hiện "—" */ }
      finally { if (!cancelled) setLoadingCount(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [surveyId]);

  const count = answeredBySurvey[surveyId]?.count;

  return (
    <span style={S.participantBadge}>
      <Users size={11} />
      {loadingCount ? "..." : count !== undefined ? `${count} tham gia` : "—"}
    </span>
  );
}

/* ─── Survey Card ────────────────────────────────────────────────── */
function SurveyCard({ s, onDelete, onUpdate, onOpen, deletingId, updatingId }) {
  const [editing, setEditing]       = useState(false);
  const [title, setTitle]           = useState(s.title);
  const [description, setDescription] = useState(s.description || "");
  const titleRef = useRef(null);

  const startEdit = (e) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const cancel = (e) => {
    e?.stopPropagation();
    setEditing(false);
    setTitle(s.title);
    setDescription(s.description || "");
  };

  const save = async (e) => {
    e.stopPropagation();
    if (!title.trim()) return;
    await onUpdate(s.id, { title: title.trim(), description: description.trim() });
    setEditing(false);
  };

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  const isDeleting = deletingId === s.id;
  const isSaving   = updatingId === s.id;

  return (
    <div
      onClick={() => !editing && onOpen(s.id)}
      style={S.card}
      onMouseEnter={(e) => {
        if (editing) return;
        e.currentTarget.style.boxShadow = "0 6px 28px rgba(79,110,247,0.18)";
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "#2e3d70";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#1a2035";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={S.cardIconBox}>
          <FileText size={17} color="#6c7ef7" />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {!editing ? (
            <>
              <button
                onClick={startEdit}
                title="Chỉnh sửa"
                style={S.btnIcon}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111827")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                disabled={isDeleting}
                title="Xóa"
                style={S.btnDanger(isDeleting)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#150f0f")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {isDeleting
                  ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  : <Trash2 size={13} />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={save}
                disabled={isSaving}
                title="Lưu"
                style={{ ...S.btnIcon, color: "#22c55e", border: "1px solid #14532d" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0a1a0a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {isSaving
                  ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  : <Check size={13} />}
              </button>
              <button
                onClick={cancel}
                title="Huỷ"
                style={{ ...S.btnDanger(false), color: "#94a3b8", borderColor: "#1e293b" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0d1120")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1 }} onClick={(e) => editing && e.stopPropagation()}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề *"
              style={{ ...S.input(!title.trim()), fontSize: 13, padding: "8px 11px" }}
              onKeyDown={(e) => { if (e.key === "Enter") save(e); if (e.key === "Escape") cancel(); }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả (tuỳ chọn)"
              rows={2}
              style={{ ...S.textarea, fontSize: 13, padding: "8px 11px" }}
            />
          </div>
        ) : (
          <>
            <h3 style={S.cardTitle}>{s.title}</h3>
            <p style={S.cardDesc}>{s.description || "Không có mô tả"}</p>
          </>
        )}
      </div>

      {/* Footer */}
      {!editing && (
        <div style={S.cardFooter}>
          {/* Số người tham gia thay cho id */}
          <ParticipantBadge surveyId={s.id} />

          {s.createdAt && <span style={S.cardDate}>{formatDate(s.createdAt)}</span>}

          <div style={S.cardLink}>
            Xem chi tiết <ChevronRight size={13} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SurveyPage ─────────────────────────────────────────────────── */
export default function SurveyPage() {
  const { createSurvey, deleteSurvey, updateSurvey, loading } = useSurvey();
  const navigate = useNavigate();

  const [surveys, setSurveys]         = useState([]);
  const [fetchError, setFetchError]   = useState(null);
  const [fetching, setFetching]       = useState(false);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError]     = useState("");
  const [showForm, setShowForm]       = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [updatingId, setUpdatingId]   = useState(null);

  const normalize = (s) => ({
    id: s.id, title: s.title,
    description: s.description, createdAt: s.createdAt,
  });

  const fetchAll = async () => {
    setFetchError(null); setFetching(true);
    try {
      const res  = await surveyService.getAllSurveys();
      const data = res.data ?? res;
      setSurveys((data.surveys || []).map(normalize));
    } catch {
      setFetchError("Không thể tải danh sách khảo sát.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setFormError("Tiêu đề không được để trống."); return; }
    setFormError("");
    try {
      const res     = await createSurvey({ title, description: description || "" });
      const created = res?.survey ? normalize(res.survey) : normalize(res);
      setSurveys((prev) => [created, ...prev]);
      setTitle(""); setDescription(""); setShowForm(false);
    } catch { /* toast handled in provider */ }
  };

  const handleUpdate = async (id, payload) => {
    setUpdatingId(id);
    try {
      const updated = await updateSurvey(id, payload);
      if (!updated?.id) return;
      setSurveys((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const openSurvey = (id) => navigate(`/admin/surveys/${id}`);

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* ── Header ── */}
        <div style={S.pageHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={S.iconBox}><ClipboardList size={22} color="#6c7ef7" /></div>
            <div>
              <h1 style={S.h1}>Quản lý Khảo sát</h1>
              <p style={S.subtext}>
                {fetching ? "Đang tải..." : `${surveys.length} khảo sát hiện có`}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormError(""); }}
            style={S.btnPrimary(showForm)}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Huỷ" : "Tạo mới"}
          </button>
        </div>

        {/* ── Create Form ── */}
        {showForm && (
          <div style={S.formCard}>
            <h2 style={S.formTitle}>Khảo sát mới</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  placeholder="Tiêu đề khảo sát *"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setFormError(""); }}
                  style={S.input(!!formError)}
                  autoFocus
                />
                <textarea
                  placeholder="Mô tả (tuỳ chọn)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={S.textarea}
                />
                {formError && (
                  <div style={S.errRow}><AlertCircle size={14} />{formError}</div>
                )}
                <div style={S.formActions}>
                  <button type="button" onClick={() => setShowForm(false)} style={S.btnGhost}>Huỷ</button>
                  <button type="submit" disabled={loading} style={S.btnPrimary(false)}>
                    {loading
                      ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      : <Plus size={14} />}
                    {loading ? "Đang tạo..." : "Tạo khảo sát"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Error Banner ── */}
        {fetchError && (
          <div style={S.errBanner}>
            <AlertCircle size={16} color="#ef4444" />
            {fetchError}
            <button
              onClick={fetchAll}
              style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#6c7ef7", background: "none", border: "none", cursor: "pointer" }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {fetching && surveys.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0", color: "#334155" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {/* ── Empty ── */}
        {!fetching && surveys.length === 0 && !fetchError && (
          <div style={S.empty}>
            <Inbox size={48} strokeWidth={1.2} />
            <p style={{ fontSize: 15, margin: 0, color: "#475569" }}>Chưa có khảo sát nào.</p>
            <button
              onClick={() => setShowForm(true)}
              style={{ fontSize: 13, fontWeight: 600, color: "#6c7ef7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
            >
              Tạo khảo sát đầu tiên
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        {surveys.length > 0 && (
          <div style={S.grid}>
            {surveys.map((s) => (
              <SurveyCard
                key={s.id}
                s={s}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onOpen={openSurvey}
                deletingId={deletingId}
                updatingId={updatingId}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}