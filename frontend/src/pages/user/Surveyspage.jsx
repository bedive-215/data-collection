// ─── SurveysPage.jsx ────────────────────────────────────────────────
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
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import { useSurvey } from "@/providers/SurveyProvider";
import { useResponse } from "@/providers/ResponseProvider";
import { SurveyCardHome } from "@/components/survey/SurveyCardHome";

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chưa làm" },
  { key: "done", label: "Đã hoàn thành" },
];

// ─────────────────────────────────────────────────────────────
// Type config
// ─────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  SINGLE_CHOICE: {
    label: "Một lựa chọn",
    barColor: "#2563eb",
    badgeBg: "#eff6ff",
    badgeBorder: "#bfdbfe",
    badgeColor: "#1d4ed8",
  },
  MULTIPLE_CHOICE: {
    label: "Nhiều lựa chọn",
    barColor: "#7c3aed",
    badgeBg: "#f5f3ff",
    badgeBorder: "#ddd6fe",
    badgeColor: "#6d28d9",
  },
  TEXT: {
    label: "Văn bản",
    barColor: "#0891b2",
    badgeBg: "#ecfeff",
    badgeBorder: "#a5f3fc",
    badgeColor: "#0e7490",
  },
};

function getTypeCfg(type) {
  return (
    TYPE_CONFIG[type] ?? {
      label: type,
      barColor: "#888",
      badgeBg: "#f3f4f6",
      badgeBorder: "#e5e7eb",
      badgeColor: "#6b7280",
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Chuẩn hoá answer thành Set<string>
 * Xử lý: null, string, "a,b,c", [], ["a","b"]
 */
function getAnswerSet(answer) {
  if (answer === null || answer === undefined) return new Set();
  if (Array.isArray(answer)) {
    return new Set(answer.map((s) => String(s).trim()).filter(Boolean));
  }
  return new Set(
    String(answer)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
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

  // ── TEXT ──
  if (isText) {
    return item.answer?.trim() ? (
      <div
        style={{
          background: "#f8faff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "12px 14px",
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.6,
        }}
      >
        {item.answer}
      </div>
    ) : (
      <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
        Không có câu trả lời
      </p>
    );
  }

  // ── SINGLE / MULTIPLE có options từ backend ──
  const options = item.options ?? [];

  if (options.length > 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {!hasAnswer && (
          <p
            style={{
              fontSize: 13,
              color: "#9ca3af",
              fontStyle: "italic",
              marginBottom: 4,
            }}
          >
            Chưa chọn lựa chọn nào
          </p>
        )}
        {options.map((opt, i) => {
          const label =
            typeof opt === "string"
              ? opt
              : opt.label ?? opt.value ?? opt.content ?? "";
          const isSelected =
            answerSet.has(label) || answerSet.has(String(opt.id ?? ""));

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 10,
                border: `1px solid ${isSelected ? "#bfdbfe" : "#e5e7eb"}`,
                background: isSelected ? "rgba(239,246,255,0.8)" : "#fafafa",
              }}
            >
              {isMultiple ? (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`,
                    background: isSelected ? "#2563eb" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 11 8" fill="none">
                      <path
                        d="M1 4L4 7L10 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${isSelected ? "#2563eb" : "#d1d5db"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#2563eb",
                      }}
                    />
                  )}
                </div>
              )}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "#1e40af" : "#6b7280",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── SINGLE / MULTIPLE không có options (backend chỉ trả answer string/array) ──
  // → Hiển thị trực tiếp answer dạng highlighted chip
  if (hasAnswer) {
    const labels = [...answerSet];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {labels.map((label, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 10,
              border: "1.5px solid #bfdbfe",
              background: "rgba(239,246,255,0.8)",
            }}
          >
            {isMultiple ? (
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: "2px solid #2563eb",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="10" height="8" viewBox="0 0 11 8" fill="none">
                  <path
                    d="M1 4L4 7L10 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : (
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2px solid #2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#2563eb",
                  }}
                />
              </div>
            )}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
      Không có câu trả lời
    </p>
  );
}

// ─────────────────────────────────────────────────────────────
// QuestionCard
// ─────────────────────────────────────────────────────────────
function QuestionCard({ item, index }) {
  const cfg = getTypeCfg(item.type);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        borderTop: `3px solid ${cfg.barColor}`,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 18px" }}>
        {/* meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            Câu {index + 1}
          </span>
          <span
            style={{
              background: cfg.badgeBg,
              border: `1px solid ${cfg.badgeBorder}`,
              color: cfg.badgeColor,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            {cfg.label}
          </span>
        </div>

        {/* question text */}
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          {item.question}
        </h3>

        {/* answer */}
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
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getMySubmission(surveyId);

        // Backend trả: { data: [{ response_id, answers: [...] }] }
        // Hoặc trực tiếp array responses
        const raw = res?.data ?? res ?? [];

        const allAnswers = Array.isArray(raw)
          ? raw.flatMap((r) => r.answers ?? [])
          : raw.answers ?? [];

        setAnswers(allAnswers);
      } catch (err) {
        console.error(err);
        setError("Không thể tải câu trả lời.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [surveyId]);

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflow: "hidden",
          background: "#f4f5f7",
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Đóng
          </button>

          <div className="text-sm font-bold text-gray-700">InsightFlow</div>

          <div style={{ width: 60 }} />
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {/* Hero */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: "#dcfce7", border: "1px solid #86efac" }}
            >
              <CheckCircle2 size={14} color="#16a34a" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803d]">
                Đã hoàn thành
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 mb-1">
              {surveyTitle}
            </h2>

            {!loading && (
              <p className="text-sm text-gray-400">{answers.length} câu hỏi</p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 text-[#4f6ef7] gap-3">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-semibold text-sm">Đang tải...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <span className="text-4xl">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && answers.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <Inbox size={42} />
              <p>Không có câu trả lời.</p>
            </div>
          )}

          {/* Answers */}
          {!loading && !error && answers.length > 0 && (
            <div className="flex flex-col gap-4">
              {answers.map((item, idx) => (
                <QuestionCard
                  key={item.question_id ?? idx}
                  item={item}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CardSkeleton
// ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-[#e8ecf5] rounded-2xl overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="h-[140px] bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
        <div className="w-[72px] h-[72px] rounded-[20px] bg-white/40 backdrop-blur-sm border border-white/50" />
      </div>
      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-2/3" />
        <div className="flex justify-between items-center pt-3">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-8 bg-slate-100 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SurveyCardWrapper — adapts SurveyCardHome for SurveysPage
// ─────────────────────────────────────────────────────────────
function SurveyCardWrapper({ survey, done, onStart, onViewSubmission, index }) {
  const handleClick = () => {
    if (done) {
      onViewSubmission(survey.id, survey.title);
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
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function SurveysPage() {
  const navigate = useNavigate();

  const { surveys, loading, error, fetchPublicSurveys } = useSurvey();
  const { getAllMyResponses } = useResponse();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [modalSurvey, setModalSurvey] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilter, setShowFilter] = useState(false);

  // ─── Fetch data ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      await fetchPublicSurveys();

      const responseRes = await getAllMyResponses().catch(() => null);
      const responseList = responseRes?.data ?? [];

      const ids = new Set(
        responseList.map((r) => r.survey_id ?? r.surveyId)
      );

      setDoneSurveyIds(ids);
    } catch (err) {
      console.error(err);
    }
  }, [fetchPublicSurveys, getAllMyResponses]);

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Counts ───────────────────────────────────────────────
  const totalCount = surveys.length;
  const doneCount = surveys.filter((s) => doneSurveyIds.has(s.id)).length;
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;

  // ─── Displayed list ───────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...surveys];

    if (activeTab === "pending") {
      list = list.filter((s) => !doneSurveyIds.has(s.id));
    }
    if (activeTab === "done") {
      list = list.filter((s) => doneSurveyIds.has(s.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    if (sortBy === "name") {
      list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }

    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleStart = (surveyId) => {
    navigate(`/user/survey/${surveyId}`);
  };

  const handleViewSubmission = (surveyId, title) => {
    setModalSurvey({ id: surveyId, title });
  };

  return (
    <main
      className="min-h-screen max-w-7xl mx-auto px-6 md:px-8 py-10"
      style={{
        backgroundColor: "#f4f5f7",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Modal */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
              Khảo sát
            </h1>
            <p className="text-sm text-gray-400">
              {loading
                ? "Đang tải..."
                : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
            </p>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e8ecf5] text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 mb-6 bg-white rounded-2xl p-1.5 w-fit"
        style={{ border: "1px solid #e8ecf5" }}
      >
        {TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? totalCount
              : tab.key === "pending"
              ? pendingCount
              : doneCount;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
              style={
                isActive
                  ? { background: "linear-gradient(135deg,#6a8fff,#4f6ef7)" }
                  : {}
              }
            >
              {tab.label}
              {!loading && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm khảo sát..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none bg-white focus:ring-2 focus:ring-[#4f6ef7]/20"
            style={{ border: "1px solid #e8ecf5" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilter((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
            showFilter
              ? "bg-[#eef2ff] text-[#4f6ef7]"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
          style={{
            border: `1px solid ${showFilter ? "#4f6ef7" : "#e8ecf5"}`,
          }}
        >
          <SlidersHorizontal size={15} />
          Lọc
        </button>

        <div className="flex-1" />

        {/* View mode */}
        <div
          className="flex items-center bg-white rounded-xl overflow-hidden"
          style={{ border: "1px solid #e8ecf5" }}
        >
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2.5 ${
              viewMode === "grid"
                ? "bg-[#eef2ff] text-[#4f6ef7]"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid size={16} />
          </button>
          <div style={{ width: 1, background: "#e8ecf5", height: 20 }} />
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2.5 ${
              viewMode === "list"
                ? "bg-[#eef2ff] text-[#4f6ef7]"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div
          className="bg-white rounded-2xl p-5 mb-6 flex flex-wrap gap-6 items-end"
          style={{ border: "1px solid #e8ecf5" }}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Sắp xếp theo
            </p>
            <div className="flex gap-2">
              {[
                { key: "newest", label: "Mới nhất" },
                { key: "oldest", label: "Cũ nhất" },
                { key: "name", label: "Tên A-Z" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSortBy(item.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    border:
                      sortBy === item.key
                        ? "1px solid #4f6ef7"
                        : "1px solid #e8ecf5",
                    background: sortBy === item.key ? "#eef2ff" : "#fff",
                    color: sortBy === item.key ? "#4f6ef7" : "#6b7280",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSearch("");
              setSortBy("newest");
              setActiveTab("all");
              setShowFilter(false);
            }}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            style={{ border: "1px solid #e8ecf5" }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <CardSkeleton key={i} />
            ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <span className="text-5xl">⚠️</span>
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="text-[#4f6ef7] font-semibold hover:underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-4">
          <Inbox size={52} strokeWidth={1.2} />
          <div className="text-center">
            <p className="text-base font-semibold text-gray-500">
              Không có khảo sát nào
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {search
                ? `Không tìm thấy kết quả cho "${search}"`
                : "Chưa có dữ liệu"}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && displayed.length > 0 && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
              : "flex flex-col gap-3"
          }
        >
          {displayed.map((survey, index) => (
            <SurveyCardWrapper
              key={survey.id}
              survey={survey}
              done={doneSurveyIds.has(survey.id)}
              onStart={handleStart}
              onViewSubmission={handleViewSubmission}
              index={index}
            />
          ))}
        </div>
      )}
    </main>
  );
}