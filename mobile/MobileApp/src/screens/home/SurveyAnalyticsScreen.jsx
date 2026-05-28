/**
 * SurveyAnalyticsScreen.jsx
 * Full analytics for mobile — 5 tabs: Overview / Questions / Responses / CrossTab / Export
 * Adapted from web AnalyticsPage.jsx
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Dimensions, Alert,
  FlatList, Modal, TextInput, RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import analyticsService from "../../services/analyticsService";
import { useSurvey } from "../../providers/SurveyProvider";
import { COLORS, STATUS_MAP, DATE_PRESETS, resolveDatePreset } from "../../utils/constants";

const { width: SW } = Dimensions.get("window");

/* ════════════════════════════════════════════════════════════════
   TABS
════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "overview",  label: "Tổng quan",  icon: "📈" },
  { id: "questions", label: "Câu hỏi",    icon: "🎯" },
  { id: "responses", label: "Phản hồi",   icon: "👥" },
  { id: "crosstab",  label: "Cross Tab",  icon: "🔗" },
  { id: "export",    label: "Xuất dữ liệu", icon: "📥" },
];

/* ════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════ */
function fmt(n) {
  if (typeof n !== "number") return n ?? "—";
  return n.toLocaleString("vi-VN");
}

/* Simple bar chart using Views */
function SimpleBarChart({ data = [], maxVal, height = 160, barColor = COLORS.primary }) {
  if (!data || data.length === 0) return null;
  const max = maxVal || Math.max(...data.map(d => d.value ?? d.count ?? 0), 1);
  return (
    <View style={{ height }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
        {data.map((item, i) => {
          const pct = (item.value ?? item.count ?? 0) / max;
          return (
            <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
              <View
                style={{
                  width: "100%",
                  height: Math.max(pct * (height - 24), 4),
                  backgroundColor: barColor,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  opacity: 0.8 + (pct * 0.2),
                }}
              />
              <Text style={styles.barLabel} numberOfLines={1}>{item.label ?? item.name ?? ""}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* Horizontal bar chart for choice questions */
function HorizontalBarChart({ options = [], maxCount, height = 60 }) {
  if (!options || options.length === 0) return null;
  const max = maxCount || Math.max(...options.map(o => o.count ?? 0), 1);
  return (
    <View style={{ gap: 8 }}>
      {options.map((opt, i) => {
        const pct = ((opt.count ?? 0) / max) * 100;
        const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
        const c = colors[i % colors.length];
        return (
          <View key={opt.option_id ?? opt.id ?? i} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={styles.hBarLabel} numberOfLines={1}>{opt.label ?? opt.content ?? ""}</Text>
              <Text style={styles.hBarValue}>{opt.count} ({opt.percent}%)</Text>
            </View>
            <View style={{ height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  backgroundColor: c,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* Progress bar */
function ProgressBar({ value, max, color = COLORS.primary }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={{ height: 6, backgroundColor: COLORS.gray200, borderRadius: 999, overflow: "hidden" }}>
      <View
        style={{
          height: "100%",
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

/* Stat card */
function StatCard({ label, value, color = "indigo", sub }) {
  const colorMap = {
    indigo:  { bg: "#e0e7ff", color: "#6366f1" },
    emerald:  { bg: "#d1fae5", color: "#10b981" },
    violet:  { bg: "#f3e8ff", color: "#a855f7" },
    amber:   { bg: "#fef3c7", color: "#f59e0b" },
    cyan:    { bg: "#cffafe", color: "#06b6d4" },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <View style={[styles.statCard, { backgroundColor: `${c.color}0a`, borderColor: `${c.color}1a` }]}>
      <Text style={[styles.statLabel, { color: COLORS.textSub }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.color }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

/* Glass card */
function GlassCard({ children, style }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

/* Section title */
function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/* Date preset picker */
function DatePresetPicker({ active, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 1 }}>
      {DATE_PRESETS.map(p => {
        const is = active === p.value;
        return (
          <TouchableOpacity
            key={p.value}
            style={[styles.dateChip, is && styles.dateChipActive]}
            onPress={() => onChange(p.value)}
          >
            <Text style={[styles.dateChipText, is && styles.dateChipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* NPS Score card */
function NPSCard({ npsData }) {
  if (!npsData) return (
    <GlassCard style={{ padding: 16, alignItems: "center" }}>
      <Text style={styles.emptyText}>Cần câu hỏi xếp hạng (RATING 1-10) để tính NPS</Text>
    </GlassCard>
  );
  const scoreColor = npsData.score >= 50 ? COLORS.success : npsData.score >= 0 ? COLORS.warning : COLORS.error;
  return (
    <GlassCard style={{ padding: 18, gap: 12 }}>
      <View style={styles.npsHeader}>
        <Text style={{ fontSize: 16 }}>👍</Text>
        <Text style={styles.npsTitle}>NPS Score</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
        <Text style={[styles.npsScore, { color: scoreColor }]}>{npsData.score}</Text>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={styles.npsRow}>
            {[
              { label: "Promoter", count: npsData.promoters, color: COLORS.success },
              { label: "Passive", count: npsData.passives, color: COLORS.warning },
              { label: "Detractor", count: npsData.detractors, color: COLORS.error },
            ].map(s => (
              <View key={s.label} style={[styles.npsSubItem, { borderColor: `${s.color}30`, backgroundColor: `${s.color}0a` }]}>
                <Text style={[styles.npsSubCount, { color: s.color }]}>{s.count}</Text>
                <Text style={styles.npsSubLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", borderRadius: 6, overflow: "hidden", height: 8 }}>
            <View style={{ flex: npsData.promoter_pct, backgroundColor: COLORS.success }} />
            <View style={{ flex: Math.max(100 - npsData.promoter_pct - npsData.detractor_pct, 0), backgroundColor: COLORS.warning }} />
            <View style={{ flex: npsData.detractor_pct, backgroundColor: COLORS.error }} />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

/* Date heatmap (simplified) */
function DateHeatmap({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const getColor = (count) => {
    if (count === 0) return COLORS.gray200;
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
    <View style={{ overflowX: "auto", paddingBottom: 4 }}>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {weeks.map((w, wi) => (
          <View key={wi} style={{ flexDirection: "column", gap: 2 }}>
            {w.map((day, di) => (
              <View
                key={di}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  backgroundColor: day ? getColor(day.count) : "transparent",
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
        <Text style={styles.heatmapLegend}>Ít</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: getColor(r * max) }} />
        ))}
        <Text style={styles.heatmapLegend}>Nhiều</Text>
      </View>
    </View>
  );
}

/* Question analytics card */
function QuestionCard({ question, index }) {
  const [expanded, setExpanded] = useState(false);
  const isChoice = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type);
  const isNumber = ["RATING", "NUMBER"].includes(question.type);
  const isText   = ["TEXT", "PARAGRAPH", "EMAIL"].includes(question.type);

  const topOpt = question.options?.[0];
  const typeColors = {
    TEXT: "#4f6ef7", PARAGRAPH: "#7c3aed", EMAIL: "#0891b2",
    DATE: "#b45309", NUMBER: "#059669", RATING: "#d97706",
    SINGLE_CHOICE: "#ea580c", MULTIPLE_CHOICE: "#16a34a",
    DROPDOWN: "#6d28d9", LINEAR_SCALE: "#7c3aed", TIME: "#0891b2",
  };
  const typeColor = typeColors[question.type] || "#6b7280";
  const typeLabel = {
    TEXT: "Văn bản", PARAGRAPH: "Đoạn văn", EMAIL: "Email",
    DATE: "Ngày", NUMBER: "Số", RATING: "Xếp hạng",
    SINGLE_CHOICE: "1 lựa chọn", MULTIPLE_CHOICE: "Nhiều lựa chọn",
    DROPDOWN: "Dropdown", LINEAR_SCALE: "Thang đo", TIME: "Giờ",
  }[question.type] || question.type;

  return (
    <GlassCard style={{ padding: 0, overflow: "hidden", marginBottom: 10 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.qCardHeader} activeOpacity={0.75}>
        <View style={styles.qNumBadge}>
          <Text style={styles.qNumText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.qTitle} numberOfLines={1}>
            {question.question_content || question.question_id?.slice(-6) || "Câu hỏi"}
          </Text>
          <View style={styles.qMetaRow}>
            <View style={[styles.qTypeBadge, { backgroundColor: `${typeColor}15`, borderColor: `${typeColor}30` }]}>
              <Text style={[styles.qTypeText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <Text style={styles.qRespCount}>{question.total_responses ?? 0} phản hồi</Text>
            {topOpt && (
              <Text style={styles.qTopOpt}>↑ {String(topOpt.label ?? "").slice(0, 12)} ({topOpt.percent}%)</Text>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 18, color: COLORS.textSub }}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.qCardBody}>
          {isChoice && question.options && (
            <HorizontalBarChart options={question.options} maxCount={question.options[0]?.count || 1} />
          )}
          {isNumber && (
            <View style={styles.numberStats}>
              {[
                { label: "Trung bình", value: question.avg?.toFixed(1) },
                { label: "Thấp nhất", value: question.min },
                { label: "Cao nhất", value: question.max },
                { label: "Độ lệch", value: question.stddev?.toFixed(2) },
              ].map(item => (
                <View key={item.label} style={styles.numberStatItem}>
                  <Text style={styles.numberStatLabel}>{item.label}</Text>
                  <Text style={styles.numberStatValue}>{item.value ?? "—"}</Text>
                </View>
              ))}
            </View>
          )}
          {isText && (
            <View>
              {question.word_frequency?.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {question.word_frequency.slice(0, 16).map((item, i) => (
                    <View key={item.word || i} style={styles.keywordBadge}>
                      <Text style={styles.keywordText}>{item.word} ({item.count})</Text>
                    </View>
                  ))}
                </View>
              )}
              {question.answers?.length > 0 ? (
                question.answers.slice(0, 5).map((ans, i) => (
                  <View key={ans.id || i} style={styles.textAnswer}>
                    <Text style={styles.textAnswerText}>{ans.text || ans.answer_text || "—"}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có câu trả lời</Text>
              )}
            </View>
          )}
          {!isChoice && !isNumber && !isText && (
            <Text style={styles.emptyText}>Không có dữ liệu chi tiết</Text>
          )}
        </View>
      )}
    </GlassCard>
  );
}

/* Response row */
function ResponseRow({ response }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = response.status === "COMPLETED";

  return (
    <GlassCard style={{ padding: 0, overflow: "hidden", marginBottom: 8 }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.respRow} activeOpacity={0.75}>
        <View style={styles.respIdBadge}>
          <Text style={styles.respIdText}>{response.response_id?.slice(-6) || "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.respStatusBadge, { backgroundColor: isCompleted ? "#d1fae5" : "#fef3c7" }]}>
            <Text style={[styles.respStatusText, { color: isCompleted ? "#059669" : "#d97706" }]}>
              {isCompleted ? "✓ Hoàn thành" : "○ Đang làm"}
            </Text>
          </View>
        </View>
        <Text style={styles.respMeta}>
          {response.time_to_complete_seconds ? `${Math.floor(response.time_to_complete_seconds / 60)}p ${response.time_to_complete_seconds % 60}s` : "—"}
        </Text>
        <Text style={styles.respMeta}>{response.answers?.length || 0} câu</Text>
        <Text style={styles.respMeta}>
          {response.submitted_at ? new Date(response.submitted_at).toLocaleDateString("vi-VN") : "—"}
        </Text>
      </TouchableOpacity>
      {expanded && response.answers?.length > 0 && (
        <View style={styles.respAnswers}>
          {response.answers.map((ans, i) => (
            <View key={ans.id || i} style={styles.respAnswer}>
              <Text style={styles.respAnswerQ} numberOfLines={1}>{ans.question_content || "Câu hỏi"}</Text>
              <Text style={styles.respAnswerVal} numberOfLines={2}>{ans.value || ans.answer_text || "—"}</Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

/* Cross-tab modal */
function CrossTabModal({ open, onClose, questions, onAnalyze }) {
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const choiceQs = questions.filter(q => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type));

  const handleAnalyze = async () => {
    if (!q1 || !q2) return;
    setLoading(true);
    try {
      const r = await onAnalyze(q1, q2);
      setResult(r?.data?.data ?? r);
    } catch { Alert.alert("Lỗi", "Không tải được cross-tab."); }
    finally { setLoading(false); }
  };

  const handleClose = () => { setQ1(null); setQ2(null); setResult(null); onClose(); };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity style={[styles.modalBox, { maxWidth: SW - 48, maxHeight: "75%" }]} activeOpacity={1}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cross-Tabulation</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.ctModalBody}>
            {/* Question selectors */}
            <Text style={styles.fieldLabel}>Câu hỏi A (Hàng)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ gap: 8, flexDirection: "row" }}>
                {choiceQs.map(q => (
                  <TouchableOpacity
                    key={q.question_id || q.id}
                    style={[styles.qSelectChip, q1 === (q.question_id || q.id) && styles.qSelectChipActive]}
                    onPress={() => setQ1(q.question_id || q.id)}
                  >
                    <Text style={[styles.qSelectChipText, q1 === (q.question_id || q.id) && styles.qSelectChipTextActive]} numberOfLines={1}>
                      {String(q.question_content || q.question_id || "").slice(0, 20)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Câu hỏi B (Cột)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ gap: 8, flexDirection: "row" }}>
                {choiceQs.map(q => (
                  <TouchableOpacity
                    key={q.question_id || q.id}
                    style={[styles.qSelectChip, q2 === (q.question_id || q.id) && styles.qSelectChipActive]}
                    onPress={() => setQ2(q.question_id || q.id)}
                  >
                    <Text style={[styles.qSelectChipText, q2 === (q.question_id || q.id) && styles.qSelectChipTextActive]} numberOfLines={1}>
                      {String(q.question_content || q.question_id || "").slice(0, 20)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryBtn, (!q1 || !q2 || loading) && styles.btnDisabled]}
              onPress={handleAnalyze}
              disabled={!q1 || !q2 || loading}
            >
              {loading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={styles.primaryBtnText}>🔮 Phân tích</Text>}
            </TouchableOpacity>

            {/* Chi-square result */}
            {result && result.chi_square != null && (
              <GlassCard style={{ marginTop: 16, padding: 16, gap: 10 }}>
                <Text style={styles.sectionTitle}>Kết quả Chi-Square</Text>
                <View style={styles.chiRow}>
                  {[
                    { label: "χ²", value: result.chi_square },
                    { label: "Cramér's V", value: result.cramers_v },
                    { label: "df", value: result.degrees_of_freedom },
                    { label: "Mẫu", value: result.total_samples },
                  ].map(item => (
                    <View key={item.label} style={styles.chiItem}>
                      <Text style={styles.chiLabel}>{item.label}</Text>
                      <Text style={styles.chiValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chiConclusion}>
                  <Text style={styles.chiConclusionText}>
                    {result.has_correlation ? "✓ Có tương quan" : "✗ Không có tương quan"}
                    {" — "}{result.significance || ""} (độ mạnh: {result.strength || "—"})
                  </Text>
                </View>
              </GlassCard>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════════════════════ */
export default function SurveyAnalyticsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const surveyId = route.params?.surveyId;

  const [activeTab, setActiveTab] = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [sLoad, setSLoad] = useState(true);
  const [sErr, setSErr] = useState(null);

  const [trend, setTrend] = useState(null);
  const [tLoad, setTLoad] = useState(true);

  const [comp, setComp] = useState(null);
  const [cLoad, setCLoad] = useState(true);

  const [survey, setSurvey] = useState(null);
  const [svLoad, setSvLoad] = useState(true);

  const [hmData, setHmData] = useState(null);
  const [hmLoad, setHmLoad] = useState(true);

  const [responses, setResponses] = useState(null);
  const [rLoad, setRLoad] = useState(true);
  const [rPage, setRPage] = useState(1);
  const [rSearch, setRSearch] = useState("");
  const [rStatus, setRStatus] = useState("");

  const [ctModal, setCtModal] = useState(false);

  const getParams = () => {
    const p = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  };

  const applyPreset = (preset) => {
    setDatePreset(preset);
    if (preset === "all") { setDateFrom(""); setDateTo(""); return; }
    if (preset === "custom") return;
    const { from, to } = resolveDatePreset(preset);
    setDateFrom(from || ""); setDateTo(to || "");
  };

  useEffect(() => { applyPreset("30d"); }, []);

  const fetchStats = useCallback(async () => {
    setSLoad(true); setSErr(null);
    try { const r = await analyticsService.getDashboard(surveyId, getParams()); setStats(r.data?.data); }
    catch (e) { setSErr(e?.message); }
    finally { setSLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchTrend = useCallback(async () => {
    setTLoad(true);
    try { const r = await analyticsService.getResponseTrend(surveyId, "day", getParams()); setTrend(r.data?.data); }
    finally { setTLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchComp = useCallback(async () => {
    setCLoad(true);
    try { const r = await analyticsService.getCompletionStats(surveyId, getParams()); setComp(r.data?.data); }
    finally { setCLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchSurvey = useCallback(async () => {
    setSvLoad(true);
    try { const r = await analyticsService.getSurveyAnalytics(surveyId, getParams()); setSurvey(r.data?.data); }
    finally { setSvLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchHeatmap = useCallback(async () => {
    setHmLoad(true);
    try { const r = await analyticsService.getDateHeatmap(surveyId, getParams()); setHmData(r.data?.data); }
    finally { setHmLoad(false); }
  }, [surveyId, dateFrom, dateTo]);

  const fetchResponses = useCallback(async (page = 1) => {
    setRLoad(true);
    try {
      const r = await analyticsService.getFilteredResponses(surveyId, { page, limit: 15, search_query: rSearch, status: rStatus });
      setResponses(r.data?.data);
    } finally { setRLoad(false); }
  }, [surveyId, rSearch, rStatus]);

  useEffect(() => {
    fetchStats(); fetchComp(); fetchSurvey();
  }, [fetchStats, fetchComp, fetchSurvey]);

  useEffect(() => { fetchTrend(); }, [fetchTrend]);
  useEffect(() => { fetchHeatmap(); }, [fetchHeatmap]);
  useEffect(() => { if (activeTab === "responses") fetchResponses(rPage); }, [activeTab, rPage, fetchResponses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchComp(), fetchSurvey(), fetchTrend(), fetchHeatmap()]);
    setRefreshing(false);
  };

  const handleCrossAnalyze = async (q1, q2) => {
    const params = getParams();
    const r = await analyticsService.getCrossTab(surveyId, q1, q2, params);
    return r;
  };

  const handleExportJSON = async () => {
    try {
      const [surveyR, compR, trendR] = await Promise.all([
        analyticsService.getSurveyAnalytics(surveyId, getParams()),
        analyticsService.getCompletionStats(surveyId, getParams()),
        analyticsService.getResponseTrend(surveyId, "day", getParams()),
      ]);
      const data = {
        survey_id: surveyId,
        exported_at: new Date().toISOString(),
        overview: compR.data?.data,
        trend: trendR.data?.data,
        questions: surveyR.data?.data?.questions,
      };
      Alert.alert("Xuất dữ liệu", `JSON đã sẵn sàng (${JSON.stringify(data).length} bytes). Chức năng lưu file sẽ được cập nhật.`);
    } catch {
      Alert.alert("Lỗi", "Xuất dữ liệu thất bại.");
    }
  };

  const questions = survey?.questions || [];
  const choiceQs = questions.filter(q => ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type));
  const ratingQs = questions.filter(q => q.type === "RATING");
  const npsAnswers = ratingQs.flatMap(q => (q.distribution || []).flatMap(d => Array(d.count || 0).fill(d.rating)));
  const calcNPS = (answers) => {
    if (!answers || !answers.length) return null;
    const promoters = answers.filter(a => a >= 9).length;
    const detractors = answers.filter(a => a <= 6).length;
    const n = answers.length;
    return {
      score: parseFloat((((promoters - detractors) / n) * 100).toFixed(1)),
      promoters, detractors, passives: n - promoters - detractors, n,
      promoter_pct: parseFloat(((promoters / n) * 100).toFixed(1)),
      detractor_pct: parseFloat(((detractors / n) * 100).toFixed(1)),
    };
  };
  const npsData = calcNPS(npsAnswers);

  const trendData = trend?.trend?.map(t => ({ label: t.period?.slice(5) || t.date || "", value: t.count || 0 })) || [];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>📊 Phân tích</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{surveyId}</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Text style={{ fontSize: 18 }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB BAR ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: "#fff", maxHeight: 36 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4 }}
      >
        {TABS.map(tab => {
          const is = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, marginRight: 6,
                backgroundColor: is ? COLORS.primary : "#f1f5f9",
              }}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: is ? "#fff" : COLORS.textSub }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Stat cards */}
            {sLoad ? (
              <View style={styles.statsGrid}>
                {[1,2,3,4].map(i => <View key={i} style={styles.statSkeleton} />)}
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <StatCard label="Tổng bắt đầu" value={fmt(stats?.overview?.total_started || 0)} color="indigo" />
                <StatCard label="Hoàn thành" value={fmt(stats?.overview?.total_completed || 0)} color="emerald" />
                <StatCard label="Tỷ lệ hoàn thành" value={`${stats?.overview?.completion_rate || 0}%`} color="violet" />
                <StatCard label="Câu hỏi" value={questions.length} color="cyan" />
                {npsData && <StatCard label="NPS Score" value={npsData.score} color="emerald" sub={`${npsData.promoter_pct}% promoter`} />}
              </View>
            )}

            {/* Trend chart */}
            <SectionTitle>Xu hướng phản hồi</SectionTitle>
            {tLoad ? (
              <View style={styles.chartSkeleton} />
            ) : trendData.length > 0 ? (
              <GlassCard style={{ padding: 16 }}>
                <SimpleBarChart data={trendData.slice(-14)} height={140} barColor="#6366f1" />
              </GlassCard>
            ) : (
              <GlassCard style={{ padding: 24, alignItems: "center" }}>
                <Text style={styles.emptyText}>Chưa có dữ liệu xu hướng</Text>
              </GlassCard>
            )}

            {/* Date heatmap */}
            <SectionTitle>Lịch hoạt động</SectionTitle>
            {hmLoad ? (
              <View style={styles.chartSkeleton} />
            ) : hmData?.heatmap?.length > 0 ? (
              <GlassCard style={{ padding: 16 }}>
                <DateHeatmap data={hmData.heatmap} />
              </GlassCard>
            ) : (
              <GlassCard style={{ padding: 24, alignItems: "center" }}>
                <Text style={styles.emptyText}>Không có dữ liệu</Text>
              </GlassCard>
            )}

            {/* Completion stats */}
            <SectionTitle>Tỷ lệ hoàn thành</SectionTitle>
            <GlassCard style={{ padding: 16, gap: 12 }}>
              {[
                { label: "Hoàn thành", value: comp?.total_completed || 0, color: COLORS.success },
                { label: "Đang làm", value: Math.max((comp?.total_started || 0) - (comp?.total_completed || 0), 0), color: COLORS.warning },
              ].map(item => (
                <View key={item.label} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.completionLabel}>{item.label}</Text>
                    <Text style={[styles.completionValue, { color: item.color }]}>{fmt(item.value)}</Text>
                  </View>
                  <ProgressBar value={item.value} max={comp?.total_started || 1} color={item.color} />
                </View>
              ))}
            </GlassCard>

            {/* NPS */}
            {ratingQs.length > 0 && <NPSCard npsData={npsData} />}
          </View>
        )}

        {/* ════════════ QUESTIONS ════════════ */}
        {activeTab === "questions" && (
          <View style={styles.tabContent}>
            {svLoad ? (
              <View style={{ gap: 10 }}>
                {[1,2,3].map(i => <View key={i} style={styles.qSkeleton} />)}
              </View>
            ) : questions.length === 0 ? (
              <GlassCard style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>🎯</Text>
                <Text style={styles.emptyTitle}>Chưa có câu hỏi</Text>
                <Text style={styles.emptyText}>Khảo sát này chưa có câu hỏi nào</Text>
              </GlassCard>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={styles.resultCount}>{questions.length} câu hỏi</Text>
                </View>
                {questions.map((q, i) => (
                  <QuestionCard key={q.question_id || i} question={q} index={i} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ════════════ RESPONSES ════════════ */}
        {activeTab === "responses" && (
          <View style={styles.tabContent}>
            {/* Filters */}
            <GlassCard style={{ padding: 14, gap: 10, marginBottom: 12 }}>
              <View style={styles.filterRow}>
                <TextInput
                  style={styles.searchInput}
                  value={rSearch}
                  onChangeText={v => { setRSearch(v); setRPage(1); }}
                  placeholder="Tìm kiếm phản hồi..."
                  placeholderTextColor={COLORS.textDim}
                />
              </View>
              <View style={styles.filterRow}>
                {["", "COMPLETED", "IN_PROGRESS"].map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.filterChip, rStatus === val && styles.filterChipActive]}
                    onPress={() => { setRStatus(val); setRPage(1); }}
                  >
                    <Text style={[styles.filterChipText, rStatus === val && styles.filterChipTextActive]}>
                      {val === "" ? "Tất cả" : val === "COMPLETED" ? "Hoàn thành" : "Đang làm"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* List */}
            {rLoad ? (
              <View style={{ gap: 8 }}>
                {[1,2,3,4].map(i => <View key={i} style={styles.qSkeleton} />)}
              </View>
            ) : responses?.responses?.length > 0 ? (
              <>
                {responses.responses.map(r => (
                  <ResponseRow key={r.response_id} response={r} />
                ))}
                {/* Pagination */}
                {responses?.pagination?.total_pages > 1 && (
                  <View style={styles.pagination}>
                    <TouchableOpacity
                      style={[styles.pageBtn, rPage === 1 && styles.pageBtnDisabled]}
                      onPress={() => setRPage(p => Math.max(1, p - 1))}
                      disabled={rPage === 1}
                    >
                      <Text style={styles.pageBtnText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>{rPage} / {responses.pagination.total_pages}</Text>
                    <TouchableOpacity
                      style={[styles.pageBtn, rPage === responses.pagination.total_pages && styles.pageBtnDisabled]}
                      onPress={() => setRPage(p => Math.min(responses.pagination.total_pages, p + 1))}
                      disabled={rPage === responses.pagination.total_pages}
                    >
                      <Text style={styles.pageBtnText}>›</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <GlassCard style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>📭</Text>
                <Text style={styles.emptyTitle}>Chưa có phản hồi</Text>
                <Text style={styles.emptyText}>{rSearch || rStatus ? "Thử thay đổi bộ lọc" : "Survey chưa có phản hồi nào"}</Text>
              </GlassCard>
            )}
          </View>
        )}

        {/* ════════════ CROSSTAB ════════════ */}
        {activeTab === "crosstab" && (
          <View style={styles.tabContent}>
            {choiceQs.length < 2 ? (
              <GlassCard style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>🔗</Text>
                <Text style={styles.emptyTitle}>Cần ít nhất 2 câu hỏi lựa chọn</Text>
                <Text style={styles.emptyText}>Cross-tab yêu cầu câu hỏi dạng một lựa chọn hoặc nhiều lựa chọn</Text>
              </GlassCard>
            ) : (
              <>
                <GlassCard style={{ padding: 14, gap: 10 }}>
                  <View style={styles.ctHeader}>
                    <Text style={styles.ctTitle}>🔮 Cross-Tabulation</Text>
                    <Text style={styles.ctDesc}>Phân tích mối tương quan giữa 2 câu hỏi lựa chọn</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { paddingVertical: 10 }]}
                    onPress={() => setCtModal(true)}
                  >
                    <Text style={[styles.primaryBtnText, { fontSize: 13 }]}>🔬 Phân tích 2 câu hỏi</Text>
                  </TouchableOpacity>
                </GlassCard>
              </>
            )}
          </View>
        )}

        {/* ════════════ EXPORT ════════════ */}
        {activeTab === "export" && (
          <View style={styles.tabContent}>
            <GlassCard style={{ padding: 20, gap: 14 }}>
              <View style={styles.exportHeader}>
                <Text style={{ fontSize: 28 }}>📥</Text>
                <Text style={styles.exportTitle}>Xuất dữ liệu</Text>
              </View>
              <Text style={styles.exportDesc}>
                Xuất toàn bộ dữ liệu khảo sát theo khoảng thời gian đã chọn.
              </Text>
              <TouchableOpacity style={styles.exportCard} onPress={() => Alert.alert("CSV Export", "Chức năng đang phát triển. Backend đã sẵn sàng.")}>
                <View style={styles.exportCardLeft}>
                  <Text style={{ fontSize: 22 }}>📊</Text>
                  <View>
                    <Text style={styles.exportCardTitle}>Xuất CSV</Text>
                    <Text style={styles.exportCardDesc}>Định dạng Excel. Phân tích trong Google Sheets.</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 18, color: COLORS.textDim }}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportCard} onPress={handleExportJSON}>
                <View style={styles.exportCardLeft}>
                  <Text style={{ fontSize: 22 }}>📄</Text>
                  <View>
                    <Text style={styles.exportCardTitle}>Xuất JSON</Text>
                    <Text style={styles.exportCardDesc}>Dữ liệu thô. Lưu trữ hoặc backup.</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 18, color: COLORS.textDim }}>›</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Summary stats */}
            <GlassCard style={{ padding: 16, gap: 10 }}>
              <Text style={styles.sectionTitle}>Tổng quan dữ liệu</Text>
              <View style={styles.statsGrid}>
                <StatCard label="Tổng phản hồi" value={fmt(stats?.overview?.total_started || 0)} color="indigo" />
                <StatCard label="Hoàn thành" value={fmt(stats?.overview?.total_completed || 0)} color="emerald" />
                <StatCard label="Câu hỏi" value={questions.length} color="cyan" />
                <StatCard label="Tỷ lệ" value={`${stats?.overview?.completion_rate || 0}%`} color="violet" />
              </View>
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* CrossTab modal */}
      <CrossTabModal
        open={ctModal}
        onClose={() => setCtModal(false)}
        questions={questions}
        onAnalyze={handleCrossAnalyze}
      />
    </SafeAreaView>
  );
}

/* ════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  backBtnText: { fontSize: 20, color: COLORS.text, fontWeight: "300", lineHeight: 24 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 10, color: COLORS.textDim, fontFamily: "monospace" },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.gray100,
    alignItems: "center", justifyContent: "center",
  },

  // Tab bar
  tabScroll: { backgroundColor: "rgba(255,255,255,0.85)", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBar: { flexDirection: "row", padding: 3, gap: 3 },
  tab: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: "700", color: COLORS.textSub },
  tabTextActive: { color: COLORS.white },

  // Date preset
  presetRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.7)" },
  presetLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSub },
  dateChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200 },
  dateChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  dateChipText: { fontSize: 11, fontWeight: "600", color: COLORS.textSub },
  dateChipTextActive: { color: COLORS.primary },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  tabContent: { gap: 14 },

  // Glass card
  glassCard: {
    backgroundColor: COLORS.surface, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1, minWidth: "44%", padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  statLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "900" },
  statSub: { fontSize: 10, color: COLORS.textDim, marginTop: 2 },
  statSkeleton: { flex: 1, minWidth: "44%", height: 70, borderRadius: 16, backgroundColor: COLORS.gray100, marginBottom: 4 },
  chartSkeleton: { height: 160, borderRadius: 18, backgroundColor: COLORS.gray100, marginBottom: 4 },

  // Section title
  sectionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 8 },

  // Empty
  emptyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textDim },

  // Completion
  completionLabel: { fontSize: 13, color: COLORS.text },
  completionValue: { fontSize: 13, fontWeight: "700" },

  // Bar chart
  barLabel: { fontSize: 9, color: COLORS.textDim, marginTop: 3, textAlign: "center" },
  hBarLabel: { fontSize: 12, color: COLORS.text, flex: 1 },
  hBarValue: { fontSize: 11, color: COLORS.textSub, fontWeight: "600" },

  // NPS
  npsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  npsTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  npsScore: { fontSize: 42, fontWeight: "900", lineHeight: 48 },
  npsRow: { flexDirection: "row", gap: 6 },
  npsSubItem: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1, alignItems: "center", gap: 2 },
  npsSubCount: { fontSize: 16, fontWeight: "800" },
  npsSubLabel: { fontSize: 9, fontWeight: "600", color: COLORS.textDim },
  heatmapLegend: { fontSize: 9, color: COLORS.textDim },

  // Question card
  qSkeleton: { height: 72, borderRadius: 18, backgroundColor: COLORS.gray100, marginBottom: 4 },
  qCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  qNumBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  qNumText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  qTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  qMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  qTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  qTypeText: { fontSize: 10, fontWeight: "700" },
  qRespCount: { fontSize: 11, color: COLORS.textDim },
  qTopOpt: { fontSize: 10, color: COLORS.success, fontWeight: "600" },
  qCardBody: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.gray200, gap: 10 },
  numberStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  numberStatItem: { flex: 1, minWidth: "45%", padding: 10, backgroundColor: COLORS.gray50, borderRadius: 10, alignItems: "center", gap: 4 },
  numberStatLabel: { fontSize: 10, color: COLORS.textDim },
  numberStatValue: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  keywordBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.primaryLight, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primaryBorder },
  keywordText: { fontSize: 11, fontWeight: "600", color: COLORS.primary },
  textAnswer: { backgroundColor: COLORS.gray50, borderRadius: 10, padding: 12, marginBottom: 6 },
  textAnswerText: { fontSize: 13, color: COLORS.gray700, lineHeight: 20 },
  resultCount: { fontSize: 12, color: COLORS.textSub },

  // Response
  respRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  respIdBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: COLORS.gray100, borderRadius: 6 },
  respIdText: { fontSize: 10, fontWeight: "700", color: COLORS.textSub, fontFamily: "monospace" },
  respStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  respStatusText: { fontSize: 10, fontWeight: "700" },
  respMeta: { fontSize: 11, color: COLORS.textDim },
  respAnswers: { padding: 12, borderTopWidth: 1, borderTopColor: COLORS.gray200, gap: 6 },
  respAnswer: { backgroundColor: COLORS.gray50, borderRadius: 10, padding: 10, gap: 4 },
  respAnswerQ: { fontSize: 10, color: COLORS.textDim },
  respAnswerVal: { fontSize: 12, color: COLORS.gray700 },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 16 },
  pageBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray200, alignItems: "center", justifyContent: "center" },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  pageInfo: { fontSize: 13, fontWeight: "600", color: COLORS.textSub },

  // Filter
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.gray50, borderRadius: 10, fontSize: 13, color: COLORS.text, borderWidth: 1, borderColor: COLORS.gray200 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200 },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  filterChipText: { fontSize: 11, fontWeight: "600", color: COLORS.textSub },
  filterChipTextActive: { color: COLORS.primary },

  // Cross-tab
  ctHeader: { alignItems: "center", gap: 4 },
  ctTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  ctDesc: { fontSize: 11, color: COLORS.textSub, textAlign: "center" },

  // Export
  exportHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  exportTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  exportDesc: { fontSize: 13, color: COLORS.textSub, lineHeight: 20 },
  exportCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: COLORS.gray50, borderRadius: 14, borderWidth: 1, borderColor: COLORS.gray200 },
  exportCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  exportCardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  exportCardDesc: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },

  // Buttons
  primaryBtn: {
    paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.white },
  btnDisabled: { backgroundColor: COLORS.gray200, shadowOpacity: 0, elevation: 0 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,17,23,0.55)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalBox: { width: "100%", maxWidth: 460, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 22, overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  modalTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  modalClose: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" },
  modalCloseText: { fontSize: 13, color: COLORS.textSub },
  ctModalBody: { padding: 18, gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textSub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  qSelectChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: COLORS.gray100, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray200, maxWidth: 160 },
  qSelectChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  qSelectChipText: { fontSize: 10, fontWeight: "600", color: COLORS.textSub },
  qSelectChipTextActive: { color: COLORS.primary },

  // Chi-square
  chiRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chiItem: { flex: 1, minWidth: "45%", padding: 8, backgroundColor: COLORS.gray50, borderRadius: 10, alignItems: "center", gap: 2 },
  chiLabel: { fontSize: 10, color: COLORS.textDim },
  chiValue: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  chiConclusion: { backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12 },
  chiConclusionText: { fontSize: 12, fontWeight: "600", color: COLORS.primary, textAlign: "center" },
});
