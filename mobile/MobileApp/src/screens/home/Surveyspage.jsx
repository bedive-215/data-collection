// ─── SurveysPage.native.jsx ───────────────────────────────────────────────
// React Native version
// Deps: lucide-react-native, @react-navigation/native, react-native-safe-area-context

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { useSurvey } from "@/providers/SurveyProvider";
// import { useResponse } from "@/providers/ResponseProvider";

/* ─── Icons ────────────────────────────────────────────────── */
let IconSet = {};
try { IconSet = require("lucide-react-native"); } catch {}
const Icon = ({ name, size = 16, color = "#64748b" }) => {
  const Comp = IconSet[name];
  if (!Comp) return <Text style={{ fontSize: size * 0.75, color }}>■</Text>;
  return <Comp size={size} color={color} />;
};

const { width: SW } = Dimensions.get("window");

/* ─── Colors ───────────────────────────────────────────────── */
const C = {
  bg:           "#f4f5f7",
  surface:      "#ffffff",
  primary:      "#4f6ef7",
  primaryLight: "#eef2ff",
  primaryBorder:"#4f6ef7",
  text:         "#111827",
  textSub:      "#6b7280",
  textDim:      "#9ca3af",
  border:       "#e8ecf5",
  success:      "#16a34a",
  successBg:    "#dcfce7",
  successBorder:"#bbf7d0",
  done:         "#f0fdf4",
  doneBorder:   "#bbf7d0",
};

/* ─── Tabs ─────────────────────────────────────────────────── */
const TABS = [
  { key: "all",     label: "Tất cả" },
  { key: "pending", label: "Chưa làm" },
  { key: "done",    label: "Đã hoàn thành" },
];

/* ─── Type config ──────────────────────────────────────────── */
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
  return TYPE_CONFIG[type] ?? {
    label: type || "Khác",
    barColor: "#888",
    badgeBg: "#f3f4f6",
    badgeBorder: "#e5e7eb",
    badgeColor: "#6b7280",
  };
}

/* ─── Mock data ────────────────────────────────────────────── */
const MOCK_SURVEYS = [
  {
    id: "1",
    title: "Khảo sát sự hài lòng khách hàng Q2",
    description: "Đánh giá mức độ hài lòng của khách hàng về sản phẩm và dịch vụ.",
    created_at: "2024-05-01T00:00:00Z",
  },
  {
    id: "2",
    title: "Khảo sát nội bộ nhân viên 2024",
    description: "Thu thập phản hồi từ nhân viên về môi trường làm việc và phúc lợi.",
    created_at: "2024-04-20T00:00:00Z",
  },
  {
    id: "3",
    title: "Đánh giá chất lượng sản phẩm mới",
    description: "Đánh giá sản phẩm ra mắt tháng 3/2024.",
    created_at: "2024-03-10T00:00:00Z",
  },
  {
    id: "4",
    title: "Khảo sát trải nghiệm người dùng ứng dụng",
    description: null,
    created_at: "2024-02-15T00:00:00Z",
  },
];

const MOCK_DONE_IDS = new Set(["1", "3"]);

const MOCK_ANSWERS = [
  { question_id: "q1", type: "TEXT",            question: "Tên của bạn là gì?",              answer: "Nguyễn Văn A", options: [] },
  { question_id: "q2", type: "SINGLE_CHOICE",   question: "Bạn đánh giá dịch vụ thế nào?",  answer: "Tốt",          options: ["Tốt", "Trung bình", "Kém"] },
  { question_id: "q3", type: "MULTIPLE_CHOICE", question: "Tính năng nào bạn thích nhất?",   answer: ["Giao diện đẹp", "Tốc độ nhanh"], options: ["Giao diện đẹp", "Tốc độ nhanh", "Dễ sử dụng", "Hỗ trợ tốt"] },
];

/* ─── Helpers ──────────────────────────────────────────────── */
function getAnswerSet(answer) {
  if (answer === null || answer === undefined) return new Set();
  if (Array.isArray(answer)) return new Set(answer.map(s => String(s).trim()).filter(Boolean));
  return new Set(String(answer).split(",").map(s => s.trim()).filter(Boolean));
}

