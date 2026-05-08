// ─── SurveysPage.jsx ────────────────────────────────────────────────
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  FileText,
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

// ─────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chưa làm" },
  { key: "done", label: "Đã hoàn thành" },
];

// ─────────────────────────────────────────────────────────────
// Type meta
// ─────────────────────────────────────────────────────────────
const TYPE_META = {
  SINGLE_CHOICE: {
    label: "Một lựa chọn",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    accent: "#2563eb",
  },
  MULTIPLE_CHOICE: {
    label: "Nhiều lựa chọn",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    accent: "#7c3aed",
  },
  TEXT: {
    label: "Văn bản",
    color: "#0e7490",
    bg: "#ecfeff",
    border: "#a5f3fc",
    accent: "#0891b2",
  },
};

function typeMeta(type) {
  return (
    TYPE_META[type] ?? {
      label: type,
      color: "#6b7280",
      bg: "#f3f4f6",
      border: "#e5e7eb",
      accent: "#9ca3af",
    }
  );
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
function SingleChoiceIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="#9ca3af" stroke="none" />
    </svg>
  );
}

function MultipleChoiceIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function TypeIcon({ type }) {
  if (type === "MULTIPLE_CHOICE") return <MultipleChoiceIcon />;

  if (type === "TEXT") {
    return (
      <FileText
        size={17}
        strokeWidth={1.5}
        color="#9ca3af"
      />
    );
  }

  return <SingleChoiceIcon />;
}

