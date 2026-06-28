/**
 * Admin AnalyticsPage — Full Fixed Version
 * Fixes:
 * 1. ChartBox: removed position:absolute wrapper → recharts width/height=-1 resolved
 * 2. dashboard.trend used directly as fallback when trend state is loading
 * 3. fetchTrend normalizes payload to { trend: [...] } shape
 * 4. All data paths verified against API response shape
 * 5. getFilteredResponses page/limit params fixed
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Legend} from "recharts";
import {
  ArrowLeft, RefreshCw, Download, Users, CheckCircle, Clock,
  TrendingUp, Target, FileText, Table, Filter, ChevronDown, ChevronUp,
  Zap, Sparkles, BarChart3, Activity, Award, Eye, X,
  Search, ThumbsUp, Minus,
  TrendingDown, Calendar, ChevronRight, Copy, FileSpreadsheet,
  Brain} from "lucide-react";
import analyticsService from "@/services/analyticsService";
import { toast } from "react-toastify";
import {
  adminTheme as T, chartColors, questionTypeBadge,
  DATE_PRESETS, resolveDatePreset, formatNumber} from "@/styles/designSystem";
import {
  SkeletonStatCard, SkeletonChart, SkeletonQuestionCard,
  SkeletonTableRow, RetrySection, Shimmer} from "@/components/common/Skeleton/index.jsx";

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",   label: "Tổng quan",          icon: BarChart3 },
  { id: "questions",  label: "Chi tiết câu hỏi",   icon: Target },
  { id: "responses",  label: "Danh sách phản hồi", icon: Users },
  { id: "crosstab",   label: "Cross Tab",           icon: Table },
  { id: "ai",         label: "AI Insights",          icon: Brain },
  { id: "export",     label: "Xuất dữ liệu",        icon: FileSpreadsheet },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (typeof n !== "number") return n ?? "—";
  return n.toLocaleString("vi-VN");
}
function fmtDur(s) {
  if (!s) return "—";
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}p ${sec}s`;
}

// ─── CHI-SQUARE TEST ──────────────────────────────────────────────────────────
function chiSquareTest(rows) {
  if (!rows || rows.length < 4) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total < 10) return null;

  const rowTotals = {};
  const colTotals = {};
  rows.forEach(r => {
    rowTotals[r.option_a_id] = (rowTotals[r.option_a_id] || 0) + r.count;
    colTotals[r.option_b_id] = (colTotals[r.option_b_id] || 0) + r.count;
  });

  let chiSq = 0;
  rows.forEach(r => {
    const expected = (rowTotals[r.option_a_id] * colTotals[r.option_b_id]) / total;
    if (expected > 0) chiSq += Math.pow(r.count - expected, 2) / expected;
  });

  const df = (Object.keys(rowTotals).length - 1) * (Object.keys(colTotals).length - 1);
  if (df < 1) return null;

  const cramersV = Math.sqrt(chiSq / (total * Math.min(Object.keys(rowTotals).length - 1, Object.keys(colTotals).length - 1)));

  let significance = "Không có ý nghĩa";
  if (chiSq > 3.84)  significance = "Có ý nghĩa";
  if (chiSq > 6.63)  significance = "Rất có ý nghĩa";
  if (chiSq > 10.83) significance = "Cực kỳ có ý nghĩa";

  const v = Math.abs(cramersV);
  let strength = "Không";
  if (v > 0.1) strength = "Yếu";
  if (v > 0.3) strength = "Trung bình";
  if (v > 0.5) strength = "Mạnh";
  if (v > 0.7) strength = "Rất mạnh";

  return {
    chi_square: parseFloat(chiSq.toFixed(3)),
    cramers_v: parseFloat(Math.abs(cramersV).toFixed(3)),
    degrees_of_freedom: df,
    total_samples: total,
    significance,
    strength,
    has_correlation: chiSq > 3.84};
}

// ─── NPS CALCULATION ──────────────────────────────────────────────────────────
function calcNPS(answers) {
  if (!answers || answers.length === 0) return null;
  const promoters  = answers.filter(a => a >= 9).length;
  const detractors = answers.filter(a => a <= 6).length;
  const n = answers.length;
  return {
    score: parseFloat((((promoters - detractors) / n) * 100).toFixed(1)),
    promoters, detractors, passives: n - promoters - detractors, n,
    promoter_pct:  parseFloat(((promoters  / n) * 100).toFixed(1)),
    detractor_pct: parseFloat(((detractors / n) * 100).toFixed(1))};
}

// ─── CHART BOX ───────────────────────────────────────────────────────────────
// FIX: Do NOT use position:absolute on the inner wrapper.
// ResponsiveContainer reads the clientWidth/clientHeight of its direct parent.
// If parent is position:absolute and not yet painted, it returns -1.
// Solution: just a plain div with explicit pixel height + minWidth:0 to handle flex shrink.
function ChartBox({ height = 240, children }) {
  return (
    <div style={{ width: "100%", height: height, minWidth: 0 }}>
      {children}
    </div>
  );
}

// ─── CHART TOOLTIP ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12,
      padding: "12px 16px"}}>
      <p style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 14, fontWeight: 500 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "#3B82F6" }) {
  const [w, setW] = useState(0);
  const pct = max > 0 ? (value / max) * 100 : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 60); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height: 6, background: "#F4F3F8", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 999, width: `${w}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}} />
    </div>
  );
}

// ─── DATE HEATMAP ─────────────────────────────────────────────────────────────
function DateHeatmap({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const getColor = (count) => {
    if (count === 0) return "#F4F3F8";
    const ratio = count / max;
    if (ratio < 0.25) return "#1e3a5f";
    if (ratio < 0.5)  return "#2563eb";
    if (ratio < 0.75) return "#3b82f6";
    return "#60a5fa";
  };

  const weeks = [];
  let week = [];
  const startDay = new Date(data[0]?.date).getDay() || 7;
  for (let i = 1; i < startDay; i++) week.push(null);
  data.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

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
                transition: "transform 0.15s"}}
                onMouseEnter={e => { if (day) e.currentTarget.style.transform = "scale(1.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                title={day ? `${day.date}: ${day.count} phản hồi` : ""}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "#4B5563" }}>Ít</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: getColor(r * max) }} />
        ))}
        <span style={{ fontSize: 10, color: "#4B5563" }}>Nhiều</span>
      </div>
    </div>
  );
}

// ─── FUNNEL / DROP-OFF ────────────────────────────────────────────────────────
function FunnelViz({ dropOffData }) {
  if (!dropOffData || dropOffData.length === 0) return null;
  const sorted = [...dropOffData].sort((a, b) => b.answered_count - a.answered_count);
  const funnelData = sorted.slice(0, 10).map(d => ({
    name: `Q${d.question_i?.slice(-3) || "?"}`,
    value: d.answered_count}));
  return (
    <ChartBox height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
          <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
            {funnelData.map((_, i) => (
              <Cell key={i} fill={chartColors[i % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

// ─── NPS CARD ─────────────────────────────────────────────────────────────────
function NPSCard({ npsData }) {
  if (!npsData) return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20, textAlign: "center" }}>
      <p style={{ color: "#9CA3AF", fontSize: 14 }}>Cần câu hỏi đánh giá (RATING 1-10) để tính NPS</p>
    </div>
  );
  const scoreColor = npsData.score >= 50 ? "#10b981" : npsData.score >= 0 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <ThumbsUp size={17} color="#3B82F6" />
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>NPS Score</h4>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div>
          <p style={{ fontSize: 48, fontWeight: 600, color: scoreColor, lineHeight: 1, margin: 0 }}>{npsData.score}</p>
          <p style={{ fontSize: 14, color: "#9CA3AF", marginTop: 4 }}>trên 100</p>
        </div>
        <div style={{ flex: 1, paddingBottom: 4 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {[
              { label: "Promoter",  count: npsData.promoters,  color: "#10b981" },
              { label: "Passive",   count: npsData.passives,   color: "#f59e0b" },
              { label: "Detractor", count: npsData.detractors, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: "#FFFFFF", border: `1px solid ${s.color}30`, borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: s.color, margin: 0 }}>{s.count}</p>
                <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8 }}>
            <div style={{ flex: npsData.promoter_pct, background: "#10b981" }} />
            <div style={{ flex: 100 - npsData.promoter_pct - npsData.detractor_pct, background: "#f59e0b" }} />
            <div style={{ flex: npsData.detractor_pct, background: "#ef4444" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const iconColors = {
    indigo:  "#3B82F6",
    emerald: "#10b981",
    violet:  "#60A5FA",
    amber:   "#f59e0b",
    cyan:    "#06b6d4"};
  const c = iconColors[color] || iconColors.indigo;
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E8E6F0", borderRadius: 12, padding: 20,
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`}}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.1 }}>{visible ? value : "—"}</p>
          {sub && <p style={{ fontSize: 14, color: "#9CA3AF", marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "#FFFFFF", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={c} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

// ─── TYPE BADGE ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = questionTypeBadge?.[type] || { label: type, bg: "#F4F3F8", color: "#374151" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, background: t.bg, color: t.color }}>
      {t.label}
    </span>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc, onAction, actionLabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", background: "#FFFFFF", border: "1px dashed #E8E6F0", borderRadius: 12, gap: 12, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F4F3F8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={28} color="#9CA3AF" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#9CA3AF", maxWidth: 300, lineHeight: 1.6, margin: 0 }}>{desc}</p>
      {onAction && actionLabel && (
        <button onClick={onAction} style={{ marginTop: 8, height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#FFFFFF", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── QUESTION CARD ────────────────────────────────────────────────────────────
function QuestionCard({ question, index }) {
  const [expanded, setExpanded] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimDone(true), index * 60 + 150); return () => clearTimeout(t); }, [index]);

  const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type);
  const isNumber = ["RATING", "NUMBER"].includes(question.type);
  const isText   = ["TEXT", "PARAGRAPH", "EMAIL"].includes(question.type);
  const isDate   = question.type === "DATE";
  const topOpt   = question.options?.[0];

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${expanded ? "#3B82F6" : "#E8E6F0"}`,
      borderRadius: 12, overflow: "hidden",
      opacity: animDone ? 1 : 0, transform: animDone ? "translateY(0)" : "translateY(12px)",
      transition: `all 0.4s ease ${index * 60}ms`}}>
      {/* Header */}
      <div
        style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, color: "#FFFFFF", flexShrink: 0 }}>
            {index + 1}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {question.question_content || question.question_i?.slice(0, 8) + "…"}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TypeBadge type={question.type} />
              <span style={{ fontSize: 14, color: "#9CA3AF" }}>{question.total_responses ?? 0} phản hồi</span>
              {topOpt && (
                <span style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={11} /> {topOpt.label?.slice(0, 15)} ({topOpt.percent}%)
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #E8E6F0" }}>

          {/* CHOICE */}
          {isChoice && question.options && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <ChartBox height={180}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.options} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" horizontal={false} />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                      <YAxis dataKey="label" type="category" stroke="#9CA3AF" fontSize={11} width={120} tickFormatter={v => v?.length > 15 ? v.slice(0, 15) + "…" : v} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={20}>
                        {question.options.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {question.options.map((opt, i) => (
                    <div key={opt.option_id || i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: chartColors[i % chartColors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</span>
                    <div style={{ width: 140 }}><ProgressBar value={opt.count} max={question.options[0]?.count || 1} color={chartColors[i % chartColors.length]} /></div>
                    <span style={{ fontSize: 12, color: "#9CA3AF", width: 42, textAlign: "right" }}>{opt.percent}%</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", width: 30, textAlign: "right", fontWeight: 700 }}>{opt.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NUMBER / RATING */}
          {isNumber && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Trung bình", value: question.avg?.toFixed(1),    color: "#3B82F6" },
                  { label: "Thấp nhất",  value: question.min,                color: "#9CA3AF" },
                  { label: "Cao nhất",   value: question.max,                color: "#9CA3AF" },
                  { label: "Độ lệch",    value: question.stddev?.toFixed(2), color: "#9CA3AF" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 12, textAlign: "center" }}>
                    <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 6 }}>{item.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 600, color: item.color, margin: 0 }}>{item.value ?? "—"}</p>
                  </div>
                ))}
              </div>
              {question.distribution?.length > 0 && (
                <ChartBox height={160}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                      <XAxis dataKey={question.type === "RATING" ? "rating" : "value"} stroke="#9CA3AF" fontSize={11} />
                      <YAxis stroke="#9CA3AF" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {question.distribution.map((_, i) => (
                          <Cell key={i} fill="#3B82F6" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              )}
            </div>
          )}

          {/* DATE */}
          {isDate && (
            <div style={{ paddingTop: 18 }}>
              {question.distribution?.length > 0 ? (
                <ChartBox height={180}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                      <YAxis stroke="#9CA3AF" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartBox>
              ) : <p style={{ color: "#9CA3AF", textAlign: "center", padding: "20px 0" }}>Chưa có dữ liệu ngày</p>}
            </div>
          )}

          {/* TEXT */}
          {isText && (
            <div style={{ paddingTop: 18 }}>
              {question.answers?.length > 0 ? (
                <>
                  {question.word_frequency?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 10 }}>Từ khóa nổi bật</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {question.word_frequency.slice(0, 16).map((item, i) => (
                          <span key={item.word || i} style={{ padding: "4px 10px", background: "#F4F3F8", color: "#374151", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "1px solid #E8E6F0" }}>
                            {item.word} <span style={{ opacity: 0.6 }}>({item.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                    {question.answers.map((ans, i) => (
                      <div key={ans.id || i} style={{ background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#374151" }}>
                        {ans.text || ans.answer_text || "—"}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF" }}>Chưa có câu trả lời</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RESPONSE ROW ─────────────────────────────────────────────────────────────
function ResponseRow({ response }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.03)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ width: 32, textAlign: "center", fontSize: 11, fontFamily: "monospace", color: "#4B5563" }}>{response.response_i?.slice(0, 6)}</div>
        <div style={{ flex: 1 }}>
           <span style={{
            display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 8, fontSize: 11, fontWeight: 500,
            background: "#F4F3F8",
            color: response.status === "COMPLETED" ? "#10b981" : "#f59e0b",
            border: `1px solid ${response.status === "COMPLETED" ? "#10b981" : "#f59e0b"}`}}>
            {response.status === "COMPLETED" ? "✓ Hoàn thành" : "○ Đang làm"}
          </span>
        </div>
        <div style={{ fontSize: 14, color: "#9CA3AF", width: 70, textAlign: "right" }}>{response.time_to_complete_seconds ? fmtDur(response.time_to_complete_seconds) : "—"}</div>
        <div style={{ fontSize: 14, color: "#9CA3AF", width: 40, textAlign: "right" }}>{response.answers?.length || 0}</div>
        <div style={{ fontSize: 14, color: "#9CA3AF", width: 80, textAlign: "right", fontFamily: "monospace" }}>
          {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : "—"}
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "transparent", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && response.answers?.length > 0 && (
        <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {response.answers.map((ans, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ans.question_content}</p>
                <p style={{ fontSize: 14, color: "#374151", margin: 0, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ans.value || ans.answer_text || "—"}
                </p>
              </div>
              <TypeBadge type={ans.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DATE PRESET SELECTOR ─────────────────────────────────────────────────────
function DatePresetSelector({ activePreset, onChange }) {
  const [show, setShow] = useState(false);
  const current = DATE_PRESETS?.find(p => p.value === activePreset) || { label: "30 ngày" };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setShow(!show)} style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px", background: "#FFFFFF", border: "1px solid #3B82F6", borderRadius: 8, color: "#3B82F6", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
        <Filter size={14} /> {current.label} <ChevronDown size={14} />
      </button>
      {show && (
        <>
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 6, zIndex: 200, minWidth: 155}}>
            {(DATE_PRESETS || []).map(p => (
              <button key={p.value} onClick={() => { onChange(p.value); setShow(false); }} style={{ width: "100%", display: "flex", alignItems: "center", padding: "9px 14px", borderRadius: 8, border: "none", background: p.value === activePreset ? "#3B82F6" : "transparent", color: p.value === activePreset ? "#FFFFFF" : "#374151", fontSize: 13, fontWeight: p.value === activePreset ? 500 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left" }}>
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShow(false)} />
        </>
      )}
    </div>
  );
}

// ─── TREND GROUP-BY SWITCHER ──────────────────────────────────────────────────
function TrendSwitcher({ value, onChange }) {
  const opts = [{ label: "Ngày", value: "day" }, { label: "Tuần", value: "week" }, { label: "Tháng", value: "month" }];
  return (
    <div style={{ display: "flex", background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 8, padding: 3, gap: 2 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", background: value === o.value ? "#3B82F6" : "transparent", color: value === o.value ? "#FFFFFF" : "#9CA3AF" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder = "Tìm kiếm phản hồi..." }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <Search size={15} color={focused ? "#3B82F6" : "#9CA3AF"} style={{ position: "absolute", left: 14, pointerEvents: "none" }} />
      <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder}
        style={{ height: 36, padding: "0 14px 0 40px", width: "100%", background: "#FFFFFF", border: `1px solid ${focused ? "#3B82F6" : "#E8E6F0"}`, borderRadius: 8, fontSize: 14, color: "#374151", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ position: "absolute", right: 10, background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── STATUS FILTER ────────────────────────────────────────────────────────────
function StatusFilter({ value, onChange }) {
  const opts = [{ label: "Tất cả", value: "" }, { label: "Hoàn thành", value: "COMPLETED" }, { label: "Đang làm", value: "IN_PROGRESS" }];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: value === o.value ? "2px solid #3B82F6" : "1px solid #E8E6F0", background: value === o.value ? "#3B82F6" : "#FFFFFF", color: value === o.value ? "#FFFFFF" : "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [trendGroup, setTrendGroup] = useState("day");

  // ─── SECTION STATES ───────────────────────────────────────────────────────────
  // Dashboard: { overview, trend, questions } — from getDashboard
  const [dashboard, setDashboard] = useState(null);
  const [dashLoad, setDashLoad]   = useState(true);
  const [dashErr, setDashErr]     = useState(null);

  // Completion stats (separate endpoint)
  const [comp, setComp]   = useState(null);
  const [cLoad, setCLoad] = useState(true);
  const [cErr, setCErr]   = useState(null);

  // Trend (separate endpoint, kept for group-by switcher)
  // FIX: normalized to { trend: [...] } shape regardless of API response shape
  const [trend, setTrend] = useState(null);
  const [tLoad, setTLoad] = useState(true);
  const [tErr, setTErr]   = useState(null);

  // Survey questions (full analytics — separate endpoint for detail tab)
  const [survey, setSurvey]   = useState(null);
  const [svLoad, setSvLoad]   = useState(true);
  const [svErr, setSvErr]     = useState(null);

  // Heatmap
  const [hmData, setHmData]   = useState(null);
  const [hmLoad, setHmLoad]   = useState(true);
  const [hmErr, setHmErr]     = useState(null);

  // Responses tab
  const [responses, setResponses] = useState(null);
  const [rLoad, setRLoad]         = useState(false);
  const [rErr, setRErr]           = useState(null);
  const [rPage, setRPage]         = useState(1);
  const [rSearch, setRSearch]     = useState("");
  const [rStatus, setRStatus]     = useState("");

  // Cross-tab
  const [crossTab, setCrossTab]     = useState(null);
  const [ctLoading, setCtLoading]   = useState(false);
  const [selectedQ1, setSelectedQ1] = useState(null);
  const [selectedQ2, setSelectedQ2] = useState(null);
  const [chiResult, setChiResult]   = useState(null);

  // AI Insights
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoad, setAiLoad]        = useState(false);
  const [aiErr, setAiErr]          = useState(null);

  // Real-time
  const [liveResponseCount, setLiveResponseCount] = useState(null);
  const socketRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  // ─── DATE HELPERS ─────────────────────────────────────────────────────────────
  const applyPreset = useCallback((preset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    if (typeof resolveDatePreset === "function") {
      const { from, to } = resolveDatePreset(preset);
      setDateFrom(from || "");
      setDateTo(to || "");
    }
  }, []);

  useEffect(() => { applyPreset("30d"); }, []);

  // ─── FETCH HELPERS ────────────────────────────────────────────────────────────
  const buildParams = useCallback(() => {
    const p = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo)   p.date_to   = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  /**
   * FIX: getDashboard response shape:
   *   axios: response.data = { success, data: { overview, trend, questions } }
   *   so payload = response.data.data = { overview, trend, questions }
   *
   * We also sync dashboard.trend into the trend state (normalized) so the
   * trend chart works immediately without waiting for a separate fetchTrend call.
   */
  const fetchDashboard = useCallback(async () => {
    setDashLoad(true); setDashErr(null);
    try {
      const response = await analyticsService.getDashboard(surveyId, buildParams());
      // response.data (axios) = { success, data: { overview, trend, questions } }
      const payload = response.data?.data ?? response.data ?? {};
      setDashboard(payload);

      // Sync dashboard.trend into trend state as fallback
      // API returns trend as array directly: [{ period, count }]
      if (Array.isArray(payload.trend) && payload.trend.length > 0) {
        setTrend({ trend: payload.trend });
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setDashErr(e?.response?.data?.message || e?.message || "Lỗi tải dashboard");
    } finally {
      setDashLoad(false);
    }
  }, [surveyId, buildParams]);

  const fetchCompletion = useCallback(async () => {
    setCLoad(true); setCErr(null);
    try {
      const response = await analyticsService.getCompletionStats(surveyId, buildParams());
      const payload = response.data?.data ?? response.data ?? {};
      setComp(payload);
    } catch (e) {
      console.error("Completion fetch error:", e);
      setCErr(e?.response?.data?.message || e?.message || "Lỗi tải completion");
    } finally {
      setCLoad(false);
    }
  }, [surveyId, buildParams]);

  /**
   * FIX: getResponseTrend may return:
   *   { success, data: { trend: [...] } }  → payload.trend = [...]
   *   OR { success, data: [...] }           → payload = [...]
   * Normalize to { trend: [...] } in both cases.
   */
  const fetchTrend = useCallback(async (group = trendGroup) => {
    setTLoad(true); setTErr(null);
    try {
      const response = await analyticsService.getResponseTrend(surveyId, group, buildParams());
      const raw = response.data?.data ?? response.data ?? {};
      // Normalize: if raw is array treat as trend array directly
      const normalized = Array.isArray(raw)
        ? { trend: raw }
        : { trend: raw.trend ?? raw.data ?? [] };
      setTrend(normalized);
    } catch (e) {
      console.error("Trend fetch error:", e);
      setTErr(e?.response?.data?.message || e?.message || "Lỗi tải trend");
    } finally {
      setTLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, buildParams]);

  /**
   * getSurveyAnalytics returns { success, data: { survey_id, questions: [...] } }
   */
  const fetchSurvey = useCallback(async () => {
    setSvLoad(true); setSvErr(null);
    try {
      const response = await analyticsService.getSurveyAnalytics(surveyId, buildParams());
      const payload = response.data?.data ?? response.data ?? {};
      setSurvey(payload);
    } catch (e) {
      console.error("Survey analytics fetch error:", e);
      setSvErr(e?.response?.data?.message || e?.message || "Lỗi tải câu hỏi");
    } finally {
      setSvLoad(false);
    }
  }, [surveyId, buildParams]);

  const fetchHeatmap = useCallback(async () => {
    setHmLoad(true); setHmErr(null);
    try {
      const response = await analyticsService.getDateHeatmap(surveyId, buildParams());
      const payload = response.data?.data ?? response.data ?? {};
      setHmData(payload);
    } catch (e) {
      console.error("Heatmap fetch error:", e);
      setHmErr(e?.response?.data?.message || e?.message || "Lỗi tải heatmap");
    } finally {
      setHmLoad(false);
    }
  }, [surveyId, buildParams]);

  /**
   * FIX: page and limit are passed inside params object.
   */
  const fetchResponses = useCallback(async (page = 1) => {
    setRLoad(true); setRErr(null);
    try {
      const params = {
        ...buildParams(),
        page,
        limit: 15,
        ...(rSearch ? { search_query: rSearch } : {}),
        ...(rStatus ? { status: rStatus }       : {})};
      const response = await analyticsService.getFilteredResponses(surveyId, params);
      const payload = response.data?.data ?? response.data ?? {};
      setResponses(payload);
    } catch (e) {
      console.error("Responses fetch error:", e);
      setRErr(e?.response?.data?.message || e?.message || "Lỗi tải phản hồi");
    } finally {
      setRLoad(false);
    }
  }, [surveyId, rSearch, rStatus, buildParams]);

  // ─── CROSS TAB ────────────────────────────────────────────────────────────────
  const fetchCrossTab = useCallback(async () => {
    if (!selectedQ1 || !selectedQ2) return;
    setCtLoading(true);
    try {
      const response = await analyticsService.getCrossTab(surveyId, selectedQ1, selectedQ2, buildParams());
      const data = response.data?.data ?? response.data ?? {};
      setCrossTab(data);

      if (data?.rows?.length > 0) {
        const flatRows = data.rows.flatMap(row =>
          Object.values(row.breakdown || {}).map(cell => ({
            option_a_id: row.option_id,
            option_b_id: cell.option_id,
            count: cell.count}))
        );
        setChiResult(chiSquareTest(flatRows));
      } else {
        setChiResult(null);
      }
    } catch (e) {
      console.error("CrossTab error:", e);
      toast.error("Không tải được cross-tab");
    } finally {
      setCtLoading(false);
    }
  }, [surveyId, selectedQ1, selectedQ2, buildParams]);

  // ─── AI INSIGHTS ─────────────────────────────────────────────────────────────
  const fetchAiInsights = useCallback(async () => {
    setAiLoad(true); setAiErr(null);
    try {
      const response = await analyticsService.getAiInsights(surveyId, buildParams());
      const payload = response.data?.data?.ai_insights ?? response.data?.data ?? null;
      setAiInsights(payload);
    } catch (e) {
      console.error("AI Insights error:", e);
      setAiErr(e?.response?.data?.message || e?.message || "Lỗi tải AI Insights");
    } finally {
      setAiLoad(false);
    }
  }, [surveyId, buildParams]);

  // ─── EFFECTS ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboard();
    fetchCompletion();
    fetchSurvey();
    fetchHeatmap();
  }, [fetchDashboard, fetchCompletion, fetchSurvey, fetchHeatmap]);

  // Re-fetch trend when trendGroup changes (without re-fetching dashboard)
  useEffect(() => { fetchTrend(trendGroup); }, [trendGroup, fetchTrend]);

  useEffect(() => {
    if (activeTab === "responses") fetchResponses(rPage);
  }, [activeTab, rPage, fetchResponses]);

  useEffect(() => {
    if (selectedQ1 && selectedQ2) fetchCrossTab();
  }, [fetchCrossTab]);

  useEffect(() => {
    if (activeTab === "ai") fetchAiInsights();
  }, [activeTab, fetchAiInsights]);

  // ─── SOCKET ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !surveyId) return;
    const socket = io(API_URL, { auth: { token }, reconnectionDelay: 1000 });
    socketRef.current = socket;
    socket.on("connect", () => { socket.emit("admin:watch-survey", surveyId); });
    socket.on("survey:new-response", (data) => {
      if (data.survey_id === surveyId) {
        setLiveResponseCount(data.total_responses);
        toast.info(`📊 Phản hồi mới! Tổng: ${data.total_responses}`, { autoClose: 3000 });
      }
    });
    return () => { socket.disconnect(); };
  }, [surveyId]);

  // ─── DERIVED DATA ─────────────────────────────────────────────────────────────
  // overview: from dashboard.overview (getDashboard response)
  const overviewStats = dashboard?.overview ?? {};

  // questions: prefer survey.questions (getSurveyAnalytics, more detailed)
  // fallback to dashboard.questions (getDashboard)
  const questions = survey?.questions ?? dashboard?.questions ?? [];
  const choiceQs  = questions.filter(q => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type));

  // trend data: prefer dedicated fetchTrend result, fallback to dashboard.trend
  // Both are normalized to { trend: [...] } shape
  const trendData = trend?.trend ?? (Array.isArray(dashboard?.trend) ? dashboard.trend : []);

  // overview avg_completion_time: getDashboard returns it as display string
  // getCompletionStats returns avg_completion_time_display separately
  const avgTimeDisplay = overviewStats.avg_completion_time ?? comp?.avg_completion_time_display ?? "—";

  // NPS from rating questions
  const ratingQs   = questions.filter(q => q.type === "RATING");
  const npsAnswers = ratingQs.flatMap(q =>
    (q.distribution || []).flatMap(d => Array(d.count || 0).fill(d.rating))
  );
  const npsData = calcNPS(npsAnswers);

  const handleRefreshAll = () => {
    fetchDashboard();
    fetchTrend();
    fetchCompletion();
    fetchSurvey();
    fetchHeatmap();
    if (activeTab === "responses") fetchResponses(rPage);
    if (activeTab === "ai") fetchAiInsights();
  };

  // ─── EXPORT ───────────────────────────────────────────────────────────────────
  const handleExport = async (format) => {
    try {
      if (format === "csv") {
        const { url, token } = analyticsService.exportCSV(surveyId, buildParams());
        const a = document.createElement("a");
        a.href = url + (url.includes("?") ? "&" : "?") + `Authorization=Bearer ${token}`;
        a.download = `survey-${surveyId}.csv`;
        a.click();
        toast.success("Đang tải CSV...");
      } else {
        const [surveyR, compR, trendR] = await Promise.all([
          analyticsService.getSurveyAnalytics(surveyId, buildParams()),
          analyticsService.getCompletionStats(surveyId, buildParams()),
          analyticsService.getResponseTrend(surveyId, "day", buildParams()),
        ]);
        const exportData = {
          survey_id: surveyId,
          exported_at: new Date().toISOString(),
          overview: compR.data?.data,
          trend: trendR.data?.data,
          questions: surveyR.data?.data?.questions};
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `analytics-${surveyId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Đã xuất JSON");
      }
    } catch { toast.error("Xuất thất bại"); }
  };

  const chartCard = {
    background: "#FFFFFF",
    border: "1px solid #E8E6F0",
    borderRadius: 12, padding: 20};

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F4F3F8", color: "#374151", fontSize: 14, fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 80% 50% at 20% 20%, rgba(245,158,11,0.08) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(96,165,250,0.06) 0%, transparent 50%)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#FFFFFF", borderBottom: "1px solid #E8E6F0" }}>
        <div style={{ padding: "16px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => navigate(-1)} style={{ width: 42, height: 42, borderRadius: 8, border: "1px solid #3B82F6", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#3B82F6" }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={18} color="#3B82F6" />
                  <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: 0 }}>Phân tích Khảo sát</h1>
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, marginTop: 3, fontFamily: "monospace" }}>{surveyId}</p>
              </div>
            </div>
            <button onClick={handleRefreshAll} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", background: "#FFFFFF", color: "#3B82F6", border: "1px solid #3B82F6", borderRadius: 8, height: 36, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>
        </div>
        <div style={{ padding: "0 28px", display: "flex", gap: 4 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const is = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: "14px 14px 0 0", border: "none", borderBottom: is ? "2px solid #3B82F6" : "2px solid transparent", background: "transparent", color: is ? "#3B82F6" : "#9CA3AF", fontSize: 13, fontWeight: is ? 500 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px 48px", maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Filter Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <Filter size={15} color="#9CA3AF" />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Khoảng thời gian:</span>
          <DatePresetSelector activePreset={datePreset} onChange={applyPreset} />
          {datePreset === "custom" && (
            <>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ height: 36, padding: "0 12px", background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 8, fontSize: 14, color: "#374151", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              <span style={{ color: "#9CA3AF" }}>—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ height: 36, padding: "0 12px", background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 8, fontSize: 14, color: "#374151", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
            </>
          )}
          {/* Live indicator */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: liveResponseCount !== null ? "#10b981" : "#9CA3AF"}} />
            <span style={{ fontSize: 11, color: liveResponseCount !== null ? "#10b981" : "#9CA3AF", fontWeight: 600 }}>
              {liveResponseCount !== null ? `Live · ${liveResponseCount} phản hồi` : "Real-time"}
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════ OVERVIEW ══ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {dashLoad ? [1,2,3,4,5].map(i => <SkeletonStatCard key={i} theme="dark" />) : (
                <>
                  <StatCard label="Tổng bắt đầu"    value={fmt(overviewStats.total_started    ?? comp?.total_started    ?? 0)} icon={Users}       color="indigo"  delay={0}   />
                  <StatCard label="Hoàn thành"        value={fmt(overviewStats.total_completed  ?? comp?.total_completed  ?? 0)} icon={CheckCircle}  color="emerald" delay={80}  />
                  <StatCard label="Tỷ lệ hoàn thành" value={`${overviewStats.completion_rate   ?? comp?.completion_rate  ?? 0}%`} icon={TrendingUp}   color="violet"  delay={160} />
                  <StatCard label="Thời gian TB"      value={avgTimeDisplay}                                                      icon={Clock}        color="amber"   delay={240} />
                  <StatCard label="Tổng câu hỏi"      value={questions.length}                                                    icon={Target}       color="cyan"    delay={320} />
                  {npsData && <StatCard label="NPS Score" value={npsData.score} icon={ThumbsUp} color="emerald" delay={400} sub={`${npsData.promoter_pct}% promoter`} />}
                </>
              )}
            </div>

            {/* Trend + Heatmap */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16 }}>

              {/* Trend chart — uses normalized trendData */}
              <div style={{ ...chartCard }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Activity size={17} color="#3B82F6" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Xu hướng phản hồi</h3>
                  </div>
                  <TrendSwitcher value={trendGroup} onChange={(g) => { setTrendGroup(g); fetchTrend(g); }} />
                </div>
                {(tLoad && trendData.length === 0) ? <Shimmer height={240} /> : trendData.length > 0 ? (
                  <ChartBox height={240}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                        <XAxis dataKey="period" stroke="#9CA3AF" fontSize={11} />
                        <YAxis stroke="#9CA3AF" fontSize={11} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2.5} fill="url(#g1)" dot={false} activeDot={{ r: 6, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartBox>
                ) : <EmptyState icon={Activity} title="Chưa có dữ liệu xu hướng" desc="Khảo sát chưa có phản hồi nào trong khoảng thời gian này" />}
                {tErr && <p style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>{tErr} <button onClick={fetchTrend} style={{ color: "#3B82F6", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer" }}>Thử lại</button></p>}
              </div>

              {/* Heatmap */}
              <div style={{ ...chartCard }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={17} color="#3B82F6" />
                  </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Lịch hoạt động</h3>
                </div>
                {hmLoad ? <Shimmer height={160} /> : hmData?.heatmap?.length > 0 ? (
                  <DateHeatmap data={hmData.heatmap} />
                ) : <EmptyState icon={Calendar} title="Không có dữ liệu" desc="Chưa có phản hồi nào" />}
                {hmErr && <p style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginTop: 8 }}>{hmErr}</p>}
              </div>
            </div>

            {/* Completion + Funnel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ ...chartCard }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Award size={17} color="#3B82F6" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Tỷ lệ hoàn thành</h3>
                </div>
                {cLoad ? <Shimmer height={200} /> : (
                  <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Hoàn thành", value: comp?.total_completed ?? overviewStats.total_completed ?? 0, color: "#10b981" },
                      { label: "Đang làm",   value: Math.max(0, (comp?.total_started ?? overviewStats.total_started ?? 0) - (comp?.total_completed ?? overviewStats.total_completed ?? 0)), color: "#f59e0b" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{item.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: item.color }}>{fmt(item.value)}</span>
                        </div>
                        <ProgressBar value={item.value} max={comp?.total_started ?? overviewStats.total_started ?? 1} color={item.color} />
                      </div>
                    ))}
                    {(comp?.avg_completion_time_seconds ?? 0) > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 8 }}>
                        <Clock size={14} color="#3B82F6" />
                        <span style={{ fontSize: 14, color: "#374151" }}>Thời gian TB: <strong>{comp?.avg_completion_time_display ?? "—"}</strong></span>
                      </div>
                    )}
                    {cErr && <p style={{ color: "#ef4444", fontSize: 12 }}>{cErr}</p>}
                  </div>
                )}
              </div>

              <div style={{ ...chartCard }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingDown size={17} color="#3B82F6" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Drop-off theo câu hỏi</h3>
                </div>
                {cLoad ? <Shimmer height={220} /> : comp?.drop_off_by_question?.length > 0 ? (
                  <FunnelViz dropOffData={comp.drop_off_by_question} />
                ) : <EmptyState icon={TrendingDown} title="Chưa có dữ liệu drop-off" desc="Không có phản hồi chưa hoàn thành" />}
              </div>
            </div>

            {/* NPS + Pie */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <NPSCard npsData={npsData} />
              <div style={{ ...chartCard }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BarChart3 size={17} color="#3B82F6" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Phân bố câu hỏi</h3>
                </div>
                {svLoad ? <Shimmer height={220} /> : choiceQs.length > 0 ? (
                  <ChartBox height={220}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={choiceQs.slice(0, 7).map((q, i) => ({
                            name: q.question_content?.slice(0, 18) || `Q${i + 1}`,
                            value: q.total_responses || 0}))}
                          cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}
                        >
                          {choiceQs.slice(0, 7).map((_, i) => (
                            <Cell key={i} fill={chartColors[i % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: "#9CA3AF", fontSize: 14 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartBox>
                ) : <EmptyState icon={BarChart3} title="Chưa có câu hỏi dạng lựa chọn" desc="Survey không có câu hỏi lựa chọn" />}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ QUESTIONS ══ */}
        {activeTab === "questions" && (
          <div>
            {svLoad ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1,2,3].map(i => <SkeletonQuestionCard key={i} theme="dark" />)}</div>
            ) : svErr ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <p style={{ color: "#ef4444", marginBottom: 12 }}>{svErr}</p>
                <button onClick={fetchSurvey} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid #3B82F6", background: "#FFFFFF", color: "#3B82F6", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Thử lại</button>
              </div>
            ) : questions.length === 0 ? (
              <EmptyState icon={Target} title="Chưa có câu hỏi" desc="Khảo sát này chưa có câu hỏi nào" actionLabel="Tạo câu hỏi" onAction={() => navigate(`/admin/surveys/${surveyId}`)} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>{questions.length} câu hỏi</p>
                </div>
                {questions.map((q, i) => <QuestionCard key={q.question_id || i} question={q} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════ RESPONSES ══ */}
        {activeTab === "responses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <SearchBar value={rSearch} onChange={v => { setRSearch(v); setRPage(1); }} placeholder="Tìm kiếm trong câu trả lời..." />
              </div>
              <StatusFilter value={rStatus} onChange={v => { setRStatus(v); setRPage(1); }} />
              {(rSearch || rStatus) && (
                <button onClick={() => { setRSearch(""); setRStatus(""); setRPage(1); }} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "transparent", color: "#9CA3AF", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={13} /> Xóa lọc
                </button>
              )}
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileText size={17} color="#3B82F6" />
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Danh sách phản hồi</h3>
                </div>
                <span style={{ fontSize: 14, color: "#9CA3AF", background: "#F4F3F8", padding: "4px 12px", borderRadius: 20 }}>
                  {responses?.pagination?.total_responses ?? 0} tổng số
                </span>
              </div>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid #E8E6F0", fontSize: 14, color: "#9CA3AF" }}>
                <div style={{ width: 32, textAlign: "center" }}>ID</div>
                <div style={{ flex: 1 }}>Trạng thái</div>
                <div style={{ width: 70, textAlign: "right" }}>Thời gian</div>
                <div style={{ width: 40, textAlign: "right" }}>Câu</div>
                <div style={{ width: 80, textAlign: "right" }}>Ngày</div>
                <div style={{ width: 28 }}></div>
              </div>
              {rLoad
                ? [1,2,3,4,5].map(i => <SkeletonTableRow key={i} cols={5} theme="dark" />)
                : rErr
                    ? <div style={{ padding: "40px 20px", textAlign: "center" }}><p style={{ color: "#ef4444" }}>{rErr}</p><button onClick={() => fetchResponses(rPage)} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid #3B82F6", background: "#FFFFFF", color: "#3B82F6", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Thử lại</button></div>
                  : responses?.responses?.length > 0
                    ? responses.responses.map(r => <ResponseRow key={r.response_id} response={r} />)
                    : <div style={{ padding: "60px 20px", textAlign: "center" }}><EmptyState icon={Eye} title="Không tìm thấy phản hồi" desc={rSearch || rStatus ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm" : "Chưa có phản hồi nào trong khoảng thời gian này"} /></div>
              }
              {/* Pagination */}
              {(responses?.pagination?.total_pages ?? 0) > 1 && (
                <div style={{ padding: "14px 18px", borderTop: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <button onClick={() => setRPage(p => Math.max(1, p - 1))} disabled={rPage === 1} style={{ height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid #E8E6F0", background: "#FFFFFF", cursor: rPage === 1 ? "not-allowed" : "pointer", fontSize: 14, opacity: rPage === 1 ? 0.4 : 1, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>←</button>
                  {Array.from({ length: Math.min(5, responses.pagination.total_pages) }, (_, i) => i + 1).map(pg => (
                    <button key={pg} onClick={() => setRPage(pg)} style={{ width: 36, height: 36, borderRadius: 8, border: pg === rPage ? "none" : "1px solid #E8E6F0", background: pg === rPage ? "#3B82F6" : "#FFFFFF", color: pg === rPage ? "#FFFFFF" : "#374151", fontWeight: pg === rPage ? 500 : 400, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{pg}</button>
                  ))}
                  <button onClick={() => setRPage(p => Math.min(responses.pagination.total_pages, p + 1))} disabled={rPage === responses.pagination.total_pages} style={{ height: 36, padding: "0 14px", borderRadius: 8, border: "1px solid #E8E6F0", background: "#FFFFFF", cursor: rPage === responses.pagination.total_pages ? "not-allowed" : "pointer", fontSize: 14, opacity: rPage === responses.pagination.total_pages ? 0.4 : 1, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>→</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ CROSSTAB ══ */}
        {activeTab === "crosstab" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ ...chartCard }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Zap size={17} color="#3B82F6" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Cross-Tabulation</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
                {[
                  { label: "Câu hỏi A (Hàng)", val: selectedQ1, set: setSelectedQ1 },
                  { label: "Câu hỏi B (Cột)",  val: selectedQ2, set: setSelectedQ2 },
                ].map(({ label, val, set }, idx) => (
                  <div key={idx}>
                    <label style={{ display: "block", fontSize: 12, color: "#9CA3AF", fontWeight: 600, marginBottom: 8 }}>{label}</label>
                    <select value={val || ""} onChange={e => set(e.target.value || null)} style={{ width: "100%", height: 36, padding: "0 14px", background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#374151", cursor: "pointer" }}>
                      <option value="">Chọn câu hỏi...</option>
                      {choiceQs.map(q => (<option key={q.question_id} value={q.question_id}>{q.question_content?.slice(0, 60)}</option>))}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={fetchCrossTab} disabled={!selectedQ1 || !selectedQ2 || ctLoading} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "#3B82F6", color: "#FFFFFF", fontSize: 14, cursor: !selectedQ1 || !selectedQ2 || ctLoading ? "not-allowed" : "pointer", opacity: !selectedQ1 || !selectedQ2 || ctLoading ? 0.5 : 1, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                {ctLoading ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={15} />}
                Phân tích
              </button>
            </div>

            {/* Chi-square result */}
            {chiResult && (
              <div style={{ ...chartCard, border: chiResult.has_correlation ? "1px solid #10b981" : "1px solid #E8E6F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {chiResult.has_correlation ? <ThumbsUp size={17} color="#10b981" /> : <Minus size={17} color="#f59e0b" />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Kết quả kiểm định Chi-Square</h4>
                    <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>Mối tương quan giữa 2 câu hỏi</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Chi-Square (χ²)", value: chiResult.chi_square,         color: "#D97706" },
                    { label: "Cramér's V",       value: chiResult.cramers_v,          color: "#D97706" },
                    { label: "Bậc tự do (df)",   value: chiResult.degrees_of_freedom, color: "#9CA3AF" },
                    { label: "Mẫu",              value: chiResult.total_samples,      color: "#9CA3AF" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 6 }}>{item.label}</p>
                      <p style={{ fontSize: 24, fontWeight: 600, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Ý nghĩa thống kê",  value: chiResult.significance, color: chiResult.has_correlation ? "#10b981" : "#f59e0b" },
                    { label: "Độ mạnh tương quan", value: chiResult.strength,     color: chiResult.has_correlation ? "#10b981" : "#9CA3AF" },
                    { label: "Kết luận",            value: chiResult.has_correlation ? "Có tương quan ✓" : "Không có tương quan", color: chiResult.has_correlation ? "#10b981" : "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ flex: 1, minWidth: 140, background: "#FFFFFF", border: `1px solid ${item.color}`, borderRadius: 12, padding: "10px 14px" }}>
                      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CrossTab table */}
            {crossTab?.rows?.length > 0 && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E6F0" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                    {crossTab.question_a?.label?.slice(0, 30)} × {crossTab.question_b?.label?.slice(0, 30)}
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F4F3F8" }}>
                        <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 14, color: "#374151", borderBottom: "1px solid #E8E6F0", whiteSpace: "nowrap" }}>
                          {crossTab.question_a?.label?.slice(0, 20)}
                        </th>
                        {Object.values(crossTab.rows[0]?.breakdown || {}).slice(0, 10).map(opt => (
                          <th key={opt.option_id} style={{ padding: "11px 12px", textAlign: "center", fontSize: 14, color: "#374151", borderBottom: "1px solid #E8E6F0" }}>
                            {opt.label?.slice(0, 12)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crossTab.rows.map(row => (
                        <tr key={row.option_id}
                          onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "11px 14px", fontSize: 14, color: "#374151", borderBottom: "1px solid #E8E6F0", whiteSpace: "nowrap" }}>{row.label?.slice(0, 25)}</td>
                          {Object.values(row.breakdown || {}).slice(0, 10).map(cell => {
                            const maxCount = Math.max(...crossTab.rows.flatMap(r => Object.values(r.breakdown || {}).map(c => c.count)), 1);
                            const intensity = cell.count / maxCount;
                            return (
                              <td key={cell.option_id} style={{ padding: "11px 12px", textAlign: "center", borderBottom: "1px solid #E8E6F0" }}>
                                <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: `rgba(59,130,246,${intensity * 0.3})`, color: intensity > 0.5 ? "#FFFFFF" : "#3B82F6" }}>
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

        {/* ══════════════════════════════════════════════ AI INSIGHTS ══ */}
        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ ...chartCard }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={17} color="#3B82F6" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>AI Insights</h3>
                  <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>Phân tích thông minh được tạo bởi AI</p>
                </div>
                <button
                  onClick={fetchAiInsights}
                  disabled={aiLoad}
                  style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid #3B82F6", background: "#FFFFFF", color: "#3B82F6", fontSize: 14, cursor: aiLoad ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: aiLoad ? 0.6 : 1 }}
                >
                  <RefreshCw size={13} style={aiLoad ? { animation: "spin 1s linear infinite" } : {}} />
                  Tải lại
                </button>
              </div>

              {aiLoad ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20, minHeight: 120 }}>
                      <Shimmer height={16} />
                      <div style={{ marginTop: 10 }}><Shimmer height={12} /></div>
                      <div style={{ marginTop: 6 }}><Shimmer height={12} /></div>
                    </div>
                  ))}
                </div>
              ) : aiErr ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ color: "#ef4444", marginBottom: 12 }}>{aiErr}</p>
                  <button onClick={fetchAiInsights} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid #3B82F6", background: "#FFFFFF", color: "#3B82F6", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    Thử lại
                  </button>
                </div>
              ) : aiInsights ? (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8E6F0",
                    borderRadius: 12,
                    padding: "24px",
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                    fontFamily: "'DM Sans', sans-serif",
                    maxHeight: 600,
                    overflowY: "auto"}}
                >
                  {aiInsights.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("### ")) return <h4 key={i} style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "20px 0 8px", borderBottom: "1px solid #E8E6F0", paddingBottom: 6 }}>{trimmed.slice(4)}</h4>;
                    if (trimmed.startsWith("## ")) return <h3 key={i} style={{ fontSize: 17, fontWeight: 600, color: "#111827", margin: "24px 0 10px" }}>{trimmed.slice(3)}</h3>;
                    if (trimmed.startsWith("* **")) {
                      const match = trimmed.match(/^\* \*\*(.+?)\*\*[:—]?\s*(.*)$/);
                      if (match) return (
                        <div key={i} style={{ margin: "10px 0 8px", paddingLeft: 8 }}>
                          <strong style={{ color: "#3B82F6" }}>{match[1]}</strong>
                          {match[2] && <span style={{ color: "#9CA3AF" }}>{match[2]}</span>}
                        </div>
                      );
                    }
                    if (trimmed.startsWith("*   ")) return <li key={i} style={{ marginLeft: 16, marginBottom: 4, color: "#374151" }}>{trimmed.slice(4).replace(/\*\*(.+?)\*\*/g, "$1")}</li>;
                    if (trimmed.startsWith("- **")) {
                      const m = trimmed.match(/^- \*\*(.+?)\*\*[:—]?\s*(.*)$/);
                      if (m) return (
                        <div key={i} style={{ margin: "8px 0 6px", paddingLeft: 8, borderLeft: "3px solid #3B82F6" }}>
                          <strong style={{ color: "#111827" }}>{m[1]}</strong>
                          {m[2] && <span style={{ color: "#9CA3AF" }}> — {m[2]}</span>}
                        </div>
                      );
                    }
                    if (trimmed === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #E8E6F0", margin: "16px 0" }} />;
                    if (!trimmed) return <div key={i} style={{ height: 6 }} />;
                    return <p key={i} style={{ margin: "4px 0", color: "#374151" }}>{trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")}</p>;
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Brain}
                  title="Nhấn 'Tải lại' để bắt đầu"
                  desc="AI sẽ phân tích dữ liệu khảo sát và đưa ra các insights."
                />
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ EXPORT ══ */}
        {activeTab === "export" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...chartCard }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <FileSpreadsheet size={18} color="#3B82F6" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Xuất dữ liệu</h3>
              </div>
              <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20, lineHeight: 1.6 }}>
                Xuất toàn bộ dữ liệu khảo sát theo khoảng thời gian đã chọn.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { icon: FileSpreadsheet, title: "Xuất CSV",  desc: "Định dạng Excel/Google Sheets.", format: "csv",  color: "#10b981" },
                  { icon: Copy,            title: "Xuất JSON", desc: "Dữ liệu thô dạng JSON.",         format: "json", color: "#60A5FA" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.format} style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", transition: "all 0.25s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.transform = "translateY(0)"; }}
                      onClick={() => handleExport(item.format)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: "#F4F3F8", border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={24} color={item.color} />
                        </div>
                        <ChevronRight size={18} color="#9CA3AF" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 6 }}>{item.title}</h4>
                        <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Download size={14} color="#3B82F6" />
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#3B82F6" }}>Tải về ngay</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...chartCard }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 14 }}>Tổng quan dữ liệu</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                {[
                  { label: "Tổng phản hồi",   value: overviewStats.total_started    ?? 0 },
                  { label: "Hoàn thành",        value: overviewStats.total_completed  ?? 0 },
                  { label: "Câu hỏi",           value: questions.length },
                  { label: "Tỷ lệ hoàn thành", value: `${overviewStats.completion_rate ?? 0}%` },
                ].map(item => (
                  <div key={item.label} style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 14, textAlign: "center" }}>
                    <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 6 }}>{item.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: "#111827", margin: 0 }}>{fmt(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        input::placeholder { color: #4B5563; }
      `}</style>
    </div>
  );
}