/* ─── FadeIn ───────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: delay * 1000, useNativeDriver: true }),
      Animated.timing(ty,      { toValue: 0, duration: 400, delay: delay * 1000, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ translateY: ty }] }, style]}>{children}</Animated.View>;
}

/* ─── Skeleton card ────────────────────────────────────────── */
function CardSkeleton({ index }) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[ss.card, { opacity: pulse, marginBottom: 12 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#f1f1f1" }} />
        <View style={{ width: 80, height: 20, borderRadius: 10, backgroundColor: "#f1f1f1" }} />
      </View>
      <View style={{ height: 14, backgroundColor: "#f1f1f1", borderRadius: 6, width: "75%", marginBottom: 8 }} />
      <View style={{ height: 11, backgroundColor: "#f1f1f1", borderRadius: 6, width: "100%", marginBottom: 5 }} />
      <View style={{ height: 11, backgroundColor: "#f1f1f1", borderRadius: 6, width: "60%", marginBottom: 16 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ height: 11, backgroundColor: "#f1f1f1", borderRadius: 6, width: 60 }} />
        <View style={{ height: 32, backgroundColor: "#f1f1f1", borderRadius: 12, width: 90 }} />
      </View>
    </Animated.View>
  );
}

/* ─── AnswerBlock ──────────────────────────────────────────── */
function AnswerBlock({ item }) {
  const isText     = item.type === "TEXT";
  const isMultiple = item.type === "MULTIPLE_CHOICE";
  const answerSet  = getAnswerSet(item.answer);
  const hasAnswer  = answerSet.size > 0;

  if (isText) {
    return item.answer?.trim() ? (
      <View style={ss.textAnswer}>
        <Text style={ss.textAnswerText}>{item.answer}</Text>
      </View>
    ) : (
      <Text style={ss.emptyText}>Không có câu trả lời</Text>
    );
  }

  const options = item.options ?? [];

  const renderOption = (label, isSelected, i) => (
    <View
      key={i}
      style={[
        ss.optionRow,
        isSelected && { borderColor: "#bfdbfe", backgroundColor: "rgba(239,246,255,0.9)" },
      ]}
    >
      {isMultiple ? (
        <View style={[ss.checkbox, isSelected && { backgroundColor: "#2563eb", borderColor: "#2563eb" }]}>
          {isSelected && <Icon name="Check" size={10} color="#fff" />}
        </View>
      ) : (
        <View style={ss.radio}>
          {isSelected && <View style={ss.radioDot} />}
        </View>
      )}
      <Text style={[ss.optionLabel, isSelected && { color: "#1e40af", fontWeight: "700" }]}>
        {label}
      </Text>
    </View>
  );

  if (options.length > 0) {
    return (
      <View style={{ gap: 6 }}>
        {!hasAnswer && <Text style={ss.emptyText}>Chưa chọn lựa chọn nào</Text>}
        {options.map((opt, i) => {
          const label = typeof opt === "string" ? opt : opt.label ?? opt.value ?? opt.content ?? "";
          const isSelected = answerSet.has(label) || answerSet.has(String(opt.id ?? ""));
          return renderOption(label, isSelected, i);
        })}
      </View>
    );
  }

  if (hasAnswer) {
    return (
      <View style={{ gap: 6 }}>
        {[...answerSet].map((label, i) => renderOption(label, true, i))}
      </View>
    );
  }

  return <Text style={ss.emptyText}>Không có câu trả lời</Text>;
}