// ─────────────────────────────────────────────────────────────
// OptionRow
// ─────────────────────────────────────────────────────────────
function OptionRow({
  label,
  isSelected,
  isMultiple,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${
          isSelected ? "#bfdbfe" : "#e5e7eb"
        }`,
        background: isSelected
          ? "rgba(239,246,255,0.7)"
          : "#fafafa",
      }}
    >
      {isMultiple ? (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            border: `2px solid ${
              isSelected ? "#2563eb" : "#d1d5db"
            }`,
            background: isSelected
              ? "#2563eb"
              : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isSelected && (
            <svg
              width="10"
              height="8"
              viewBox="0 0 11 8"
              fill="none"
            >
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
            border: `2px solid ${
              isSelected ? "#2563eb" : "#d1d5db"
            }`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isSelected && (
            <div
              style={{
                width: 9,
                height: 9,
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
}

// ─────────────────────────────────────────────────────────────
// SubmissionModal
// ─────────────────────────────────────────────────────────────
function SubmissionModal({
  surveyId,
  surveyTitle,
  onClose,
}) {
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

        const raw = res?.data ?? res ?? [];

        const normalized = raw.flatMap(
          (r) => r.answers ?? []
        );

        setAnswers(normalized);
      } catch (err) {
        console.error(err);
        setError(
          "Không thể tải câu trả lời."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [surveyId]);

  return (
    <div
      onClick={(e) =>
        e.target === e.currentTarget &&
        onClose()
      }
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
            padding: "16px 20px",
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

          <div className="text-sm font-bold text-gray-700">
            InsightFlow
          </div>

          <div style={{ width: 60 }} />
        </div>

        {/* Body */}
        <div
          style={{
            padding: 24,
            overflowY: "auto",
            flex: 1,
          }}
        >
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{
                background: "#dcfce7",
                border: "1px solid #86efac",
              }}
            >
              <CheckCircle2
                size={14}
                color="#16a34a"
              />

              <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803d]">
                Đã hoàn thành
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
              {surveyTitle}
            </h2>

            {!loading && (
              <p className="text-sm text-gray-400">
                {answers.length} câu trả lời
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 text-[#4f6ef7] gap-3">
              <Loader2
                size={20}
                className="animate-spin"
              />
              <span className="font-semibold text-sm">
                Đang tải...
              </span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
              <span className="text-4xl">
                ⚠️
              </span>
              <p>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            answers.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
                <Inbox size={42} />
                <p>Không có câu trả lời.</p>
              </div>
            )}

          {/* Answers */}
          {!loading &&
            !error &&
            answers.length > 0 && (
              <div className="flex flex-col gap-4">
                {answers.map((item, idx) => {
                  const meta = typeMeta(
                    item.type
                  );

                  const isText =
                    item.type === "TEXT";

                  const isMultiple =
                    item.type ===
                    "MULTIPLE_CHOICE";

                  const selectedSet =
                    isMultiple
                      ? new Set(
                          Array.isArray(
                            item.answer
                          )
                            ? item.answer
                            : String(
                                item.answer ?? ""
                              )
                                .split(",")
                                .map((s) =>
                                  s.trim()
                                )
                        )
                      : new Set([
                          String(
                            item.answer ?? ""
                          ),
                        ]);

                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#fff",
                        borderRadius: 18,
                        border:
                          "1px solid #e5e7eb",
                        borderTop: `3px solid ${meta.accent}`,
                        overflow: "hidden",
                      }}
                    >
                      <div className="p-5">
                        {/* top */}
                        <div className="flex items-center justify-between mb-4">
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 12,
                              border:
                                "1px solid #d1d5db",
                              background:
                                "#f9fafb",
                            }}
                            className="flex items-center justify-center"
                          >
                            <TypeIcon
                              type={item.type}
                            />
                          </div>

                          <span
                            style={{
                              background:
                                meta.bg,
                              border: `1px solid ${meta.border}`,
                              color:
                                meta.color,
                            }}
                            className="px-3 py-1 rounded-full text-[11px] font-bold"
                          >
                            {meta.label}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-gray-800 mb-4 leading-relaxed">
                          {idx + 1}.{" "}
                          {item.question}
                        </h3>

                        {/* text */}
                        {isText && (
                          <div
                            style={{
                              background:
                                "#f8faff",
                              border:
                                "1px solid #e5e7eb",
                            }}
                            className="rounded-xl p-4 text-sm text-gray-700 leading-relaxed"
                          >
                            {item.answer ||
                              "Không có dữ liệu"}
                          </div>
                        )}

                        {/* choices */}
                        {!isText && (
                          <div className="flex flex-col gap-2">
                            {(item.options ??
                              []).map(
                              (
                                opt,
                                optIdx
                              ) => {
                                const label =
                                  opt?.label ??
                                  opt?.value ??
                                  opt?.content ??
                                  "";

                                const isSelected =
                                  selectedSet.has(
                                    label
                                  ) ||
                                  selectedSet.has(
                                    String(
                                      opt.id
                                    )
                                  );

                                return (
                                  <OptionRow
                                    key={
                                      optIdx
                                    }
                                    label={
                                      label
                                    }
                                    isSelected={
                                      isSelected
                                    }
                                    isMultiple={
                                      isMultiple
                                    }
                                  />
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Survey Card
// ─────────────────────────────────────────────────────────────
function SurveyCard({
  survey,
  done,
  onStart,
  onViewSubmission,
}) {
  const createdDate = survey?.created_at
    ? new Date(
        survey.created_at
      ).toLocaleDateString("vi-VN")
    : "";

  return (
    <div
      onClick={() =>
        done &&
        onViewSubmission(
          survey.id,
          survey.title
        )
      }
      className={`group rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        done
          ? "bg-white hover:bg-[#f0fdf4]"
          : "bg-white hover:bg-[#f0f4ff]"
      }`}
      style={{
        borderColor: done
          ? "#bbf7d0"
          : "#e8ecf5",
        cursor: done
          ? "pointer"
          : "default",
      }}
    >
      {/* top */}
      <div className="flex justify-between items-start mb-5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
            done
              ? "bg-[#dcfce7] text-[#16a34a]"
              : "bg-[#eef2ff] text-[#4f6ef7]"
          }`}
        >
          {done ? (
            <CheckCircle2
              size={22}
              strokeWidth={1.6}
            />
          ) : (
            <FileText
              size={22}
              strokeWidth={1.6}
            />
          )}
        </div>

        {done ? (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
            Đã hoàn thành
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f4f5f7] text-gray-400 border border-[#e8ecf5]">
            Survey
          </span>
        )}
      </div>

      {/* body */}
      <h3 className="text-[15px] font-bold text-gray-800 mb-2 line-clamp-2">
        {survey.title}
      </h3>

      <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed">
        {survey.description}
      </p>

      {/* footer */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={13} />
          <span>{createdDate}</span>
        </div>

        {done ? (
          <span className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
            Xem kết quả →
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart(survey.id);
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6a8fff] to-[#4f6ef7] hover:opacity-90 active:scale-95"
          >
            Bắt đầu →
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-[#e8ecf5] rounded-2xl p-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100" />
        <div className="w-20 h-5 rounded-full bg-gray-100" />
      </div>

      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-5" />

      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-8 bg-gray-100 rounded-xl w-24" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function SurveysPage() {
  const navigate = useNavigate();

  const {
    surveys,
    loading,
    error,
    fetchPublicSurveys,
  } = useSurvey();

  const { getAllMyResponses } =
    useResponse();

  const [doneSurveyIds, setDoneSurveyIds] =
    useState(new Set());

  const [modalSurvey, setModalSurvey] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("all");

  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] =
    useState("newest");

  const [viewMode, setViewMode] =
    useState("grid");

  const [showFilter, setShowFilter] =
    useState(false);

  // ─────────────────────────────────────────
  // Fetch data
  // ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      await fetchPublicSurveys();

      const responseRes =
        await getAllMyResponses().catch(
          () => null
        );

      const responseList =
        responseRes?.data ?? [];

      const ids = new Set(
        responseList.map(
          (r) =>
            r.survey_id ??
            r.surveyId
        )
      );

      setDoneSurveyIds(ids);
    } catch (err) {
      console.error(err);
    }
  }, [
    fetchPublicSurveys,
    getAllMyResponses,
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  // ─────────────────────────────────────────
  // Counts
  // ─────────────────────────────────────────
  const totalCount = surveys.length;

  const doneCount = surveys.filter((s) =>
    doneSurveyIds.has(s.id)
  ).length;

  const pendingCount = surveys.filter(
    (s) => !doneSurveyIds.has(s.id)
  ).length;

  // ─────────────────────────────────────────
  // Displayed list
  // ─────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...surveys];

    if (activeTab === "pending") {
      list = list.filter(
        (s) =>
          !doneSurveyIds.has(s.id)
      );
    }

    if (activeTab === "done") {
      list = list.filter((s) =>
        doneSurveyIds.has(s.id)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      list = list.filter(
        (s) =>
          s.title
            ?.toLowerCase()
            .includes(q) ||
          s.description
            ?.toLowerCase()
            .includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort(
        (a, b) =>
          new Date(
            b.created_at
          ) -
          new Date(a.created_at)
      );
    }

    if (sortBy === "oldest") {
      list.sort(
        (a, b) =>
          new Date(
            a.created_at
          ) -
          new Date(b.created_at)
      );
    }

    if (sortBy === "name") {
      list.sort((a, b) =>
        (a.title ?? "").localeCompare(
          b.title ?? ""
        )
      );
    }

    return list;
  }, [
    surveys,
    doneSurveyIds,
    activeTab,
    search,
    sortBy,
  ]);

  // ─────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────
  const handleStart = (surveyId) => {
    navigate(`/user/survey/${surveyId}`);
  };

  const handleViewSubmission = (
    surveyId,
    title
  ) => {
    setModalSurvey({
      id: surveyId,
      title,
    });
  };

  return (
    <main
      className="min-h-screen max-w-7xl mx-auto px-6 md:px-8 py-10"
      style={{
        backgroundColor: "#f4f5f7",
        fontFamily:
          "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Modal */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() =>
            setModalSurvey(null)
          }
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
        style={{
          border: "1px solid #e8ecf5",
        }}
      >
        {TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? totalCount
              : tab.key === "pending"
              ? pendingCount
              : doneCount;

          const isActive =
            activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(tab.key)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              }`}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(135deg,#6a8fff,#4f6ef7)",
                    }
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
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Tìm kiếm khảo sát..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none bg-white focus:ring-2 focus:ring-[#4f6ef7]/20"
            style={{
              border: "1px solid #e8ecf5",
            }}
          />

          {search && (
            <button
              onClick={() =>
                setSearch("")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter */}
        <button
          onClick={() =>
            setShowFilter((v) => !v)
          }
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
            showFilter
              ? "bg-[#eef2ff] text-[#4f6ef7]"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
          style={{
            border: `1px solid ${
              showFilter
                ? "#4f6ef7"
                : "#e8ecf5"
            }`,
          }}
        >
          <SlidersHorizontal size={15} />
          Lọc
        </button>

        <div className="flex-1" />

        {/* View */}
        <div
          className="flex items-center bg-white rounded-xl overflow-hidden"
          style={{
            border: "1px solid #e8ecf5",
          }}
        >
          <button
            onClick={() =>
              setViewMode("grid")
            }
            className={`px-3 py-2.5 ${
              viewMode === "grid"
                ? "bg-[#eef2ff] text-[#4f6ef7]"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid size={16} />
          </button>

          <div
            style={{
              width: 1,
              background: "#e8ecf5",
              height: 20,
            }}
          />

          <button
            onClick={() =>
              setViewMode("list")
            }
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
          style={{
            border: "1px solid #e8ecf5",
          }}
        >
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Sắp xếp theo
            </p>

            <div className="flex gap-2">
              {[
                {
                  key: "newest",
                  label: "Mới nhất",
                },
                {
                  key: "oldest",
                  label: "Cũ nhất",
                },
                {
                  key: "name",
                  label: "Tên A-Z",
                },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() =>
                    setSortBy(item.key)
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    border:
                      sortBy === item.key
                        ? "1px solid #4f6ef7"
                        : "1px solid #e8ecf5",

                    background:
                      sortBy === item.key
                        ? "#eef2ff"
                        : "#fff",

                    color:
                      sortBy === item.key
                        ? "#4f6ef7"
                        : "#6b7280",
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
            style={{
              border: "1px solid #e8ecf5",
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <span className="text-5xl">
            ⚠️
          </span>

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
      {!loading &&
        !error &&
        displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300 gap-4">
            <Inbox
              size={52}
              strokeWidth={1.2}
            />

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
      {!loading &&
        !error &&
        displayed.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-3"
            }
          >
            {displayed.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                done={doneSurveyIds.has(
                  survey.id
                )}
                onStart={handleStart}
                onViewSubmission={
                  handleViewSubmission
                }
              />
            ))}
          </div>
        )}
    </main>
  );
}