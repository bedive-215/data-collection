// ─── SurveysPage.jsx ────────────────────────────────────────────────
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Clock, FileText, Inbox,
  Search, LayoutGrid, List, SlidersHorizontal, X, Loader2,
  ArrowLeft,
} from "lucide-react";
import surveyService from "@/services/surveyService";
import { useResponse } from "@/providers/ResponseProvider";

// ── Tabs config ───────────────────────────────────────────────────
const TABS = [
  { key: "all",     label: "Tất cả"        },
  { key: "pending", label: "Chưa làm"      },
  { key: "done",    label: "Đã hoàn thành" },
];

const TYPE_META = {
  SINGLE_CHOICE:   { label: "Một lựa chọn",   color: "#1d4ed8", bg: "#eff6ff",  border: "#bfdbfe", accent: "#2563eb" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", color: "#6d28d9", bg: "#f5f3ff",  border: "#ddd6fe", accent: "#7c3aed" },
  TEXT:            { label: "Văn bản",          color: "#0e7490", bg: "#ecfeff",  border: "#a5f3fc", accent: "#0891b2" },
};
function typeMeta(type) {
  return TYPE_META[type] ?? { label: type, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", accent: "#9ca3af" };
}

// ── Icon per question type ────────────────────────────────────────
function SingleChoiceIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="#9ca3af" stroke="none" />
    </svg>
  );
}
function MultipleChoiceIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function TypeIcon({ type }) {
  if (type === "MULTIPLE_CHOICE") return <MultipleChoiceIcon />;
  if (type === "TEXT")            return <FileText size={17} strokeWidth={1.5} color="#9ca3af" />;
  return <SingleChoiceIcon />;
}