/* ─── QuestionCard ─────────────────────────────────────────── */
function QuestionCard({ item, index }) {
  const cfg = getTypeCfg(item.type);
  return (
    <View style={[ss.questionCard, { borderTopColor: cfg.barColor }]}>
      <View style={ss.questionMeta}>
        <Text style={ss.questionIndex}>Câu {index + 1}</Text>
        <View style={[ss.typeBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
          <Text style={[ss.typeBadgeText, { color: cfg.badgeColor }]}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={ss.questionText}>{item.question}</Text>
      <AnswerBlock item={item} />
    </View>
  );
}

/* ─── Submission Modal ─────────────────────────────────────── */
function SubmissionModal({ surveyId, surveyTitle, onClose, getMySubmission }) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true); setError(null);
        const res = await getMySubmission?.(surveyId);
        const raw = res?.data ?? res ?? [];
        const all = Array.isArray(raw)
          ? raw.flatMap(r => r.answers ?? [])
          : raw.answers ?? [];
        setAnswers(all.length > 0 ? all : MOCK_ANSWERS); // mock fallback
      } catch {
        setError("Không thể tải câu trả lời.");
        setAnswers(MOCK_ANSWERS); // mock fallback
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [surveyId]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={ss.modalOverlay}>
        <View style={ss.modalBox}>
          {/* Header */}
          <View style={ss.modalHeader}>
            <TouchableOpacity onPress={onClose} style={ss.modalBackBtn}>
              <Icon name="ArrowLeft" size={16} color={C.textSub} />
              <Text style={ss.modalBackText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={ss.modalBrand}>InsightFlow</Text>
            <View style={{ width: 70 }} />
          </View>

          {/* Body */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={ss.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={ss.modalHero}>
              <View style={ss.completedBadge}>
                <Icon name="CheckCircle2" size={13} color={C.success} />
                <Text style={ss.completedBadgeText}>ĐÃ HOÀN THÀNH</Text>
              </View>
              <Text style={ss.modalTitle}>{surveyTitle}</Text>
              {!loading && (
                <Text style={ss.modalSubtitle}>{answers.length} câu hỏi</Text>
              )}
            </View>

            {/* Loading */}
            {loading && (
              <View style={ss.centered}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={[ss.loadingText, { marginTop: 10 }]}>Đang tải...</Text>
              </View>
            )}

            {/* Error */}
            {!loading && error && (
              <View style={ss.centered}>
                <Text style={{ fontSize: 36 }}>⚠️</Text>
                <Text style={ss.errorText}>{error}</Text>
              </View>
            )}

            {/* Empty */}
            {!loading && !error && answers.length === 0 && (
              <View style={ss.centered}>
                <Icon name="Inbox" size={42} color={C.textDim} />
                <Text style={ss.emptyStateText}>Không có câu trả lời.</Text>
              </View>
            )}

            {/* Answers */}
            {!loading && answers.length > 0 && (
              <View style={{ gap: 12 }}>
                {answers.map((item, idx) => (
                  <QuestionCard key={item.question_id ?? idx} item={item} index={idx} />
                ))}
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Survey Card ──────────────────────────────────────────── */
function SurveyCard({ survey, done, onStart, onViewSubmission, viewMode }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const createdDate = survey?.created_at
    ? new Date(survey.created_at).toLocaleDateString("vi-VN")
    : "";

  const isListMode = viewMode === "list";

  const handlePressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => done ? onViewSubmission(survey.id, survey.title) : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={done ? 0.85 : 1}
        style={[
          ss.card,
          done && { backgroundColor: "#f9fffe", borderColor: C.doneBorder },
          isListMode && { flexDirection: "row", alignItems: "center", gap: 14 },
        ]}
      >
        {/* Icon */}
        <View style={[
          ss.cardIcon,
          done
            ? { backgroundColor: C.successBg }
            : { backgroundColor: C.primaryLight },
          isListMode && { marginBottom: 0, flexShrink: 0 },
        ]}>
          <Icon
            name={done ? "CheckCircle2" : "FileText"}
            size={22}
            color={done ? C.success : C.primary}
          />
        </View>

        {/* Content */}
        <View style={[{ flex: 1 }, !isListMode && { marginTop: 16 }]}>
          <View style={ss.cardTopRow}>
            <View style={[
              ss.statusBadge,
              done
                ? { backgroundColor: C.successBg, borderColor: C.successBorder }
                : { backgroundColor: "#f4f5f7", borderColor: C.border },
            ]}>
              <Text style={[ss.statusBadgeText, done && { color: C.success }]}>
                {done ? "Đã hoàn thành" : "Survey"}
              </Text>
            </View>
          </View>

          <Text style={ss.cardTitle} numberOfLines={2}>{survey.title}</Text>

          {!isListMode && (
            <Text style={ss.cardDesc} numberOfLines={2}>
              {survey.description || "Không có mô tả"}
            </Text>
          )}

          <View style={ss.cardFooter}>
            <View style={ss.cardDateRow}>
              <Icon name="Clock" size={12} color={C.textDim} />
              <Text style={ss.cardDate}>{createdDate}</Text>
            </View>

            {done ? (
              <View style={[ss.actionChip, { backgroundColor: C.successBg, borderColor: C.successBorder }]}>
                <Text style={[ss.actionChipText, { color: C.success }]}>Xem kết quả →</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => onStart(survey.id)}
                style={ss.startBtn}
                activeOpacity={0.85}
              >
                <Text style={ss.startBtnText}>Bắt đầu →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ─── Filter Panel ─────────────────────────────────────────── */
function FilterPanel({ sortBy, onSortChange, onReset }) {
  const SORTS = [
    { key: "newest", label: "Mới nhất" },
    { key: "oldest", label: "Cũ nhất" },
    { key: "name",   label: "Tên A-Z" },
  ];
  return (
    <View style={ss.filterPanel}>
      <Text style={ss.filterLabel}>SẮP XẾP THEO</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {SORTS.map(s => (
          <TouchableOpacity
            key={s.key}
            onPress={() => onSortChange(s.key)}
            style={[
              ss.sortBtn,
              sortBy === s.key && { borderColor: C.primary, backgroundColor: C.primaryLight },
            ]}
          >
            <Text style={[ss.sortBtnText, sortBy === s.key && { color: C.primary }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={onReset} style={ss.resetBtn}>
        <Text style={ss.resetBtnText}>Reset bộ lọc</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function SurveysPage() {
  // Thay bằng provider thật:
  // const navigation = useNavigation();
  // const { surveys, loading, error, fetchPublicSurveys } = useSurvey();
  // const { getAllMyResponses, getMySubmission } = useResponse();

  const [surveys,      setSurveys]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [modalSurvey,  setModalSurvey]  = useState(null);
  const [activeTab,    setActiveTab]    = useState("all");
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState("newest");
  const [viewMode,     setViewMode]     = useState("grid");
  const [showFilter,   setShowFilter]   = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      // Thật: await fetchPublicSurveys();
      // Thật: const res = await getAllMyResponses().catch(() => null);
      await new Promise(r => setTimeout(r, 800)); // mock delay
      setSurveys(MOCK_SURVEYS);
      setDoneSurveyIds(MOCK_DONE_IDS);
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const totalCount   = surveys.length;
  const doneCount    = surveys.filter(s => doneSurveyIds.has(s.id)).length;
  const pendingCount = surveys.filter(s => !doneSurveyIds.has(s.id)).length;

  const tabCounts = { all: totalCount, pending: pendingCount, done: doneCount };

  const displayed = useMemo(() => {
    let list = [...surveys];
    if (activeTab === "pending") list = list.filter(s => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter(s =>  doneSurveyIds.has(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "name")   list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  const handleStart = (surveyId) => {
    // navigation.navigate("SurveyDetail", { surveyId });
    console.log("Navigate to survey:", surveyId);
  };

  const numColumns = viewMode === "grid" ? 2 : 1;
  const cardWidth  = viewMode === "grid"
    ? (SW - 32 - 12) / 2   // 16 padding each side + 12 gap
    : SW - 32;

  const renderItem = ({ item, index }) => (
    <View style={viewMode === "grid" ? { width: cardWidth, marginLeft: index % 2 === 1 ? 12 : 0 } : {}}>
      <SurveyCard
        survey={item}
        done={doneSurveyIds.has(item.id)}
        onStart={handleStart}
        onViewSubmission={(id, title) => setModalSurvey({ id, title })}
        viewMode={viewMode}
      />
    </View>
  );

  return (
    <SafeAreaView style={ss.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={ss.header}>
        <View style={{ flex: 1 }}>
          <Text style={ss.pageTitle}>Khảo sát</Text>
          <Text style={ss.pageSubtitle}>
            {loading
              ? "Đang tải..."
              : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => fetchData(true)} style={ss.refreshBtn}>
          <Icon name="RefreshCw" size={15} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={ss.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.tabsScroll}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count = tabCounts[tab.key];
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[ss.tabBtn, isActive && ss.tabBtnActive]}
              >
                <Text style={[ss.tabLabel, isActive && ss.tabLabelActive]}>{tab.label}</Text>
                {!loading && (
                  <View style={[ss.tabCount, isActive && ss.tabCountActive]}>
                    <Text style={[ss.tabCountText, isActive && ss.tabCountTextActive]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Toolbar ── */}
      <View style={ss.toolbar}>
        {/* Search */}
        <View style={ss.searchBar}>
          <Icon name="Search" size={15} color={C.textDim} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm kiếm khảo sát..."
            placeholderTextColor={C.textDim}
            style={ss.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Icon name="X" size={14} color={C.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter + View mode */}
        <View style={ss.toolbarRight}>
          <TouchableOpacity
            onPress={() => setShowFilter(v => !v)}
            style={[ss.iconToolBtn, showFilter && { backgroundColor: C.primaryLight, borderColor: C.primary }]}
          >
            <Icon name="SlidersHorizontal" size={15} color={showFilter ? C.primary : C.textSub} />
          </TouchableOpacity>

          <View style={ss.viewToggle}>
            <TouchableOpacity
              onPress={() => setViewMode("grid")}
              style={[ss.viewBtn, viewMode === "grid" && ss.viewBtnActive]}
            >
              <Icon name="LayoutGrid" size={15} color={viewMode === "grid" ? C.primary : C.textDim} />
            </TouchableOpacity>
            <View style={ss.viewDivider} />
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              style={[ss.viewBtn, viewMode === "list" && ss.viewBtnActive]}
            >
              <Icon name="List" size={15} color={viewMode === "list" ? C.primary : C.textDim} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Filter Panel ── */}
      {showFilter && (
        <FilterPanel
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }}
        />
      )}

      {/* ── Content ── */}
      {loading ? (
        <ScrollView contentContainerStyle={ss.listContent}>
          {viewMode === "grid" ? (
            <View style={ss.gridRow}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={{ width: cardWidth, marginLeft: i % 2 === 1 ? 12 : 0 }}>
                  <CardSkeleton index={i} />
                </View>
              ))}
            </View>
          ) : (
            [0, 1, 2, 3].map(i => <CardSkeleton key={i} index={i} />)
          )}
        </ScrollView>
      ) : error ? (
        <View style={ss.centeredFull}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={ss.errorStateText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchData()} style={ss.retryBtn}>
            <Text style={ss.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : displayed.length === 0 ? (
        <View style={ss.centeredFull}>
          <Icon name="Inbox" size={52} color={C.textDim} />
          <Text style={ss.emptyStateTitle}>Không có khảo sát nào</Text>
          <Text style={ss.emptyStateSub}>
            {search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có dữ liệu"}
          </Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}   // re-mount khi đổi view mode để reset numColumns
          data={displayed}
          keyExtractor={item => item.id}
          numColumns={viewMode === "grid" ? 2 : 1}
          renderItem={renderItem}
          contentContainerStyle={ss.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          columnWrapperStyle={viewMode === "grid" ? null : undefined}
        />
      )}

      {/* ── Submission Modal ── */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
          getMySubmission={async () => null}   // thay bằng provider thật
        />
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
const ss = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  pageTitle: { fontSize: 24, fontWeight: "800", color: C.text },
  pageSubtitle: { fontSize: 12, color: C.textDim, marginTop: 2 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
  },

  // Tabs
  tabsContainer: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    flexDirection: "row",
  },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: C.primary,
  },
  tabLabel: { fontSize: 13, fontWeight: "600", color: C.textSub },
  tabLabelActive: { color: "#fff" },
  tabCount: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 999, backgroundColor: "#f1f1f1",
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: { fontSize: 11, fontWeight: "700", color: C.textSub },
  tabCountTextActive: { color: "#fff" },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: C.text, paddingVertical: 0 },
  toolbarRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  iconToolBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  viewToggle: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
  },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 9 },
  viewBtnActive: { backgroundColor: C.primaryLight },
  viewDivider: { width: 1, height: 20, backgroundColor: C.border },

  // Filter panel
  filterPanel: {
    backgroundColor: C.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterLabel: {
    fontSize: 10, fontWeight: "700", color: C.textSub,
    letterSpacing: 0.8, marginBottom: 8,
  },
  sortBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
  },
  sortBtnText: { fontSize: 12, fontWeight: "600", color: C.textSub },
  resetBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.surface,
  },
  resetBtnText: { fontSize: 12, fontWeight: "600", color: C.textSub },

  // List content
  listContent: { padding: 16, paddingBottom: 40 },
  gridRow: { flexDirection: "row", flexWrap: "wrap" },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    marginBottom: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10, fontWeight: "700", color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14, fontWeight: "700", color: C.text,
    marginBottom: 6, lineHeight: 20,
  },
  cardDesc: {
    fontSize: 12, color: C.textDim,
    lineHeight: 18, marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 8,
  },
  cardDateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDate: { fontSize: 11, color: C.textDim },
  actionChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  actionChipText: { fontSize: 11, fontWeight: "700" },
  startBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  startBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // States
  centeredFull: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 40,
  },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  loadingText: { fontSize: 13, fontWeight: "600", color: C.textSub },
  emptyStateTitle: { fontSize: 15, fontWeight: "700", color: C.textSub, marginTop: 14, textAlign: "center" },
  emptyStateSub: { fontSize: 13, color: C.textDim, marginTop: 5, textAlign: "center" },
  errorStateText: { fontSize: 14, color: C.textSub, marginTop: 10, textAlign: "center" },
  retryBtn: {
    marginTop: 14, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary,
  },
  retryBtnText: { fontSize: 13, fontWeight: "700", color: C.primary },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#f4f5f7",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: C.border,
    height: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalBackBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 4 },
  modalBackText: { fontSize: 13, fontWeight: "600", color: C.textSub },
  modalBrand: { fontSize: 13, fontWeight: "800", color: C.text },
  modalBody: { padding: 20 },
  modalHero: { alignItems: "center", marginBottom: 22 },
  completedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder,
    marginBottom: 12,
  },
  completedBadgeText: {
    fontSize: 10, fontWeight: "800",
    letterSpacing: 1, color: "#15803d",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: C.text, textAlign: "center" },
  modalSubtitle: { fontSize: 13, color: C.textDim, marginTop: 4 },

  // Question card
  questionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1, borderColor: "#e5e7eb",
    borderTopWidth: 3,
    padding: 16,
    overflow: "hidden",
  },
  questionMeta: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 8,
  },
  questionIndex: { fontSize: 11, color: C.textDim },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  questionText: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 12, lineHeight: 19 },

  // Answer
  textAnswer: {
    backgroundColor: "#f8faff",
    borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 10, padding: 12,
  },
  textAnswerText: { fontSize: 13, color: "#374151", lineHeight: 20 },
  emptyText: { fontSize: 13, color: C.textDim, fontStyle: "italic" },
  optionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 10,
    borderWidth: 1, borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 2, borderColor: "#d1d5db",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "#d1d5db",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  radioDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#2563eb",
  },
  optionLabel: { fontSize: 13, color: "#6b7280", flex: 1 },
  errorText: { fontSize: 13, color: C.textSub, marginTop: 8, textAlign: "center" },
  emptyStateText: { fontSize: 13, color: C.textDim, marginTop: 10 },
});