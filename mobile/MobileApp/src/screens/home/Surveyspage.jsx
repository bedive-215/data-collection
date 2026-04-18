// ─── SurveysPage.native.jsx ─────────────────────────────────────────────────
// React Native version – requires:
//   @react-navigation/native  (useNavigation)
//   react-native-vector-icons/Feather  OR  expo-vector-icons (optional – icons replaced with text emoji fallback)
//
// Drop-in replacements kept identical to the web version where possible.
// Service imports (surveyService, useResponse) stay the same – only the UI layer changes.

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useSurvey }   from "../../providers/Surveyprovider";
import { useResponse } from "../../providers/Responseprovider";

const { width: SCREEN_W } = Dimensions.get("window");
const NUM_COLS = SCREEN_W >= 600 ? 2 : 1; // 2-column grid on tablets

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:          "#f4f5f7",
  white:       "#ffffff",
  border:      "#e8ecf5",
  borderGreen: "#bbf7d0",
  blue:        "#4f6ef7",
  blueLight:   "#eef2ff",
  blueGrad1:   "#6a8fff",
  green:       "#16a34a",
  greenLight:  "#dcfce7",
  greenBg:     "#f0fdf4",
  purple:      "#7c3aed",
  purpleLight: "#f5f3ff",
  purpleBorder:"#e9d5ff",
  gray900:     "#111827",
  gray800:     "#1f2937",
  gray500:     "#6b7280",
  gray400:     "#9ca3af",
  gray300:     "#d1d5db",
  gray100:     "#f3f4f6",
  gray50:      "#f9fafb",
};

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",     label: "Tất cả"        },
  { key: "pending", label: "Chưa làm"      },
  { key: "done",    label: "Đã hoàn thành" },
];

// ── Type badge meta ───────────────────────────────────────────────────────────
const TYPE_META = {
  SINGLE_CHOICE:   { label: "Một lựa chọn",  color: C.blue,   bg: C.blueLight   },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", color: C.purple, bg: C.purpleLight },
  TEXT:            { label: "Văn bản",         color: "#0891b2", bg: "#ecfeff"    },
};
const typeMeta = (type) =>
  TYPE_META[type] ?? { label: type, color: C.gray500, bg: C.gray100 };

