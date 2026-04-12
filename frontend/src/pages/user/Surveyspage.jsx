// ─── SurveysPage.jsx ────────────────────────────────────────────────
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Clock, FileText, Inbox,
  Search, LayoutGrid, List, SlidersHorizontal, X, Loader2,
} from "lucide-react";
import surveyService from "@/services/surveyService";
import { useResponse } from "@/providers/ResponseProvider";

// ── Tabs config ───────────────────────────────────────────────────
const TABS = [
  { key: "all",     label: "Tất cả"       },
  { key: "pending", label: "Chưa làm"     },
  { key: "done",    label: "Đã hoàn thành" },
];

// ── Type badge meta ───────────────────────────────────────────────
const TYPE_META = {
  SINGLE_CHOICE:   { label: "Một lựa chọn",   color: "#4f6ef7", bg: "#eef2ff" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn",  color: "#7c3aed", bg: "#f5f3ff" },
  TEXT:            { label: "Văn bản",          color: "#0891b2", bg: "#ecfeff" },
};
function typeMeta(type) {
  return TYPE_META[type] ?? { label: type, color: "#6b7280", bg: "#f3f4f6" };
}

// ── SubmissionModal ───────────────────────────────────────────────
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
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
    };
    fetchSubmission();
  }, [surveyId]);

  const allAnswers = data?.data?.flatMap((r) => r.answers) ?? [];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background: "#f4f5f7", border: "1px solid #e8ecf5", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 bg-white flex-shrink-0" style={{ borderBottom: "1px solid #e8ecf5" }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", border: "1px solid #86efac" }}
          >
            <CheckCircle2 size={24} className="text-[#16a34a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Câu trả lời của bạn</p>
            <h2 className="text-base font-extrabold text-gray-900 leading-snug line-clamp-2">{surveyTitle}</h2>
          </div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "none" }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Completed banner */}
        {!loading && !error && allAnswers.length > 0 && (
          <div className="mx-4 mt-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0" }}>
            <CheckCircle2 size={15} className="text-[#16a34a] flex-shrink-0" />
            <p className="text-xs font-bold text-[#15803d]">
              Bạn đã hoàn thành · {allAnswers.length} câu trả lời
            </p>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

          {/* Loading skeletons */}
          {loading && (
            <>
              <div className="flex items-center gap-2 text-[#4f6ef7] text-sm font-semibold px-1 mb-1">
                <Loader2 size={15} className="animate-spin" />
                Đang tải câu trả lời...
              </div>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse" style={{ border: "1px solid #e8ecf5" }}>
                  <div className="flex gap-3 mb-4">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-100 rounded-full w-24" />
                    </div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm text-center">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && allAnswers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Inbox size={40} strokeWidth={1.2} />
              <p className="text-sm">Không có câu trả lời nào.</p>
            </div>
          )}

          {/* Answer cards */}
          {!loading && !error && allAnswers.map((item, i) => {
            const meta = typeMeta(item.type);
            const isMultiple = item.type === "MULTIPLE_CHOICE";
            const chips = isMultiple
              ? item.answer.split(",").map((a) => a.trim()).filter(Boolean)
              : null;

            return (
              <div key={item.question_id ?? i} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #e8ecf5" }}>
                {/* Question */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#6a8fff,#4f6ef7)" }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{item.question}</p>
                    <span
                      className="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>

                <div style={{ height: 1, background: "#f0f2f7", marginBottom: 12 }} />

                {/* Answer */}
                {isMultiple && chips ? (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((a, ci) => (
                      <span
                        key={ci}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                        style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}
                      >
                        <CheckCircle2 size={11} />
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700"
                    style={{ background: "#f8f9fb", border: "1px solid #eef0f5" }}
                  >
                    <CheckCircle2 size={14} className="text-[#4f6ef7] flex-shrink-0" />
                    <span>{item.answer}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 bg-white flex-shrink-0" style={{ borderTop: "1px solid #e8ecf5" }}>
          <button
            onClick={onClose}
            style={{ border: "none", background: "linear-gradient(135deg,#6a8fff,#4f6ef7)" }}
            className="w-full py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SurveyCard (grid) ─────────────────────────────────────────────
function SurveyCard({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <div
      onClick={() => done && onViewSubmission(id, title)}
      style={{ borderColor: done ? "#bbf7d0" : "#e8ecf5", cursor: done ? "pointer" : "default" }}
      className={`group flex flex-col transition-all duration-200 p-6 rounded-2xl border
        hover:-translate-y-0.5 hover:shadow-lg
        ${done ? "bg-white hover:bg-[#f0fdf4]" : "bg-white hover:bg-[#f0f4ff]"}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          group-hover:scale-110 transition-transform duration-200
          ${done ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#eef2ff] text-[#4f6ef7]"}`}
        >
          {done ? <CheckCircle2 size={22} /> : <FileText size={22} />}
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
          <Clock size={13} />
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
  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <div
      onClick={() => done && onViewSubmission(id, title)}
      style={{ borderColor: done ? "#bbf7d0" : "#e8ecf5", cursor: done ? "pointer" : "default" }}
      className={`group flex items-center gap-5 px-6 py-4 rounded-2xl border transition-all duration-150
        ${done ? "bg-white hover:bg-[#f0fdf4]" : "bg-white hover:bg-[#f0f4ff]"}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
        group-hover:scale-110 transition-transform duration-200
        ${done ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#eef2ff] text-[#4f6ef7]"}`}
      >
        {done ? <CheckCircle2 size={20} /> : <FileText size={20} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{desc}</p>
      </div>

      <div className="flex items-center gap-1.5 text-gray-400 text-xs flex-shrink-0 hidden sm:flex">
        <Clock size={12} />
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

  // Modal state: { id, title } | null
  const [modalSurvey, setModalSurvey] = useState(null);

  // Filter state
  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("newest");
  const [viewMode, setViewMode]     = useState("grid");
  const [showFilter, setShowFilter] = useState(false);

  // Fetch
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [surveysRes, responsesRes] = await Promise.all([
        surveyService.getAllSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      setSurveys(surveysRes.data?.surveys ?? []);
      const responsesList = responsesRes?.data ?? [];
      setDoneSurveyIds(new Set(responsesList.map((r) => r.survey_id ?? r.surveyId)));
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart          = (id) => navigate(`/user/survey/${id}`);
  const handleViewSubmission = (id, title) => setModalSurvey({ id, title });

  // Derived counts
  const totalCount   = surveys.length;
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;

  // Filtered + sorted list
  const displayed = useMemo(() => {
    let list = [...surveys];
    if (activeTab === "pending") list = list.filter((s) => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter((s) =>  doneSurveyIds.has(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "name")   list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-8 py-10 min-h-screen" style={{ backgroundColor: "#f4f5f7" }}>

      {/* ── Modal ───────────────────────────────────────── */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      {/* ── Page Header ─────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Khảo sát</h1>
        <p className="text-gray-400 text-sm">
          {loading ? "Đang tải..." : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
        </p>
      </header>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-2xl p-1.5 w-fit" style={{ border: "1px solid #e8ecf5" }}>
        {TABS.map((tab) => {
          const count = tab.key === "all" ? totalCount : tab.key === "pending" ? pendingCount : doneCount;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={isActive
                ? { background: "linear-gradient(135deg,#6a8fff,#4f6ef7)", border: "none", color: "#fff" }
                : { border: "none", background: "transparent", color: "#9ca3af" }
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${isActive ? "shadow-sm" : "hover:text-gray-700 hover:bg-gray-50"}`}
            >
              {tab.label}
              {!loading && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm khảo sát..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none bg-white focus:ring-2 focus:ring-[#4f6ef7]/20"
            style={{ border: "1px solid #e8ecf5" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ border: "none", background: "none" }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilter((v) => !v)}
          style={{ borderColor: showFilter ? "#4f6ef7" : "#e8ecf5", border: "1px solid" }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
            ${showFilter ? "bg-[#eef2ff] text-[#4f6ef7]" : "bg-white text-gray-500 hover:bg-gray-50"}`}
        >
          <SlidersHorizontal size={15} />
          Lọc
        </button>

        <div className="flex-1" />

        <div className="flex items-center bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #e8ecf5" }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{ border: "none" }}
            className={`px-3 py-2.5 transition-colors cursor-pointer ${viewMode === "grid" ? "bg-[#eef2ff] text-[#4f6ef7]" : "bg-transparent text-gray-400 hover:bg-gray-50"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <div style={{ width: 1, background: "#e8ecf5", height: 20 }} />
          <button
            onClick={() => setViewMode("list")}
            style={{ border: "none" }}
            className={`px-3 py-2.5 transition-colors cursor-pointer ${viewMode === "list" ? "bg-[#eef2ff] text-[#4f6ef7]" : "bg-transparent text-gray-400 hover:bg-gray-50"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Filter panel ─────────────────────────────────── */}
      {showFilter && (
        <div className="bg-white rounded-2xl p-5 mb-6 flex flex-wrap gap-6 items-end" style={{ border: "1px solid #e8ecf5" }}>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sắp xếp theo</p>
            <div className="flex gap-2">
              {[
                { key: "newest", label: "Mới nhất" },
                { key: "oldest", label: "Cũ nhất"  },
                { key: "name",   label: "Tên A–Z"  },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  style={{
                    border: sortBy === key ? "1px solid #4f6ef7" : "1px solid #e8ecf5",
                    background: sortBy === key ? "#eef2ff" : "#fff",
                    color: sortBy === key ? "#4f6ef7" : "#6b7280",
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:border-[#4f6ef7]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }}
            style={{ border: "1px solid #e8ecf5", background: "none" }}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────── */}
      {loading && (
        viewMode === "grid"
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          : <div className="flex flex-col gap-3">
              {Array(6).fill(0).map((_, i) => <RowSkeleton key={i} />)}
            </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <span className="text-5xl">⚠️</span>
          <p className="text-sm">{error}</p>
          <button onClick={fetchData} style={{ border: "none", background: "none" }}
            className="text-[#4f6ef7] text-sm font-semibold hover:underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-4">
          <Inbox size={52} strokeWidth={1.2} />
          <div className="text-center">
            <p className="text-base font-semibold text-gray-500">Không có khảo sát nào</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có dữ liệu."}
            </p>
          </div>
          {search && (
            <button onClick={() => setSearch("")} style={{ border: "none", background: "none" }}
              className="text-[#4f6ef7] text-sm font-semibold hover:underline cursor-pointer">
              Xóa tìm kiếm
            </button>
          )}
        </div>
      )}

      {!loading && !error && displayed.length > 0 && (
        viewMode === "grid"
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map((s) => (
                <SurveyCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  desc={s.description}
                  createdAt={s.createdAt}
                  done={doneSurveyIds.has(s.id)}
                  onStart={handleStart}
                  onViewSubmission={handleViewSubmission}
                />
              ))}
            </div>
          : <div className="flex flex-col gap-3">
              {displayed.map((s) => (
                <SurveyRow
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  desc={s.description}
                  createdAt={s.createdAt}
                  done={doneSurveyIds.has(s.id)}
                  onStart={handleStart}
                  onViewSubmission={handleViewSubmission}
                />
              ))}
            </div>
      )}
    </main>
  );
}