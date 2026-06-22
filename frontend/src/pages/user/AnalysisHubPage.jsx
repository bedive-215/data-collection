import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Sparkles, Search, Loader2,
  ChevronDown, FileText, CheckCircle2, Users, Brain,
  TrendingUp, ArrowRight, Globe, Lock, X, ChevronUp
} from "lucide-react";
import { useSurvey } from "@/providers/SurveyProvider";
import analyticsService from "@/services/analyticsService";

const C = {
  bg: "#f0f2f6",
  surface: "#ffffff",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  primary: "#4f46e5",
  primaryDark: "#3730a3",
  primaryLight: "rgba(99,102,241,0.12)",
  success: "#10b981",
  warning: "#f59e0b",
  aiPink: "#ec4899",
  aiPinkLight: "rgba(236,72,153,0.12)",
  font: "'DM Sans','Inter',sans-serif"};

const thumbColors = [
  "#6366f1", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6",
];

const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",   color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  DRAFT:     { label: "Nháp",     color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  EXPIRED:   { label: "Hết hạn",  color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  CLOSED:    { label: "Đã đóng",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  SCHEDULED: { label: "Lên lịch", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 999, color: s.color, background: s.bg,
      fontFamily: C.font, letterSpacing: "0.01em"}}>
      {s.label}
    </span>
  );
}