// ─────────────────────────────────────────────────────────────────────────────
// SubmissionModal
// ─────────────────────────────────────────────────────────────────────────────
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMySubmission(surveyId);
        setData(res);
      } catch {
        setError("Không thể tải câu trả lời. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    })();
  }, [surveyId]);

  // getMySubmission trả về raw responseService result.
  // Tuỳ responseService: có thể là { data: [...] } (axios) hoặc mảng trực tiếp.
  // Handle cả 2 trường hợp:
  const rawList = Array.isArray(data?.data) ? data.data
                : Array.isArray(data)        ? data
                : [];
  const allAnswers = rawList.flatMap((r) => r.answers ?? []);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={ms.overlay}>
          <TouchableWithoutFeedback>
            <View style={ms.sheet}>

              {/* Header */}
              <View style={ms.header}>
                <View style={ms.headerIcon}>
                  <Text style={{ fontSize: 20 }}>✅</Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={ms.headerSub}>Câu trả lời của bạn</Text>
                  <Text style={ms.headerTitle} numberOfLines={2}>{surveyTitle}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
                  <Text style={{ color: C.gray500, fontSize: 18, lineHeight: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Completed banner */}
              {!loading && !error && allAnswers.length > 0 && (
                <View style={ms.banner}>
                  <Text style={ms.bannerText}>
                    ✅  Bạn đã hoàn thành · {allAnswers.length} câu trả lời
                  </Text>
                </View>
              )}

              {/* Body */}
              <ScrollView style={ms.body} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                {loading && (
                  <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
                    <ActivityIndicator color={C.blue} />
                    <Text style={{ color: C.blue, fontSize: 13, fontWeight: "600" }}>
                      Đang tải câu trả lời...
                    </Text>
                    {[0, 1, 2].map((i) => <SkeletonBlock key={i} />)}
                  </View>
                )}

                {!loading && error && (
                  <View style={ms.center}>
                    <Text style={{ fontSize: 36 }}>⚠️</Text>
                    <Text style={ms.emptyText}>{error}</Text>
                  </View>
                )}

                {!loading && !error && allAnswers.length === 0 && (
                  <View style={ms.center}>
                    <Text style={{ fontSize: 36 }}>📭</Text>
                    <Text style={ms.emptyText}>Không có câu trả lời nào.</Text>
                  </View>
                )}

                {!loading && !error && allAnswers.map((item, i) => {
                  const meta = typeMeta(item.type);
                  const chips = item.type === "MULTIPLE_CHOICE"
                    ? item.answer.split(",").map((a) => a.trim()).filter(Boolean)
                    : null;
                  return (
                    <View key={item.question_id ?? i} style={ms.answerCard}>
                      <View style={ms.qRow}>
                        <View style={ms.qNum}>
                          <Text style={ms.qNumText}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={ms.qText}>{item.question}</Text>
                          <View style={[ms.typeBadge, { backgroundColor: meta.bg }]}>
                            <Text style={[ms.typeBadgeText, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={ms.divider} />

                      {chips ? (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          {chips.map((a, ci) => (
                            <View key={ci} style={ms.chip}>
                              <Text style={ms.chipText}>✔ {a}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <View style={ms.answerBox}>
                          <Text style={{ color: C.blue, marginRight: 6 }}>✔</Text>
                          <Text style={ms.answerText}>{item.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Footer */}
              <View style={ms.footer}>
                <TouchableOpacity onPress={onClose} style={ms.closeFullBtn} activeOpacity={0.85}>
                  <Text style={ms.closeFullBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function SkeletonBlock() {
  return (
    <View style={[ms.answerCard, { opacity: 0.5 }]}>
      <View style={{ width: "75%", height: 12, backgroundColor: C.gray100, borderRadius: 6, marginBottom: 10 }} />
      <View style={{ width: "100%", height: 36, backgroundColor: C.gray100, borderRadius: 10 }} />
    </View>
  );
}

const ms = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 },
  sheet:          { width: "100%", maxWidth: 520, maxHeight: "90%", backgroundColor: C.bg, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  header:         { flexDirection: "row", alignItems: "flex-start", padding: 20, paddingBottom: 16, backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border, gap: 12 },
  headerIcon:     { width: 44, height: 44, borderRadius: 14, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen, alignItems: "center", justifyContent: "center" },
  headerSub:      { fontSize: 10, fontWeight: "700", color: C.gray400, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  headerTitle:    { fontSize: 15, fontWeight: "800", color: C.gray900, lineHeight: 22 },
  closeBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: C.gray50, alignItems: "center", justifyContent: "center" },
  banner:         { margin: 12, marginBottom: 0, padding: 12, borderRadius: 16, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen },
  bannerText:     { fontSize: 12, fontWeight: "700", color: "#15803d" },
  body:           { flex: 1, padding: 12 },
  center:         { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 10 },
  emptyText:      { fontSize: 13, color: C.gray400, textAlign: "center" },
  answerCard:     { backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  qRow:           { flexDirection: "row", gap: 10, marginBottom: 10 },
  qNum:           { width: 24, height: 24, borderRadius: 8, backgroundColor: C.blue, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  qNumText:       { color: C.white, fontSize: 10, fontWeight: "800" },
  qText:          { fontSize: 13, fontWeight: "600", color: C.gray800, lineHeight: 20 },
  typeBadge:      { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99 },
  typeBadgeText:  { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  divider:        { height: 1, backgroundColor: "#f0f2f7", marginVertical: 10 },
  chip:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.purpleLight, borderWidth: 1, borderColor: C.purpleBorder },
  chipText:       { fontSize: 12, fontWeight: "700", color: C.purple },
  answerBox:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: "#f8f9fb", borderWidth: 1, borderColor: "#eef0f5" },
  answerText:     { fontSize: 13, fontWeight: "500", color: C.gray800, flex: 1 },
  footer:         { padding: 12, paddingTop: 10, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border },
  closeFullBtn:   { backgroundColor: C.blue, borderRadius: 16, paddingVertical: 12, alignItems: "center" },
  closeFullBtnText: { color: C.white, fontSize: 14, fontWeight: "700" },
});

// ─────────────────────────────────────────────────────────────────────────────
// SurveyCard (grid item)
// ─────────────────────────────────────────────────────────────────────────────
function SurveyCard({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN")
    : "";
  return (
    <TouchableOpacity
      onPress={() => done && onViewSubmission(id, title)}
      activeOpacity={done ? 0.75 : 1}
      style={[sc.card, done ? sc.cardDone : sc.cardPending, NUM_COLS === 2 && { flex: 1 }]}
    >
      <View style={sc.topRow}>
        <View style={[sc.iconBox, done ? sc.iconBoxDone : sc.iconBoxPending]}>
          <Text style={{ fontSize: 20 }}>{done ? "✅" : "📄"}</Text>
        </View>
        {done ? (
          <View style={sc.badgeDone}>
            <Text style={sc.badgeDoneText}>✔ Đã hoàn thành</Text>
          </View>
        ) : (
          <View style={sc.badgePending}>
            <Text style={sc.badgePendingText}>Survey</Text>
          </View>
        )}
      </View>

      <Text style={sc.title} numberOfLines={2}>{title}</Text>
      <Text style={sc.desc}  numberOfLines={2}>{desc}</Text>

      <View style={sc.bottomRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={sc.dateIcon}>🕐</Text>
          <Text style={sc.date}>{displayDate}</Text>
        </View>
        {done ? (
          <View style={sc.resultBtn}>
            <Text style={sc.resultBtnText}>Xem kết quả →</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onStart(id)}
            style={sc.startBtn}
            activeOpacity={0.85}
          >
            <Text style={sc.startBtnText}>Bắt đầu →</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const sc = StyleSheet.create({
  card:           { backgroundColor: C.white, borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 12 },
  cardDone:       { borderColor: C.borderGreen },
  cardPending:    { borderColor: C.border },
  topRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  iconBox:        { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconBoxDone:    { backgroundColor: C.greenLight },
  iconBoxPending: { backgroundColor: C.blueLight },
  badgeDone:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen },
  badgeDoneText:  { fontSize: 10, fontWeight: "700", color: C.green, letterSpacing: 0.5 },
  badgePending:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.border },
  badgePendingText: { fontSize: 10, fontWeight: "700", color: C.gray400, letterSpacing: 0.5 },
  title:          { fontSize: 15, fontWeight: "800", color: C.gray800, marginBottom: 6, lineHeight: 22 },
  desc:           { fontSize: 13, color: C.gray400, lineHeight: 20, marginBottom: 16, flex: 1 },
  bottomRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  dateIcon:       { fontSize: 11 },
  date:           { fontSize: 12, color: C.gray400 },
  resultBtn:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen },
  resultBtnText:  { fontSize: 12, fontWeight: "700", color: C.green },
  startBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: C.blue },
  startBtnText:   { fontSize: 12, fontWeight: "700", color: C.white },
});

// ─────────────────────────────────────────────────────────────────────────────
// SurveyRow (list item)
// ─────────────────────────────────────────────────────────────────────────────
function SurveyRow({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN")
    : "";
  return (
    <TouchableOpacity
      onPress={() => done && onViewSubmission(id, title)}
      activeOpacity={done ? 0.75 : 1}
      style={[sr.row, done ? sr.rowDone : sr.rowPending]}
    >
      <View style={[sr.iconBox, done ? sr.iconBoxDone : sr.iconBoxPending]}>
        <Text style={{ fontSize: 18 }}>{done ? "✅" : "📄"}</Text>
      </View>

      <View style={sr.info}>
        <Text style={sr.title} numberOfLines={1}>{title}</Text>
        <Text style={sr.desc}  numberOfLines={1}>{desc}</Text>
      </View>

      <Text style={sr.date}>{displayDate}</Text>

      {done ? (
        <View style={sr.resultBtn}>
          <Text style={sr.resultBtnText}>Xem →</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => onStart(id)} style={sr.startBtn} activeOpacity={0.85}>
          <Text style={sr.startBtnText}>Bắt đầu →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const sr = StyleSheet.create({
  row:            { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderWidth: 1, backgroundColor: C.white, marginBottom: 10 },
  rowDone:        { borderColor: C.borderGreen },
  rowPending:     { borderColor: C.border },
  iconBox:        { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconBoxDone:    { backgroundColor: C.greenLight },
  iconBoxPending: { backgroundColor: C.blueLight },
  info:           { flex: 1, minWidth: 0 },
  title:          { fontSize: 13, fontWeight: "700", color: C.gray800 },
  desc:           { fontSize: 12, color: C.gray400, marginTop: 2 },
  date:           { fontSize: 11, color: C.gray400, flexShrink: 0 },
  resultBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen, flexShrink: 0 },
  resultBtnText:  { fontSize: 11, fontWeight: "700", color: C.green },
  startBtn:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.blue, flexShrink: 0 },
  startBtnText:   { fontSize: 11, fontWeight: "700", color: C.white },
});

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <View style={[sc.card, sc.cardPending, { opacity: 0.6 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.gray100 }} />
        <View style={{ width: 80, height: 20, borderRadius: 99, backgroundColor: C.gray100 }} />
      </View>
      <View style={{ height: 14, backgroundColor: C.gray100, borderRadius: 6, width: "75%", marginBottom: 8 }} />
      <View style={{ height: 12, backgroundColor: C.gray100, borderRadius: 6, width: "100%", marginBottom: 4 }} />
      <View style={{ height: 12, backgroundColor: C.gray100, borderRadius: 6, width: "60%", marginBottom: 20 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ height: 10, width: 60, backgroundColor: C.gray100, borderRadius: 6 }} />
        <View style={{ height: 28, width: 80, backgroundColor: C.gray100, borderRadius: 12 }} />
      </View>
    </View>
  );
}

function RowSkeleton() {
  return (
    <View style={[sr.row, sr.rowPending, { opacity: 0.6 }]}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.gray100 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ height: 12, backgroundColor: C.gray100, borderRadius: 6, width: "40%" }} />
        <View style={{ height: 10, backgroundColor: C.gray100, borderRadius: 6, width: "70%" }} />
      </View>
      <View style={{ height: 28, width: 80, backgroundColor: C.gray100, borderRadius: 12 }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SurveysPage (main)
// ─────────────────────────────────────────────────────────────────────────────
export default function SurveysPage() {
  const navigation = useNavigation();
  const { fetchAllSurveys }    = useSurvey();
  const { getAllMyResponses }   = useResponse();

  const [surveys, setSurveys]             = useState([]);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [modalSurvey, setModalSurvey]     = useState(null);

  // Filter state
  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [sortBy, setSortBy]         = useState("newest");
  const [viewMode, setViewMode]     = useState("grid"); // "grid" | "list"
  const [showFilter, setShowFilter] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  // Dùng useRef tránh vòng lặp vô hạn khi provider tạo function mới mỗi render
  const fetchAllSurveysRef    = useRef(fetchAllSurveys);
  const getAllMyResponsesRef  = useRef(getAllMyResponses);
  useEffect(() => {
    fetchAllSurveysRef.current   = fetchAllSurveys;
    getAllMyResponsesRef.current  = getAllMyResponses;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // fetchAllSurveys (SurveyProvider) trả về mảng survey trực tiếp
      // getAllMyResponses (ResponseProvider) trả về object có .data là mảng
      const [surveysData, responsesData] = await Promise.all([
        fetchAllSurveysRef.current().catch(() => []),
        getAllMyResponsesRef.current().catch(() => null),
      ]);

      // SurveyProvider.fetchAllSurveys trả về mảng survey[]
      setSurveys(Array.isArray(surveysData) ? surveysData : []);

      // Handle cả 2 case: responseService trả { data: [...] } (axios) hoặc mảng trực tiếp
      const list = Array.isArray(responsesData?.data) ? responsesData.data
                 : Array.isArray(responsesData)        ? responsesData
                 : [];
      setDoneSurveyIds(new Set(list.map((r) => r.survey_id ?? r.surveyId)));
    } catch {
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  };

  // Chỉ chạy 1 lần khi mount
  useEffect(() => { fetchData(); }, []);

  const handleStart          = (id) => navigation.navigate("SurveyDetail", { id });
  const handleViewSubmission = (id, title) => setModalSurvey({ id, title });

  // ── Derived counts ─────────────────────────────────────────────────────────
  const totalCount   = surveys.length;
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;

  const countFor = (key) =>
    key === "all" ? totalCount : key === "pending" ? pendingCount : doneCount;

  // ── Filtered + sorted list ─────────────────────────────────────────────────
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

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderCard = ({ item, index }) => {
    // For 2-col grid, add right margin to left items
    const isLeft = NUM_COLS === 2 && index % 2 === 0;
    return (
      <View style={[NUM_COLS === 2 && { flex: 1, marginRight: isLeft ? 8 : 0 }]}>
        <SurveyCard
          id={item.id}
          title={item.title}
          desc={item.description}
          createdAt={item.createdAt}
          done={doneSurveyIds.has(item.id)}
          onStart={handleStart}
          onViewSubmission={handleViewSubmission}
        />
      </View>
    );
  };

  const renderRow = ({ item }) => (
    <SurveyRow
      id={item.id}
      title={item.title}
      desc={item.description}
      createdAt={item.createdAt}
      done={doneSurveyIds.has(item.id)}
      onStart={handleStart}
      onViewSubmission={handleViewSubmission}
    />
  );

  const ListEmpty = () => (
    <View style={p.emptyBox}>
      <Text style={{ fontSize: 48 }}>📭</Text>
      <Text style={p.emptyTitle}>Không có khảo sát nào</Text>
      <Text style={p.emptyDesc}>
        {search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có dữ liệu."}
      </Text>
      {!!search && (
        <TouchableOpacity onPress={() => setSearch("")}>
          <Text style={p.emptyLink}>Xóa tìm kiếm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ListHeader = () => (
    <>
      {/* Page Header */}
      <View style={p.pageHeader}>
        <Text style={p.pageTitle}>Khảo sát</Text>
        <Text style={p.pageSubtitle}>
          {loading
            ? "Đang tải..."
            : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={p.tabsWrapper} contentContainerStyle={p.tabsInner}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[p.tab, isActive ? p.tabActive : p.tabInactive]}
              activeOpacity={0.8}
            >
              <Text style={[p.tabLabel, isActive ? p.tabLabelActive : p.tabLabelInactive]}>
                {tab.label}
              </Text>
              {!loading && (
                <View style={[p.tabCount, isActive ? p.tabCountActive : p.tabCountInactive]}>
                  <Text style={[p.tabCountText, isActive ? p.tabCountTextActive : p.tabCountTextInactive]}>
                    {countFor(tab.key)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Toolbar */}
      <View style={p.toolbar}>
        {/* Search */}
        <View style={p.searchBox}>
          <Text style={{ fontSize: 14, color: C.gray400, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={p.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm kiếm khảo sát..."
            placeholderTextColor={C.gray400}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Text style={{ color: C.gray400, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter + ViewMode */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => setShowFilter((v) => !v)}
            style={[p.filterBtn, showFilter && p.filterBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, marginRight: 4 }}>⚙️</Text>
            <Text style={[p.filterBtnText, showFilter && { color: C.blue }]}>Lọc</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <View style={p.viewToggle}>
            <TouchableOpacity
              onPress={() => setViewMode("grid")}
              style={[p.viewBtn, viewMode === "grid" && p.viewBtnActive]}
            >
              <Text style={{ fontSize: 15 }}>⊞</Text>
            </TouchableOpacity>
            <View style={p.viewDivider} />
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              style={[p.viewBtn, viewMode === "list" && p.viewBtnActive]}
            >
              <Text style={{ fontSize: 15 }}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Panel */}
      {showFilter && (
        <View style={p.filterPanel}>
          <Text style={p.filterLabel}>Sắp xếp theo</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[
              { key: "newest", label: "Mới nhất" },
              { key: "oldest", label: "Cũ nhất"  },
              { key: "name",   label: "Tên A–Z"  },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSortBy(key)}
                style={[p.sortChip, sortBy === key && p.sortChipActive]}
              >
                <Text style={[p.sortChipText, sortBy === key && { color: C.blue }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }}
            style={p.resetBtn}
          >
            <Text style={p.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // ── Loading skeletons ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={p.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ListHeader />
        <View style={p.skeletonGrid}>
          {Array(6).fill(0).map((_, i) =>
            viewMode === "grid"
              ? <View key={i} style={NUM_COLS === 2 ? { flex: 1, marginRight: i % 2 === 0 ? 8 : 0 } : {}}>
                  <CardSkeleton />
                </View>
              : <RowSkeleton key={i} />
          )}
        </View>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[p.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
        <Text style={p.emptyDesc}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={{ marginTop: 12 }}>
          <Text style={{ color: C.blue, fontWeight: "700", fontSize: 14 }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={p.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Submission Modal */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      <FlatList
        data={displayed}
        keyExtractor={(item) => String(item.id)}
        numColumns={viewMode === "grid" ? NUM_COLS : 1}
        key={viewMode === "grid" ? `grid-${NUM_COLS}` : "list"}   // force re-mount when layout changes
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        renderItem={viewMode === "grid" ? renderCard : renderRow}
        contentContainerStyle={p.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={viewMode === "grid" && NUM_COLS > 1 ? { gap: 0 } : undefined}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page styles
// ─────────────────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  listContent:     { paddingHorizontal: 16, paddingBottom: 32, paddingTop: Platform.OS === "ios" ? 56 : 16 },
  skeletonGrid:    { paddingHorizontal: 16, flexDirection: "row", flexWrap: "wrap", gap: 0 },

  // Header
  pageHeader:      { marginBottom: 20 },
  pageTitle:       { fontSize: 28, fontWeight: "800", color: C.gray900, letterSpacing: -0.5 },
  pageSubtitle:    { fontSize: 13, color: C.gray400, marginTop: 4 },

  // Tabs
  tabsWrapper:     { marginBottom: 16 },
  tabsInner:       { flexDirection: "row", gap: 4, backgroundColor: C.white, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: C.border, alignSelf: "flex-start" },
  tab:             { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  tabActive:       { backgroundColor: C.blue },
  tabInactive:     { backgroundColor: "transparent" },
  tabLabel:        { fontSize: 13, fontWeight: "700" },
  tabLabelActive:  { color: C.white },
  tabLabelInactive:{ color: C.gray400 },
  tabCount:        { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  tabCountActive:  { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountInactive:{ backgroundColor: C.gray100 },
  tabCountText:    { fontSize: 11, fontWeight: "700" },
  tabCountTextActive:   { color: C.white },
  tabCountTextInactive: { color: C.gray500 },

  // Toolbar
  toolbar:         { marginBottom: 12 },
  searchBox:       { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  searchInput:     { flex: 1, fontSize: 13, color: C.gray800, padding: 0 },
  filterBtn:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.blueLight, borderColor: C.blue },
  filterBtnText:   { fontSize: 13, fontWeight: "700", color: C.gray500 },
  viewToggle:      { flexDirection: "row", backgroundColor: C.white, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  viewBtn:         { paddingHorizontal: 12, paddingVertical: 10 },
  viewBtnActive:   { backgroundColor: C.blueLight },
  viewDivider:     { width: 1, backgroundColor: C.border },

  // Filter panel
  filterPanel:     { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  filterLabel:     { fontSize: 10, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  sortChip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  sortChipActive:  { borderColor: C.blue, backgroundColor: C.blueLight },
  sortChipText:    { fontSize: 12, fontWeight: "700", color: C.gray500 },
  resetBtn:        { alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  resetBtnText:    { fontSize: 12, fontWeight: "700", color: C.gray400 },

  // Empty
  emptyBox:        { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 10 },
  emptyTitle:      { fontSize: 16, fontWeight: "700", color: C.gray500 },
  emptyDesc:       { fontSize: 13, color: C.gray400, textAlign: "center" },
  emptyLink:       { fontSize: 13, fontWeight: "700", color: C.blue, marginTop: 4 },
});