/* ─────────────────────────────────────────────────────────────────
   SubmissionModal
   ───────────────────────────────────────────────────────────────── */
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMySubmission(surveyId);
        setData(res);
      } catch (err) {
        console.error(err);
        setError("Không thể tải câu trả lời. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    })();
  }, [surveyId]);

  const allAnswers  = data?.data?.flatMap((r) => r.answers) ?? [];
  const totalAnswers = allAnswers.length;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{
        position: "relative",
        width: "100%", maxWidth: 560,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        borderRadius: 20,
        overflow: "hidden",
        background: "#f4f5f7",
        border: "1px solid #e1e2ed",
        boxShadow: "0 24px 64px rgba(0,0,40,0.14)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Top nav bar ── */}
        <div style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e1e2ed",
          padding: "0 20px",
          height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#6b7280", fontSize: 13, fontWeight: 600,
            padding: "6px 10px", borderRadius: 8,
            transition: "background 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Đóng
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>InsightFlow</span>
          <div style={{ width: 72 }} />
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px 24px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 99,
              background: "#dcfce7", border: "1px solid #86efac",
              marginBottom: 14,
            }}>
              <CheckCircle2 size={13} strokeWidth={2.5} color="#16a34a" />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#15803d", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Đã hoàn thành
              </span>
            </div>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: "#111827",
              letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 6,
            }}>
              {surveyTitle}
            </h2>
            {!loading && !error && (
              <p style={{ fontSize: 14, color: "#6b7280" }}>
                {totalAnswers} câu trả lời
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#4f6ef7", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                Đang tải câu trả lời...
              </div>
              {[0, 1].map((i) => (
                <div key={i} style={{
                  background: "#fff", borderRadius: 16,
                  border: "1px solid #e5e7eb", borderTop: "3px solid #e5e7eb",
                  padding: 18, animation: "pulse 1.5s ease infinite",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: "#f3f4f6" }} />
                    <div style={{ width: 76, height: 22, borderRadius: 99, background: "#f3f4f6" }} />
                  </div>
                  <div style={{ height: 14, background: "#f3f4f6", borderRadius: 6, marginBottom: 8, width: "72%" }} />
                  {[0, 1, 2].map((j) => (
                    <div key={j} style={{ height: 38, background: "#f9fafb", borderRadius: 10, marginBottom: 8, border: "1px solid #f3f4f6" }} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 10, color: "#9ca3af" }}>
              <span style={{ fontSize: 36 }}>⚠️</span>
              <p style={{ fontSize: 14 }}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && totalAnswers === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 10, color: "#9ca3af" }}>
              <Inbox size={40} strokeWidth={1.2} />
              <p style={{ fontSize: 14 }}>Không có câu trả lời nào.</p>
            </div>
          )}

          {/* Question cards — styled like DashboardPage SurveyCard */}
          {!loading && !error && allAnswers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {allAnswers.map((item, qIdx) => {
                const isText     = item.type === "TEXT";
                const isMultiple = item.type === "MULTIPLE_CHOICE";
                const meta       = typeMeta(item.type);

                const selectedSet = isMultiple
                  ? new Set(item.answer?.split(",").map((a) => a.trim()).filter(Boolean))
                  : new Set([item.answer]);
                const options = item.options ?? [];

                return (
                  <div key={item.question_id ?? qIdx} style={{
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    borderTop: `3px solid ${meta.accent}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}>

                    {/* Header row: icon + type badge */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 18px 0",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 11,
                        border: "1.5px solid #d1d5db", background: "#f9fafb",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <TypeIcon type={item.type} />
                      </div>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99,
                        background: meta.bg, border: `1px solid ${meta.border}`,
                        color: meta.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                      }}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "14px 18px 18px" }}>
                      <h3 style={{
                        fontSize: 14, fontWeight: 700, color: "#111827",
                        lineHeight: 1.45, marginBottom: 12,
                      }}>
                        {qIdx + 1}. {item.question}
                      </h3>

                      {/* TEXT answer */}
                      {isText && (
                        <div style={{
                          padding: "12px 14px",
                          background: "#f8faff",
                          border: "1px solid #e1e2ed",
                          borderRadius: 10,
                          fontSize: 13, color: "#374151", lineHeight: 1.6,
                        }}>
                          {item.answer || (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Không có câu trả lời</span>
                          )}
                        </div>
                      )}

                      {/* SINGLE / MULTIPLE CHOICE options */}
                      {!isText && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {options.length > 0 ? (
                            options.map((opt, oIdx) => {
                              const optLabel   = typeof opt === "string" ? opt : (opt.content ?? opt.label ?? opt.value ?? "");
                              const isSelected = selectedSet.has(optLabel) || selectedSet.has(String(opt.id ?? ""));
                              return (
                                <OptionRow key={oIdx} label={optLabel} isSelected={isSelected} isMultiple={isMultiple} />
                              );
                            })
                          ) : isMultiple ? (
                            item.answer?.split(",").map((a, ai) => (
                              <OptionRow key={ai} label={a.trim()} isSelected={true} isMultiple={true} />
                            ))
                          ) : (
                            <OptionRow label={item.answer} isSelected={true} isMultiple={false} />
                          )}
                        </div>
                      )}

                      {/* Divider + footer meta */}
                      <div style={{ height: 1, background: "#f3f4f6", margin: "14px 0" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af", fontSize: 12 }}>
                        <Clock size={12} strokeWidth={1.5} />
                        Đã trả lời
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          background: "#fff",
          borderTop: "1px solid #e1e2ed",
          padding: "14px 20px",
          flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            width: "100%", padding: "11px",
            background: "#f3f4f6", color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
      `}</style>
    </div>
  );
}

/* ── OptionRow ───────────────────────────────────────────────────── */
function OptionRow({ label, isSelected, isMultiple }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px",
      borderRadius: 10,
      border: `1px solid ${isSelected ? "#bfdbfe" : "#e5e7eb"}`,
      background: isSelected ? "rgba(239,246,255,0.7)" : "#fafafa",
      transition: "all 0.15s",
    }}>
      {isMultiple ? (
        /* Checkbox */
        <div style={{
          width: 18, height: 18, borderRadius: 5,
          border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`,
          background: isSelected ? "#2563eb" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all 0.15s",
        }}>
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ) : (
        /* Radio */
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all 0.15s",
        }}>
          {isSelected && (
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#2563eb" }} />
          )}
        </div>
      )}
      <span style={{
        fontSize: 13,
        fontWeight: isSelected ? 600 : 400,
        color: isSelected ? "#1e40af" : "#6b7280",
        transition: "color 0.15s",
      }}>
        {label}
      </span>
    </div>
  );
}

// ── SurveyCard (grid) ─────────────────────────────────────────────
function SurveyCard({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";

  return (
    <div
      onClick={() => done && onViewSubmission(id, title)}
      style={{ borderColor: done ? "#bbf7d0" : "#e8ecf5", cursor: done ? "pointer" : "default", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className={`group flex flex-col transition-all duration-200 p-6 rounded-2xl border
        hover:-translate-y-0.5 hover:shadow-lg
        ${done ? "bg-white hover:bg-[#f0fdf4]" : "bg-white hover:bg-[#f0f4ff]"}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          group-hover:scale-110 transition-transform duration-200
          ${done ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#eef2ff] text-[#4f6ef7]"}`}>
          {done ? <CheckCircle2 size={22} strokeWidth={1.5} /> : <FileText size={22} strokeWidth={1.5} />}
        </div>
        {done ? (
          <span style={{ borderColor: "#bbf7d0" }}
            className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] border uppercase tracking-wider">
            <CheckCircle2 size={9} /> Đã hoàn thành
          </span>
        ) : (
          <span style={{ border: "1px solid #e8ecf5" }}
            className="text-[10px] font-bold px-3 py-1 bg-[#f4f5f7] rounded-full text-gray-400 tracking-wider uppercase">
            Survey
          </span>
        )}
      </div>

      <h3 className="text-[15px] font-bold mb-1.5 text-gray-800 line-clamp-2 leading-snug">{title}</h3>
      <p className="text-gray-400 text-sm mb-5 line-clamp-2 leading-relaxed flex-1">{desc}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          <Clock size={13} strokeWidth={1.5} />
          <span>{displayDate}</span>
        </div>
        {done ? (
          <span style={{ borderColor: "#bbf7d0" }}
            className="px-4 py-1.5 bg-[#dcfce7] text-[#16a34a] font-bold rounded-xl text-xs border">
            Xem kết quả →
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(id); }}
            style={{ border: "none" }}
            className="px-4 py-1.5 bg-gradient-to-r from-[#6a8fff] to-[#4f6ef7] text-white font-bold rounded-xl text-xs active:scale-95 transition-all hover:opacity-90"
          >
            Bắt đầu →
          </button>
        )}
      </div>
    </div>
  );
}

// ── SurveyRow (list) ──────────────────────────────────────────────
function SurveyRow({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";

  return (
    <div
      onClick={() => done && onViewSubmission(id, title)}
      style={{ borderColor: done ? "#bbf7d0" : "#e8ecf5", cursor: done ? "pointer" : "default", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className={`group flex items-center gap-5 px-6 py-4 rounded-2xl border transition-all duration-150
        ${done ? "bg-white hover:bg-[#f0fdf4]" : "bg-white hover:bg-[#f0f4ff]"}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
        group-hover:scale-110 transition-transform duration-200
        ${done ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#eef2ff] text-[#4f6ef7]"}`}>
        {done ? <CheckCircle2 size={20} strokeWidth={1.5} /> : <FileText size={20} strokeWidth={1.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5 text-gray-400 text-xs flex-shrink-0 hidden sm:flex">
        <Clock size={12} strokeWidth={1.5} />
        <span>{displayDate}</span>
      </div>
      {done ? (
        <span style={{ borderColor: "#bbf7d0" }}
          className="px-4 py-1.5 bg-[#dcfce7] text-[#16a34a] font-bold rounded-xl text-xs border flex-shrink-0">
          Xem kết quả →
        </span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onStart(id); }}
          style={{ border: "none" }}
          className="px-4 py-1.5 bg-gradient-to-r from-[#6a8fff] to-[#4f6ef7] text-white font-bold rounded-xl text-xs active:scale-95 transition-all hover:opacity-90 flex-shrink-0"
        >
          Bắt đầu →
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ borderColor: "#e8ecf5" }} className="bg-white p-6 rounded-2xl border animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100" />
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </div>
      <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
      <div className="h-3 bg-gray-100 rounded mb-1 w-full" />
      <div className="h-3 bg-gray-100 rounded mb-5 w-2/3" />
      <div className="flex items-center justify-between mt-4">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-7 w-20 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
function RowSkeleton() {
  return (
    <div style={{ borderColor: "#e8ecf5" }} className="bg-white px-6 py-4 rounded-2xl border animate-pulse flex items-center gap-5">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3.5 bg-gray-100 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="h-7 w-24 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ── SurveysPage ───────────────────────────────────────────────────
export default function SurveysPage() {
  const navigate = useNavigate();
  const { getAllMyResponses } = useResponse();

  const [surveys, setSurveys]             = useState([]);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [modalSurvey, setModalSurvey]     = useState(null);
  const [activeTab, setActiveTab]         = useState("all");
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState("newest");
  const [viewMode, setViewMode]           = useState("grid");
  const [showFilter, setShowFilter]       = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [surveysRes, responsesRes] = await Promise.all([
        surveyService.getAllSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      setSurveys(surveysRes.data?.surveys ?? []);
      const responsesList = responsesRes?.data ?? [];
      setDoneSurveyIds(new Set(responsesList.map((r) => r.survey_id ?? r.surveyId)));
    } catch (err) {
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart          = (id) => navigate(`/user/survey/${id}`);
  const handleViewSubmission = (id, title) => setModalSurvey({ id, title });

  const totalCount   = surveys.length;
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;

  const displayed = useMemo(() => {
    let list = [...surveys];
    if (activeTab === "pending") list = list.filter((s) => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter((s) =>  doneSurveyIds.has(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "name")   list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-8 py-10 min-h-screen" style={{ backgroundColor: "#f4f5f7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Khảo sát</h1>
        <p className="text-gray-400 text-sm">
          {loading ? "Đang tải..." : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-2xl p-1.5 w-fit" style={{ border: "1px solid #e8ecf5" }}>
        {TABS.map((tab) => {
          const count = tab.key === "all" ? totalCount : tab.key === "pending" ? pendingCount : doneCount;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={isActive
                ? { background: "linear-gradient(135deg,#6a8fff,#4f6ef7)", border: "none", color: "#fff" }
                : { border: "none", background: "transparent", color: "#9ca3af" }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${isActive ? "shadow-sm" : "hover:text-gray-700 hover:bg-gray-50"}`}
            >
              {tab.label}
              {!loading && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm khảo sát..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none bg-white focus:ring-2 focus:ring-[#4f6ef7]/20"
            style={{ border: "1px solid #e8ecf5" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ border: "none", background: "none" }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0">
              <X size={14} />
            </button>
          )}
        </div>

        <button onClick={() => setShowFilter((v) => !v)}
          style={{ borderColor: showFilter ? "#4f6ef7" : "#e8ecf5", border: "1px solid" }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
            ${showFilter ? "bg-[#eef2ff] text-[#4f6ef7]" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
          <SlidersHorizontal size={15} />
          Lọc
        </button>

        <div className="flex-1" />

        <div className="flex items-center bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8ecf5" }}>
          <button onClick={() => setViewMode("grid")} style={{ border: "none" }}
            className={`px-3 py-2.5 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-[#eef2ff] text-[#4f6ef7]" : "bg-transparent text-gray-400 hover:bg-gray-50"}`}>
            <LayoutGrid size={16} />
          </button>
          <div style={{ width: 1, background: "#e8ecf5", height: 20 }} />
          <button onClick={() => setViewMode("list")} style={{ border: "none" }}
            className={`px-3 py-2.5 transition-colors cursor-pointer ${viewMode === "list" ? "bg-[#eef2ff] text-[#4f6ef7]" : "bg-transparent text-gray-400 hover:bg-gray-50"}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="bg-white rounded-2xl p-5 mb-6 flex flex-wrap gap-6 items-end" style={{ border: "1px solid #e8ecf5" }}>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sắp xếp theo</p>
            <div className="flex gap-2">
              {[{ key: "newest", label: "Mới nhất" }, { key: "oldest", label: "Cũ nhất" }, { key: "name", label: "Tên A–Z" }].map(({ key, label }) => (
                <button key={key} onClick={() => setSortBy(key)}
                  style={{ border: sortBy === key ? "1px solid #4f6ef7" : "1px solid #e8ecf5", background: sortBy === key ? "#eef2ff" : "#fff", color: sortBy === key ? "#4f6ef7" : "#6b7280" }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:border-[#4f6ef7]">
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }}
            style={{ border: "1px solid #e8ecf5", background: "none" }}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            Reset
          </button>
        </div>
      )}

      {/* Content */}
      {loading && (viewMode === "grid"
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
        : <div className="flex flex-col gap-3">{Array(6).fill(0).map((_, i) => <RowSkeleton key={i} />)}</div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <span className="text-5xl">⚠️</span>
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} style={{ border: "none", background: "none" }} className="text-[#4f6ef7] text-sm font-semibold hover:underline cursor-pointer">Thử lại</button>
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-4">
          <Inbox size={52} strokeWidth={1.2} />
          <div className="text-center">
            <p className="text-base font-semibold text-gray-500">Không có khảo sát nào</p>
            <p className="text-sm text-gray-400 mt-1">{search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có dữ liệu."}</p>
          </div>
          {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "none" }} className="text-[#4f6ef7] text-sm font-semibold hover:underline cursor-pointer">Xóa tìm kiếm</button>}
        </div>
      )}

      {!loading && !error && displayed.length > 0 && (
        viewMode === "grid"
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map((s) => <SurveyCard key={s.id} id={s.id} title={s.title} desc={s.description} createdAt={s.createdAt} done={doneSurveyIds.has(s.id)} onStart={handleStart} onViewSubmission={handleViewSubmission} />)}
            </div>
          : <div className="flex flex-col gap-3">
              {displayed.map((s) => <SurveyRow key={s.id} id={s.id} title={s.title} desc={s.description} createdAt={s.createdAt} done={doneSurveyIds.has(s.id)} onStart={handleStart} onViewSubmission={handleViewSubmission} />)}
            </div>
      )}
    </main>
  );
}