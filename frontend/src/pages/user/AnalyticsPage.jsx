
/**
 * User AnalyticsPage  Complete redesign (light theme)
 * Features: date heatmap, trend group-by, response search/filter,
 * NPS score, funnel chart, chi-square + Cramér's V, export JSON,
 * empty states, per-section loading/error/retry, unified light theme
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area} from "recharts";
import {
  ArrowLeft, RefreshCw, Download, Users, CheckCircle, Clock,
  TrendingUp, Target, FileText, Table, Filter, ChevronDown, ChevronUp,
  Zap, Sparkles, BarChart3, Activity, Award, Eye, AlertTriangle, X,
  Search, SlidersHorizontal, ThumbsUp, ThumbsDown, Minus,
  TrendingDown, Calendar, ChevronRight, Copy, FileSpreadsheet, EyeOff,
  Venus, Brain} from "lucide-react";
import analyticsService from "@/services/analyticsService";
import { toast } from "react-toastify";
import {
  chartColors, questionTypeBadge,
  DATE_PRESETS, resolveDatePreset, formatNumber} from "@/styles/designSystem";
import {
  SkeletonStatCard, SkeletonChart, SkeletonQuestionCard,
  SkeletonTableRow, RetrySection, Shimmer} from "@/components/common/Skeleton/index.jsx";
import { ROUTERS } from "@/utils/constants";

// --- TABS --------------------------------------------------------------------
const PRIMARY_TABS = [
  { id: "overview",    label: "Tổng quan",          icon: BarChart3 },
  { id: "questions",   label: "Chi tiết câu hỏi",   icon: Target },
  { id: "responses",   label: "Danh sách phản hồi", icon: Users },
];

const MORE_TABS = [
  { id: "gender",     label: "Giới tính",           icon: Venus },
  { id: "crosstab",    label: "Cross Tab",            icon: Table },
  { id: "ai",          label: "AI Insights",          icon: Brain },
  { id: "export",      label: "Xuất dữ liệu",        icon: FileSpreadsheet },
];

// --- HELPERS ------------------------------------------------------------------
function fmt(n) {
  if (typeof n !== "number") return n ?? "";
  return n.toLocaleString("vi-VN");
}

// --- CHI-SQUARE TEST -----------------------------------------------------------
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
  let strength = "Không"; if (v > 0.1) strength = "Yếu"; if (v > 0.3) strength = "Trung bình"; if (v > 0.5) strength = "Mạnh"; if (v > 0.7) strength = "Rất mạnh";
  return {
    chi_square: parseFloat(chiSq.toFixed(3)),
    cramers_v: parseFloat(Math.abs(cramersV).toFixed(3)),
    degrees_of_freedom: df, total_samples: total,
    significance: chiSq > 10.83 ? "Cực kỳ có ý nghĩa" : chiSq > 6.63 ? "Rất có ý nghĩa" : chiSq > 3.84 ? "Có ý nghĩa" : "Không có ý nghĩa",
    strength, has_correlation: chiSq > 3.84};
}

// --- NPS ------------------------------------------------------------------------
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

// --- CHART TOOLTIP -------------------------------------------------------------
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E8E6F0", borderRadius: 12,
      padding: "12px 16px"}}>
      <p style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 14, fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// --- PROGRESS BAR ---------------------------------------------------------------
function ProgressBar({ value, max, color = "#5B4EE8" }) {
  const [w, setW] = useState(0);
  const pct = max > 0 ? (value / max) * 100 : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 60); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height: 6, background: "#E8E6F0", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 999, width: `${w}%`,
        background: color,
        transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}} />
    </div>
  );
}

// --- DATE HEATMAP --------------------------------------------------------------
function DateHeatmap({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const getColor = (count) => {
    if (count === 0) return "#E8E6F0";
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
                transition: "transform 0.15s",
                title: day ? `${day.date}: ${day.count} phản hỏi` : ""}}
                onMouseEnter={e => { if (day) e.currentTarget.style.transform = "scale(1.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>Ít</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: getColor(r * max), border: "1px solid rgba(0,0,0,0.06)" }} />
        ))}
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>Nhiều</span>
      </div>
    </div>
  );
}

// --- FUNNEL --------------------------------------------------------------------
function FunnelViz({ dropOffData }) {
  if (!dropOffData || dropOffData.length === 0) return null;
  const sorted = [...dropOffData].sort((a, b) => b.answered_count - a.answered_count);
  const max = sorted[0]?.answered_count || 1;
  const funnelData = sorted.slice(0, 10).map(d => ({
    name: `Q${d.question_i?.slice(-3) || "?"}`, value: d.answered_count}));
  return (
    <div style={{ height: 200 }}>
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
    </div>
  );
}

// --- NPS CARD ------------------------------------------------------------------
function NPSCard({ npsData }) {
  if (!npsData) return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20, textAlign: "center"}}>
      <p style={{ color: "#9CA3AF", fontSize: 13, fontWeight: 400 }}>Cần câu hỏi đánh giá (RATING 1-10) để tính NPS</p>
    </div>
  );
  const scoreColor = npsData.score >= 50 ? "#10b981" : npsData.score >= 0 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20}}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <ThumbsUp size={17} color="#5B4EE8" />
        <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>NPS Score</h4>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div>
          <p style={{ fontSize: 48, fontWeight: 600, color: scoreColor, lineHeight: 1, margin: 0 }}>{npsData.score}</p>
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, fontWeight: 400 }}>trên 100</p>
        </div>
        <div style={{ flex: 1, paddingBottom: 4 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            {[{ label: "Promoter", count: npsData.promoters, color: "#10b981" }, { label: "Passive", count: npsData.passives, color: "#f59e0b" }, { label: "Detractor", count: npsData.detractors, color: "#ef4444" }].map(s => (
              <div key={s.label} style={{ flex: 1, background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 10, padding: "6px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: s.color, margin: 0 }}>{s.count}</p>
                <p style={{ fontSize: 9, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 8 }}>
            <div style={{ flex: npsData.promoter_pct, background: "#10b981", transition: "width 0.8s" }} />
            <div style={{ flex: 100 - npsData.promoter_pct - npsData.detractor_pct, background: "#f59e0b", transition: "width 0.8s" }} />
            <div style={{ flex: npsData.detractor_pct, background: "#ef4444", transition: "width 0.8s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STAT CARD -----------------------------------------------------------------

function StatCard({ label, value, icon: Icon, sub, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E8E6F0",
      borderRadius: 12,
      padding: 20,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`}}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", margin: 0, marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.1 }}>{visible ? value : ""}</p>
          {sub && <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, fontWeight: 400 }}>{sub}</p>}
        </div>
        <Icon size={20} color="#5B4EE8" style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

// --- TYPE BADGE -----------------------------------------------------------------
function TypeBadge({ type }) {
  const t = questionTypeBadge[type] || { label: type, bg: "#EDE9FF", color: "#5B4EE8" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: t.bg || "#EDE9FF", color: t.color || "#5B4EE8" }}>
      {t.label}
    </span>
  );
}

// --- EMPTY STATE ----------------------------------------------------------------
function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "64px 24px",
      gap: 16, textAlign: "center"}}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F4F3F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={28} color="#ccc" strokeWidth={1.5} />
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#9CA3AF", margin: 0, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 300, lineHeight: 1.6, margin: 0, fontWeight: 400 }}>{desc}</p>
      </div>
      {action && (
        <button onClick={action.onClick} style={{ background: "#5B4EE8", color: "#FFF", border: "none", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// --- QUESTION CARD --------------------------------------------------------------
function QuestionCard({ question, index }) {
  const [expanded, setExpanded] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimDone(true), index * 60 + 150); return () => clearTimeout(t); }, [index]);

  const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type);
  const isNumber = ["RATING", "NUMBER"].includes(question.type);
  const isText   = ["TEXT", "PARAGRAPH", "EMAIL"].includes(question.type);
  const isDate   = question.type === "DATE";
  const topOpt = question.options?.[0];

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${expanded ? "#5B4EE8" : "#E8E6F0"}`,
      borderRadius: 12, overflow: "hidden",
      opacity: animDone ? 1 : 0, transform: animDone ? "translateY(0)" : "translateY(12px)",
      transition: `all 0.4s ease ${index * 60}ms`}}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EDE9FF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, color: "#5B4EE8", flexShrink: 0 }}>
            {index + 1}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0, marginBottom: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {question.question_content || question.question_i?.slice(0, 8) + ""}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TypeBadge type={question.type} />
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>{question.total_responses} phản hỏi</span>
              {topOpt && <span style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4, fontWeight: 400 }}><TrendingUp size={11} /> {topOpt.label?.slice(0, 15)} ({topOpt.percent}%)</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: "#F4F3F8", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #E8E6F0" }}>
          {isChoice && question.options && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ height: 180, marginBottom: 14 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={question.options} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" horizontal={false} />
                    <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
                    <YAxis dataKey="label" type="category" stroke="#9CA3AF" fontSize={11} width={120} tickFormatter={v => v?.length > 15 ? v.slice(0, 15) + "" : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={20}>
                      {question.options.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {question.options.map((opt, i) => (
                  <div key={opt.option_id || i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: chartColors[i % chartColors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 400 }}>{opt.label}</span>
                    <div style={{ width: 140 }}><ProgressBar value={opt.count} max={question.options[0]?.count || 1} color={chartColors[i % chartColors.length]} /></div>
                    <span style={{ fontSize: 12, color: "#9CA3AF", width: 42, textAlign: "right", fontWeight: 400 }}>{opt.percent}%</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", width: 30, textAlign: "right", fontWeight: 600 }}>{opt.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isNumber && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Trung bình", value: question.avg?.toFixed(1), color: "#5B4EE8" },
                  { label: "Thấp nhất", value: question.min, color: "#374151" },
                  { label: "Cao nhất", value: question.max, color: "#374151" },
                  { label: "Độ lệch", value: question.stddev?.toFixed(2), color: "#374151" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6, fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontSize: 20, fontWeight: 600, color: item.color, margin: 0 }}>{item.value ?? ""}</p>
                  </div>
                ))}
              </div>
              {question.distribution?.length > 0 && (
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                      <XAxis dataKey={question.type === "RATING" ? "rating" : "value"} stroke="#9CA3AF" fontSize={11} />
                      <YAxis stroke="#9CA3AF" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        <Cell fill="#5B4EE8" />
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                      <YAxis stroke="#9CA3AF" fontSize={11} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        <Cell fill="#06b6d4" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p style={{ color: "#9CA3AF", textAlign: "center", padding: "20px 0", fontWeight: 400 }}>Chưa có dữ liệu ngày</p>}
            </div>
          )}

          {isText && (
            <div style={{ paddingTop: 18 }}>
              {question.answers?.length > 0 ? (
                <>
                  {question.word_frequency?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10, fontWeight: 500 }}>Từ khóa nổi bật</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {question.word_frequency.slice(0, 16).map((item, i) => (
                          <span key={item.word || i} style={{ padding: "4px 10px", background: "#EDE9FF", color: "#5B4EE8", borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
                            {item.word} <span style={{ opacity: 0.6 }}>({item.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                    {question.answers.map((ans, i) => (
                      <div key={ans.id || i} style={{ background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#374151", fontWeight: 400 }}>
                        {ans.text || ans.answer_text || ""}
                      </div>
                    ))}
                  </div>
                  {question.pagination && (
                    <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 12, fontWeight: 400 }}>
                      Hiển thị {question.answers.length} / {question.pagination.total_answers} câu trả lời
                    </p>
                  )}
                </>
              ) : <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontWeight: 400 }}>Chưa có câu trả lời</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- RESPONSE ROW --------------------------------------------------------------
function ResponseRow({ response }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #E8E6F0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ width: 32, textAlign: "center", fontSize: 11, fontFamily: "monospace", color: "#9CA3AF" }}>{response.response_i?.slice(0, 6)}</div>
        <div style={{ flex: 1 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 999, fontSize: 12, fontWeight: 500,
            background: response.status === "COMPLETED" ? "#d1fae5" : "#fef3c7",
            color: response.status === "COMPLETED" ? "#059669" : "#d97706"}}>
            {response.status === "COMPLETED" ? "? Hoàn thành" : "? Ðang làm"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", width: 70, textAlign: "right", fontWeight: 400 }}>
          {response.time_to_complete_seconds ? `${Math.floor(response.time_to_complete_seconds / 60)}p ${response.time_to_complete_seconds % 60}s` : ""}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", width: 40, textAlign: "right", fontWeight: 400 }}>{response.answers?.length || 0}</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", width: 80, textAlign: "right", fontFamily: "monospace", fontWeight: 400 }}>
          {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : ""}
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F4F3F8", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && response.answers?.length > 0 && (
        <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {response.answers.map((ans, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "10px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ans.question_content}</p>
                <p style={{ fontSize: 13, color: "#374151", margin: 0, marginTop: 3, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ans.value || ans.answer_text || ""}</p>
              </div>
              <TypeBadge type={ans.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- DATE PRESET ----------------------------------------------------------------
function DatePresetSelector({ activePreset, onChange }) {
  const [show, setShow] = useState(false);
  const current = DATE_PRESETS.find(p => p.value === activePreset) || DATE_PRESETS[2];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setShow(!show)} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#FFFFFF", border: "1px solid #E8E6F0",
        borderRadius: 12, color: "#9CA3AF", fontSize: 13, fontWeight: 500,
        cursor: "pointer", fontFamily: "system-ui", transition: "all 0.2s"}}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#5B4EE8"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E6F0"; }}
      >
        <Filter size={14} /> {current.label} <ChevronDown size={14} />
      </button>
      {show && (
        <>
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 6, zIndex: 200, minWidth: 155}}>
            {DATE_PRESETS.map(p => (
              <button key={p.value} onClick={() => { onChange(p.value); setShow(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", padding: "9px 14px",
                borderRadius: 8, border: "none", background: "transparent",
                color: p.value === activePreset ? "#5B4EE8" : "#9CA3AF",
                fontSize: 13, fontWeight: p.value === activePreset ? 600 : 500,
                cursor: "pointer", fontFamily: "system-ui", textAlign: "left",
                transition: "background 0.15s"}}
                onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                {p.label}
                {p.value === activePreset && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#5B4EE8" }} />}
              </button>
            ))}
          </div>
          <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShow(false)} />
        </>
      )}
    </div>
  );
}

// --- TREND SWITCHER ------------------------------------------------------------
function TrendSwitcher({ value, onChange }) {
  const opts = [{ label: "Ngày", value: "day" }, { label: "Tuần", value: "week" }, { label: "Tháng", value: "month" }];
  return (
    <div style={{ display: "flex", background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 8, padding: 2, gap: 2 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500,
          fontFamily: "system-ui", transition: "all 0.2s",
          background: value === o.value ? "#5B4EE8" : "transparent",
          color: value === o.value ? "#fff" : "#9CA3AF"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// --- SEARCH BAR ----------------------------------------------------------------
function SearchBar({ value, onChange, placeholder = "Tìm kiếm phản hồi..." }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <Search size={15} color={focused ? "#5B4EE8" : "#ccc"} style={{ position: "absolute", left: 14, pointerEvents: "none" }} />
      <input value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding: "10px 14px 10px 40px", width: "100%",
          background: "#FFFFFF", border: `1px solid ${focused ? "#5B4EE8" : "#E8E6F0"}`,
          borderRadius: 12, fontSize: 13, color: "#111827",
          fontFamily: "system-ui", outline: "none",
          transition: "border-color 0.2s"}}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 4 }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// --- STATUS FILTER --------------------------------------------------------------
function StatusFilter({ value, onChange }) {
  const opts = [{ label: "Tất cả", value: "" }, { label: "Hoàn thành", value: "COMPLETED" }, { label: "Đang làm", value: "IN_PROGRESS" }];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: "7px 14px", borderRadius: 10, border: `1px solid ${value === o.value ? "#5B4EE8" : "#E8E6F0"}`,
          background: value === o.value ? "#EDE9FF" : "#fff",
          color: value === o.value ? "#5B4EE8" : "#9CA3AF", fontSize: 12, fontWeight: 500,
          cursor: "pointer", fontFamily: "system-ui", transition: "all 0.2s"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// --- MAIN ----------------------------------------------------------------------
export default function UserAnalyticsPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [dateFrom, setDateFrom]    = useState("");
  const [dateTo, setDateTo]        = useState("");
  const [trendGroup, setTrendGroup] = useState("day");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // AI Insights
  const [aiInsights, setAiInsights] = useState(null); const [aiLoad, setAiLoad] = useState(false); const [aiErr, setAiErr] = useState(null);

  const applyPreset = useCallback((preset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    const { from, to } = resolveDatePreset(preset);
    setDateFrom(from || ""); setDateTo(to || "");
  }, []);
  useEffect(() => { applyPreset("30d"); }, []);

  const getParams = () => { const p = {}; if (dateFrom) p.date_from = dateFrom; if (dateTo) p.date_to = dateTo; return p; };

  const fetchStats = useCallback(async () => {
    setSLoad(true); setSErr(null);
    try { const r = await analyticsService.getDashboard(surveyId, getParams()); setStats(r.data?.data); }
    catch (e) { setSErr(e?.message); }
    finally { setSLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchTrend = useCallback(async () => {
    setTLoad(true); setTErr(null);
    try { const r = await analyticsService.getResponseTrend(surveyId, trendGroup, getParams()); setTrend(r.data?.data); }
    catch (e) { setTErr(e?.message); }
    finally { setTLoad(false); }
  }, [surveyId, trendGroup, dateFrom, dateTo]);

  const fetchComp = useCallback(async () => {
    setCLoad(true); setCErr(null);
    try { const r = await analyticsService.getCompletionStats(surveyId, getParams()); setComp(r.data?.data); }
    catch (e) { setCErr(e?.message); }
    finally { setCLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchSurvey = useCallback(async () => {
    setSvLoad(true); setSvErr(null);
    try { const r = await analyticsService.getSurveyAnalytics(surveyId, getParams()); setSurvey(r.data?.data); }
    catch (e) { setSvErr(e?.message); }
    finally { setSvLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchHeatmap = useCallback(async () => {
    setHmLoad(true); setHmErr(null);
    try { const r = await analyticsService.getDateHeatmap(surveyId, getParams()); setHmData(r.data?.data); }
    catch (e) { setHmErr(e?.message); }
    finally { setHmLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchResponses = useCallback(async (page = 1) => {
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
    try {
      const r = await analyticsService.getCompareByGender(genderTabQuestion, surveyId, getParams());
      setGenderData(r.data?.data);
    } catch (e) { setGErr(e?.message); }
    finally { setGLoad(false); }
  }, [genderTabQuestion, surveyId, dateFrom, dateTo]);

  const fetchAgeData = useCallback(async () => {
    if (!genderTabQuestion || !surveyId) return;
    setALoad(true); setAErr(null);
    try {
      const r = await analyticsService.getCompareByAge(genderTabQuestion, surveyId, getParams());
      setAgeData(r.data?.data);
    } catch (e) { setAErr(e?.message); }
    finally { setALoad(false); }
  }, [genderTabQuestion, surveyId, dateFrom, dateTo]);

  const fetchInsightData = useCallback(async () => {
    if (!genderTabQuestion || !surveyId) return;
    setILoad(true); setIErr(null);
    try {
      const r = await analyticsService.getInsightAgeGender(genderTabQuestion, surveyId, getParams());
      setInsightData(r.data?.data);
    } catch (e) { setIErr(e?.message); }
    finally { setILoad(false); }
  }, [genderTabQuestion, surveyId, dateFrom, dateTo]);

  const fetchAiInsights = useCallback(async () => {
    if (!surveyId) return;
    setAiLoad(true); setAiErr(null);
    try {
      const r = await analyticsService.getAiInsights(surveyId, getParams());
      setAiInsights(r.data?.data?.ai_insights || null);
    } catch (e) { setAiErr(e?.message); }
    finally { setAiLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  useEffect(() => {
    if (activeTab === "gender" && genderTabQuestion) {
      fetchGenderData();
      fetchAgeData();
      fetchInsightData();
    }
  }, [activeTab, genderTabQuestion, fetchGenderData, fetchAgeData, fetchInsightData]);

  useEffect(() => {
    if (activeTab === "ai") fetchAiInsights();
  }, [activeTab, fetchAiInsights]);

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
    if (activeTab === "ai") fetchAiInsights();
  };

  const questions = survey?.questions || [];
  const choiceQs  = questions.filter(q => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type));
  const ratingQs  = questions.filter(q => q.type === "RATING");
  const npsAnswers = ratingQs.flatMap(q => (q.distribution || []).flatMap(d => Array(d.count).fill(d.rating)));
  const npsData = calcNPS(npsAnswers);

  const cardStyle = {
    background: "#FFFFFF",
    borderRadius: 12,
    border: "1px solid #E8E6F0",
    padding: 20};

  return (
    <div style={{ fontFamily: "system-ui", background: "#F4F3F8", position: "relative", overflowX: "hidden", minHeight: "100vh" }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 18px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 16, paddingTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => navigate(ROUTERS.USER.MY_SURVEYS)} style={{
              width: 42, height: 42, borderRadius: 12, border: "1px solid #E8E6F0",
              background: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "transform 0.15s"}}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <ArrowLeft size={18} color="#111827" />
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="#5B4EE8" />
                <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", margin: 0 }}>Phân tích Khảo sát</h1>
              </div>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, marginTop: 4, fontFamily: "monospace", fontWeight: 400 }}>{surveyId}</p>
            </div>
          </div>
          <button onClick={handleRefreshAll} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#FFF", color: "#5B4EE8", border: "1px solid #5B4EE8",
            borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14,
            fontWeight: 500, cursor: "pointer", fontFamily: "system-ui"}}>
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", marginBottom: 24, flexWrap: "wrap" }}>
          <Filter size={15} color="#9CA3AF" />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>Khoảng thời gian:</span>
          <DatePresetSelector activePreset={datePreset} onChange={applyPreset} />
          {datePreset === "custom" && (
            <>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "7px 12px", background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 10, fontSize: 12, color: "#374151", fontFamily: "system-ui", outline: "none", cursor: "pointer" }} />
              <span style={{ color: "#ccc" }}></span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "7px 12px", background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 10, fontSize: 12, color: "#374151", fontFamily: "system-ui", outline: "none", cursor: "pointer" }} />
            </>
          )}
          {dateFrom && dateTo && datePreset === "custom" && (
            <button onClick={() => applyPreset("30d")} style={{ background: "none", border: "none", fontSize: 11, color: "#9CA3AF", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "system-ui", padding: "4px 8px", borderRadius: 6 }}>
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #E8E6F0", marginBottom: 28, gap: 0 }}>
          {PRIMARY_TABS.map(tab => {
            const Icon = tab.icon;
            const is = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
                border: "none", borderBottom: is ? "2px solid #5B4EE8" : "none",
                cursor: "pointer", fontSize: 14, fontWeight: 500,
                fontFamily: "system-ui", transition: "all 0.2s ease",
                background: "transparent",
                color: is ? "#5B4EE8" : "#9CA3AF",
                marginBottom: -1}}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 20px",
              border: "none", borderBottom: MORE_TABS.some(t => t.id === activeTab) ? "2px solid #5B4EE8" : "none",
              cursor: "pointer", fontSize: 14, fontWeight: 500,
              fontFamily: "system-ui", transition: "all 0.2s ease",
              background: "transparent",
              color: MORE_TABS.some(t => t.id === activeTab) ? "#5B4EE8" : "#9CA3AF",
              marginBottom: -1}}>
              Thêm <ChevronDown size={14} />
            </button>
            {showMoreMenu && (
              <>
                <div style={{ position: "absolute", top: "100%", left: 0, background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12, padding: 6, zIndex: 200, minWidth: 170}}>
                  {MORE_TABS.map(tab => {
                    const Icon = tab.icon;
                    const is = activeTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowMoreMenu(false); }} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        borderRadius: 8, border: "none", background: is ? "#EDE9FF" : "transparent",
                        color: is ? "#5B4EE8" : "#9CA3AF", fontSize: 13, fontWeight: is ? 500 : 400,
                        cursor: "pointer", fontFamily: "system-ui", textAlign: "left",
                        transition: "background 0.15s"}}
                        onMouseEnter={e => { e.currentTarget.style.background = is ? "#EDE9FF" : "#F4F3F8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = is ? "#EDE9FF" : "transparent"; }}
                      >
                        <Icon size={16} /> {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowMoreMenu(false)} />
              </>
            )}
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* OVERVIEW */}
        {/* ---------------------------------------------- */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            <RetrySection error={sErr} onRetry={fetchStats} isLoading={sLoad} theme="light">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                {sLoad ? [1,2,3,4,5].map(i => <SkeletonStatCard key={i} theme="light" />) : (
                  <>
                    <StatCard label="Tổng bắt đầu" value={fmt(stats?.overview?.total_started || 0)} icon={Users} color="indigo" delay={0} />
                    <StatCard label="Hoàn thành" value={fmt(stats?.overview?.total_completed || 0)} icon={CheckCircle} color="emerald" delay={80} />
                    <StatCard label="T? l? hoàn thành" value={`${stats?.overview?.completion_rate || 0}%`} icon={TrendingUp} color="violet" delay={160} />
                    <StatCard label="Thỏi gian TB" value={stats?.overview?.avg_completion_time || ""} icon={Clock} color="amber" delay={240} />
                    <StatCard label="Tổng câu hỏi" value={questions.length} icon={Target} color="cyan" delay={320} />
                  </>
                )}
              </div>
            </RetrySection>

            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 24 }}>
              <RetrySection error={tErr} onRetry={fetchTrend} isLoading={tLoad}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Xu hướng phản hồi</h3>
                    <TrendSwitcher value={trendGroup} onChange={setTrendGroup} />
                  </div>
                  {tLoad ? <Shimmer height={240} /> : trend?.trend?.length > 0 ? (
                    <div style={{ height: 240 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend.trend}>
                          <defs>
                            <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5B4EE8" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#5B4EE8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                          <XAxis dataKey="period" stroke="#9CA3AF" fontSize={11} />
                          <YAxis stroke="#9CA3AF" fontSize={11} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="count" stroke="#5B4EE8" strokeWidth={2.5} fill="url(#lg2)" dot={false} activeDot={{ r: 6, fill: "#5B4EE8", stroke: "#fff", strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState
                      icon={BarChart3}
                      title="Chưa có dữ liệu"
                      desc="Khảo sát chưa có phản hồi nào"
                      action={{ label: "Làm mới", onClick: fetchTrend }}
                    />
                  )}
                </div>
              </RetrySection>

              <RetrySection error={hmErr} onRetry={fetchHeatmap} isLoading={hmLoad}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <Calendar size={17} color="#06b6d4" />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Lịch hoạt động</h3>
                  </div>
                  {hmLoad ? <Shimmer height={160} /> : hmData?.heatmap?.length > 0 ? (
                    <DateHeatmap data={hmData.heatmap} />
                  ) : <EmptyState icon={Calendar} title="Không có dữ liệu" desc="Chưa có phản hồi nào" />}
                </div>
              </RetrySection>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <RetrySection error={cErr} onRetry={fetchComp} isLoading={cLoad}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <Award size={17} color="#10b981" />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>T? l? hoàn thành</h3>
                  </div>
                  {cLoad ? <Shimmer height={200} /> : (
                    <div style={{ height: 200, display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
                      {[
                        { label: "Hoàn thành", value: comp?.total_completed || 0, color: "#10b981" },
                        { label: "Ðang làm", value: (comp?.total_started || 0) - (comp?.total_completed || 0), color: "#f59e0b" },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: "#374151", fontWeight: 400 }}>{item.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{fmt(item.value)}</span>
                          </div>
                          <ProgressBar value={item.value} max={comp?.total_started || 1} color={item.color} />
                        </div>
                      ))}
                      {comp?.avg_completion_time_seconds > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#EDE9FF", border: "1px solid #E8E6F0", borderRadius: 12 }}>
                          <Clock size={14} color="#5B4EE8" />
                          <span style={{ fontSize: 13, color: "#5B4EE8", fontWeight: 400 }}>Thỏi gian TB: <strong style={{ fontWeight: 600 }}>{comp?.avg_completion_time_display || ""}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </RetrySection>

              <RetrySection error={cErr} onRetry={fetchComp} isLoading={cLoad}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <TrendingDown size={17} color="#ef4444" />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Drop-off theo câu hỏi</h3>
                  </div>
                  {cLoad ? <Shimmer height={200} /> : comp?.drop_off_by_question?.length > 0 ? (
                    <FunnelViz dropOffData={comp.drop_off_by_question} />
                  ) : <EmptyState icon={TrendingDown} title="Chưa có dữ liệu drop-off" desc="Không có phản hồi chưa hoàn thành" />}
                </div>
              </RetrySection>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <NPSCard npsData={npsData} />
              <RetrySection error={svErr} onRetry={fetchSurvey} isLoading={svLoad}>
                <div style={{ ...cardStyle, padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <BarChart3 size={17} color="#a855f7" />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Phân bố câu hỏi</h3>
                  </div>
                  {svLoad ? <Shimmer height={220} /> : choiceQs.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={choiceQs.slice(0, 7).map((q, i) => ({ name: q.question_content?.slice(0, 18) || `Q${i+1}`, value: q.total_responses || 0 }))}
                            cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {choiceQs.slice(0, 7).map((_, i) => (
                              <Cell key={i} fill={chartColors[i % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <EmptyState icon={BarChart3} title="Chưa có câu hỏi đểng lựa chọn" desc="Survey không có câu hỏi lựa chọn" />}
                </div>
              </RetrySection>
            </div>
          </div>
        )}

        {/* ---------------------------------------------- */}
        {/* QUESTIONS */}
        {/* ---------------------------------------------- */}
        {activeTab === "questions" && (
          <RetrySection error={svErr} onRetry={fetchSurvey} isLoading={svLoad}>
            {svLoad ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1,2,3].map(i => <SkeletonQuestionCard key={i} theme="light" />)}</div>
            ) : questions.length === 0 ? (
              <EmptyState icon={Target} title="Chưa có câu hỏi" desc="Khảo sát này chưa có câu hỏi nào" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>{questions.length} câu hỏi</p>
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

        {/* ---------------------------------------------- */}
        {/* RESPONSES */}
        {/* ---------------------------------------------- */}
        {activeTab === "responses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <SearchBar value={rSearch} onChange={v => { setRSearch(v); setRPage(1); }} placeholder="Tìm kiếm trong câu trả lời..." />
              </div>
              <StatusFilter value={rStatus} onChange={v => { setRStatus(v); setRPage(1); }} />
              {(rSearch || rStatus) && (
                <button onClick={() => { setRSearch(""); setRStatus(""); setRPage(1); }} style={{ padding: "7px 14px", borderRadius: 10, border: "1px solid #E8E6F0", background: "#FFFFFF", color: "#9CA3AF", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "system-ui", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={13} /> Xóa lọc
                </button>
              )}
            </div>

            <RetrySection error={rErr} onRetry={() => fetchResponses(rPage)} isLoading={rLoad}>
              <div style={{ ...cardStyle, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={17} color="#5B4EE8" />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Danh sách phản hồi</h3>
                  </div>
                  <span style={{ fontSize: 12, color: "#9CA3AF", background: "#F4F3F8", padding: "4px 12px", borderRadius: 999, fontWeight: 500 }}>
                    {responses?.pagination?.total_responses || 0} tổng số
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", borderBottom: "1px solid #E8E6F0", fontSize: 10, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  <div style={{ width: 32, textAlign: "center" }}>ID</div>
                  <div style={{ flex: 1 }}>Trạng thái</div>
                  <div style={{ width: 70, textAlign: "right" }}>Thỏi gian</div>
                  <div style={{ width: 40, textAlign: "right" }}>Câu</div>
                  <div style={{ width: 80, textAlign: "right" }}>Ngày</div>
                  <div style={{ width: 28 }}></div>
                </div>
                {rLoad ? [1,2,3,4,5].map(i => <SkeletonTableRow key={i} cols={5} theme="light" />)
                  : responses?.responses?.length > 0 ? responses.responses.map(r => <ResponseRow key={r.response_id} response={r} />)
                  : <div style={{ padding: "60px 20px" }}><EmptyState icon={rSearch || rStatus ? EyeOff : Eye} title={rSearch || rStatus ? "Không tìm thấy" : "Chưa có phản hồi"} desc={rSearch || rStatus ? "Thử thay đổi bộ lọc" : "Chưa có phản hồi nào"} /></div>
                }
                {responses?.pagination?.total_pages > 1 && (
                  <div style={{ padding: "14px 18px", borderTop: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <button onClick={() => setRPage(p => Math.max(1, p - 1))} disabled={rPage === 1}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #E8E6F0", background: "#FFFFFF", cursor: rPage === 1 ? "not-allowed" : "pointer", fontSize: 13, opacity: rPage === 1 ? 0.4 : 1, color: "#9CA3AF", fontFamily: "system-ui" }}>{'?'}</button>
                    {Array.from({ length: Math.min(5, responses.pagination.total_pages) }, (_, i) => i + 1).map(pg => (
                      <button key={pg} onClick={() => setRPage(pg)} style={{
                        width: 36, height: 36, borderRadius: 10,
                        border: pg === rPage ? "none" : "1px solid #E8E6F0",
                        background: pg === rPage ? "#5B4EE8" : "#fff",
                        color: pg === rPage ? "#fff" : "#9CA3AF", fontWeight: pg === rPage ? 500 : 400, fontSize: 13,
                        cursor: "pointer", fontFamily: "system-ui"}}>{pg}</button>
                    ))}
                    <button onClick={() => setRPage(p => Math.min(responses.pagination.total_pages, p + 1))}
                      disabled={rPage === responses.pagination.total_pages}
                      style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #E8E6F0", background: "#FFFFFF", cursor: rPage === responses.pagination.total_pages ? "not-allowed" : "pointer", fontSize: 13, opacity: rPage === responses.pagination.total_pages ? 0.4 : 1, color: "#9CA3AF", fontFamily: "system-ui" }}>{'?'}</button>
                  </div>
                )}
              </div>
            </RetrySection>
          </div>
        )}

        {/* ---------------------------------------------- */}
        {/* GENDER ANALYTICS */}
        {/* ---------------------------------------------- */}
        {activeTab === "gender" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Question selector */}
            <div style={{ ...cardStyle, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Venus size={17} color="#ec4899" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Phân tích theo Giới tính & Độ tuổi</h3>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 8 }}>
                  Chọn câu hỏi lựa chọn để phân tích:
                </label>
                <select
                  value={genderTabQuestion || ""}
                  onChange={e => setGenderTabQuestion(e.target.value || null)}
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "#FFFFFF",
                    border: "1px solid #E8E6F0", borderRadius: 12,
                    fontSize: 13, fontFamily: "system-ui", outline: "none",
                    color: "#374151", cursor: "pointer"}}
                >
                  <option value="">— Chọn câu hỏi —</option>
                  {choiceQs.map(q => (
                    <option key={q.question_id} value={q.question_id}>
                      {q.question_content?.slice(0, 80)}
                    </option>
                  ))}
                </select>
              </div>

              {!genderTabQuestion && (
                <div style={{ marginTop: 20, padding: "32px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13, fontWeight: 400 }}>
                  Vui lòng chọn câu hỏi lựa chọn để xem phân tích theo giới tính và độ tuổi.
                </div>
              )}
            </div>

            {genderTabQuestion && (
              <>
                {/* Gender comparison */}
                <RetrySection error={gErr} onRetry={fetchGenderData} isLoading={gLoad}>
                  <div style={{ ...cardStyle, padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <Venus size={17} color="#ec4899" />
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>So sánh theo Giới tính</h3>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>Phân bố câu trả lời theo Nam / Nữ / Khác</p>
                      </div>
                    </div>

                    {gLoad ? <Shimmer height={260} /> : genderData && Object.keys(genderData).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {Object.entries(genderData).map(([gender, genderInfo], gi) => {
                          const genderColors = { MALE: "#3b82f6", FEMALE: "#ec4899", OTHER: "#a855f7", UNKNOWN: "#9CA3AF" };
                          const genderLabels = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác", UNKNOWN: "Chưa cập nhật" };
                          const color = genderColors[gender] || "#5B4EE8";
                          const label = genderLabels[gender] || gender;
                          const data = Object.entries(genderInfo.data || {}).map(([opt, pct]) => ({ name: opt, value: pct }));

                          return (
                            <div key={gender}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
                                <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>({genderInfo.total} phản hỏi)</span>
                              </div>
                              <div style={{ height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                                    <YAxis stroke="#9CA3AF" fontSize={11} unit="%" />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                      <Cell fill={color} />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                                {Object.entries(genderInfo.data || {}).map(([opt, pct]) => (
                                  <div key={opt} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: "#374151", flex: 1, fontWeight: 400 }}>{opt}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{pct}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState icon={Venus} title="Chưa có dữ liệu" desc="Chưa có phản hồi nào cho câu hỏi này" />
                    )}
                  </div>
                </RetrySection>

                {/* Age comparison */}
                <RetrySection error={aErr} onRetry={fetchAgeData} isLoading={aLoad}>
                  <div style={{ ...cardStyle, padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <Clock size={17} color="#f59e0b" />
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>So sánh theo Độ tuổi</h3>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>Phân bố câu trả lời theo nhóm tuổi</p>
                      </div>
                    </div>

                    {aLoad ? <Shimmer height={260} /> : ageData && Object.keys(ageData).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {Object.entries(ageData).map(([ageGroup, ageInfo], gi) => {
                          const groupColors = ["#5B4EE8", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"];
                          const color = groupColors[gi % groupColors.length];
                          const data = Object.entries(ageInfo.data || {}).map(([opt, cnt]) => ({ name: opt, value: cnt }));

                          return (
                            <div key={ageGroup}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{ageGroup}</span>
                                <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 400 }}>({ageInfo.total} phản hỏi)</span>
                              </div>
                              <div style={{ height: 140 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={data} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6F0" />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                                    <YAxis stroke="#9CA3AF" fontSize={10} unit="%" />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                      <Cell fill={color} />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState icon={Clock} title="Chưa có dữ liệu" desc="Chưa có phản hồi nào" />
                    )}
                  </div>
                </RetrySection>

                {/* Combined Age + Gender heatmap */}
                <RetrySection error={iErr} onRetry={fetchInsightData} isLoading={iLoad}>
                  <div style={{ ...cardStyle, padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <Activity size={17} color="#5B4EE8" />
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Heatmap: Tuổi × Giới tính</h3>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>Tương quan chi tiết giữa nhóm tuổi và giới tính</p>
                      </div>
                    </div>

                    {iLoad ? <Shimmer height={300} /> : insightData?.insight && Object.keys(insightData.insight).length > 0 ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                          <thead>
                            <tr style={{ background: "#F4F3F8" }}>
                              <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#9CA3AF", borderBottom: "2px solid #E8E6F0", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                                Nhóm tuổi
                              </th>
                              {["Nam", "Nữ", "Khác", "Chưa cập nhật"].map(g => (
                                <th key={g} style={{ padding: "11px 14px", textAlign: "center", fontSize: 11, fontWeight: 500, color: "#9CA3AF", borderBottom: "2px solid #E8E6F0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                  {g}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(insightData.insight).map(([ageGroup, genders]) => (
                              <tr key={ageGroup}
                                onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#374151", borderBottom: "1px solid #E8E6F0" }}>{ageGroup}</td>
                                {[
                                  { key: "MALE", label: "Nam" },
                                  { key: "FEMALE", label: "Nữ" },
                                  { key: "OTHER", label: "Khác" },
                                  { key: "UNKNOWN", label: "Chưa cập nhật" },
                                ].map(({ key, label }) => {
                                  const cell = genders[key];
                                  const maxPct = Math.max(...Object.values(insightData.insight).flatMap(g =>
                                    Object.values(g).map(c => c?.total || 0)
                                  ), 1);
                                  const intensity = cell?.total ? Math.min(cell.total / maxPct, 1) : 0;
                                  const color = key === "MALE" ? "#3b82f6" : key === "FEMALE" ? "#ec4899" : key === "OTHER" ? "#a855f7" : "#9CA3AF";

                                  return (
                                    <td key={key} style={{ padding: "11px 14px", textAlign: "center", borderBottom: "1px solid #E8E6F0" }}>
                                      {cell?.total ? (
                                        <div>
                                          <span style={{
                                            display: "inline-block",
                                            padding: "5px 12px",
                                            borderRadius: 10,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            background: `${color}15`,
                                            color: color}}>
                                            {cell.total}%
                                          </span>
                                          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, fontWeight: 400 }}>
                                            ({cell.total} lượt)
                                          </div>
                                        </div>
                                      ) : (
                                        <span style={{ color: "#ccc", fontSize: 13 }}></span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12, textAlign: "right", fontWeight: 400 }}>
                          * % = tỷ lệ phản hồi trong nhóm tuổi × giới tính tương ứng
                        </p>
                      </div>
                    ) : (
                      <EmptyState icon={Activity} title="Chưa có dữ liệu" desc="Chưa có phản hồi nào" />
                    )}
                  </div>
                </RetrySection>
              </>
            )}
          </div>
        )}

        {/* ---------------------------------------------- */}
        {/* CROSSTAB */}
        {/* ---------------------------------------------- */}
        {activeTab === "crosstab" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ ...cardStyle, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Sparkles size={17} color="#a855f7" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Cross-Tabulation</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16 }}>
                {[{ label: "Câu hỏi A (Hàng)", val: selectedQ1, set: setSelectedQ1 },
                  { label: "Câu hỏi B (Cột)", val: selectedQ2, set: setSelectedQ2 }].map(({ label, val, set }, idx) => (
                  <div key={idx}>
                    <label style={{ display: "block", fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 8 }}>{label}</label>
                    <select value={val || ""} onChange={e => set(e.target.value || null)} style={{
                      width: "100%", padding: "10px 14px", background: "#FFFFFF",
                      border: "1px solid #E8E6F0", borderRadius: 12, fontSize: 13,
                      fontFamily: "system-ui", outline: "none", color: "#374151", cursor: "pointer"}}>
                      <option value="">Chọn câu hỏi...</option>
                      {choiceQs.map(q => (<option key={q.question_id} value={q.question_id}>{q.question_content?.slice(0, 60)}</option>))}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={fetchCrossTab} disabled={!selectedQ1 || !selectedQ2 || ctLoad} style={{
                background: "#5B4EE8", color: "#FFF", border: "none",
                borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14,
                fontWeight: 500, fontFamily: "system-ui",
                cursor: !selectedQ1 || !selectedQ2 || ctLoad ? "not-allowed" : "pointer",
                opacity: !selectedQ1 || !selectedQ2 || ctLoad ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 8}}>
                {ctLoad ? <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={15} />}
                Phân tích
              </button>
            </div>

            {chiResult && (
              <div style={{ ...cardStyle, padding: "24px", border: chiResult.has_correlation ? "1px solid #10b981" : "1px solid #E8E6F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: chiResult.has_correlation ? "#d1fae5" : "#fef3c7", border: `1px solid ${chiResult.has_correlation ? "#10b981" : "#f59e0b"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {chiResult.has_correlation ? <ThumbsUp size={17} color="#10b981" /> : <Minus size={17} color="#f59e0b" />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Kết quả kiểm định Chi-Square</h4>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>Mối tương quan giữa 2 câu hỏi</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Chi-Square (χ²)", value: chiResult.chi_square, color: "#5B4EE8" },
                    { label: "Cramér's V", value: chiResult.cramers_v, color: "#5B4EE8" },
                    { label: "Bậc tự do (df)", value: chiResult.degrees_of_freedom, color: "#374151" },
                    { label: "Mẫu", value: chiResult.total_samples, color: "#374151" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                      <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6, fontWeight: 500 }}>{item.label}</p>
                      <p style={{ fontSize: 24, fontWeight: 600, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Ý nghĩa thống kê", value: chiResult.significance, color: chiResult.has_correlation ? "#10b981" : "#f59e0b" },
                    { label: "Độ mạnh tương quan", value: chiResult.strength, color: chiResult.has_correlation ? "#10b981" : "#9CA3AF" },
                    { label: "Kết luận", value: chiResult.has_correlation ? "Có tương quan" : "Không có tương quan", color: chiResult.has_correlation ? "#10b981" : "#f59e0b" },
                  ].map(item => (
                    <div key={item.label} style={{ flex: 1, minWidth: 140, background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "10px 14px" }}>
                      <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4, fontWeight: 500 }}>{item.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: item.color, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {crossTab?.rows?.length > 0 && (
              <div style={{ ...cardStyle, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E6F0" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                    {crossTab.question_a?.label?.slice(0, 30)} × {crossTab.question_b?.label?.slice(0, 30)}
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F4F3F8" }}>
                        <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#9CA3AF", borderBottom: "1px solid #E8E6F0", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                          {crossTab.question_a?.label?.slice(0, 20)}
                        </th>
                        {Object.values(crossTab.rows[0]?.breakdown || {}).slice(0, 10).map(opt => (
                          <th key={opt.option_id} style={{ padding: "11px 12px", textAlign: "center", fontSize: 10, fontWeight: 500, color: "#9CA3AF", borderBottom: "1px solid #E8E6F0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {opt.label?.slice(0, 12)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crossTab.rows?.map(row => (
                        <tr key={row.option_id}
                          onMouseEnter={e => { e.currentTarget.style.background = "#F4F3F8"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <td style={{ padding: "11px 14px", fontSize: 13, color: "#374151", borderBottom: "1px solid #E8E6F0", whiteSpace: "nowrap", fontWeight: 400 }}>{row.label?.slice(0, 25)}</td>
                          {Object.values(row.breakdown || {}).slice(0, 10).map(cell => {
                            const maxCount = Math.max(...crossTab.rows.flatMap(r => Object.values(r.breakdown || {}).map(c => c.count)), 1);
                            const intensity = cell.count / maxCount;
                            return (
                              <td key={cell.option_id} style={{ padding: "11px 12px", textAlign: "center", borderBottom: "1px solid #E8E6F0" }}>
                                <span style={{
                                  display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                                  background: `rgba(91,78,232,${intensity * 0.15})`,
                                  color: intensity > 0.5 ? "#111827" : "#5B4EE8"}}>
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

        {/* ---------------------------------------------- */}
        {/* AI INSIGHTS */}
        {/* ---------------------------------------------- */}
        {activeTab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ ...cardStyle, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Brain size={17} color="#5B4EE8" />
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>AI Insights</h3>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 400 }}>Phân tích thông minh được tạo bởi AI</p>
                </div>
                <button
                  onClick={fetchAiInsights}
                  disabled={aiLoad}
                  style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "#FFF", color: "#5B4EE8", border: "1px solid #5B4EE8", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, fontWeight: 500, cursor: aiLoad ? "not-allowed" : "pointer", fontFamily: "system-ui", opacity: aiLoad ? 0.6 : 1 }}
                >
                  <RefreshCw size={13} style={aiLoad ? { animation: "spin 1s linear infinite" } : {}} />
                  Tải lại
                </button>
              </div>

              {aiLoad ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: 20, minHeight: 120 }}>
                      <Shimmer height={16} />
                      <div style={{ marginTop: 10 }}><Shimmer height={12} /></div>
                      <div style={{ marginTop: 6 }}><Shimmer height={12} /></div>
                    </div>
                  ))}
                </div>
              ) : aiErr ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <p style={{ color: "#ef4444", marginBottom: 12, fontWeight: 400 }}>{aiErr}</p>
                  <button onClick={fetchAiInsights} style={{ background: "#FFF", color: "#5B4EE8", border: "1px solid #5B4EE8", borderRadius: 8, height: 36, padding: "0 16px", fontSize: 14, cursor: "pointer", fontFamily: "system-ui", fontWeight: 500 }}>
                    Thử lại
                  </button>
                </div>
              ) : aiInsights ? (
                <div
                  style={{
                    background: "#F4F3F8",
                    border: "1px solid #E8E6F0",
                    borderRadius: 12,
                    padding: "24px",
                    fontSize: 13,
                    color: "#111827",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                    fontFamily: "system-ui",
                    maxHeight: 600,
                    overflowY: "auto"}}
                >
                  {aiInsights.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("### ")) return <h4 key={i} style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "20px 0 8px", borderBottom: "1px solid #E8E6F0", paddingBottom: 6 }}>{trimmed.slice(4)}</h4>;
                    if (trimmed.startsWith("## ")) return <h3 key={i} style={{ fontSize: 17, fontWeight: 600, color: "#111827", margin: "24px 0 10px" }}>{trimmed.slice(3)}</h3>;
                    if (trimmed.startsWith("* **")) {
                      const match = trimmed.match(/^\* \*\*(.+?)\*\*[:]?\s*(.*)$/);
                      if (match) return (
                        <div key={i} style={{ margin: "10px 0 8px", paddingLeft: 8 }}>
                          <strong style={{ color: "#5B4EE8" }}>{match[1]}</strong>
                          {match[2] && <span style={{ color: "#374151", fontWeight: 400 }}>{match[2]}</span>}
                        </div>
                      );
                    }
                    if (trimmed.startsWith("*   ")) return <li key={i} style={{ marginLeft: 16, marginBottom: 4, color: "#374151", fontWeight: 400 }}>{trimmed.slice(4).replace(/\*\*(.+?)\*\*/g, "$1")}</li>;
                    if (trimmed.startsWith("- **")) {
                      const m = trimmed.match(/^- \*\*(.+?)\*\*[:]?\s*(.*)$/);
                      if (m) return (
                        <div key={i} style={{ margin: "8px 0 6px", paddingLeft: 8, borderLeft: "3px solid #EDE9FF" }}>
                          <strong style={{ color: "#111827" }}>{m[1]}</strong>
                          {m[2] && <span style={{ color: "#9CA3AF", fontWeight: 400 }}>  {m[2]}</span>}
                        </div>
                      );
                    }
                    if (trimmed === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #E8E6F0", margin: "16px 0" }} />;
                    if (!trimmed) return <div key={i} style={{ height: 6 }} />;
                    return <p key={i} style={{ margin: "4px 0", color: "#374151", fontWeight: 400 }}>{trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")}</p>;
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

        {/* ---------------------------------------------- */}
        {/* EXPORT */}
        {/* ---------------------------------------------- */}
        {activeTab === "export" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ ...cardStyle, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <FileSpreadsheet size={18} color="#5B4EE8" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Xuất dữ liệu</h3>
              </div>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20, lineHeight: 1.6, fontWeight: 400 }}>
                Xuất toàn bộ dữ liệu khảo sát theo khoảng thời gian đã chọn.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { icon: FileSpreadsheet, title: "Xuất CSV", desc: "Định dạng Excel. Phù hợp phân tích trong Excel, Google Sheets.", color: "#10b981" },
                  { icon: Copy, title: "Xuất JSON", desc: "Dữ liệu thô JSON. Lưu trữ, backup hoặc chuyển đổi.", color: "#a855f7" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} style={{
                      background: "#FFFFFF", border: "1px solid #E8E6F0", borderRadius: 12,
                      padding: "24px", display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", transition: "all 0.25s"}}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E6F0"; e.currentTarget.style.transform = "translateY(0)"; }}
                      onClick={item.title === "Xu?t CSV" ? () => toast.info("CSV export s? đểng backend endpoint. API dã s?n sàng.") : handleExportJSON}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: `${item.color}15`, border: "1px solid #E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={24} color={item.color} />
                        </div>
                        <ChevronRight size={18} color="#ccc" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 6 }}>{item.title}</h4>
                        <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.6, fontWeight: 400 }}>{item.desc}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Download size={14} color={item.color} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: item.color }}>Tải về ngay</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: "24px" }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 14 }}>Tổng quan dữ liệu</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                {[
                  { label: "Tổng phản hồi", value: stats?.overview?.total_started || 0 },
                  { label: "Hoàn thành", value: stats?.overview?.total_completed || 0 },
                  { label: "Câu hỏi", value: questions.length },
                  { label: "Tỷ lệ hoàn thành", value: `${stats?.overview?.completion_rate || 0}%` },
                ].map(item => (
                  <div key={item.label} style={{ background: "#F4F3F8", border: "1px solid #E8E6F0", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6, fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: "#111827", margin: 0 }}>{fmt(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.15); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
        input::placeholder { color: #9CA3AF; }
      `}</style>
    </div>
  );
}
