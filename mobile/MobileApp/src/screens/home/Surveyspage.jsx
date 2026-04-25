// ─── SurveysPage.native.jsx ──────────────────────────────────────
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback,
  FlatList, ScrollView, Modal, ActivityIndicator, StyleSheet,
  Platform, StatusBar, Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSurvey }   from "../../providers/Surveyprovider";
import { useResponse } from "../../providers/Responseprovider";

const { width: SCREEN_W } = Dimensions.get("window");
const NUM_COLS = SCREEN_W >= 600 ? 2 : 1;

// ── Palette ───────────────────────────────────────────────────────
const C = {
  bg:           "#f4f5f7",
  white:        "#ffffff",
  border:       "#e8ecf5",
  borderGreen:  "#bbf7d0",
  blue:         "#4f6ef7",
  blueLight:    "#eef2ff",
  blueBorder:   "#bfdbfe",
  blueAnswer:   "#eff6ff",
  blueDeep:     "#1e40af",
  blueText:     "#1d4ed8",
  green:        "#16a34a",
  greenLight:   "#dcfce7",
  greenBg:      "#f0fdf4",
  greenDeep:    "#15803d",
  purple:       "#7c3aed",
  purpleLight:  "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText:   "#6d28d9",
  teal:         "#0891b2",
  tealLight:    "#ecfeff",
  tealBorder:   "#a5f3fc",
  tealText:     "#0e7490",
  gray900:      "#111827",
  gray800:      "#1f2937",
  gray700:      "#374151",
  gray500:      "#6b7280",
  gray400:      "#9ca3af",
  gray300:      "#d1d5db",
  gray200:      "#e5e7eb",
  gray100:      "#f3f4f6",
  gray50:       "#f9fafb",
  grayFaint:    "#f8faff",
  divider:      "#f3f4f6",
};

// ── Type meta ─────────────────────────────────────────────────────
const TYPE_META = {
  SINGLE_CHOICE:   { label: "Một lựa chọn",   color: C.blueText,   bg: "#eff6ff",    border: C.blueBorder,   accent: "#2563eb" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", color: C.purpleText, bg: C.purpleLight, border: C.purpleBorder, accent: C.purple  },
  TEXT:            { label: "Văn bản",          color: C.tealText,   bg: C.tealLight,  border: C.tealBorder,   accent: C.teal   },
};
const typeMeta = (type) =>
  TYPE_META[type] ?? { label: type, color: C.gray500, bg: C.gray100, border: C.gray200, accent: C.gray400 };

// ── Tabs ──────────────────────────────────────────────────────────
const TABS = [
  { key: "all",     label: "Tất cả"        },
  { key: "pending", label: "Chưa làm"      },
  { key: "done",    label: "Đã hoàn thành" },
];

// ─────────────────────────────────────────────────────────────────
// Helper: parse list từ mọi dạng axios/fetch trả về
// ─────────────────────────────────────────────────────────────────
function parseList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.data))       return raw.data;
  if (Array.isArray(raw))             return raw;
  return [];
}

// ─────────────────────────────────────────────────────────────────
// OptionRow
// ─────────────────────────────────────────────────────────────────
function OptionRow({ label, isSelected, isMultiple }) {
  return (
    <View style={[
      or.row,
      { borderColor: isSelected ? C.blueBorder : C.gray200,
        backgroundColor: isSelected ? C.blueAnswer : C.gray50 },
    ]}>
      {isMultiple ? (
        <View style={[
          or.checkbox,
          { borderColor: isSelected ? "#2563eb" : C.gray300,
            backgroundColor: isSelected ? "#2563eb" : "transparent" },
        ]}>
          {isSelected && (
            <Text style={{ color: C.white, fontSize: 10, fontWeight: "800", lineHeight: 14 }}>✓</Text>
          )}
        </View>
      ) : (
        <View style={[or.radio, { borderColor: isSelected ? "#2563eb" : C.gray300 }]}>
          {isSelected && <View style={or.radioDot} />}
        </View>
      )}
      <Text style={[or.label, { color: isSelected ? C.blueDeep : C.gray500, fontWeight: isSelected ? "600" : "400" }]}>
        {label}
      </Text>
    </View>
  );
}
const or = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radio:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#2563eb" },
  label:    { fontSize: 13, flex: 1, lineHeight: 20 },
});

