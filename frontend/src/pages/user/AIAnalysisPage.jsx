/**
 * AIAnalysisPage — Phân tích bằng AI
 * Trang riêng cho AI Insights
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, Brain, Sparkles, BarChart3,
  Clock, Users, CheckCircle, TrendingUp, Zap,
  TrendingDown, Award, Activity, Calendar,
  ChevronRight, Loader2, AlertTriangle,
} from "lucide-react";
import analyticsService from "@/services/analyticsService";
import { useSurvey } from "@/providers/SurveyProvider";
import { toast } from "react-toastify";
import { ROUTERS } from "@/utils/constants";

/* ─── Design tokens ─────────────────────────────────────────── */
const glassCard = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(24px) saturate(190%)",
  WebkitBackdropFilter: "blur(24px) saturate(190%)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: 18,
  boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(15,23,42,0.04)",
};
const chartCard = { ...glassCard, padding: "22px 24px" };

/* ─── Loading skeleton ─────────────────────────────────────── */
function Shimmer({ height = 80 }) {
  return (
    <div style={{
      height, borderRadius: 12,
      background: "linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
    }} />
  );
}

/* ─── Insight Card ──────────────────────────────────────── */
function InsightCard({ icon: Icon, iconBg, iconColor, title, children, delay = 0 }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: 18,
      padding: "22px 24px",
      backdropFilter: "blur(20px)",
      boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 4px 20px rgba(15,23,42,0.04)",
      animation: `fadeSlideIn 0.5s ease-out ${delay}ms both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 14px ${iconColor}25`,
          flexShrink: 0,
        }}>
          <Icon size={20} color={iconColor} strokeWidth={1.8} />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── AI Insights Renderer ───────────────────────────────── */
function AIInsightsRenderer({ text }) {
  if (!text) return null;
  return (
    <div style={{
      background: "#fafafa",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      padding: "20px 22px",
      fontSize: 13,
      color: "#1e293b",
      lineHeight: 1.8,
      whiteSpace: "pre-wrap",
      fontFamily: "'DM Sans', sans-serif",
      maxHeight: 500,
      overflowY: "auto",
    }}>
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("### ")) return <h4 key={i} style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "20px 0 8px", borderBottom: "1px solid rgba(99,102,241,0.2)", paddingBottom: 6 }}>{trimmed.slice(4)}</h4>;
        if (trimmed.startsWith("## ")) return <h3 key={i} style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "24px 0 10px" }}>{trimmed.slice(3)}</h3>;
        if (trimmed.startsWith("* **")) {
          const match = trimmed.match(/^\* \*\*(.+?)\*\*[:—]?\s*(.*)$/);
          if (match) return (
            <div key={i} style={{ margin: "10px 0 8px", paddingLeft: 8 }}>
              <strong style={{ color: "#6366f1" }}>{match[1]}</strong>
              {match[2] && <span style={{ color: "#334155" }}>{match[2]}</span>}
            </div>
          );
        }
        if (trimmed.startsWith("*   ")) return <li key={i} style={{ marginLeft: 16, marginBottom: 4, color: "#334155" }}>{trimmed.slice(4).replace(/\*\*(.+?)\*\*/g, "$1")}</li>;
        if (trimmed.startsWith("- **")) {
          const m = trimmed.match(/^- \*\*(.+?)\*\*[:—]?\s*(.*)$/);
          if (m) return (
            <div key={i} style={{ margin: "8px 0 6px", paddingLeft: 8, borderLeft: "3px solid #e0e7ff" }}>
              <strong style={{ color: "#1e293b" }}>{m[1]}</strong>
              {m[2] && <span style={{ color: "#475569" }}> — {m[2]}</span>}
            </div>
          );
        }
        if (trimmed === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "16px 0" }} />;
        if (!trimmed) return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: "4px 0", color: "#334155" }}>{trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")}</p>;
      })}
    </div>
  );
}

