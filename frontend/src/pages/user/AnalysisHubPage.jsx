/**
 * AnalysisHubPage — Trung tâm Phân tích
 * - Chọn survey (dropdown compact)
 * - Chọn chế độ: Thống kê hoặc AI
 * - Điều hướng tới trang phân tích tương ứng
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Sparkles, ArrowLeft, Search, Loader2,
  ChevronDown, FileText, CheckCircle2, Users, Brain,
  TrendingUp, ArrowRight, Globe, Lock, X, ChevronUp,
} from "lucide-react";
import { useSurvey } from "@/providers/SurveyProvider";
import analyticsService from "@/services/analyticsService";

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  bg: "#f5f7fb",
  primary: "#4f46e5",
  primaryDark: "#3730a3",
  primaryLight: "rgba(99,102,241,0.1)",
  surface: "#ffffff",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  warning: "#f59e0b",
  aiPink: "#ec4899",
  font: "'DM Sans','Inter',sans-serif",
};

const thumbColors = [
  "#6366f1", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6",
];

/* ─── Status Badge ──────────────────────────────────────────── */
const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",   color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  DRAFT:     { label: "Nháp",     color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  EXPIRED:   { label: "Hết hạn",  color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  CLOSED:    { label: "Đã đóng",   color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  SCHEDULED: { label: "Lên lịch", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 7px",
      borderRadius: 999, color: s.color, background: s.bg,
      fontFamily: C.font,
    }}>
      {s.label}
    </span>
  );
}