// ─────────────────────────────────────────────────────────────────
// SubmissionModal
// ─────────────────────────────────────────────────────────────────
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await getMySubmission(surveyId);
        setData(res);
      } catch {
        setError("Không thể tải câu trả lời. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    })();
  }, [surveyId]);

  const rawList    = parseList(data);
  const allAnswers = rawList.flatMap((r) => r.answers ?? []);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      {/* ── FIX: Tách backdrop ra khỏi sheet để không chặn scroll ── */}
      <View style={sm.overlay}>
        {/* Backdrop tap-to-close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={sm.overlayBackdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet — View thường, không bọc TouchableWithoutFeedback */}
        <View style={sm.sheet}>

          {/* ── Top nav bar ── */}
          <View style={sm.navbar}>
            <TouchableOpacity onPress={onClose} style={sm.backBtn} activeOpacity={0.7}>
              <Text style={sm.backArrow}>←</Text>
              <Text style={sm.backText}>Đóng</Text>
            </TouchableOpacity>
            <Text style={sm.navBrand}>InsightFlow</Text>
            <View style={{ width: 72 }} />
          </View>

          {/* ── Scrollable body ── */}
          <ScrollView
            style={sm.body}
            contentContainerStyle={sm.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={sm.heroHeader}>
              <View style={sm.completedBadge}>
                <Text style={sm.completedBadgeText}>✓  ĐÃ HOÀN THÀNH</Text>
              </View>
              <Text style={sm.heroTitle}>{surveyTitle}</Text>
              {!loading && !error && (
                <Text style={sm.heroSub}>{allAnswers.length} câu trả lời</Text>
              )}
            </View>

            {/* Loading */}
            {loading && (
              <View style={sm.center}>
                <ActivityIndicator color={C.blue} size="small" />
                <Text style={sm.loadingText}>Đang tải câu trả lời...</Text>
                {[0, 1].map((i) => <QuestionSkeleton key={i} />)}
              </View>
            )}

            {/* Error */}
            {!loading && error && (
              <View style={sm.center}>
                <Text style={{ fontSize: 36 }}>⚠️</Text>
                <Text style={sm.emptyText}>{error}</Text>
              </View>
            )}

            {/* Empty */}
            {!loading && !error && allAnswers.length === 0 && (
              <View style={sm.center}>
                <Text style={{ fontSize: 36 }}>📭</Text>
                <Text style={sm.emptyText}>Không có câu trả lời nào.</Text>
              </View>
            )}

            {/* Question cards */}
            {!loading && !error && allAnswers.map((item, qIdx) => {
              const meta       = typeMeta(item.type);
              const isText     = item.type === "TEXT";
              const isMultiple = item.type === "MULTIPLE_CHOICE";
              const selectedSet = isMultiple
                ? new Set(item.answer?.split(",").map((a) => a.trim()).filter(Boolean))
                : new Set([item.answer]);
              const options = item.options ?? [];

              return (
                <View key={`${item.question_id ?? qIdx}`} style={[sm.qCard, { borderTopColor: meta.accent }]}>
                  <View style={sm.qCardHeader}>
                    <View style={sm.qIconBox}>
                      <Text style={{ fontSize: 14 }}>
                        {item.type === "MULTIPLE_CHOICE" ? "⊞" : item.type === "TEXT" ? "✎" : "◎"}
                      </Text>
                    </View>
                    <View style={[sm.typeBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                      <Text style={[sm.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  <Text style={sm.qText}>{qIdx + 1}. {item.question}</Text>

                  {isText && (
                    <View style={sm.textAnswerBox}>
                      <Text style={sm.textAnswerText}>
                        {item.answer || <Text style={{ color: C.gray400, fontStyle: "italic" }}>Không có câu trả lời</Text>}
                      </Text>
                    </View>
                  )}

                  {!isText && (
                    <View style={{ marginTop: 4 }}>
                      {options.length > 0
                        ? options.map((opt, oIdx) => {
                            const optLabel   = typeof opt === "string" ? opt : (opt.content ?? opt.label ?? opt.value ?? "");
                            const isSelected = selectedSet.has(optLabel) || selectedSet.has(String(opt.id ?? ""));
                            return <OptionRow key={oIdx} label={optLabel} isSelected={isSelected} isMultiple={isMultiple} />;
                          })
                        : isMultiple
                          ? item.answer?.split(",").map((a, ai) => (
                              <OptionRow key={ai} label={a.trim()} isSelected={true} isMultiple={true} />
                            ))
                          : <OptionRow label={item.answer} isSelected={true} isMultiple={false} />
                      }
                    </View>
                  )}

                  <View style={sm.qFooter}>
                    <Text style={sm.qFooterText}>🕐  Đã trả lời</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* ── Footer ── */}
          <View style={sm.footer}>
            <TouchableOpacity onPress={onClose} style={sm.closeBtn} activeOpacity={0.85}>
              <Text style={sm.closeBtnText}>← Quay lại</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

function QuestionSkeleton() {
  return (
    <View style={[sm.qCard, { borderTopColor: C.gray200, opacity: 0.6 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: C.gray100 }} />
        <View style={{ width: 76, height: 22, borderRadius: 99, backgroundColor: C.gray100 }} />
      </View>
      <View style={{ height: 14, backgroundColor: C.gray100, borderRadius: 6, width: "72%", marginBottom: 12 }} />
      {[0, 1, 2].map((j) => (
        <View key={j} style={{ height: 38, backgroundColor: C.gray50, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: C.gray100 }} />
      ))}
    </View>
  );
}

const sm = StyleSheet.create({
  // ── FIX: overlay là flex container, không dùng TouchableWithoutFeedback bọc ngoài
  overlay:            { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  // ── FIX: backdrop absolute fill để tap-to-close hoạt động mà không chặn scroll sheet
  overlayBackdrop:    { ...StyleSheet.absoluteFillObject },
  sheet:              { height: "95%", backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  navbar:             { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 52, paddingHorizontal: 16, backgroundColor: "rgba(255,255,255,0.92)", borderBottomWidth: 1, borderColor: C.border },
  backBtn:            { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  backArrow:          { fontSize: 16, color: C.gray500, lineHeight: 20 },
  backText:           { fontSize: 13, fontWeight: "600", color: C.gray500 },
  navBrand:           { fontSize: 13, fontWeight: "700", color: C.gray700 },
  body:               { flex: 1 },
  bodyContent:        { padding: 20, paddingBottom: 16, gap: 16 },
  heroHeader:         { alignItems: "center", marginBottom: 8 },
  completedBadge:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 99, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen, marginBottom: 14 },
  completedBadgeText: { fontSize: 11, fontWeight: "800", color: C.greenDeep, letterSpacing: 0.7 },
  heroTitle:          { fontSize: 20, fontWeight: "800", color: C.gray900, textAlign: "center", lineHeight: 28, marginBottom: 6, letterSpacing: -0.3 },
  heroSub:            { fontSize: 14, color: C.gray400 },
  center:             { alignItems: "center", paddingVertical: 32, gap: 10 },
  loadingText:        { color: C.blue, fontSize: 13, fontWeight: "600" },
  emptyText:          { fontSize: 13, color: C.gray400, textAlign: "center" },
  qCard:              { backgroundColor: C.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.gray200, borderTopWidth: 3, overflow: "hidden" },
  qCardHeader:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  qIconBox:           { width: 40, height: 40, borderRadius: 11, borderWidth: 1.5, borderColor: C.gray300, backgroundColor: C.gray50, alignItems: "center", justifyContent: "center" },
  typeBadge:          { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  typeBadgeText:      { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  qText:              { fontSize: 14, fontWeight: "700", color: C.gray900, lineHeight: 22, marginBottom: 12 },
  textAnswerBox:      { padding: 12, backgroundColor: C.grayFaint, borderWidth: 1, borderColor: "#e1e2ed", borderRadius: 10 },
  textAnswerText:     { fontSize: 13, color: C.gray700, lineHeight: 22 },
  qFooter:            { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: C.divider },
  qFooterText:        { fontSize: 12, color: C.gray400 },
  footer:             { padding: 12, paddingBottom: Platform.OS === "ios" ? 28 : 12, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border },
  closeBtn:           { backgroundColor: C.gray100, borderRadius: 14, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: C.gray200 },
  closeBtnText:       { fontSize: 14, fontWeight: "700", color: C.gray700 },
});

// ─────────────────────────────────────────────────────────────────
// SurveyCard
// ─────────────────────────────────────────────────────────────────
function SurveyCard({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";
  return (
    <View style={[sc.card, done ? sc.cardDone : sc.cardPending, NUM_COLS === 2 && { flex: 1 }]}>
      <View style={sc.topRow}>
        <View style={[sc.iconBox, done ? sc.iconBoxDone : sc.iconBoxPending]}>
          <Text style={{ fontSize: 20 }}>{done ? "✅" : "📄"}</Text>
        </View>
        {done ? (
          <View style={sc.badgeDone}><Text style={sc.badgeDoneText}>✔ Đã hoàn thành</Text></View>
        ) : (
          <View style={sc.badgePending}><Text style={sc.badgePendingText}>Survey</Text></View>
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
          <TouchableOpacity
            onPress={() => onViewSubmission(id, title)}
            style={sc.resultBtn}
            activeOpacity={0.85}
          >
            <Text style={sc.resultBtnText}>Xem kết quả →</Text>
          </TouchableOpacity>
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
    </View>
  );
}
const sc = StyleSheet.create({
  card:             { backgroundColor: C.white, borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 12 },
  cardDone:         { borderColor: C.borderGreen },
  cardPending:      { borderColor: C.border },
  topRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  iconBox:          { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconBoxDone:      { backgroundColor: C.greenLight },
  iconBoxPending:   { backgroundColor: C.blueLight },
  badgeDone:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen },
  badgeDoneText:    { fontSize: 10, fontWeight: "700", color: C.green, letterSpacing: 0.5 },
  badgePending:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: C.gray100, borderWidth: 1, borderColor: C.border },
  badgePendingText: { fontSize: 10, fontWeight: "700", color: C.gray400, letterSpacing: 0.5 },
  title:            { fontSize: 15, fontWeight: "800", color: C.gray800, marginBottom: 6, lineHeight: 22 },
  desc:             { fontSize: 13, color: C.gray400, lineHeight: 20, marginBottom: 16, flex: 1 },
  bottomRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  dateIcon:         { fontSize: 11 },
  date:             { fontSize: 12, color: C.gray400 },
  resultBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen },
  resultBtnText:    { fontSize: 12, fontWeight: "700", color: C.green },
  startBtn:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: C.blue },
  startBtnText:     { fontSize: 12, fontWeight: "700", color: C.white },
});

// ─────────────────────────────────────────────────────────────────
// SurveyRow
// ─────────────────────────────────────────────────────────────────
function SurveyRow({ id, title, desc, createdAt, done, onStart, onViewSubmission }) {
  const displayDate = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";
  return (
    <View style={[sr.row, done ? sr.rowDone : sr.rowPending]}>
      <View style={[sr.iconBox, done ? sr.iconBoxDone : sr.iconBoxPending]}>
        <Text style={{ fontSize: 18 }}>{done ? "✅" : "📄"}</Text>
      </View>
      <View style={sr.info}>
        <Text style={sr.title} numberOfLines={1}>{title}</Text>
        <Text style={sr.desc}  numberOfLines={1}>{desc}</Text>
      </View>
      <Text style={sr.date}>{displayDate}</Text>
      {done ? (
        <TouchableOpacity
          onPress={() => onViewSubmission(id, title)}
          style={sr.resultBtn}
          activeOpacity={0.85}
        >
          <Text style={sr.resultBtnText}>Xem →</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => onStart(id)}
          style={sr.startBtn}
          activeOpacity={0.85}
        >
          <Text style={sr.startBtnText}>Bắt đầu →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sr = StyleSheet.create({
  row:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, borderWidth: 1, backgroundColor: C.white, marginBottom: 10 },
  rowDone:       { borderColor: C.borderGreen },
  rowPending:    { borderColor: C.border },
  iconBox:       { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconBoxDone:   { backgroundColor: C.greenLight },
  iconBoxPending:{ backgroundColor: C.blueLight },
  info:          { flex: 1, minWidth: 0 },
  title:         { fontSize: 13, fontWeight: "700", color: C.gray800 },
  desc:          { fontSize: 12, color: C.gray400, marginTop: 2 },
  date:          { fontSize: 11, color: C.gray400, flexShrink: 0 },
  resultBtn:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.borderGreen, flexShrink: 0 },
  resultBtnText: { fontSize: 11, fontWeight: "700", color: C.green },
  startBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.blue, flexShrink: 0 },
  startBtnText:  { fontSize: 11, fontWeight: "700", color: C.white },
});

// ─────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// SurveysPage (main)
// ─────────────────────────────────────────────────────────────────
export default function SurveysPage() {
  const navigation = useNavigation();
  const { fetchAllSurveys }  = useSurvey();
  const { getAllMyResponses } = useResponse();

  const [surveys, setSurveys]             = useState([]);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [modalSurvey, setModalSurvey]     = useState(null);
  const [activeTab, setActiveTab]         = useState("all");
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState("newest");
  const [viewMode, setViewMode]           = useState("grid");
  const [showFilter, setShowFilter]       = useState(false);

  const fetchAllSurveysRef  = useRef(fetchAllSurveys);
  const getAllMyResponsesRef = useRef(getAllMyResponses);
  useEffect(() => {
    fetchAllSurveysRef.current  = fetchAllSurveys;
    getAllMyResponsesRef.current = getAllMyResponses;
  });

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [surveysRaw, responsesRaw] = await Promise.all([
        fetchAllSurveysRef.current().catch(() => []),
        getAllMyResponsesRef.current().catch(() => null),
      ]);

      const surveyList = parseList(surveysRaw);
      setSurveys(surveyList);

      const responseList = parseList(responsesRaw);
      const ids = new Set(
        responseList.map((r) => r.survey_id ?? r.surveyId).filter(Boolean)
      );
      setDoneSurveyIds(ids);
    } catch {
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart          = (id) => navigation.navigate("UserSurvey", { surveyId: id });
  const handleViewSubmission = (id, title) => setModalSurvey({ id, title });

  const totalCount   = surveys.length;
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;
  const countFor     = (key) => key === "all" ? totalCount : key === "pending" ? pendingCount : doneCount;

  const displayed = useMemo(() => {
    let list = [...surveys];
    if (activeTab === "pending") list = list.filter((s) => !doneSurveyIds.has(s.id));
    if (activeTab === "done")    list = list.filter((s) =>  doneSurveyIds.has(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "oldest") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "name")   list.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [surveys, doneSurveyIds, activeTab, search, sortBy]);

  const renderCard = ({ item, index }) => {
    const isLeft = NUM_COLS === 2 && index % 2 === 0;
    return (
      <View style={[NUM_COLS === 2 && { flex: 1, marginRight: isLeft ? 8 : 0 }]}>
        <SurveyCard
          id={item.id} title={item.title} desc={item.description} createdAt={item.createdAt}
          done={doneSurveyIds.has(item.id)}
          onStart={handleStart}
          onViewSubmission={handleViewSubmission}
        />
      </View>
    );
  };

  const renderRow = ({ item }) => (
    <SurveyRow
      id={item.id} title={item.title} desc={item.description} createdAt={item.createdAt}
      done={doneSurveyIds.has(item.id)}
      onStart={handleStart}
      onViewSubmission={handleViewSubmission}
    />
  );

  const ListEmpty = () => (
    <View style={pp.emptyBox}>
      <Text style={{ fontSize: 48 }}>📭</Text>
      <Text style={pp.emptyTitle}>Không có khảo sát nào</Text>
      <Text style={pp.emptyDesc}>{search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có dữ liệu."}</Text>
      {!!search && (
        <TouchableOpacity onPress={() => setSearch("")}>
          <Text style={pp.emptyLink}>Xóa tìm kiếm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ListHeader = () => (
    <>
      <View style={pp.pageHeader}>
        <Text style={pp.pageTitle}>Khảo sát</Text>
        <Text style={pp.pageSubtitle}>
          {loading ? "Đang tải..." : `${totalCount} khảo sát · ${doneCount} hoàn thành · ${pendingCount} chưa làm`}
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={pp.tabsWrapper} contentContainerStyle={pp.tabsInner}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={[pp.tab, isActive ? pp.tabActive : pp.tabInactive]} activeOpacity={0.8}>
              <Text style={[pp.tabLabel, isActive ? pp.tabLabelActive : pp.tabLabelInactive]}>{tab.label}</Text>
              {!loading && (
                <View style={[pp.tabCount, isActive ? pp.tabCountActive : pp.tabCountInactive]}>
                  <Text style={[pp.tabCountText, isActive ? pp.tabCountTextActive : pp.tabCountTextInactive]}>
                    {countFor(tab.key)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Toolbar */}
      <View style={pp.toolbar}>
        <View style={pp.searchBox}>
          <Text style={{ fontSize: 14, color: C.gray400, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={pp.searchInput} value={search} onChangeText={setSearch}
            placeholder="Tìm kiếm khảo sát..." placeholderTextColor={C.gray400}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Text style={{ color: C.gray400, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TouchableOpacity onPress={() => setShowFilter((v) => !v)}
            style={[pp.filterBtn, showFilter && pp.filterBtnActive]} activeOpacity={0.8}>
            <Text style={{ fontSize: 14, marginRight: 4 }}>⚙️</Text>
            <Text style={[pp.filterBtnText, showFilter && { color: C.blue }]}>Lọc</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={pp.viewToggle}>
            <TouchableOpacity onPress={() => setViewMode("grid")}
              style={[pp.viewBtn, viewMode === "grid" && pp.viewBtnActive]}>
              <Text style={{ fontSize: 15 }}>⊞</Text>
            </TouchableOpacity>
            <View style={pp.viewDivider} />
            <TouchableOpacity onPress={() => setViewMode("list")}
              style={[pp.viewBtn, viewMode === "list" && pp.viewBtnActive]}>
              <Text style={{ fontSize: 15 }}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Panel */}
      {showFilter && (
        <View style={pp.filterPanel}>
          <Text style={pp.filterLabel}>Sắp xếp theo</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[{ key: "newest", label: "Mới nhất" }, { key: "oldest", label: "Cũ nhất" }, { key: "name", label: "Tên A–Z" }].map(({ key, label }) => (
              <TouchableOpacity key={key} onPress={() => setSortBy(key)}
                style={[pp.sortChip, sortBy === key && pp.sortChipActive]}>
                <Text style={[pp.sortChipText, sortBy === key && { color: C.blue }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => { setSearch(""); setSortBy("newest"); setActiveTab("all"); setShowFilter(false); }}
            style={pp.resetBtn}
          >
            <Text style={pp.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  if (error) {
    return (
      <View style={[pp.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
        <Text style={pp.emptyDesc}>{error}</Text>
        <TouchableOpacity onPress={fetchData} style={{ marginTop: 12 }}>
          <Text style={{ color: C.blue, fontWeight: "700", fontSize: 14 }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={pp.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}

      <FlatList
        data={loading ? [] : displayed}
        keyExtractor={(item, index) => String(item.id ?? index)}
        numColumns={viewMode === "grid" ? NUM_COLS : 1}
        key={viewMode === "grid" ? `grid-${NUM_COLS}` : "list"}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          loading
            ? () => (
                <View style={pp.skeletonGrid}>
                  {Array(6).fill(0).map((_, i) =>
                    viewMode === "grid"
                      ? <View key={i} style={NUM_COLS === 2 ? { flex: 1, marginRight: i % 2 === 0 ? 8 : 0 } : {}}>
                          <CardSkeleton />
                        </View>
                      : <RowSkeleton key={i} />
                  )}
                </View>
              )
            : ListEmpty
        }
        renderItem={viewMode === "grid" ? renderCard : renderRow}
        contentContainerStyle={pp.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={viewMode === "grid" && NUM_COLS > 1 ? { gap: 0 } : undefined}
      />
    </View>
  );
}

const pp = StyleSheet.create({
  container:            { flex: 1, backgroundColor: C.bg },
  listContent:          { paddingHorizontal: 16, paddingBottom: 32, paddingTop: Platform.OS === "ios" ? 56 : 16 },
  skeletonGrid:         { flexDirection: "row", flexWrap: "wrap" },
  pageHeader:           { marginBottom: 20 },
  pageTitle:            { fontSize: 28, fontWeight: "800", color: C.gray900, letterSpacing: -0.5 },
  pageSubtitle:         { fontSize: 13, color: C.gray400, marginTop: 4 },
  tabsWrapper:          { marginBottom: 16 },
  tabsInner:            { flexDirection: "row", gap: 4, backgroundColor: C.white, borderRadius: 18, padding: 6, borderWidth: 1, borderColor: C.border, alignSelf: "flex-start" },
  tab:                  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  tabActive:            { backgroundColor: C.blue },
  tabInactive:          { backgroundColor: "transparent" },
  tabLabel:             { fontSize: 13, fontWeight: "700" },
  tabLabelActive:       { color: C.white },
  tabLabelInactive:     { color: C.gray400 },
  tabCount:             { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  tabCountActive:       { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountInactive:     { backgroundColor: C.gray100 },
  tabCountText:         { fontSize: 11, fontWeight: "700" },
  tabCountTextActive:   { color: C.white },
  tabCountTextInactive: { color: C.gray500 },
  toolbar:              { marginBottom: 12 },
  searchBox:            { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  searchInput:          { flex: 1, fontSize: 13, color: C.gray800, padding: 0 },
  filterBtn:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterBtnActive:      { backgroundColor: C.blueLight, borderColor: C.blue },
  filterBtnText:        { fontSize: 13, fontWeight: "700", color: C.gray500 },
  viewToggle:           { flexDirection: "row", backgroundColor: C.white, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  viewBtn:              { paddingHorizontal: 12, paddingVertical: 10 },
  viewBtnActive:        { backgroundColor: C.blueLight },
  viewDivider:          { width: 1, backgroundColor: C.border },
  filterPanel:          { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  filterLabel:          { fontSize: 10, fontWeight: "700", color: C.gray500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  sortChip:             { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  sortChipActive:       { borderColor: C.blue, backgroundColor: C.blueLight },
  sortChipText:         { fontSize: 12, fontWeight: "700", color: C.gray500 },
  resetBtn:             { alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  resetBtnText:         { fontSize: 12, fontWeight: "700", color: C.gray400 },
  emptyBox:             { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 10 },
  emptyTitle:           { fontSize: 16, fontWeight: "700", color: C.gray500 },
  emptyDesc:            { fontSize: 13, color: C.gray400, textAlign: "center" },
  emptyLink:            { fontSize: 13, fontWeight: "700", color: C.blue, marginTop: 4 },
});