/* ─── Quick Stats Row ─────────────────────────────────── */
function QuickStatChip({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px",
      background: "rgba(0,0,0,0.03)",
      border: "1px solid rgba(0,0,0,0.06)",
      borderRadius: 14,
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={17} color={iconColor} strokeWidth={1.8} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#1e293b", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.1 }}>{value ?? "—"}</div>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────── */
export default function AIAnalysisPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { fetchSurveyById } = useSurvey();

  const [survey, setSurvey] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoad, setAiLoad] = useState(false);
  const [aiErr, setAiErr] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoad, setStatsLoad] = useState(true);

  // Fetch survey info
  useEffect(() => {
    if (!surveyId) return;
    fetchSurveyById(surveyId).then(s => { if (s) setSurvey(s); });
  }, [surveyId]);

  // Fetch quick stats
  useEffect(() => {
    if (!surveyId) return;
    setStatsLoad(true);
    Promise.allSettled([
      analyticsService.getSurveyStats(surveyId),
      analyticsService.getCompletionStats(surveyId),
      analyticsService.getResponseTrend(surveyId, "day"),
    ]).then(([statsR, compR, trendR]) => {
      setStats({
        stats: statsR.status === "fulfilled" ? statsR.value?.data?.data : null,
        comp: compR.status === "fulfilled" ? compR.value?.data?.data : null,
        trend: trendR.status === "fulfilled" ? trendR.value?.data?.data : null,
      });
    }).finally(() => setStatsLoad(false));
  }, [surveyId]);

  const fetchAiInsights = useCallback(async () => {
    if (!surveyId) return;
    setAiLoad(true); setAiErr(null); setAiInsights(null);
    try {
      const r = await analyticsService.getAiInsights(surveyId);
      setAiInsights(r.data?.data?.ai_insights || null);
    } catch (e) {
      setAiErr(e?.response?.data?.message || e?.message || "Không tải được AI insights");
      toast.error("Lỗi khi lấy AI insights");
    } finally {
      setAiLoad(false);
    }
  }, [surveyId]);

  useEffect(() => {
    if (surveyId) fetchAiInsights();
  }, [surveyId]);

  const completionRate = stats?.comp?.total_started
    ? Math.round((stats.comp.total_completed / stats.comp.total_started) * 100)
    : null;

  const recentTrend = stats?.trend?.trend?.slice(-7) || [];
  const trendDirection = recentTrend.length >= 2
    ? (recentTrend[recentTrend.length - 1]?.count || 0) >= (recentTrend[0]?.count || 0) ? "up" : "down"
    : null;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "transparent", position: "relative", overflowX: "hidden" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 18px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => navigate(ROUTERS.USER.ANALYSIS_HUB)}
              style={{
                width: 42, height: 42, borderRadius: 14,
                background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
            >
              <ArrowLeft size={18} color="#1e293b" />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#ec4899,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(236,72,153,0.35)" }}>
                  <Brain size={18} color="#fff" strokeWidth={1.9} />
                </div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>Phân tích bằng AI</h1>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                {survey?.title || surveyId}
              </p>
            </div>
          </div>
          <button
            onClick={fetchAiInsights}
            disabled={aiLoad}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 14,
              border: "1px solid rgba(236,72,153,0.3)",
              background: aiLoad ? "rgba(0,0,0,0.04)" : "linear-gradient(135deg, #ec4899, #f43f5e)",
              color: aiLoad ? "#64748b" : "#fff",
              fontSize: 13, fontWeight: 700, cursor: aiLoad ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: aiLoad ? "none" : "0 4px 14px rgba(236,72,153,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              if (!aiLoad) {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(236,72,153,0.45)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = aiLoad ? "none" : "0 4px 14px rgba(236,72,153,0.35)";
            }}
          >
            {aiLoad ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang phân tích...</> : <><Sparkles size={15} /> Phân tích lại bằng AI</>}
          </button>
        </div>

        {/* Quick Stats */}
        {!statsLoad && stats && (
          <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
            <QuickStatChip
              icon={Users}
              iconBg="rgba(99,102,241,0.1)"
              iconColor="#6366f1"
              label="Tổng phản hồi"
              value={stats.stats?.overview?.total_completed ?? "—"}
              sub={`${stats.stats?.overview?.total_started || 0} bắt đầu`}
            />
            <QuickStatChip
              icon={CheckCircle}
              iconBg="rgba(16,185,129,0.1)"
              iconColor="#10b981"
              label="Hoàn thành"
              value={stats.stats?.overview?.total_completed ?? "—"}
              sub={completionRate != null ? `${completionRate}% hoàn thành` : null}
            />
            <QuickStatChip
              icon={Clock}
              iconBg="rgba(245,158,11,0.1)"
              iconColor="#f59e0b"
              label="Thời gian TB"
              value={stats.comp?.avg_completion_time_display ?? "—"}
            />
            <QuickStatChip
              icon={trendDirection === "up" ? TrendingUp : TrendingDown}
              iconBg={trendDirection === "up" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)"}
              iconColor={trendDirection === "up" ? "#10b981" : "#ef4444"}
              label="Xu hướng"
              value={trendDirection === "up" ? "Tăng ↑" : trendDirection === "down" ? "Giảm ↓" : "Ổn định"}
              sub={recentTrend.length >= 2 ? `7 ngày gần nhất` : null}
            />
          </div>
        )}

        {statsLoad && (
          <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, minWidth: 140, height: 80, borderRadius: 14, background: "rgba(0,0,0,0.04)" }} />)}
          </div>
        )}

        {/* AI Insights Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <InsightCard
            icon={Brain}
            iconBg="linear-gradient(135deg, #fce7f3, #fdf2f8)"
            iconColor="#ec4899"
            title="AI Insights"
            delay={0}
          >
            {aiLoad ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 20 }}>
                    <Shimmer height={14} />
                    <div style={{ marginTop: 10 }}><Shimmer height={12} /></div>
                    <div style={{ marginTop: 6 }}><Shimmer height={12} /></div>
                  </div>
                ))}
              </div>
            ) : aiErr ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: 12 }} />
                <p style={{ color: "#ef4444", marginBottom: 16, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{aiErr}</p>
                <button
                  onClick={fetchAiInsights}
                  style={{
                    padding: "10px 24px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)",
                    borderRadius: 12, color: "#ec4899", cursor: "pointer", fontSize: 13, fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Thử lại
                </button>
              </div>
            ) : aiInsights ? (
              <AIInsightsRenderer text={aiInsights} />
            ) : (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(236,72,153,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Brain size={28} color="#ec4899" strokeWidth={1.5} />
                </div>
                <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>Nhấn nút để bắt đầu</h4>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", maxWidth: 320, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                  AI sẽ phân tích dữ liệu khảo sát và đưa ra các insights, xu hướng và đề xuất cải tiến.
                </p>
              </div>
            )}
          </InsightCard>

          {/* Trend Chart (if data available) */}
          {!statsLoad && stats?.trend?.trend?.length > 0 && (
            <InsightCard
              icon={Activity}
              iconBg="linear-gradient(135deg, #e0e7ff, #ede9fe)"
              iconColor="#6366f1"
              title="Xu hướng phản hồi (7 ngày gần nhất)"
              delay={100}
            >
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, marginTop: 8 }}>
                {recentTrend.map((d, i) => {
                  const maxVal = Math.max(...recentTrend.map(x => x.count), 1);
                  const pct = (d.count / maxVal) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                      <div style={{
                        width: "100%",
                        height: `${pct}%`,
                        borderRadius: "6px 6px 0 0",
                        background: trendDirection === "up"
                          ? "linear-gradient(to top, #6366f1, #a855f7)"
                          : "linear-gradient(to top, #ef4444, #f87171)",
                        boxShadow: `0 4px 14px ${trendDirection === "up" ? "rgba(99,102,241,0.3)" : "rgba(239,68,68,0.3)"}`,
                        minHeight: 4,
                        transition: "height 0.5s ease",
                        animation: `growUp 0.6s ease-out ${i * 0.08}s both`,
                      }} />
                      <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{d.period?.slice(-5) || ""}</span>
                    </div>
                  );
                })}
              </div>
              <style>{`
                @keyframes growUp { from { opacity: 0; transform: scaleY(0); transform-origin: bottom; } to { opacity: 1; transform: scaleY(1); transform-origin: bottom; } }
              `}</style>
            </InsightCard>
          )}

          {/* Survey info */}
          {survey && (
            <InsightCard
              icon={BarChart3}
              iconBg="linear-gradient(135deg, #fef3c7, #fffbeb)"
              iconColor="#f59e0b"
              title="Thông tin khảo sát"
              delay={200}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Tiêu đề", value: survey.title },
                  { label: "Mô tả", value: survey.description || "Không có mô tả" },
                  { label: "Số câu hỏi", value: survey.questions?.length ?? 0 },
                  { label: "Trạng thái", value: survey.is_published ? "Đã công khai" : "Riêng tư" },
                  { label: "Tạo lúc", value: survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, minWidth: 100, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: "#334155", fontFamily: "'DM Sans', sans-serif", flex: 1 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </InsightCard>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
      `}</style>
    </div>
  );
}
