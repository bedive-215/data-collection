import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, X, Search, ChevronDown, ChevronUp, Inbox, RefreshCw,
  Loader2, Edit2} from "lucide-react";
import { useSurvey } from "@/providers/SurveyProvider";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import CreateSurveyComposer from "@/components/survey/CreateSurveyComposer";
import { SurveyCardHome, ShareModal } from "@/components/survey/SurveyCardHome";
import { SurveyCardSkeleton } from "@/utils/surveyHelpers";
import EditorInviteModal from "@/components/survey/EditorInviteModal";
import { ROUTERS } from "@/utils/constants";

const C = {
  primary: "#4f46e5",
  primaryBorder: "rgba(79,70,229,0.35)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  warning: "#f59e0b",
  font: "'DM Sans','Inter',sans-serif"};

const PREVIEW_LIMIT = 5;

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)", backdropFilter: "blur(24px) saturate(190%)",
      WebkitBackdropFilter: "blur(24px) saturate(190%)",
      border: "1px solid rgba(255,255,255,0.55)", borderRadius: 22,
      ...style}}>
      {children}
    </div>
  );
}

function ExtendModal({ open, onClose, survey, onExtend }) {
  const [submitting, setSubmitting] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && survey?.end_at) {
      const d = new Date(survey.end_at);
      d.setDate(d.getDate() + 7);
      setNewDate(d.toISOString().slice(0, 16));
    }
    setError("");
  }, [open, survey]);

  const handleExtend = async () => {
    if (!newDate) { setError("Vui lòng chọn ngày"); return; }
    const selected = new Date(newDate);
    if (selected <= new Date()) { setError("Ngày phải lớn hơn hiện tại"); return; }
    setSubmitting(true);
    try {
      await onExtend(survey.id, newDate);
      onClose();
    } catch { setError("Gia hạn thất bại"); } finally { setSubmitting(false); }
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf2", width: "100%", maxWidth: 420, overflow: "hidden", fontFamily: C.font }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px 0" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <RefreshCw size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Gia hạn khảo sát</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{survey?.title}</p>
          </div>
        </div>
        <div style={{ padding: "16px 24px 20px" }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>Khảo sát đã hết hạn.</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Ngày kết thúc mới</label>
            <input type="datetime-local" value={newDate} onChange={e => { setNewDate(e.target.value); setError(""); }} min={new Date().toISOString().slice(0, 16)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${error ? "#fecaca" : "#e8ecf2"}`, background: "#fff", fontSize: 14, color: "#0f172a", outline: "none" }} />
            {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e8ecf2", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Đóng</button>
            <button onClick={handleExtend} disabled={submitting} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, background: submitting ? "#94a3b8" : "linear-gradient(135deg,#f59e0b,#fbbf24)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {submitting ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang xử lý...</> : <><RefreshCw size={15} /> Gia hạn</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MySurveysPage() {
  const navigate = useNavigate();
  const {
    mySurveys, invitedSurveys, loading,
    fetchMySurveys, fetchInvitedSurveys, updateSurvey, deleteSurvey,
    closeSurvey, shareLink} = useSurvey();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [extendModal, setExtendModal] = useState({ open: false, survey: null });
  const [expiredModal, setExpiredModal] = useState({ open: false, survey: null });
  const [shareModal, setShareModal] = useState({ open: false, surveyId: null, surveyTitle: "", shareUrl: "", loading: false, error: "" });
  const [editorInviteModal, setEditorInviteModal] = useState(null);

  useEffect(() => {
    fetchMySurveys(1, 50);
    fetchInvitedSurveys(1, 50);
  }, [fetchMySurveys, fetchInvitedSurveys]);

  const filtered = mySurveys.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()));
  const visible = expanded || showCreate ? filtered : filtered.slice(0, PREVIEW_LIMIT);
  const hasMore = filtered.length > PREVIEW_LIMIT;

  const handleShare = useCallback((surveyId) => {
    const s = mySurveys.find(x => x.id === surveyId);
    setShareModal({ open: true, surveyId, surveyTitle: s?.title || "", shareUrl: "", loading: false, error: "" });
  }, [mySurveys]);

  const handleGenerateLink = async () => {
    setShareModal(p => ({ ...p, loading: true, error: "" }));
    try {
      const result = await shareLink(shareModal.surveyId);
      const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? "";
      setShareModal(p => ({ ...p, shareUrl: url, loading: false }));
    } catch { setShareModal(p => ({ ...p, loading: false, error: "Tạo link thất bại." })); }
  };

  const handleClose = useCallback(async (surveyId) => {
    try { await closeSurvey(surveyId); await fetchMySurveys(1, 50); } catch {}
  }, [closeSurvey, fetchMySurveys]);

  const handleExtend = useCallback(async (surveyId, newEndAt) => {
    try { await updateSurvey(surveyId, { end_at: newEndAt }); await fetchMySurveys(1, 50); } catch {}
  }, [updateSurvey, fetchMySurveys]);

  const handleSaveEdit = useCallback(async (surveyId, formData) => {
    try { await updateSurvey(surveyId, formData); await fetchMySurveys(1, 50); } catch {}
  }, [updateSurvey, fetchMySurveys]);

  return (
    <main style={{ minHeight: "100vh", background: "transparent", fontFamily: C.font, overflowX: "hidden", position: "relative" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1260, margin: "0 auto", padding: "12px 18px 52px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", fontWeight: 900, color: C.text, margin: 0, lineHeight: 1.2 }}>Khảo sát của tôi</h1>
            <p style={{ fontSize: 13, color: C.textSub, margin: "4px 0 0" }}>Quản lý, chỉnh sửa và theo dõi khảo sát của bạn</p>
          </div>
          <button onClick={() => { setShowCreate(v => !v); if (!showCreate) setExpanded(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 11, border: showCreate ? `1px solid rgba(0,0,0,0.1)` : "none", background: showCreate ? "rgba(255,255,255,0.7)" : "linear-gradient(135deg,#4361ee,#6c7ef7)", color: showCreate ? C.textSub : "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            {showCreate ? <X size={14} /> : <Plus size={14} />}{showCreate ? "Huỷ" : "Tạo mới"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{ marginBottom: 20 }}>
            <CreateSurveyComposer onCancel={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); setExpanded(true); }} />
          </div>
        )}

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, maxWidth: 360, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
            <Search size={14} color={C.textSub} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khảo sát..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: C.font, color: C.text }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, display: "flex", padding: 0 }}><X size={12} /></button>}
          </div>
          <span style={{ fontSize: 11, color: C.textDim }}>{filtered.length} khảo sát</span>
        </div>

        {/* My surveys list */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
            {Array(6).fill(0).map((_, i) => <SurveyCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard style={{ textAlign: "center", padding: "48px 20px" }}>
            <Inbox size={40} color={C.textDim} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{search ? `Không tìm thấy "${search}"` : "Chưa có khảo sát nào"}</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>{search ? "Thử từ khoá khác" : "Hãy tạo khảo sát đầu tiên"}</div>
          </GlassCard>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {visible.map((survey, index) => (
                <SurveyCardHome
                  key={survey.id}
                  survey={survey}
                  index={index}
                  onClick={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                  type="my"
                  onShare={handleShare}
                  onLock={handleClose}
                  onViewAnalytics={(id) => navigate(`/user/my-surveys/${id}/studio?tab=analyze`)}
                  onExpiredClick={(s) => setExtendModal({ open: true, survey: s })}
                  onSaveEdit={handleSaveEdit}
                />
              ))}
            </div>
            {hasMore && !showCreate && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                <button onClick={() => setExpanded(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 22px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.7)", color: C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {expanded ? <><ChevronUp size={13} /> Thu gọn</> : <><ChevronDown size={13} /> Xem thêm {filtered.length - PREVIEW_LIMIT} khảo sát</>}
                </button>
              </div>
            )}
          </>
        )}

        {/* Invited surveys */}
        {invitedSurveys.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 18 }}>
              Khảo sát được mời
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: "rgba(245,158,11,0.12)", color: C.warning, border: "1px solid rgba(245,158,11,0.25)" }}>{invitedSurveys.length}</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {invitedSurveys.map((survey, index) => {
                const isExpired = survey.end_at && new Date(survey.end_at) < new Date();
                const computedStatus = isExpired ? "EXPIRED" : (survey.status || "ACTIVE");
                return (
                  <SurveyCardHome
                    key={survey.id}
                    survey={{ ...survey, status: computedStatus }}
                    index={index}
                    participantRole={survey.role || null}
                    onClick={() => {
                      if (survey.role === "editor") setEditorInviteModal({ open: true, survey });
                      else if (isExpired) { if (false) navigate(`/user/survey/${survey.id}/response`); else setExpiredModal({ open: true, survey }); }
                      else navigate(`/user/survey/${survey.id}/invited`);
                    }}
                    type="public"
                    onExpiredClick={(s) => setExpiredModal({ open: true, survey: s })}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>

      <ShareModal open={shareModal.open} onClose={() => setShareModal(p => ({ ...p, open: false }))}
        surveyTitle={shareModal.surveyTitle} shareUrl={shareModal.shareUrl}
        loading={shareModal.loading} error={shareModal.error} onGenerate={handleGenerateLink} />

      <ExtendModal open={extendModal.open} onClose={() => setExtendModal({ open: false, survey: null })}
        survey={extendModal.survey} onExtend={handleExtend} />

      {expiredModal.open && (
        <div onClick={() => setExpiredModal({ open: false, survey: null })} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "32px 24px", textAlign: "center", maxWidth: 400 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Khảo sát đã kết thúc</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Khảo sát <strong>"{expiredModal.survey?.title}"</strong> đã kết thúc.</p>
            <button onClick={() => setExpiredModal({ open: false, survey: null })} style={{ padding: "10px 32px", background: "#f4f6f8", border: "1px solid #e8ecf2", borderRadius: 10, color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Đóng</button>
          </div>
        </div>
      )}

      {editorInviteModal?.open && (
        <EditorInviteModal survey={editorInviteModal.survey} onClose={() => setEditorInviteModal({ open: false, survey: null })} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
      `}</style>
    </main>
  );
}
