// ─── SurveyPage.jsx ───────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import surveyService from "@/services/surveyService";
import { useSurvey } from "@/providers/SurveyProvider";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowRight,
  FileText,
  ClipboardList,
  Loader2,
  Inbox,
  AlertCircle,
  X,
} from "lucide-react";

export default function SurveyPage() {
  const { createSurvey, deleteSurvey, loading } = useSurvey();
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* ── Normalize ── */
  const normalize = (s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    createdAt: s.createdAt,
  });

  /* ── Fetch ── */
  const fetchAll = async () => {
    setFetchError(null);
    try {
      const res = await surveyService.getAllSurveys();
      const data = res.data ?? res;
      setSurveys((data.surveys || []).map(normalize));
    } catch (err) {
      console.error("Load surveys error:", err);
      setFetchError("Không thể tải danh sách khảo sát.");
    }
  };

  useEffect(() => { fetchAll(); }, []);

  /* ── Create ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setFormError("Tiêu đề không được để trống."); return; }
    setFormError("");
    try {
      const res = await createSurvey({ title, description: description || "" });
      const created = res?.survey ? normalize(res.survey) : normalize(res);
      setSurveys((prev) => [created, ...prev]);
      setTitle("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const ok = await deleteSurvey(id);
      if (ok) setSurveys((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const openSurvey = (id) => navigate(`/admin/surveys/${id}`);

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric",
        })
      : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f5f7",
        padding: "2.5rem 2rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardList size={22} color="#4f6ef7" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Quản lý Khảo sát
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                {surveys.length} khảo sát hiện có
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: showForm ? "#f3f4f6" : "#4f6ef7",
              color: showForm ? "#374151" : "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Huỷ" : "Tạo mới"}
          </button>
        </div>

        {/* ── Create Form ── */}
        {showForm && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: "1.75rem",
              marginBottom: "1.5rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 16,
                marginTop: 0,
              }}
            >
              Khảo sát mới
            </h2>

            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  placeholder="Tiêu đề khảo sát *"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setFormError(""); }}
                  style={{
                    padding: "10px 14px",
                    border: formError ? "1.5px solid #ef4444" : "1.5px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    color: "#111827",
                    outline: "none",
                    transition: "border-color .15s",
                    background: "#fafafa",
                  }}
                />

                <textarea
                  placeholder="Mô tả (tuỳ chọn)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{
                    padding: "10px 14px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: 10,
                    fontSize: 14,
                    color: "#111827",
                    outline: "none",
                    resize: "vertical",
                    background: "#fafafa",
                    fontFamily: "inherit",
                  }}
                />

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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(""); }}
                    style={{
                      padding: "9px 18px",
                      background: "transparent",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6b7280",
                      cursor: "pointer",
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
                      background: loading ? "#93a8fb" : "#4f6ef7",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "background .15s",
                    }}
                  >
                    {loading ? (
                      <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Plus size={15} />
                    )}
                    {loading ? "Đang tạo..." : "Tạo khảo sát"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Error Banner ── */}
        {fetchError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 12,
              marginBottom: "1.5rem",
              fontSize: 14,
              color: "#991b1b",
            }}
          >
            <AlertCircle size={16} color="#ef4444" />
            {fetchError}
            <button
              onClick={fetchAll}
              style={{
                marginLeft: "auto",
                fontSize: 13,
                fontWeight: 600,
                color: "#4f6ef7",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Survey Grid ── */}
        {surveys.length === 0 && !fetchError ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "5rem 0",
              color: "#9ca3af",
              gap: 12,
            }}
          >
            <Inbox size={48} strokeWidth={1.2} />
            <p style={{ fontSize: 15, margin: 0 }}>Chưa có khảo sát nào.</p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "#4f6ef7",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Tạo khảo sát đầu tiên
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {surveys.map((s) => (
              <div
                key={s.id}
                onClick={() => openSurvey(s.id)}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: "1.25rem 1.25rem 1rem",
                  cursor: "pointer",
                  transition: "box-shadow .15s, transform .15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,110,247,0.10)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Card top */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#eef2ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={18} color="#4f6ef7" />
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                    disabled={deletingId === s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "1px solid #fee2e2",
                      background: "#fff",
                      cursor: deletingId === s.id ? "not-allowed" : "pointer",
                      color: "#ef4444",
                      transition: "background .12s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    {deletingId === s.id ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111827",
                      margin: "0 0 6px",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      margin: 0,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {s.description || "Không có mô tả"}
                  </p>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 10,
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                    #{s.id.slice(0, 8)}
                  </span>

                  {s.createdAt && (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {formatDate(s.createdAt)}
                    </span>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#4f6ef7",
                    }}
                  >
                    Xem chi tiết
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}