/**
 * StatisticalAnalysisPage — Phân tích Thống kê
 * Tách ra từ AnalyticsPage: chỉ giữ các tab thống kê (không có AI)
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area} from "recharts";
import {
  ArrowLeft, RefreshCw, Download, Users, CheckCircle, Clock,
  TrendingUp, Target, FileText, Table, Filter, ChevronDown, ChevronUp,
  Zap, Sparkles, BarChart3, Activity, Award, Eye, AlertTriangle, X,
  Search, ThumbsUp, ThumbsDown, Minus,
  TrendingDown, Calendar, ChevronRight, FileSpreadsheet, EyeOff,
  Venus} from "lucide-react";
import analyticsService from "@/services/analyticsService";
import { useSurvey } from "@/providers/SurveyProvider";
import { toast } from "react-toastify";
import {
  userTheme as T, chartColors, questionTypeBadge,
  DATE_PRESETS, resolveDatePreset} from "@/styles/designSystem";
import {
  SkeletonStatCard, SkeletonChart, SkeletonQuestionCard,
  SkeletonTableRow, RetrySection, Shimmer} from "@/components/common/Skeleton/index.jsx";
import { ROUTERS } from "@/utils/constants";

/* ─── TABS ─────────────────────────────────────────────────────────── */
const TABS = [
  { id: "overview",  label: "Tổng quan",         icon: BarChart3 },
  { id: "questions", label: "Chi tiết câu hỏi",   icon: Target },
  { id: "responses",label: "Danh sách phản hồi",  icon: Users },
  { id: "gender",   label: "Giới tính",           icon: Venus },
  { id: "crosstab", label: "Cross Tab",            icon: Table },
  { id: "export",   label: "Xuất dữ liệu",        icon: FileSpreadsheet },
];

/* ─── HELPERS ──────────────────────────────────────────────────────── */
function fmt(n) {
  if (typeof n !== "number") return n ?? "—";
  return n.toLocaleString("vi-VN");
}

function chiSquareTest(rows) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total < 10) return null;
  const rowTotals = {}, colTotals = {};
  rows.forEach(r => {
    rowTotals[r.option_a_id] = (rowTotals[r.option_a_id] || 0) + r.count;
    colTotals[r.option_b_id] = (colTotals[r.option_b_id] || 0) + r.count;
  });
  let chiSq = 0;
  rows.forEach(r => {
    const exp = (rowTotals[r.option_a_id] * colTotals[r.option_b_id]) / total;
    if (exp > 0) chiSq += Math.pow(r.count - exp, 2) / exp;
  });
  const df = (Object.keys(rowTotals).length - 1) * (Object.keys(colTotals).length - 1);
  if (df < 1) return null;
  const cramersV = Math.sqrt(chiSq / (total * Math.min(Object.keys(rowTotals).length - 1, Object.keys(colTotals).length - 1)));
  const v = Math.abs(cramersV);
  let strength = "Không";
  if (v > 0.1) strength = "Yếu";
  if (v > 0.3) strength = "Trung bình";
  if (v > 0.5) strength = "Mạnh";
  if (v > 0.7) strength = "Rất mạnh";
  return {
    chi_square: parseFloat(chiSq.toFixed(3)),
    cramers_v: parseFloat(Math.abs(cramersV).toFixed(3)),
    degrees_of_freedom: df, total_samples: total,
    significance: chiSq > 10.83 ? "Cực kỳ có ý nghĩa" : chiSq > 6.63 ? "Rất có ý nghĩa" : chiSq > 3.84 ? "Có ý nghĩa" : "Không có ý nghĩa",
    strength, has_correlation: chiSq > 3.84};
}

function calcNPS(answers) {
  if (!answers || !answers.length) return null;
  const promoters = answers.filter(a => a >= 9).length;
  const detractors = answers.filter(a => a <= 6).length;
  const n = answers.length;
  return {
    score: parseFloat((((promoters - detractors) / n) * 100).toFixed(1)),
    promoters, detractors, passives: n - promoters - detractors, n,
    promoter_pct: parseFloat(((promoters / n) * 100).toFixed(1)),
    detractor_pct: parseFloat(((detractors / n) * 100).toFixed(1))};
}

/* ─── CHART TOOLTIP ────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14,
      padding: "12px 16px"}}>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 14, fontWeight: 700 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── PROGRESS BAR ─────────────────────────────────────────────────── */
function ProgressBar({ value, max, color = T.primary }) {
  const [w, setW] = useState(0);
  const pct = max > 0 ? (value / max) * 100 : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 60); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 999, width: `${w}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`}} />
    </div>
  );
}

/* ─── DATE HEATMAP ─────────────────────────────────────────────────── */
function DateHeatmap({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const getColor = (count) => {
    if (count === 0) return "#e2e8f0";
    const r = count / max;
    if (r < 0.25) return "#bfdbfe";
    if (r < 0.5)  return "#60a5fa";
    if (r < 0.75) return "#3b82f6";
    return "#1d4ed8";
  };
  const weeks = []; let weekArr = [];
  const startDay = new Date(data[0]?.date).getDay() || 7;
  for (let i = 1; i < startDay; i++) weekArr.push(null);
  data.forEach(d => { weekArr.push(d); if (weekArr.length === 7) { weeks.push(weekArr); weekArr = []; } });
  if (weekArr.length) { while (weekArr.length < 7) weekArr.push(null); weeks.push(weekArr); }
  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "flex", gap: 3, minWidth: "max-content" }}>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {w.map((day, di) => (
              <div key={di} style={{
                width: 13, height: 13, borderRadius: 3,
                background: day ? getColor(day.count) : "transparent",
                cursor: day ? "pointer" : "default",
                 && day.count > 0 ? `0 1px 3px ${getColor(day.count)}50` : "none",
                title: day ? `${day.date}: ${day.count} phản hồi` : ""}}
                onMouseEnter={e => { if (day) e.currentTarget.style.transform = "scale(1.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>Ít</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: getColor(r * max), border: "1px solid rgba(0,0,0,0.06)" }} />
        ))}
        <span style={{ fontSize: 10, color: "#94a3b8" }}>Nhiều</span>
      </div>
    </div>
  );
}

