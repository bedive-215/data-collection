import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, Globe, LayoutGrid, List, SlidersHorizontal,
  RefreshCw, Rocket, Inbox, Loader2} from "lucide-react";
import { useSurvey } from "@/providers/SurveyProvider";
import { useResponse } from "@/providers/ResponseProvider";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import { SurveyCardHome, ShareModal } from "@/components/survey/SurveyCardHome";
import { SurveyCardSkeleton } from "@/utils/surveyHelpers";
import { ROUTERS } from "@/utils/constants";

const C = {
  surface: "rgba(255,255,255,0.78)",
  glassBorder: "rgba(255,255,255,0.55)",
  primary: "#4f46e5",
  primaryBorder: "rgba(79,70,229,0.35)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  font: "'DM Sans','Inter',sans-serif"};

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, backdropFilter: "blur(24px) saturate(190%)",
      WebkitBackdropFilter: "blur(24px) saturate(190%)",
      border: `1px solid ${C.glassBorder}`, borderRadius: 22,
      ...style}}>
      {children}
    </div>
  );
}

export default function BrowseSurveysPage() {
  const navigate = useNavigate();
  const { publicSurveys, fetchPublicSurveys, closeSurvey } = useSurvey();
  const { getAllMyResponses } = useResponse();

  const getAllMyResponsesRef = useRef(getAllMyResponses);
  getAllMyResponsesRef.current = getAllMyResponses;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilter, setShowFilter] = useState(false);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [expiredModal, setExpiredModal] = useState({ open: false, survey: null });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [pubResult, respResult] = await Promise.allSettled([
        fetchPublicSurveys(),
        getAllMyResponsesRef.current().catch(() => null),
      ]);
      const resp = respResult.status === "fulfilled" ? respResult.value : null;
      const ids = new Set((resp?.data ?? resp ?? []).map(r => r.survey_id ?? r.surveyId));
      setDoneSurveyIds(ids);
      if (pubResult.status === "rejected") setError("Không thể tải danh sách khảo sát.");
    } catch {
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  }, [fetchPublicSurveys]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const displayed = useMemo(() => {
    let list = [...publicSurveys];
    if (activeTab === "pending") list = list.filter(s => !doneSurveyIds.has(s.id));
    if (activeTab === "done") list = list.filter(s => doneSurveyIds.has(s.id));
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(s => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)); }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "name") list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [publicSurveys, doneSurveyIds, activeTab, search, sortBy]);

  const totalCount = publicSurveys.length;
  const doneCount = publicSurveys.filter(s => doneSurveyIds.has(s.id)).length;
  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;

  const TABS = [
    { key: "all", label: "Tất cả", count: totalCount },
    { key: "pending", label: "Chưa làm", count: pendingCount },
    { key: "done", label: "Đã hoàn thành", count: doneCount },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "transparent", fontFamily: C.font, overflowX: "hidden", position: "relative" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1260, margin: "0 auto", padding: "12px 18px 52px" }}>

        {/* Hero */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
          <div style={{
            flex: "1 1 300px", position: "relative", padding: "28px 30px 30px", borderRadius: 28, overflow: "hidden",
            background: "linear-gradient(148deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.48) 55%, rgba(238,242,255,0.65) 100%)",
            backdropFilter: "blur(26px)", border: "1px solid rgba(255,255,255,0.82)"}}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 13, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Rocket size={18} color="#fff" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "#4f46e5", textTransform: "uppercase" }}>Khám phá</span>
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.6rem, 3.8vw, 2.35rem)", fontWeight: 900, lineHeight: 1.1, color: "#0f172a" }}>
              Khảo sát công khai
            </h1>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: C.textSub, maxWidth: 440, lineHeight: 1.55 }}>
              Tham gia khảo sát, đóng góp ý kiến và kiếm sao thưởng.
            </p>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: "1 1 280px", height: 42, borderRadius: 11, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
            <Search size={14} color={C.textSub} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khảo sát..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, fontFamily: C.font, color: C.text }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, display: "flex", padding: 0 }}><X size={13} /></button>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)", padding: 3, borderRadius: 11, border: "1px solid rgba(0,0,0,0.07)" }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: C.font, background: isActive ? "rgba(255,255,255,0.9)" : "transparent", color: isActive ? C.primary : C.textSub }}>
                    {tab.label}
                    {!loading && <span style={{ padding: "1px 6px", borderRadius: 999, fontSize: 10, background: isActive ? "rgba(67,97,238,0.1)" : "transparent", color: isActive ? C.primary : C.textDim }}>{tab.count}</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowFilter(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: `1px solid ${showFilter ? C.primaryBorder : "rgba(0,0,0,0.08)"}`, background: showFilter ? "rgba(67,97,238,0.1)" : "rgba(255,255,255,0.7)", color: showFilter ? C.primary : C.textSub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              <SlidersHorizontal size={12} /> Lọc
            </button>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.7)", borderRadius: 9, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: viewMode === "grid" ? "rgba(67,97,238,0.1)" : "transparent", color: viewMode === "grid" ? C.primary : C.textSub }}><LayoutGrid size={13} /></button>
              <div style={{ width: 1, background: "rgba(0,0,0,0.06)", height: 16 }} />
              <button onClick={() => setViewMode("list")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: viewMode === "list" ? "rgba(67,97,238,0.1)" : "transparent", color: viewMode === "list" ? C.primary : C.textSub }}><List size={13} /></button>
            </div>
            <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.7)", color: C.textSub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={12} /></button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilter && (
          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.textSub, marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sắp xếp theo</p>
                <div style={{ display: "flex", gap: 5 }}>
                  {[{ key: "newest", label: "Mới nhất" }, { key: "oldest", label: "Cũ nhất" }, { key: "name", label: "Tên A-Z" }].map(item => (
                    <button key={item.key} onClick={() => setSortBy(item.key)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${sortBy === item.key ? C.primaryBorder : "rgba(0,0,0,0.08)"}`, background: sortBy === item.key ? "rgba(67,97,238,0.1)" : "rgba(255,255,255,0.7)", color: sortBy === item.key ? C.primary : C.textSub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{item.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.7)", color: C.textSub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Đặt lại</button>
            </div>
          </GlassCard>
        )}

        {/* Content */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
            {Array(6).fill(0).map((_, i) => <SurveyCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <GlassCard style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{error}</div>
            <button onClick={fetchAll} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4361ee,#6c7ef7)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Thử lại</button>
          </GlassCard>
        )}

        {!loading && !error && displayed.length === 0 && (
          <GlassCard style={{ textAlign: "center", padding: "48px 20px" }}>
            <Inbox size={40} color={C.textDim} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{search ? `Không tìm thấy "${search}"` : "Không có khảo sát nào"}</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>{search ? "Thử từ khoá khác" : "Chưa có dữ liệu"}</div>
          </GlassCard>
        )}

        {!loading && !error && displayed.length > 0 && (
          <>
            <div style={{ marginBottom: 14, fontSize: 11, color: C.textSub }}>
              {displayed.length} khảo sát{search ? ` · "${search}"` : ""}
              {doneCount > 0 && <span style={{ marginLeft: 8, color: C.success, fontWeight: 600 }}>· {doneCount} đã hoàn thành</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {displayed.map((survey, i) => {
                const isDone = doneSurveyIds.has(survey.id);
                const isExpired = survey.end_at && new Date(survey.end_at) < new Date();
                return (
                  <SurveyCardHome
                    key={survey.id}
                    survey={survey}
                    index={i}
                    overrideStatus={isDone ? "COMPLETED" : null}
                    onClick={() => {
                      if (isExpired) {
                        if (isDone) navigate(`/user/survey/${survey.id}/response`);
                        else setExpiredModal({ open: true, survey });
                      } else if (isDone) navigate(`/user/survey/${survey.id}/response`);
                      else navigate(`/user/survey/${survey.id}`);
                    }}
                    type="public"
                    onExpiredClick={(s) => setExpiredModal({ open: true, survey: s })}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Expired modal */}
        {expiredModal.open && (
          <div onClick={() => setExpiredModal({ open: false, survey: null })} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf2", width: "100%", maxWidth: 400, textAlign: "center", padding: "32px 24px", fontFamily: C.font }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Khảo sát đã kết thúc</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Khảo sát <strong>"{expiredModal.survey?.title}"</strong> đã kết thúc và không còn nhận phản hồi.</p>
              <button onClick={() => setExpiredModal({ open: false, survey: null })} style={{ padding: "10px 32px", background: "#f4f6f8", border: "1px solid #e8ecf2", borderRadius: 10, color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Đóng</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
      `}</style>
    </main>
  );
}