function SurveySelector({ surveys, selected, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px",
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: C.font,
          lineHeight: 1.4}}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: selected
            ? `linear-gradient(135deg, ${thumbColors[0]}, ${thumbColors[5]})`
            : "rgba(99,102,241,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0}}>
          <FileText size={17} color={selected ? "#fff" : C.primary} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.title}
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <StatusBadge status={selected.status} />
                <span style={{ color: "#cbd5e1" }}>·</span>
                <span>{selected.is_published ? "Công khai" : "Riêng tư"}</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
                Chọn khảo sát cần phân tích
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                {surveys.length} khảo sát khả dụng
              </div>
            </>
          )}
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(0,0,0,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0}}>
          {open ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
        </div>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "#fff",
          zIndex: 9999,
          overflow: "hidden",
          animation: "hubDropdownIn 0.2s ease-out"}}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px"}}>
            <Search size={15} color="#94a3b8" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm khảo sát..."
              style={{
                flex: 1, border: "none", outline: "none",
                background: "transparent", fontSize: 13.5, fontFamily: C.font, color: "#0f172a",
                padding: "4px 0"}}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "28px", gap: 8 }}>
                <Loader2 size={16} color={C.primary} style={{ animation: "hubSpin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#64748b", fontFamily: C.font }}>Đang tải...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px", color: "#94a3b8", fontSize: 12, fontFamily: C.font }}>
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
                    padding: "11px 16px",
                    cursor: "pointer",
                    background: isSelected ? `${color}10` : "transparent"}}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(0,0,0,0.025)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: `linear-gradient(135deg, ${color}, ${color}99)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0}}>
                    <FileText size={14} color="#fff" strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {survey.title || "Không có tiêu đề"}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                      <StatusBadge status={survey.status} />
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} color={color} fill={`${color}20`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ icon: Icon, iconColor, title, desc, badges, active, onClick, delay }) {
  const isActive = active;
  return (
        <div
          onClick={onClick}
          style={{
            padding: "28px 24px",
            background: isActive
              ? `linear-gradient(135deg, ${iconColor}12, rgba(255,255,255,0.5))`
              : "rgba(255,255,255,0.65)",
            cursor: "pointer",
            opacity: 1,
            animation: `hubFadeUp 0.5s ease-out ${delay}ms both`,
            position: "relative",
            overflow: "hidden"}}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-6px)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)"
          }}
    >
      <div style={{
        position: "absolute", right: -40, top: -40,
        width: 120, height: 120, borderRadius: "50%",
        background: `${iconColor}06`,
        pointerEvents: "none"}} />
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${iconColor}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0}}>
          <Icon size={26} color={iconColor} strokeWidth={1.6} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, fontFamily: C.font }}>
              {title}
            </h3>
            {isActive && (
              <span style={{
                padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                background: `${iconColor}15`, color: iconColor, fontFamily: C.font,
                letterSpacing: "0.02em"}}>
                Đã chọn
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.65, fontFamily: C.font }}>
            {desc}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {badges.map((b, i) => (
              <span key={i} style={{
                padding: "4px 10px", fontSize: 10, fontWeight: 600,
                background: b.bg, color: b.color, fontFamily: C.font}}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

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
      background: "linear-gradient(135deg, #f0f2f6 0%, #f8f9ff 50%, #f0f2f6 100%)",
      fontFamily: C.font,
      overflowX: "hidden",
      position: "relative"}}>
      <div style={{
        position: "fixed", top: "-20%", right: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0}} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0}} />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 32}}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0}}>
            <Sparkles size={20} color="#fff" strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: "-0.02em" }}>
              Trung tâm Phân tích
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: C.textSub, marginTop: 2 }}>
              Chọn khảo sát và chế độ phân tích để bắt đầu
            </p>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.7)",
          padding: "28px",
          marginBottom: 20}}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0}}>1</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Chọn khảo sát</span>
          </div>

          <SurveySelector
            surveys={mySurveys}
            selected={selectedSurvey}
            onSelect={setSelectedSurvey}
            loading={loading}
          />
        </div>

        {selectedSurvey && (
          <div style={{
            background: "rgba(255,255,255,0.7)",
            padding: "16px 20px",
            marginBottom: 20,
            display: "flex", alignItems: "center", gap: 14,
            animation: "hubFadeUp 0.3s ease-out"}}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0}}>
              <FileText size={19} color="#fff" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedSurvey.title}
                </span>
                <StatusBadge status={selectedSurvey.status} />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {stats ? (
                  <>
                    {stats.total_started != null && (
                      <span style={{ fontSize: 11, color: C.textSub, display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={11} color={C.primary} /> {stats.total_started} phản hồi
                      </span>
                    )}
                    {stats.total_completed != null && (
                      <span style={{ fontSize: 11, color: C.success, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={11} /> {stats.total_completed} hoàn thành
                      </span>
                    )}
                    {stats.completion_rate != null && (
                      <span style={{ fontSize: 11, color: C.primary, display: "flex", alignItems: "center", gap: 4 }}>
                        <TrendingUp size={11} /> {stats.completion_rate}%
                      </span>
                    )}
                  </>
                  ) : loadingStats ? (
                  <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4 }}>
                    <Loader2 size={11} style={{ animation: "hubSpin 1s linear infinite" }} /> Đang tải thống kê...
                  </span>
                ) : null}
                <span style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4 }}>
                  {selectedSurvey.is_published ? <><Globe size={11} color={C.success} /> Công khai</> : <><Lock size={11} /> Riêng tư</>}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedSurvey(null)}
              style={{
                width: 30, height: 30, borderRadius: 9,
                background: "rgba(0,0,0,0.04)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: C.textDim, flexShrink: 0}}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.color = C.textDim; }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{
          background: "rgba(255,255,255,0.7)",
          padding: "28px",
          marginBottom: 20}}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0}}>2</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Chọn loại phân tích</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <AnalysisCard
              icon={BarChart3}
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

        <button
          onClick={handleAnalyze}
          disabled={!selectedSurvey}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "18px 24px",
            borderRadius: 16, border: "none",
            background: selectedSurvey
              ? activeMode === "ai"
                ? "linear-gradient(135deg, #ec4899, #f43f5e)"
                : "linear-gradient(135deg, #4f46e5, #6366f1)"
              : "rgba(0,0,0,0.06)",
            color: selectedSurvey ? "#fff" : C.textDim,
            fontSize: 15, fontWeight: 700, cursor: selectedSurvey ? "pointer" : "not-allowed",
            fontFamily: C.font
              ? activeMode === "ai"
                ? "0 8px 28px rgba(236,72,153,0.35)"
                : "0 8px 28px rgba(99,102,241,0.35)"
              : "none",
            position: "relative",
            overflow: "hidden"}}
          onMouseEnter={e => {
            if (selectedSurvey) {
              e.currentTarget.style.transform = "translateY(-3px)"
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)"
          }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            transform: "translateX(-100%)",
            animation: "hubShimmer 3s infinite",
            pointerEvents: "none"}} />
          {activeMode === "ai" ? <><Brain size={18} /> Phân tích bằng AI</> : <><BarChart3 size={18} /> Xem phân tích Thống kê</>}
          <ArrowRight size={17} />
        </button>

        {!selectedSurvey && (
          <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: C.textDim }}>
            Vui lòng chọn khảo sát để bắt đầu
          </p>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes hubSpin { to { transform: rotate(360deg); } }
        @keyframes hubFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes hubDropdownIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes hubShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
        input::placeholder { font-family: 'DM Sans', sans-serif; color: #94a3b8; font-size: 13.5px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
      `}</style>
    </main>
  );
}