/* ─── Survey Dropdown Selector ─────────────────────────────── */
function SurveySelector({ surveys, selected, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when open
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return surveys;
    const q = search.toLowerCase();
    return surveys.filter(s => s.title?.toLowerCase().includes(q));
  }, [surveys, search]);

  const handleSelect = (survey) => {
    onSelect(survey);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px",
          background: selected ? "rgba(255,255,255,0.95)" : "#fff",
          border: `1.5px solid ${selected ? "rgba(99,102,241,0.35)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: 14,
          cursor: "pointer",
          boxShadow: selected
            ? "0 0 0 3px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.08)"
            : "0 2px 8px rgba(15,23,42,0.06)",
          transition: "all 0.2s ease",
          textAlign: "left",
        }}
        onMouseEnter={e => {
          if (!selected) e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
        }}
        onMouseLeave={e => {
          if (!selected) e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
        }}
      >
        {selected ? (
          <>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${thumbColors[0]}, ${thumbColors[5]})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
            }}>
              <FileText size={16} color="#fff" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: C.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.title}
              </div>
              <div style={{ fontSize: 11, color: C.textDim, fontFamily: C.font, marginTop: 1 }}>
                {selected.is_published ? "🌐 Công khai" : "🔒 Riêng tư"} · <StatusBadge status={selected.status} />
              </div>
            </div>
            <CheckCircle2 size={18} color={C.primary} />
          </>
        ) : (
          <>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: C.primaryLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <FileText size={16} color={C.primary} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, fontFamily: C.font }}>
                Chọn khảo sát...
              </div>
              <div style={{ fontSize: 11, color: C.textDim, fontFamily: C.font, marginTop: 1 }}>
                {surveys.length} khảo sát
              </div>
            </div>
          </>
        )}
        {open ? <ChevronUp size={18} color={C.textSub} /> : <ChevronDown size={18} color={C.textSub} />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          boxShadow: "0 16px 48px rgba(15,23,42,0.16)",
          zIndex: 1000,
          overflow: "hidden",
          animation: "dropdownIn 0.2s ease-out",
        }}>
          {/* Search inside dropdown */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}>
            <Search size={14} color={C.textDim} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm khảo sát..."
              style={{
                flex: 1, border: "none", outline: "none",
                background: "transparent", fontSize: 13, fontFamily: C.font, color: C.text,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, display: "flex", padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px", gap: 8 }}>
                <Loader2 size={16} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: C.textSub, fontFamily: C.font }}>Đang tải...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: C.textDim, fontSize: 12, fontFamily: C.font }}>
                {search ? `Không tìm thấy "${search}"` : "Không có khảo sát nào"}
              </div>
            ) : filtered.map((survey, index) => {
              const isSelected = selected?.id === survey.id;
              const color = thumbColors[index % thumbColors.length];
              return (
                <div
                  key={survey.id}
                  onClick={() => handleSelect(survey)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    cursor: "pointer",
                    background: isSelected ? "rgba(99,102,241,0.06)" : "transparent",
                    borderBottom: index < filtered.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${color}, ${color}99)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <FileText size={14} color="#fff" strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: C.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {survey.title || "Không có tiêu đề"}
                    </div>
                    <div style={{ fontSize: 10, color: C.textDim, fontFamily: C.font, marginTop: 1 }}>
                      {survey.is_published ? "🌐 Công khai" : "🔒 Riêng tư"} · <StatusBadge status={survey.status} />
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={15} color={C.primary} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Analysis Card ────────────────────────────────────────── */
function AnalysisCard({ icon: Icon, iconBg, iconColor, title, desc, badges, active, onClick, delay }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "24px 22px",
        background: active
          ? `linear-gradient(135deg, ${iconColor}0a 0%, #fff 60%)`
          : "#fff",
        border: `2px solid ${active ? iconColor : "rgba(0,0,0,0.07)"}`,
        borderRadius: 20,
        cursor: "pointer",
        boxShadow: active
          ? `0 0 0 4px ${iconColor}15, 0 8px 32px ${iconColor}12`
          : "0 2px 8px rgba(15,23,42,0.06)",
        transition: "all 0.25s ease",
        opacity: 1,
        animation: `fadeSlideUp 0.5s ease-out ${delay}ms both`,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.borderColor = `${iconColor}50`;
          e.currentTarget.style.boxShadow = `0 12px 36px ${iconColor}15`;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.06)";
        }
      }}
    >
      {/* Left accent stripe */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 5, borderRadius: "20px 0 0 20px",
        background: active ? iconColor : "transparent",
        transition: "background 0.25s ease",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: active ? `${iconColor}15` : iconBg,
          border: `1.5px solid ${active ? `${iconColor}30` : "rgba(0,0,0,0.06)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: active ? `0 4px 16px ${iconColor}20` : "0 2px 6px rgba(0,0,0,0.06)",
          transition: "all 0.25s ease",
        }}>
          <Icon size={24} color={iconColor} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, fontFamily: C.font }}>
              {title}
            </h3>
            {active && (
              <span style={{
                padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                background: `${iconColor}15`, color: iconColor, fontFamily: C.font,
              }}>
                Đang chọn
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.6, fontFamily: C.font }}>
            {desc}
          </p>

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {badges.map((b, i) => (
              <span key={i} style={{
                padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                background: b.bg, color: b.color, fontFamily: C.font,
                border: `1px solid ${b.color}20`,
              }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: active ? iconColor : "rgba(0,0,0,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 4,
          transition: "all 0.25s ease",
        }}>
          <ArrowRight size={15} color={active ? "#fff" : C.textDim} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function AnalysisHubPage() {
  const navigate = useNavigate();
  const { mySurveys, fetchMySurveys, loading } = useSurvey();

  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [activeMode, setActiveMode] = useState("statistical");
  const [surveyStats, setSurveyStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchMySurveys(1, 50);
  }, [fetchMySurveys]);

  const fetchStats = useCallback(async (surveyId) => {
    setLoadingStats(true);
    try {
      const [statsRes, compRes] = await Promise.allSettled([
        analyticsService.getSurveyStats(surveyId),
        analyticsService.getCompletionStats(surveyId),
      ]);
      const stats = statsRes.status === "fulfilled" ? statsRes.value?.data?.data : null;
      const comp = compRes.status === "fulfilled" ? compRes.value?.data?.data : null;
      setSurveyStats(prev => ({ ...prev, [surveyId]: { ...stats, ...comp } }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSurvey && !surveyStats[selectedSurvey.id]) {
      fetchStats(selectedSurvey.id);
    }
  }, [selectedSurvey, fetchStats, surveyStats]);

  const handleAnalyze = () => {
    if (!selectedSurvey) return;
    navigate(`/user/analysis/${selectedSurvey.id}/${activeMode === "ai" ? "ai" : "statistical"}`);
  };

  const stats = selectedSurvey ? surveyStats[selectedSurvey.id] : null;

  return (
    <main style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: C.font,
      overflowX: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "0 24px",
        height: 64,
        display: "flex", alignItems: "center",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 8px rgba(15,23,42,0.06)",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(0,0,0,0.04)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", marginRight: 14,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
        >
          <ArrowLeft size={16} color={C.text} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${C.primary}30`,
          }}>
            <Sparkles size={16} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text, fontFamily: C.font }}>
              Trung tâm Phân tích
            </h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* ── Survey Selector ─────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff",
            }}>1</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: C.font }}>Chọn khảo sát</span>
          </div>

          <SurveySelector
            surveys={mySurveys}
            selected={selectedSurvey}
            onSelect={setSelectedSurvey}
            loading={loading}
          />
        </div>

        {/* ── Selected Survey Summary ─────────────────────── */}
        {selectedSurvey && (
          <div style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: 16, padding: "14px 18px",
            marginBottom: 24,
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
            animation: "fadeSlideUp 0.3s ease-out",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.primary}, #7c3aed)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: `0 3px 10px ${C.primary}25`,
            }}>
              <FileText size={18} color="#fff" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: C.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedSurvey.title}
                </span>
                <StatusBadge status={selectedSurvey.status} />
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {stats ? (
                  <>
                    {stats.total_started != null && (
                      <span style={{ fontSize: 11, color: C.textSub, fontFamily: C.font, display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={11} color={C.primary} /> {stats.total_started} phản hồi
                      </span>
                    )}
                    {stats.total_completed != null && (
                      <span style={{ fontSize: 11, color: C.success, fontFamily: C.font, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={11} /> {stats.total_completed} hoàn thành
                      </span>
                    )}
                    {stats.completion_rate != null && (
                      <span style={{ fontSize: 11, color: C.primary, fontFamily: C.font, display: "flex", alignItems: "center", gap: 4 }}>
                        <TrendingUp size={11} /> {stats.completion_rate}%
                      </span>
                    )}
                  </>
                ) : loadingStats ? (
                  <span style={{ fontSize: 11, color: C.textDim, fontFamily: C.font, display: "flex", alignItems: "center", gap: 4 }}>
                    <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Đang tải...
                  </span>
                ) : null}
                {selectedSurvey.is_published ? (
                  <span style={{ fontSize: 11, color: C.textDim, fontFamily: C.font, display: "flex", alignItems: "center", gap: 4 }}>
                    <Globe size={11} color={C.success} /> Công khai
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: C.textDim, fontFamily: C.font, display: "flex", alignItems: "center", gap: 4 }}>
                    <Lock size={11} /> Riêng tư
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedSurvey(null)}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: "rgba(0,0,0,0.04)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: C.textDim, flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = C.textDim; }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Analysis Cards ──────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff",
            }}>2</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: C.font }}>Chọn loại phân tích</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnalysisCard
              icon={BarChart3}
              iconBg="linear-gradient(135deg, #e0e7ff, #ddd6fe)"
              iconColor="#4f46e5"
              title="Phân tích Thống kê"
              desc="Tổng quan, biểu đồ từng câu hỏi, xu hướng, so sánh giới tính, cross-tab, NPS và xuất dữ liệu."
              badges={[
                { label: "Biểu đồ", bg: "rgba(99,102,241,0.1)", color: "#4f46e5" },
                { label: "Tổng quan", bg: "rgba(16,185,129,0.1)", color: "#059669" },
                { label: "Cross Tab", bg: "rgba(168,85,247,0.1)", color: "#7c3aed" },
                { label: "NPS Score", bg: "rgba(245,158,11,0.1)", color: "#d97706" },
              ]}
              active={activeMode === "statistical"}
              onClick={() => setActiveMode("statistical")}
              delay={0}
            />

            <AnalysisCard
              icon={Brain}
              iconBg="linear-gradient(135deg, #fce7f3, #fdf2f8)"
              iconColor="#ec4899"
              title="Phân tích bằng AI"
              desc="AI phân tích dữ liệu, đưa ra insights thông minh, xu hướng nổi bật và đề xuất cải tiến."
              badges={[
                { label: "AI Insights", bg: "rgba(236,72,153,0.1)", color: "#ec4899" },
                { label: "Xu hướng", bg: "rgba(6,182,212,0.1)", color: "#0891b2" },
                { label: "Đề xuất", bg: "rgba(245,158,11,0.1)", color: "#d97706" },
              ]}
              active={activeMode === "ai"}
              onClick={() => setActiveMode("ai")}
              delay={80}
            />
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────── */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedSurvey}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "16px 24px",
            borderRadius: 16, border: "none",
            background: selectedSurvey
              ? activeMode === "ai"
                ? "linear-gradient(135deg, #ec4899, #f43f5e)"
                : "linear-gradient(135deg, #4f46e5, #6366f1)"
              : "#e2e8f0",
            color: selectedSurvey ? "#fff" : C.textDim,
            fontSize: 15, fontWeight: 700, cursor: selectedSurvey ? "pointer" : "not-allowed",
            fontFamily: C.font,
            boxShadow: selectedSurvey
              ? activeMode === "ai"
                ? "0 8px 24px rgba(236,72,153,0.4)"
                : "0 8px 24px rgba(99,102,241,0.4)"
              : "none",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => {
            if (selectedSurvey) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = activeMode === "ai"
                ? "0 12px 32px rgba(236,72,153,0.5)"
                : "0 12px 32px rgba(99,102,241,0.5)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = selectedSurvey
              ? activeMode === "ai"
                ? "0 8px 24px rgba(236,72,153,0.4)"
                : "0 8px 24px rgba(99,102,241,0.4)"
              : "none";
          }}
        >
          {activeMode === "ai" ? <><Brain size={18} /> Phân tích bằng AI</> : <><BarChart3 size={18} /> Phân tích Thống kê</>}
          <ArrowRight size={17} />
        </button>

        {!selectedSurvey && (
          <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: C.textDim, fontFamily: C.font }}>
            Vui lòng chọn khảo sát bên trên để bắt đầu
          </p>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
      `}</style>
    </main>
  );
}