/* ─── FUNNEL ───────────────────────────────────────────────────────── */
function FunnelViz({ dropOffData }) {
  if (!dropOffData || dropOffData.length === 0) return null;
  const sorted = [...dropOffData].sort((a, b) => b.answered_count - a.answered_count);
  const funnelData = sorted.slice(0, 10).map(d => ({
    name: `Q${d.question_id?.slice(-3) || "?"}`, value: d.answered_count}));
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={11} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
            {funnelData.map((_, i) => (
              <Cell key={i} fill={chartColors[i % chartColors.length]}
                style={{ filter: `drop-shadow(0 2px 6px ${chartColors[i % chartColors.length]}30)` }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── NPS CARD ────────────────────────────────────────────────────── */
function NPSCard({ npsData }) {
  if (!npsData) return (
    <div style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 22, textAlign: "center" }}>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Cần câu hỏi đánh giá (RATING 1-10) để tính NPS</p>
    </div>
  );
  const scoreColor = npsData.score >= 50 ? "#10b981" : npsData.score >= 0 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 18, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <ThumbsUp size={17} color="#6366f1" />
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>NPS Score</h4>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div>
          <p style={{ fontSize: 48, fontWeight: 900, color: scoreColor, lineHeight: 1, margin: 0 }}>{npsData.score}</p>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>trên 100</p>
        </div>
        <div style={{ flex: 1, paddingBottom: 4 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {[{ label: "Promoter", count: npsData.promoters, color: "#10b981" }, { label: "Passive", count: npsData.passives, color: "#f59e0b" }, { label: "Detractor", count: npsData.detractors, color: "#ef4444" }].map(s => (
              <div key={s.label} style={{ flex: 1, background: `${s.color}10`, border: `1px solid ${s.color}20`, borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: s.color, margin: 0 }}>{s.count}</p>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8 }}>
            <div style={{ flex: npsData.promoter_pct, background: "#10b981"}} />
            <div style={{ flex: 100 - npsData.promoter_pct - npsData.detractor_pct, background: "#f59e0b"}} />
            <div style={{ flex: npsData.detractor_pct, background: "#ef4444"}} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── STAT CARD ───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const colors = {
    indigo:  { bg: "#e0e7ff", color: "#6366f1", text: "#1e293b" },
    emerald:  { bg: "#d1fae5", color: "#10b981", text: "#1e293b" },
    violet:  { bg: "#f3e8ff", color: "#a855f7", text: "#1e293b" },
    amber:   { bg: "#fef3c7", color: "#f59e0b", text: "#1e293b" },
    cyan:    { bg: "#cffafe", color: "#06b6d4", text: "#1e293b" }};
  const c = colors[color] || colors.indigo;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(99,102,241,0.01))",
      border: "1px solid rgba(99,102,241,0.12)",
      borderRadius: 18, padding: "20px 22px",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`}}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 900, color: c.text, margin: 0, lineHeight: 1.1 }}>{visible ? value : "—"}</p>
          {sub && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={c.color} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

/* ─── TYPE BADGE ──────────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const t = questionTypeBadge[type] || { label: type, bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: t.bg, color: t.color }}>
      {t.label}
    </span>
  );
}

/* ─── EMPTY STATE ──────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "64px 24px", background: "rgba(0,0,0,0.02)",
      border: "1px dashed rgba(0,0,0,0.08)", borderRadius: 20,
      gap: 12, textAlign: "center"}}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={28} color="#cbd5e1" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#94a3b8", margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 300, lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ─── QUESTION CARD ───────────────────────────────────────────────── */
function QuestionCard({ question, index }) {
  const [expanded, setExpanded] = useState(true);
  const [animDone, setAnimDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimDone(true), index * 60 + 150); return () => clearTimeout(t); }, [index]);

  const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type);
  const isNumber = ["RATING", "NUMBER"].includes(question.type);
  const isText   = ["TEXT", "PARAGRAPH", "EMAIL"].includes(question.type);
  const isDate   = question.type === "DATE";
  const topOpt = question.options?.[0];

  return (
    <div style={{
      background: "rgba(255,255,255,0.92)",
      border: `1px solid ${expanded ? "rgba(99,102,241,0.25)" : "rgba(0,0,0,0.06)"}`,
      borderRadius: 18, overflow: "hidden",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      opacity: animDone ? 1 : 0, transform: animDone ? "translateY(0)" : "translateY(12px)",
      transition: `all 0.4s ease ${index * 60}ms`}}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.03)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#6366f1", flexShrink: 0 }}>
            {index + 1}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", margin: 0, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {question.question_content || question.question_id?.slice(0, 8) + "…"}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TypeBadge type={question.type} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{question.total_responses} phản hồi</span>
              {topOpt && <span style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={11} /> {topOpt.label?.slice(0, 15)} ({topOpt.percent}%)</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {isChoice && question.options && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ height: 180, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={question.options} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} width={120} tickFormatter={v => v?.length > 15 ? v.slice(0, 15) + "…" : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={20}>
                      {question.options.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]}
                          style={{ filter: `drop-shadow(0 2px 6px ${chartColors[i % chartColors.length]}30)` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {question.options.map((opt, i) => (
                  <div key={opt.option_id || i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: chartColors[i % chartColors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</span>
                    <div style={{ width: 140 }}><ProgressBar value={opt.count} max={question.options[0]?.count || 1} color={chartColors[i % chartColors.length]} /></div>
                    <span style={{ fontSize: 12, color: "#94a3b8", width: 42, textAlign: "right" }}>{opt.percent}%</span>
                    <span style={{ fontSize: 12, color: "#64748b", width: 30, textAlign: "right", fontWeight: 700 }}>{opt.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isNumber && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Trung bình", value: question.avg?.toFixed(1), color: "#6366f1" },
                  { label: "Thấp nhất", value: question.min, color: "#334155" },
                  { label: "Cao nhất", value: question.max, color: "#334155" },
                  { label: "Độ lệch", value: question.stddev?.toFixed(2), color: "#334155" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "12px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: item.color, margin: 0 }}>{item.value ?? "—"}</p>
                  </div>
                ))}
              </div>
              {question.distribution?.length > 0 && (
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey={question.type === "RATING" ? "rating" : "value"} stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        <Cell fill="#6366f1" style={{ filter: "drop-shadow(0 2px 6px rgba(99,102,241,0.3))" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          {isDate && (
            <div style={{ paddingTop: 18 }}>
              {question.distribution?.length > 0 ? (
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        <Cell fill="#06b6d4" style={{ filter: "drop-shadow(0 2px 6px rgba(6,182,212,0.3))" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu ngày</p>}
            </div>
          )}
          {isText && (
            <div style={{ paddingTop: 18 }}>
              {question.answers?.length > 0 ? (
                <>
                  {question.word_frequency?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>Từ khóa nổi bật</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {question.word_frequency.slice(0, 16).map((item, i) => (
                          <span key={item.word || i} style={{ padding: "4px 10px", background: "#e0e7ff", color: "#6366f1", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid rgba(99,102,241,0.2)" }}>
                            {item.word} <span style={{ opacity: 0.6 }}>({item.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                    {question.answers.map((ans, i) => (
                      <div key={ans.id || i} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#334155" }}>
                        {ans.text || ans.answer_text || "—"}
                      </div>
                    ))}
                  </div>
                  {question.pagination && (
                    <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
                      Hiển thị {question.answers.length} / {question.pagination.total_answers} câu trả lời
                    </p>
                  )}
                </>
              ) : <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>Chưa có câu trả lời</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── RESPONSE ROW ────────────────────────────────────────────────── */
function ResponseRow({ response }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.02)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ width: 32, textAlign: "center", fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{response.response_id?.slice(0, 6)}</div>
        <div style={{ flex: 1 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: response.status === "COMPLETED" ? "#d1fae5" : "#fef3c7",
            color: response.status === "COMPLETED" ? "#059669" : "#d97706"}}>
            {response.status === "COMPLETED" ? "✓ Hoàn thành" : "○ Đang làm"}
          </span>
        </div>
        <div style={{ width: 70, textAlign: "right", fontSize: 12, color: "#64748b" }}>
          {response.completion_time ? `${Math.round(response.completion_time / 60)}m` : "—"}
        </div>
        <div style={{ width: 40, textAlign: "right", fontSize: 12, color: "#64748b" }}>{response.answered_count || 0}</div>
        <div style={{ width: 80, textAlign: "right", fontSize: 11, color: "#94a3b8" }}>
          {response.created_at ? new Date(response.created_at).toLocaleDateString("vi-VN") : "—"}
        </div>
        <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          {expanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
        </div>
      </div>
      {expanded && response.answers?.length > 0 && (
        <div style={{ padding: "12px 18px 16px", background: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          {response.answers.map((ans, i) => (
            <div key={i} style={{ marginBottom: 10, padding: "10px 14px", background: "white", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>Q{i + 1}: {ans.question_content?.slice(0, 60)}</p>
              <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>{ans.text || ans.answer_text || ans.answer || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SEARCH BAR ───────────────────────────────────────────────────── */
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }}>
      <Search size={14} color="#94a3b8" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#334155", fontFamily: "'DM Sans', sans-serif" }} />
      {value && <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 0 }}><X size={13} /></button>}
    </div>
  );
}

/* ─── STATUS FILTER ───────────────────────────────────────────────── */
function StatusFilter({ value, onChange }) {
  const opts = [
    { value: "", label: "Tất cả" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "IN_PROGRESS", label: "Đang làm" },
  ];
  return (
    <div style={{ display: "flex", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 3, gap: 2 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: "6px 14px", borderRadius: 10, border: "none",
          background: value === o.value ? "white" : "transparent",
          color: value === o.value ? "#1e293b" : "#64748b",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif" === o.value ? "0 2px 8px rgba(0,0,0,0.1)" : "none"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── DATE PRESET SELECTOR ────────────────────────────────────────── */
function DatePresetSelector({ activePreset, onChange }) {
  const presets = [
    { value: "7d", label: "7 ngày" },
    { value: "30d", label: "30 ngày" },
    { value: "90d", label: "90 ngày" },
    { value: "all", label: "Tất cả" },
    { value: "custom", label: "Tùy chỉnh" },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {presets.map(p => (
        <button key={p.value} onClick={() => onChange(p.value)} style={{
          padding: "6px 12px", borderRadius: 8, border: "none",
          background: activePreset === p.value ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.04)",
          color: activePreset === p.value ? "#4f46e5" : "#64748b",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif"}}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ─── TREND SWITCHER ──────────────────────────────────────────────── */
function TrendSwitcher({ value, onChange }) {
  const opts = [{ value: "day", label: "Ngày" }, { value: "week", label: "Tuần" }, { value: "month", label: "Tháng" }];
  return (
    <div style={{ display: "flex", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, padding: 3 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: "5px 10px", borderRadius: 6, border: "none",
          background: value === o.value ? "#6366f1" : "transparent",
          color: value === o.value ? "#fff" : "#64748b",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════════════════════════════════════ */
const glassCard = {
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.8)",
  borderRadius: 18};
const chartCard = { ...glassCard, padding: "22px 24px" };

export default function StatisticalAnalysisPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { fetchSurveyById, currentSurvey } = useSurvey();

  const [activeTab, setActiveTab]   = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [dateFrom, setDateFrom]    = useState("");
  const [dateTo, setDateTo]        = useState("");
  const [trendGroup, setTrendGroup] = useState("day");

  const [stats, setStats]   = useState(null); const [sLoad, setSLoad] = useState(true); const [sErr, setSErr] = useState(null);
  const [trend, setTrend]   = useState(null); const [tLoad, setTLoad] = useState(true); const [tErr, setTErr] = useState(null);
  const [comp, setComp]     = useState(null); const [cLoad, setCLoad] = useState(true); const [cErr, setCErr] = useState(null);
  const [survey, setSurvey] = useState(null); const [svLoad, setSvLoad] = useState(true); const [svErr, setSvErr] = useState(null);
  const [hmData, setHmData] = useState(null); const [hmLoad, setHmLoad] = useState(true); const [hmErr, setHmErr] = useState(null);

  const [responses, setResponses] = useState(null); const [rLoad, setRLoad] = useState(true); const [rErr, setRErr] = useState(null);
  const [rPage, setRPage] = useState(1);
  const [rSearch, setRSearch] = useState("");
  const [rStatus, setRStatus] = useState("");

  const [crossTab, setCrossTab] = useState(null); const [ctLoad, setCtLoad] = useState(false);
  const [selectedQ1, setSelectedQ1] = useState(null);
  const [selectedQ2, setSelectedQ2] = useState(null);
  const [chiResult, setChiResult] = useState(null);

  // Gender / Age analytics
  const [genderTabQuestion, setGenderTabQuestion] = useState(null);
  const [genderData, setGenderData] = useState(null); const [gLoad, setGLoad] = useState(false); const [gErr, setGErr] = useState(null);
  const [ageData, setAgeData] = useState(null); const [aLoad, setALoad] = useState(false); const [aErr, setAErr] = useState(null);
  const [insightData, setInsightData] = useState(null); const [iLoad, setILoad] = useState(false); const [iErr, setIErr] = useState(null);

  const getParams = () => {
    const p = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  };

  const applyPreset = useCallback((preset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    const { from, to } = resolveDatePreset(preset);
    setDateFrom(from); setDateTo(to);
  }, []);

  // Fetch survey info
  useEffect(() => {
    if (!surveyId) return;
    fetchSurveyById(surveyId).then(s => { if (s) setSurvey(s); });
  }, [surveyId]);

  const fetchStats = useCallback(async () => {
    if (!surveyId) return;
    setSLoad(true); setSErr(null);
    try { const r = await analyticsService.getSurveyStats(surveyId, getParams()); setStats(r.data?.data); }
    catch (e) { setSErr(e?.message); }
    finally { setSLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchTrend = useCallback(async () => {
    if (!surveyId) return;
    setTLoad(true); setTErr(null);
    try { const r = await analyticsService.getResponseTrend(surveyId, trendGroup, getParams()); setTrend(r.data?.data); }
    catch (e) { setTErr(e?.message); }
    finally { setTLoad(false); }
  }, [surveyId, trendGroup, dateFrom, dateTo]);

  const fetchComp = useCallback(async () => {
    if (!surveyId) return;
    setCLoad(true); setCErr(null);
    try { const r = await analyticsService.getCompletionStats(surveyId, getParams()); setComp(r.data?.data); }
    catch (e) { setCErr(e?.message); }
    finally { setCLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) return;
    setSvLoad(true); setSvErr(null);
    try { const r = await analyticsService.getSurveyAnalytics(surveyId, getParams()); setSurvey(r.data?.data); }
    catch (e) { setSvErr(e?.message); }
    finally { setSvLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchHeatmap = useCallback(async () => {
    if (!surveyId) return;
    setHmLoad(true); setHmErr(null);
    try { const r = await analyticsService.getDateHeatmap(surveyId, getParams()); setHmData(r.data?.data); }
    catch (e) { setHmErr(e?.message); }
    finally { setHmLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchResponses = useCallback(async (page = 1) => {
    if (!surveyId) return;
    setRLoad(true); setRErr(null);
    try { const r = await analyticsService.getFilteredResponses(surveyId, { page, limit: 15, ...getParams(), search_query: rSearch, status: rStatus }); setResponses(r.data?.data); }
    catch (e) { setRErr(e?.message); }
    finally { setRLoad(false); }
  }, [surveyId, rSearch, rStatus, dateFrom, dateTo]);

  useEffect(() => { fetchStats(); fetchComp(); fetchSurvey(); }, [fetchStats, fetchComp, fetchSurvey]);
  useEffect(() => { fetchTrend(); }, [fetchTrend]);
  useEffect(() => { fetchHeatmap(); }, [fetchHeatmap]);
  useEffect(() => { if (activeTab === "responses") fetchResponses(rPage); }, [activeTab, rPage, fetchResponses]);

  const fetchGenderData = useCallback(async () => {
    if (!genderTabQuestion || !surveyId) return;
    setGLoad(true); setGErr(null);
    try { const r = await analyticsService.getCompareByGender(genderTabQuestion, surveyId, getParams()); setGenderData(r.data?.data); }
    catch (e) { setGErr(e?.message); }
    finally { setGLoad(false); }
  }, [genderTabQuestion, surveyId, dateFrom, dateTo]);

  const fetchAgeData = useCallback(async () => {
    if (!genderTabQuestion || !surveyId) return;
    setALoad(true); setAErr(null);
    try { const r = await analyticsService.getCompareByAge(genderTabQuestion, surveyId, getParams()); setAgeData(r.data?.data); }
    catch (e) { setAErr(e?.message); }
    finally { setALoad(false); }
  }, [genderTabQuestion, surveyId, dateFrom, dateTo]);

  const fetchInsightData = useCallback(async () => {
    if (!genderTabQuestion || !surveyId) return;
    setILoad(true); setIErr(null);
    try { const r = await analyticsService.getInsightAgeGender(genderTabQuestion, surveyId, getParams()); setInsightData(r.data?.data); }
    catch (e) { setIErr(e?.message); }
    finally { setILoad(false); }
  }, [genderTabQuestion, surveyId, dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === "gender" && genderTabQuestion) {
      fetchGenderData();
      fetchAgeData();
      fetchInsightData();
    }
  }, [activeTab, genderTabQuestion, fetchGenderData, fetchAgeData, fetchInsightData]);

  const fetchCrossTab = useCallback(async () => {
    if (!surveyId || !selectedQ1 || !selectedQ2) return;
    setCtLoad(true);
    try {
      const r = await analyticsService.getCrossTab(surveyId, selectedQ1, selectedQ2, getParams());
      const data = r.data?.data;
      setCrossTab(data);
      if (data?.rows?.length > 0) {
        const result = chiSquareTest(data.rows.flatMap(row => Object.values(row.breakdown || {}).map(cell => ({ option_a_id: row.option_id, option_b_id: cell.option_id, count: cell.count }))));
        setChiResult(result);
      } else { setChiResult(null); }
    } catch { toast.error("Không tải được cross-tab"); }
    finally { setCtLoad(false); }
  }, [surveyId, selectedQ1, selectedQ2, dateFrom, dateTo]);

  useEffect(() => { if (selectedQ1 && selectedQ2) fetchCrossTab(); }, [fetchCrossTab]);

  const handleExportJSON = async () => {
    try {
      const [surveyR, compR, trendR] = await Promise.all([
        analyticsService.getSurveyAnalytics(surveyId, getParams()),
        analyticsService.getCompletionStats(surveyId, getParams()),
        analyticsService.getResponseTrend(surveyId, "day", getParams()),
      ]);
      const blob = new Blob([JSON.stringify({ survey_id: surveyId, exported_at: new Date().toISOString(), overview: compR.data?.data, trend: trendR.data?.data, questions: surveyR.data?.data?.questions }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `analytics-${surveyId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Đã xuất JSON");
    } catch { toast.error("Xuất thất bại"); }
  };

  const handleRefreshAll = () => {
    fetchStats(); fetchTrend(); fetchComp(); fetchSurvey(); fetchHeatmap();
    if (activeTab === "responses") fetchResponses(rPage);
  };

  const questions = survey?.questions || [];
  const choiceQs  = questions.filter(q => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type));
  const ratingQs   = questions.filter(q => q.type === "RATING");
  const npsAnswers = ratingQs.flatMap(q => (q.distribution || []).flatMap(d => Array(d.count).fill(d.rating)));
  const npsData = calcNPS(npsAnswers);

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "linear-gradient(135deg, #f0f2f6 0%, #f8f9ff 50%, #f0f2f6 100%)",
      position: "relative", overflowX: "hidden", minHeight: "100vh"}}>
      <div style={{
        position: "fixed", top: "-15%", right: "-8%",
        width: 450, height: 450, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0}} />
      <div style={{
        position: "fixed", bottom: "-10%", left: "-5%",
        width: 350, height: 350, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0}} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 18px 48px" }}>

        {/* Header */}
        <div style={{ ...glassCard, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => navigate(ROUTERS.USER.HOME)} style={{
              width: 44, height: 44, borderRadius: 14, border: "none",
              background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0}}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)";  }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";  }}
            >
              <ArrowLeft size={19} color="#1e293b" />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <BarChart3 size={17} color="#fff" />
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", margin: 0 }}>Phân tích Thống kê</h1>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 3 }}>
                {(survey?.title) || surveyId}
              </p>
            </div>
          </div>
          <button onClick={handleRefreshAll} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12,
            border: "1px solid rgba(99,102,241,0.15)", background: "rgba(255,255,255,0.8)",
            backdropFilter: "blur(10px)", color: "#1e293b", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif"}}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.95)";  }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)";  }}
          >
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ ...glassCard, display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(99,102,241,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <Filter size={13} color="#4f46e5" />
          </div>
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Khoảng thời gian:</span>
          <DatePresetSelector activePreset={datePreset} onChange={applyPreset} />
          {datePreset === "custom" && (
            <>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "7px 12px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12, color: "#334155", fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer" }} />
              <span style={{ color: "#94a3b8" }}>—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "7px 12px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, fontSize: 12, color: "#334155", fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer" }} />
            </>
          )}
          {dateFrom && dateTo && datePreset === "custom" && (
            <button onClick={() => applyPreset("30d")} style={{ background: "none", border: "none", fontSize: 11, color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif", padding: "4px 8px", borderRadius: 6 }}>
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ ...glassCard, display: "flex", gap: 4, padding: 5, marginBottom: 28, width: "fit-content", overflowX: "auto" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const is = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 12,
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                background: is ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
                color: is ? "#fff" : "#64748b",
                whiteSpace: "nowrap"}}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ════════════════════ OVERVIEW ════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <RetrySection error={sErr} onRetry={fetchStats} isLoading={sLoad} theme="light">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                {sLoad ? [1,2,3,4,5,6].map(i => <SkeletonStatCard key={i} theme="light" />) : (
                  <>
                    <StatCard label="Tổng bắt đầu" value={fmt(stats?.overview?.total_started || 0)} icon={Users} color="indigo" delay={0} />
                    <StatCard label="Hoàn thành" value={fmt(stats?.overview?.total_completed || 0)} icon={CheckCircle} color="emerald" delay={80} />
                    <StatCard label="Tỷ lệ hoàn thành" value={`${stats?.overview?.completion_rate || 0}%`} icon={TrendingUp} color="violet" delay={160} />
                    <StatCard label="Thời gian TB" value={stats?.overview?.avg_completion_time || "—"} icon={Clock} color="amber" delay={240} />
                    <StatCard label="Tổng câu hỏi" value={questions.length} icon={Target} color="cyan" delay={320} />
                    {npsData && <StatCard label="NPS Score" value={npsData.score} icon={ThumbsUp} color="emerald" delay={400} sub={`${npsData.promoter_pct}% promoter`} />}
                  </>
                )}
              </div>
            </RetrySection>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16 }}>
              <RetrySection error={tErr} onRetry={fetchTrend} isLoading={tLoad}>
                <div style={{ ...chartCard }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #e0e7ff, #ede9fe)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Activity size={17} color="#6366f1" />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Xu hướng phản hồi</h3>
                    </div>
                    <TrendSwitcher value={trendGroup} onChange={setTrendGroup} />
                  </div>
                  {tLoad ? <Shimmer height={240} /> : trend?.trend?.length > 0 ? (
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend.trend}>
                          <defs>
                            <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#lg2)" dot={false} activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState icon={Activity} title="Chưa có dữ liệu xu hướng" desc="Khảo sát chưa có phản hồi nào" />}
                </div>
              </RetrySection>
              <RetrySection error={hmErr} onRetry={fetchHeatmap} isLoading={hmLoad}>
                <div style={{ ...chartCard }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #cffafe, #ecfeff)", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={17} color="#06b6d4" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Lịch hoạt động</h3>
                  </div>
                  {hmLoad ? <Shimmer height={160} /> : hmData?.heatmap?.length > 0 ? (
                    <DateHeatmap data={hmData.heatmap} />
                  ) : <EmptyState icon={Calendar} title="Không có dữ liệu" desc="Chưa có phản hồi nào" />}
                </div>
              </RetrySection>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <RetrySection error={cErr} onRetry={fetchComp} isLoading={cLoad}>
                <div style={{ ...chartCard }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #d1fae5, #ecfdf5)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Award size={17} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Tỷ lệ hoàn thành</h3>
                  </div>
                  {cLoad ? <Shimmer height={200} /> : (
                    <div style={{ height: 200, display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
                      {[
                        { label: "Hoàn thành", value: comp?.total_completed || 0, color: "#10b981" },
                        { label: "Đang làm", value: (comp?.total_started || 0) - (comp?.total_completed || 0), color: "#f59e0b" },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: "#334155" }}>{item.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{fmt(item.value)}</span>
                          </div>
                          <ProgressBar value={item.value} max={comp?.total_started || 1} color={item.color} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </RetrySection>
              <RetrySection error={cErr} onRetry={fetchComp} isLoading={cLoad}>
                <div style={{ ...chartCard }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #fee2e2, #fff5f5)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TrendingDown size={17} color="#ef4444" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Drop-off theo câu hỏi</h3>
                  </div>
                  {cLoad ? <Shimmer height={200} /> : comp?.drop_off_by_question?.length > 0 ? (
                    <FunnelViz dropOffData={comp.drop_off_by_question} />
                  ) : <EmptyState icon={TrendingDown} title="Chưa có dữ liệu drop-off" desc="Không có phản hồi chưa hoàn thành" />}
                </div>
              </RetrySection>
            </div>
            <NPSCard npsData={npsData} />
          </div>
        )}

        {/* ════════════════════ QUESTIONS ════════════════════ */}
        {activeTab === "questions" && (
          <RetrySection error={svErr} onRetry={fetchSurvey} isLoading={svLoad}>
            {svLoad ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1,2,3].map(i => <SkeletonQuestionCard key={i} theme="light" />)}</div>
            ) : questions.length === 0 ? (
              <EmptyState icon={Target} title="Chưa có câu hỏi" desc="Khảo sát này chưa có câu hỏi nào" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{questions.length} câu hỏi</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RATING", "TEXT", "DATE", "NUMBER"].map(t => {
                      const count = questions.filter(q => q.type === t).length;
                      if (count === 0) return null;
                      return <TypeBadge key={t} type={t} />;
                    })}
                  </div>
                </div>
                {questions.map((q, i) => <QuestionCard key={q.question_id || i} question={q} index={i} />)}
              </div>
            )}
          </RetrySection>
        )}

        {/* ════════════════════ RESPONSES ════════════════════ */}
        {activeTab === "responses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <SearchBar value={rSearch} onChange={v => { setRSearch(v); setRPage(1); }} placeholder="Tìm kiếm trong câu trả lời..." />
              </div>
              <StatusFilter value={rStatus} onChange={v => { setRStatus(v); setRPage(1); }} />
              {(rSearch || rStatus) && (
                <button onClick={() => { setRSearch(""); setRStatus(""); setRPage(1); }} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={13} /> Xóa lọc
                </button>
              )}
            </div>
            <RetrySection error={rErr} onRetry={() => fetchResponses(rPage)} isLoading={rLoad}>
              <div style={{ ...glassCard, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={17} color="#6366f1" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Danh sách phản hồi</h3>
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b", background: "rgba(0,0,0,0.04)", padding: "4px 12px", borderRadius: 20 }}>
                    {responses?.pagination?.total_responses || 0} tổng số
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <div style={{ width: 32, textAlign: "center" }}>ID</div>
                  <div style={{ flex: 1 }}>Trạng thái</div>
                  <div style={{ width: 70, textAlign: "right" }}>Thời gian</div>
                  <div style={{ width: 40, textAlign: "right" }}>Câu</div>
                  <div style={{ width: 80, textAlign: "right" }}>Ngày</div>
                  <div style={{ width: 28 }}></div>
                </div>
                {rLoad ? [1,2,3,4,5].map(i => <SkeletonTableRow key={i} cols={5} theme="light" />)
                  : responses?.responses?.length > 0 ? responses.responses.map(r => <ResponseRow key={r.response_id} response={r} />)
                  : <div style={{ padding: "60px 20px" }}><EmptyState icon={rSearch || rStatus ? EyeOff : Eye} title={rSearch || rStatus ? "Không tìm thấy" : "Chưa có phản hồi"} desc={rSearch || rStatus ? "Thử thay đổi bộ lọc" : "Chưa có phản hồi nào"} /></div>
                }
                {responses?.pagination?.total_pages > 1 && (
                  <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <button onClick={() => setRPage(p => Math.max(1, p - 1))} disabled={rPage === 1}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)", cursor: rPage === 1 ? "not-allowed" : "pointer", fontSize: 13, opacity: rPage === 1 ? 0.4 : 1, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>←</button>
                    {Array.from({ length: Math.min(5, responses.pagination.total_pages) }, (_, i) => i + 1).map(pg => (
                      <button key={pg} onClick={() => setRPage(pg)} style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: pg === rPage ? "none" : "1px solid rgba(0,0,0,0.08)",
                        background: pg === rPage ? "linear-gradient(135deg, #6366f1, #7c5df7)" : "rgba(0,0,0,0.03)",
                        color: pg === rPage ? "#fff" : "#64748b", fontWeight: pg === rPage ? 700 : 500, fontSize: 13,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif" === rPage ? "0 4px 14px rgba(99,102,241,0.35)" : "none"}}>{pg}</button>
                    ))}
                    <button onClick={() => setRPage(p => Math.min(responses.pagination.total_pages, p + 1))}
                      disabled={rPage === responses.pagination.total_pages}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)", cursor: rPage === responses.pagination.total_pages ? "not-allowed" : "pointer", fontSize: 13, opacity: rPage === responses.pagination.total_pages ? 0.4 : 1, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>→</button>
                  </div>
                )}
              </div>
            </RetrySection>
          </div>
        )}

        {/* ════════════════════ GENDER ════════════════════ */}
        {activeTab === "gender" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ ...chartCard }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Venus size={17} color="#ec4899" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Phân tích theo Giới tính & Độ tuổi</h3>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>Chọn câu hỏi lựa chọn để phân tích:</label>
                <select
                  value={genderTabQuestion || ""}
                  onChange={e => setGenderTabQuestion(e.target.value || null)}
                  style={{ width: "100%", padding: "11px 14px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#334155", cursor: "pointer" }}
                >
                  <option value="">— Chọn câu hỏi —</option>
                  {choiceQs.map(q => (
                    <option key={q.question_id} value={q.question_id}>{q.question_content?.slice(0, 80)}</option>
                  ))}
                </select>
              </div>
              {!genderTabQuestion && (
                <div style={{ marginTop: 20, padding: "32px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  Vui lòng chọn câu hỏi lựa chọn để xem phân tích theo giới tính và độ tuổi.
                </div>
              )}
            </div>
            {genderTabQuestion && (
              <>
                <RetrySection error={gErr} onRetry={fetchGenderData} isLoading={gLoad}>
                  <div style={{ ...chartCard }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <Venus size={17} color="#ec4899" />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>So sánh theo Giới tính</h3>
                    </div>
                    {gLoad ? <Shimmer height={260} /> : genderData && Object.keys(genderData).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {Object.entries(genderData).map(([gender, genderInfo]) => {
                          const genderColors = { MALE: "#3b82f6", FEMALE: "#ec4899", OTHER: "#a855f7", UNKNOWN: "#94a3b8" };
                          const genderLabels = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác", UNKNOWN: "Chưa cập nhật" };
                          const color = genderColors[gender] || "#6366f1";
                          const label = genderLabels[gender] || gender;
                          const data = Object.entries(genderInfo.data || {}).map(([opt, pct]) => ({ name: opt, value: pct }));
                          return (
                            <div key={gender}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{label}</span>
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>({genderInfo.total} phản hồi)</span>
                              </div>
                              <div style={{ height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                      <Cell fill={color} style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }} />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <EmptyState icon={Venus} title="Chưa có dữ liệu" desc="Chưa có phản hồi nào cho câu hỏi này" />}
                  </div>
                </RetrySection>
                <RetrySection error={aErr} onRetry={fetchAgeData} isLoading={aLoad}>
                  <div style={{ ...chartCard }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <Clock size={17} color="#f59e0b" />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>So sánh theo Độ tuổi</h3>
                    </div>
                    {aLoad ? <Shimmer height={260} /> : ageData && Object.keys(ageData).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {Object.entries(ageData).map(([ageGroup, ageInfo], gi) => {
                          const groupColors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];
                          const color = groupColors[gi % groupColors.length];
                          const data = Object.entries(ageInfo.data || {}).map(([opt, cnt]) => ({ name: opt, value: cnt }));
                          return (
                            <div key={ageGroup}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{ageGroup}</span>
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>({ageInfo.total} phản hồi)</span>
                              </div>
                              <div style={{ height: 140 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                                    <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                      <Cell fill={color} style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }} />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : <EmptyState icon={Clock} title="Chưa có dữ liệu" desc="Chưa có phản hồi nào" />}
                  </div>
                </RetrySection>
              </>
            )}
          </div>
        )}

        {/* ════════════════════ CROSSTAB ════════════════════ */}
        {activeTab === "crosstab" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ ...chartCard }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Sparkles size={17} color="#a855f7" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>Cross-Tabulation</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
                {[{ label: "Câu hỏi A (Hàng)", val: selectedQ1, set: setSelectedQ1 }, { label: "Câu hỏi B (Cột)", val: selectedQ2, set: setSelectedQ2 }].map(({ label, val, set }, idx) => (
                  <div key={idx}>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>{label}</label>
                    <select value={val || ""} onChange={e => set(e.target.value || null)} style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#334155", cursor: "pointer" }}>
                      <option value="">Chọn câu hỏi...</option>
                      {choiceQs.map(q => (<option key={q.question_id} value={q.question_id}>{q.question_content?.slice(0, 60)}</option>))}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={fetchCrossTab} disabled={!selectedQ1 || !selectedQ2 || ctLoad} style={{
                padding: "11px 24px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #6366f1, #7c5df7)", color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: !selectedQ1 || !selectedQ2 || ctLoad ? "not-allowed" : "pointer",
                opacity: !selectedQ1 || !selectedQ2 || ctLoad ? 0.5 : 1,
                fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 8}}>
                {ctLoad ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={15} />}
                Phân tích
              </button>
            </div>
            {chiResult && (
              <div style={{ ...chartCard, border: chiResult.has_correlation ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  {chiResult.has_correlation ? <ThumbsUp size={17} color="#10b981" /> : <Minus size={17} color="#f59e0b" />}
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>Kết quả kiểm định Chi-Square</h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Chi-Square (χ²)", value: chiResult.chi_square, color: "#6366f1" },
                    { label: "Cramér's V", value: chiResult.cramers_v, color: "#6366f1" },
                    { label: "Bậc tự do (df)", value: chiResult.degrees_of_freedom, color: "#334155" },
                    { label: "Mẫu", value: chiResult.total_samples, color: "#334155" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
                      <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontSize: 24, fontWeight: 900, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Ý nghĩa thống kê", value: chiResult.significance, color: chiResult.has_correlation ? "#10b981" : "#f59e0b" },
                    { label: "Độ mạnh tương quan", value: chiResult.strength, color: chiResult.has_correlation ? "#10b981" : "#64748b" },
                    { label: "Kết luận", value: chiResult.has_correlation ? "Có tương quan ✓" : "Không có tương quan", color: chiResult.has_correlation ? "#10b981" : "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ flex: 1, minWidth: 140, background: `${item.color}10`, border: `1px solid ${item.color}20`, borderRadius: 12, padding: "10px 14px" }}>
                      <p style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {crossTab?.rows?.length > 0 && (
              <div style={{ ...glassCard, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                    {crossTab.question_a?.label?.slice(0, 30)} × {crossTab.question_b?.label?.slice(0, 30)}
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                        <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid rgba(0,0,0,0.06)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {crossTab.question_a?.label?.slice(0, 20)}
                        </th>
                        {Object.values(crossTab.rows[0]?.breakdown || {}).slice(0, 10).map(opt => (
                          <th key={opt.option_id} style={{ padding: "11px 12px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#64748b", borderBottom: "1px solid rgba(0,0,0,0.06)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {opt.label?.slice(0, 12)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crossTab.rows?.map(row => (
                        <tr key={row.option_id}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.03)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155", borderBottom: "1px solid rgba(0,0,0,0.04)", whiteSpace: "nowrap" }}>{row.label?.slice(0, 25)}</td>
                          {Object.values(row.breakdown || {}).slice(0, 10).map(cell => {
                            const maxCount = Math.max(...crossTab.rows.flatMap(r => Object.values(r.breakdown || {}).map(c => c.count)), 1);
                            const intensity = cell.count / maxCount;
                            return (
                              <td key={cell.option_id} style={{ padding: "11px 12px", textAlign: "center", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 800, background: `rgba(99,102,241,${intensity * 0.15})`, color: intensity > 0.5 ? "#1e293b" : "#6366f1" }}>
                                  {cell.count}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ EXPORT ════════════════════ */}
        {activeTab === "export" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...chartCard }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <FileSpreadsheet size={18} color="#6366f1" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", margin: 0 }}>Xuất dữ liệu</h3>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                Xuất toàn bộ dữ liệu khảo sát theo khoảng thời gian đã chọn.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={handleExportJSON} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #6366f1, #7c5df7)", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif"}}>
                  <Download size={16} /> Xuất JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
      `}</style>
    </div>
  );
}
