// ─── SurveysPage.jsx — "Khám phá" ────────────────────────────────────
// Thiết kế: editorial clean, neutral palette, card grid đều kích thước.
// Đã bỏ: đoạn mô tả "Tìm nhanh, tạo mới..." dưới header.
// Card: fixed height, grid cols auto-fill minmax(280px, 1fr).
// ─────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Inbox,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Loader2,
  RefreshCw} from "lucide-react";

import { useSurvey } from "@/providers/SurveyProvider";
import { useResponse } from "@/providers/ResponseProvider";
import { SurveyCardHome } from "@/components/survey/SurveyCardHome";

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",     label: "Tất cả"       },
  { key: "pending", label: "Chưa làm"     },
  { key: "done",    label: "Đã hoàn thành" },
];

// ─────────────────────────────────────────────────────────────
// TYPE_CONFIG (giữ nguyên cho AnswerBlock / QuestionCard)
// ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  SINGLE_CHOICE: {
    label: "Một lựa chọn",
    barColor: "#2563eb", badgeBg: "#eff6ff",
    badgeBorder: "#bfdbfe", badgeColor: "#1d4ed8"},
  MULTIPLE_CHOICE: {
    label: "Nhiều lựa chọn",
    barColor: "#7c3aed", badgeBg: "#f5f3ff",
    badgeBorder: "#ddd6fe", badgeColor: "#6d28d9"},
  TEXT: {
    label: "Văn bản",
    barColor: "#0891b2", badgeBg: "#ecfeff",
    badgeBorder: "#a5f3fc", badgeColor: "#0e7490"}};
function getTypeCfg(type) {
  return TYPE_CONFIG[type] ?? {
    label: type, barColor: "#888",
    badgeBg: "#f3f4f6", badgeBorder: "#e5e7eb", badgeColor: "#6b7280"};
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getAnswerSet(answer) {
  if (answer === null || answer === undefined) return new Set();
  if (Array.isArray(answer))
    return new Set(answer.map((s) => String(s).trim()).filter(Boolean));
  return new Set(
    String(answer).split(",").map((s) => s.trim()).filter(Boolean)
  );
}

// ─────────────────────────────────────────────────────────────
// AnswerBlock
// ─────────────────────────────────────────────────────────────
function AnswerBlock({ item }) {
  const isText = item.type === "TEXT";
  const isMultiple = item.type === "MULTIPLE_CHOICE";
  const answerSet = getAnswerSet(item.answer);
  const hasAnswer = answerSet.size > 0;

  if (isText) {
    return item.answer?.trim() ? (
      <div style={{ background: "#f8faff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
        {item.answer}
      </div>
    ) : (
      <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Không có câu trả lời</p>
    );
  }

  const options = item.options ?? [];
  if (options.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {!hasAnswer && <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic", marginBottom: 4 }}>Chưa chọn lựa chọn nào</p>}
        {options.map((opt, i) => {
          const label = typeof opt === "string" ? opt : opt.label ?? opt.value ?? opt.content ?? "";
          const isSelected = answerSet.has(label) || answerSet.has(String(opt.id ?? ""));
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: `1px solid ${isSelected ? "#bfdbfe" : "#e5e7eb"}`, background: isSelected ? "rgba(239,246,255,0.8)" : "#fafafa" }}>
              {isMultiple ? (
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`, background: isSelected ? "#2563eb" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSelected && <svg width="10" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }}/>}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#1e40af" : "#6b7280" }}>{label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (hasAnswer) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[...answerSet].map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "1.5px solid #bfdbfe", background: "rgba(239,246,255,0.8)" }}>
            {isMultiple ? (
              <div style={{ width: 18, height: 18, borderRadius: 5, border: "2px solid #2563eb", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }}/>
              </div>
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Không có câu trả lời</p>;
}

// ─────────────────────────────────────────────────────────────
// QuestionCard
// ─────────────────────────────────────────────────────────────
function QuestionCard({ item, index }) {
  const cfg = getTypeCfg(item.type);
  return (
    <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb", borderTop: `3px solid ${cfg.barColor}`, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>Câu {index + 1}</span>
          <span style={{ background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, color: cfg.badgeColor, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{cfg.label}</span>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12, lineHeight: 1.5 }}>{item.question}</h3>
        <AnswerBlock item={item} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SubmissionModal
// ─────────────────────────────────────────────────────────────
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true); setError(null);
        const res = await getMySubmission(surveyId);
        const raw = res?.data ?? res ?? [];
        const all = Array.isArray(raw)
          ? raw.flatMap((r) => r.answers ?? [])
          : raw.answers ?? [];
        setAnswers(all);
      } catch { setError("Không thể tải câu trả lời."); }
      finally { setLoading(false); }
    };
    fetch();
  }, [surveyId]);

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", overflow: "hidden", background: "#ffffff", borderRadius: 18, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
        <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={16} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Đáp án của bạn</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span dangerouslySetInnerHTML={{__html:surveyTitle||""}}/></div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <X size={13}/>
          </button>
        </div>
        <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {loading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "40px 0", color: "#94a3b8" }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }}/><span style={{ fontSize: 13 }}>Đang tải đáp án...</span></div>}
          {!loading && error && <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: "#94a3b8" }}>{error}</div>}
          {!loading && !error && answers.length === 0 && <div style={{ textAlign: "center", padding: "32px 0" }}><Inbox size={22} color="#94a3b8" style={{ marginBottom: 8 }}/><div style={{ fontSize: 13, color: "#94a3b8" }}>Bạn chưa trả lời khảo sát này.</div></div>}
          {!loading && !error && answers.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)", alignSelf: "flex-start" }}>
                <CheckCircle2 size={13} color="#059669"/>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{answers.length} câu hỏi</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {answers.map((item, idx) => <QuestionCard key={item.question_id ?? idx} item={item} index={idx}/>)}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CardSkeleton — đồng nhất kích thước với card thật
// ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e8ecf5",
      borderRadius: 14,
      overflow: "hidden",
      height: 260,   /* ← khớp với card thật */
      display: "flex",
      flexDirection: "column",
      animation: "skPulse 1.4s ease-in-out infinite"}}>
      <div style={{ height: 110, background: "linear-gradient(135deg,#f1f5fb,#e8edf5)" }}/>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "70%" }}/>
        <div style={{ height: 10, background: "#f8fafc", borderRadius: 6, width: "90%" }}/>
        <div style={{ height: 10, background: "#f8fafc", borderRadius: 6, width: "55%" }}/>
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 6, width: 60 }}/>
          <div style={{ height: 28, background: "#f1f5f9", borderRadius: 8, width: 80 }}/>
        </div>
      </div>
      <style>{`@keyframes skPulse{0%,100%{opacity:1}50%{opacity:.55}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ExpiredModal
// ─────────────────────────────────────────────────────────────
function ExpiredModal({ open, onClose, survey }) {
  if (!open || !survey) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8ecf2", width: "100%", maxWidth: 400, overflow: "hidden", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", textAlign: "center", padding: "32px 24px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Clock size={26} color="#ef4444"/>
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Khảo sát đã kết thúc</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
          Khảo sát <strong>"<span dangerouslySetInnerHTML={{__html:survey.title}}/>"</strong> đã kết thúc và không còn nhận phản hồi.
        </p>
        <button onClick={onClose} style={{ padding: "10px 32px", background: "#f4f6f8", border: "1px solid #e8ecf2", borderRadius: 10, color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Đóng</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SurveyCardWrapper
// ─────────────────────────────────────────────────────────────
function SurveyCardWrapper({ survey, done, onStart, onViewSubmission, index, onExpiredClick }) {
  const isExpired = survey.end_at && new Date(survey.end_at) < new Date();
  const handleClick = () => {
    if (isExpired) {
      done ? onViewSubmission(survey.id) : onExpiredClick(survey);
    } else if (done) {
      onViewSubmission(survey.id);
    } else {
      onStart(survey.id);
    }
  };
  return (
    <SurveyCardHome
      survey={survey}
      index={index}
      overrideStatus={done ? "COMPLETED" : null}
      onClick={handleClick}
      type="public"
      isOwner={false}
      onExpiredClick={onExpiredClick}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page — "Khám phá"
// Thiết kế: trắng sạch, neutral, editorial. Không gradient xoay.
// ─────────────────────────────────────────────────────────────
export default function SurveysPage() {
  const navigate = useNavigate();
  const { surveys, loading, error, fetchPublicSurveys } = useSurvey();
  const { getAllMyResponses }                            = useResponse();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [expiredModal, setExpiredModal]   = useState({ open: false, survey: null });
  const [activeTab, setActiveTab]         = useState("all");
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState("newest");
  const [viewMode, setViewMode]           = useState("grid");
  const [showFilter, setShowFilter]       = useState(false);

  const fetchData = useCallback(async () => {
    try {
      await fetchPublicSurveys();
      const res  = await getAllMyResponses().catch(() => null);
      const list = res?.data ?? [];
      setDoneSurveyIds(new Set(list.map((r) => r.survey_id ?? r.surveyId)));
    } catch {}
  }, [fetchPublicSurveys, getAllMyResponses]);

  useEffect(() => { fetchData(); }, []);

  const totalCount   = surveys.length;
  const doneCount    = surveys.filter((s) => doneSurveyIds.has(s.id)).length;
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;

  const displayed = useMemo(() => {
    let list = [...surveys];
    if (activeTab === "pending") list = list.filter((s) => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter((s) =>  doneSurveyIds.has(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "name")   list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  const handleStart          = (id) => navigate(`/user/survey/${id}`);
  const handleViewSubmission = (id) => navigate(`/user/survey/${id}/response`);
  const handleExpiredClick   = (s)  => setExpiredModal({ open: true, survey: s });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f7f8fc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      <ExpiredModal open={expiredModal.open} onClose={() => setExpiredModal({ open: false, survey: null })} survey={expiredModal.survey}/>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #eaecf2",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        position: "sticky",
        top: 0,
        zIndex: 50}}>
        {/* Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Khám phá khảo sát
          </h1>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 440, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm khảo sát..."
            style={{
              width: "100%",
              height: 38,
              paddingLeft: 36,
              paddingRight: search ? 36 : 14,
              border: "1.5px solid #e8ecf5",
              borderRadius: 10,
              fontSize: 13,
              outline: "none",
              background: "#f8fafc",
              color: "#0f172a",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxSizing: "border-box"}}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#e8ecf5"; e.target.style.background = "#f8fafc"; }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}>
              <X size={14}/>
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "#f4f6f8", borderRadius: 9, padding: 3, gap: 1 }}>
            <button onClick={() => setViewMode("grid")} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: viewMode === "grid" ? "#fff" : "transparent", color: viewMode === "grid" ? "#4f6ef7" : "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" === "grid" ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              <LayoutGrid size={15}/>
            </button>
            <button onClick={() => setViewMode("list")} style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: viewMode === "list" ? "#fff" : "transparent", color: viewMode === "list" ? "#4f6ef7" : "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" === "list" ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              <List size={15}/>
            </button>
          </div>

          {/* Filter */}
          <button onClick={() => setShowFilter((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 9, border: `1.5px solid ${showFilter ? "#6366f1" : "#e8ecf5"}`, background: showFilter ? "#eef2ff" : "#fff", color: showFilter ? "#4f6ef7" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <SlidersHorizontal size={14}/>
            Lọc
          </button>

          {/* Refresh */}
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 9, border: "1.5px solid #e8ecf5", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <RefreshCw size={14}/>
            Làm mới
          </button>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* Stats strip */}
        {!loading && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[
              { label: "Tổng", value: totalCount,   color: "#6366f1", bg: "#eef2ff" },
              { label: "Đã xong", value: doneCount,  color: "#059669", bg: "#ecfdf5" },
              { label: "Chưa làm", value: pendingCount, color: "#f59e0b", bg: "#fffbeb" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}20` }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: s.color + "99" }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "2px solid #e8ecf5" }}>
          {TABS.map((tab) => {
            const count = tab.key === "all" ? totalCount : tab.key === "pending" ? pendingCount : doneCount;
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#4f6ef7" : "#64748b", borderBottom: active ? "2px solid #4f6ef7" : "2px solid transparent", marginBottom: -2, fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                {tab.label}
                {!loading && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: active ? "#eef2ff" : "#f4f6f8", color: active ? "#4f6ef7" : "#94a3b8" }}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8ecf5", padding: "16px 20px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-end" }}>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sắp xếp</p>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ key: "newest", label: "Mới nhất" }, { key: "oldest", label: "Cũ nhất" }, { key: "name", label: "A → Z" }].map((item) => (
                  <button key={item.key} onClick={() => setSortBy(item.key)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: sortBy === item.key ? "1.5px solid #6366f1" : "1px solid #e8ecf5", background: sortBy === item.key ? "#eef2ff" : "#fff", color: sortBy === item.key ? "#4f6ef7" : "#6b7280", cursor: "pointer" }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }} style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 8, border: "1px solid #e8ecf5", background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Reset
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array(6).fill(0).map((_, i) => <CardSkeleton key={i}/>)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 12, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>Đã xảy ra lỗi</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{error}</div>
            <button onClick={fetchData} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(79,70,229,0.3)", background: "rgba(79,70,229,0.06)", color: "#4f46e5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Thử lại</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && displayed.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 8, textAlign: "center" }}>
            <Inbox size={40} color="#cbd5e1" style={{ marginBottom: 8 }}/>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: 0 }}>
              {search ? `Không tìm thấy "${search}"` : "Chưa có khảo sát nào"}
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              {search ? "Thử từ khoá khác" : "Hãy quay lại sau"}
            </p>
          </div>
        )}

        {/* ── Grid / List ────────────────────────────────────────── */}
        {!loading && !error && displayed.length > 0 && (
          <div style={
            viewMode === "grid"
              ? {
                  display: "grid",
                  /* card đều nhau: minmax(280px, 1fr), hàng đều chiều cao */
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gridAutoRows: "260px",
                  gap: 16}
              : { display: "flex", flexDirection: "column", gap: 10 }
          }>
            {displayed.map((survey, index) => (
              <SurveyCardWrapper
                key={survey.id}
                survey={survey}
                done={doneSurveyIds.has(survey.id)}
                onStart={handleStart}
                onViewSubmission={handleViewSubmission}
                index={index}
                onExpiredClick={handleExpiredClick}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        button{font-family:'Plus Jakarta Sans',sans-serif}
      `}</style>
    </main>
  );
}