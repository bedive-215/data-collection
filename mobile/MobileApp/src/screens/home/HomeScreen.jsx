// ─── DashboardPage.native.jsx ─────────────────────────────────────
// Full-featured React Native Dashboard
// - "Xem tất cả" My Surveys → navigate to OrdersTab (SurveysLayout)
// - "Xem tất cả" Public Surveys → navigate to OrdersTab (SurveysLayout)
// - "Xem kết quả" → opens SubmissionModal inline using ResponseProvider API

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2,
  Clock,
  Zap,
  Trophy,
  FileText,
  Inbox,
  ClipboardList,
  Globe,
  Share2,
  Mail,
  ArrowRight,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useResponse } from "../../providers/Responseprovider";
import { useSurvey }   from "../../providers/Surveyprovider";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 16 * 2 - 12) / 2;

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════ */
const C = {
  bg:           "#f7f8fc",
  surface:      "#ffffff",
  surfaceHigh:  "#f4f5f9",
  border:       "#e8eaf0",
  primary:      "#4361ee",
  primaryLight: "#eef0fd",
  primaryBorder:"#c5cdfb",
  text:         "#0f1117",
  textSub:      "#6b7280",
  textDim:      "#9ca3af",
  success:      "#10b981",
  navy:         "#1a1a2e",
  thumbGrads: [
    ["#e0e7ff", "#c7d2fe"],
    ["#d1fae5", "#a7f3d0"],
    ["#fce7f3", "#fbcfe8"],
    ["#e0f2fe", "#bae6fd"],
    ["#fef3c7", "#fde68a"],
    ["#f3e8ff", "#e9d5ff"],
  ],
};

const STATUS_MAP = {
  ACTIVE:    { label: "Đang mở",  color: "#059669", bg: "#d1fae5" },
  DRAFT:     { label: "Nháp",     color: C.textSub,  bg: "#f3f4f6" },
  EXPIRED:   { label: "Hết hạn",  color: "#dc2626",  bg: "#fee2e2" },
  SCHEDULED: { label: "Lên lịch", color: "#d97706",  bg: "#fef3c7" },
  CLOSED:    { label: "Đã đóng",  color: "#6b7280",  bg: "#f3f4f6" },
};

const TYPE_META = {
  SINGLE_CHOICE:   { label: "Một lựa chọn",   color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed" },
  TEXT:            { label: "Văn bản",         color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc", accent: "#0891b2" },
};
function typeMeta(type) {
  return TYPE_META[type] ?? { label: type, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", accent: "#9ca3af" };
}

const MOCK_ACTIVITIES = [
  { Icon: CheckCircle2, iconColor: C.primary,  iconBg: C.primaryLight, title: "Health & Fitness Survey", sub: "Hoàn thành · 2 giờ trước",   xp: "+250 XP", xpColor: C.success   },
  { Icon: Trophy,       iconColor: "#f59e0b",  iconBg: "#fef3c7",      title: "Level 12 Reached",        sub: "Achievement · Hôm qua",       xp: "+500 XP", xpColor: "#d97706"   },
  { Icon: CheckCircle2, iconColor: C.primary,  iconBg: C.primaryLight, title: "Food Preference Study",   sub: "Hoàn thành · 1 ngày trước",   xp: "+150 XP", xpColor: C.success   },
];

/* ════════════════════════════════════════════════════════════════
   SKELETON PULSE
════════════════════════════════════════════════════════════════ */
function usePulse() {
  const anim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.6, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return anim;
}

/* ════════════════════════════════════════════════════════════════
   SUBMISSION MODAL
   Gọi getMySubmission(surveyId) từ ResponseProvider
════════════════════════════════════════════════════════════════ */
function SubmissionModal({ surveyId, surveyTitle, onClose }) {
  const { getMySubmission } = useResponse();
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!surveyId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await getMySubmission(surveyId);
        if (cancelled) return;
        // API trả về array hoặc { data: [...] }
        const flat = (res?.data ?? res ?? []).flatMap(r => r.answers ?? []);
        setAnswers(flat);
      } catch {
        if (!cancelled) setError("Không thể tải câu trả lời. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [surveyId]);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fc" }}>

        {/* Header */}
        <View style={smm.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={smm.closeText}>← Đóng</Text>
          </TouchableOpacity>
          <Text style={smm.brand}>InsightFlow</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Title section */}
        <View style={smm.titleSection}>
          <View style={smm.doneBadge}>
            <CheckCircle2 size={12} color="#15803d" />
            <Text style={smm.doneBadgeText}> Đã hoàn thành</Text>
          </View>
          <Text style={smm.surveyTitle}>{surveyTitle}</Text>
          {!loading && !error && (
            <Text style={smm.countText}>{answers.length} câu trả lời</Text>
          )}
        </View>

        {/* Loading */}
        {loading && (
          <View style={smm.center}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={smm.loadingText}>Đang tải kết quả...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={smm.center}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={smm.errorText}>{error}</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && answers.length === 0 && (
          <View style={smm.center}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={smm.emptyText}>Không có câu trả lời nào.</Text>
          </View>
        )}

        {/* Answer list */}
        {!loading && !error && answers.length > 0 && (
          <FlatList
            data={answers}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const meta       = typeMeta(item.type);
              const isText     = item.type === "TEXT";
              const isMultiple = item.type === "MULTIPLE_CHOICE";
              const selectedSet = isMultiple
                ? new Set(Array.isArray(item.answer)
                    ? item.answer
                    : String(item.answer ?? "").split(",").map(s => s.trim()))
                : new Set([String(item.answer ?? "")]);

              return (
                <View style={[smm.answerCard, { borderTopColor: meta.accent }]}>
                  {/* Question + type badge */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={smm.questionText}>{index + 1}. {item.question}</Text>
                    <View style={[smm.typeBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                      <Text style={[smm.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  {/* Text answer */}
                  {isText && (
                    <View style={smm.textBox}>
                      <Text style={smm.textContent}>{item.answer || "Không có dữ liệu"}</Text>
                    </View>
                  )}

                  {/* Choice answers */}
                  {!isText && (
                    <View style={{ gap: 6 }}>
                      {(item.options ?? []).map((opt, oi) => {
                        const label = opt?.label ?? opt?.value ?? opt?.content ?? String(opt);
                        const isSel = selectedSet.has(label) || selectedSet.has(String(opt.id ?? ""));
                        return (
                          <View key={oi} style={[smm.optRow, isSel && smm.optRowSel]}>
                            <View style={[
                              isMultiple ? smm.checkbox : smm.radio,
                              isSel && (isMultiple ? smm.checkboxSel : smm.radioSel),
                            ]}>
                              {isSel && isMultiple  && <Text style={smm.checkmark}>✓</Text>}
                              {isSel && !isMultiple && <View style={smm.radioDot} />}
                            </View>
                            <Text style={[smm.optLabel, isSel && smm.optLabelSel]}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const smm = StyleSheet.create({
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border },
  closeText:     { fontSize: 14, fontWeight: "600", color: C.textSub },
  brand:         { fontSize: 13, fontWeight: "700", color: C.textSub },
  titleSection:  { alignItems: "center", paddingVertical: 20, paddingHorizontal: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: C.border },
  doneBadge:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#86efac", marginBottom: 10 },
  doneBadgeText: { fontSize: 11, fontWeight: "700", color: "#15803d", textTransform: "uppercase", letterSpacing: 0.5 },
  surveyTitle:   { fontSize: 18, fontWeight: "800", color: C.text, textAlign: "center", marginBottom: 4, lineHeight: 26 },
  countText:     { fontSize: 12, color: C.textSub },
  center:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 },
  loadingText:   { fontSize: 13, color: C.primary, fontWeight: "600" },
  errorText:     { fontSize: 13, color: "#ef4444", textAlign: "center" },
  emptyText:     { fontSize: 13, color: C.textSub },
  answerCard:    { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: C.border, borderTopWidth: 3, marginBottom: 12, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  questionText:  { fontSize: 13, fontWeight: "700", color: C.text, lineHeight: 20, marginBottom: 8 },
  typeBadge:     { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  textBox:       { padding: 12, backgroundColor: "#f8faff", borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  textContent:   { fontSize: 13, color: "#374151", lineHeight: 20 },
  optRow:        { flexDirection: "row", alignItems: "center", gap: 10, padding: 9, borderRadius: 9, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fafafa" },
  optRowSel:     { borderColor: "#bfdbfe", backgroundColor: "#eff6ff" },
  checkbox:      { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  checkboxSel:   { borderColor: "#2563eb", backgroundColor: "#2563eb" },
  radio:         { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioSel:      { borderColor: "#2563eb" },
  radioDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563eb" },
  checkmark:     { fontSize: 10, color: "#fff", fontWeight: "700" },
  optLabel:      { fontSize: 12, color: "#6b7280", flex: 1 },
  optLabelSel:   { fontWeight: "600", color: "#1e40af" },
});

/* ════════════════════════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEY MINI CARD
════════════════════════════════════════════════════════════════ */
function MySurveyMiniCard({ survey, index, onPress }) {
  const colors   = C.thumbGrads[index % C.thumbGrads.length];
  const isClosed = survey.status === "CLOSED";
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.miniCard, isClosed && { opacity: 0.72 }]}
    >
      <View style={[styles.miniCardThumb, { backgroundColor: isClosed ? "#e2e8f0" : colors[0] }]}>
        <FileText size={28} color="rgba(67,97,238,0.18)" strokeWidth={1.5} />
        <View style={styles.miniCardThumbTopLeft}>
          <StatusBadge status={survey.status} />
          {survey.is_published && (
            <View style={styles.liveBadge}>
              <Globe size={7} color={C.primary} />
              <Text style={styles.liveBadgeText}> Live</Text>
            </View>
          )}
        </View>
        <View style={styles.miniCardThumbBottomRight}>
          <TouchableOpacity style={styles.thumbActionBtn} onPress={() => {}}>
            <Share2 size={9} color={C.textSub} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.thumbActionBtn} onPress={() => {}}>
            <Mail size={9} color={C.textSub} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.miniCardBody}>
        <Text style={styles.miniCardTitle} numberOfLines={1}>{survey.title}</Text>
        <Text style={styles.miniCardDesc}  numberOfLines={2}>{survey.description || "Không có mô tả"}</Text>
        <View style={styles.miniCardFooter}>
          <Clock size={10} color={C.textDim} />
          <Text style={styles.miniCardDate}>
            {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEY MINI CARD
════════════════════════════════════════════════════════════════ */
function PublicSurveyMiniCard({ survey, done, onStart, onViewResult }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => done ? onViewResult(survey.id, survey.title) : undefined}
      style={[styles.publicCard, done ? styles.publicCardDone : styles.publicCardPending]}
    >
      {done && <View style={styles.publicCardTopBar} />}

      <View style={styles.publicCardHeader}>
        <View style={[styles.publicCardIcon, { backgroundColor: done ? "#ecfdf5" : C.primaryLight }]}>
          {done
            ? <CheckCircle2 size={16} color={C.success} strokeWidth={1.8} />
            : <FileText     size={16} color={C.primary}  strokeWidth={1.8} />}
        </View>
        <View style={[
          styles.publicCardBadge,
          done
            ? { backgroundColor: "#dcfce7", borderColor: "#a7f3d0" }
            : { backgroundColor: C.surfaceHigh, borderColor: C.border },
        ]}>
          <Text style={[styles.publicCardBadgeText, { color: done ? "#059669" : C.textDim }]}>
            {done ? "Đã xong" : "Survey"}
          </Text>
        </View>
      </View>

      <Text style={styles.publicCardTitle} numberOfLines={1}>{survey.title}</Text>
      <Text style={styles.publicCardDesc}  numberOfLines={2}>{survey.description}</Text>

      <View style={styles.publicCardFooter}>
        <View style={styles.publicCardDateRow}>
          <Clock size={10} color={C.textDim} />
          <Text style={styles.publicCardDate}>
            {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
          </Text>
        </View>
        {done ? (
          // ← Tap "Xem →" mở SubmissionModal với API result
          <TouchableOpacity
            style={styles.btnDoneSmall}
            onPress={() => onViewResult(survey.id, survey.title)}
          >
            <Text style={styles.btnDoneSmallText}>Xem →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.btnStartSmall}
            onPress={() => onStart(survey.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnStartSmallText}>Bắt đầu →</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* ════════════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════════════ */
function MiniCardSkeleton({ hasThumb }) {
  const opacity = usePulse();
  return (
    <Animated.View style={[styles.miniCard, { opacity }]}>
      {hasThumb && <View style={[styles.miniCardThumb, { backgroundColor: "#f3f4f6" }]} />}
      <View style={{ padding: 12, gap: 8 }}>
        {!hasThumb && <View style={[styles.skeletonBox, { width: 32, height: 32, borderRadius: 9 }]} />}
        <View style={[styles.skeletonBox, { height: 11, width: "70%" }]} />
        <View style={[styles.skeletonBox, { height: 10, width: "100%" }]} />
        <View style={[styles.skeletonBox, { height: 10, width: "55%" }]} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <View style={[styles.skeletonBox, { height: 10, width: 48 }]} />
          <View style={[styles.skeletonBox, { height: 26, width: 70, borderRadius: 7 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════
   STAT CARD
════════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, subColor, loading }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardGhostIcon}><Icon size={40} color={iconColor} /></View>
      <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{loading ? "—" : value}</Text>
      {sub ? <Text style={[styles.statSub, { color: subColor || C.textSub }]}>{sub}</Text> : null}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   ACTIVITY ITEM
════════════════════════════════════════════════════════════════ */
function ActivityItem({ Icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={styles.activityTextWrap}>
        <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.activitySub}>{sub}</Text>
      </View>
      <Text style={[styles.activityXP, { color: xpColor }]}>{xp}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   WEEKEND CHALLENGE
════════════════════════════════════════════════════════════════ */
function WeekendChallenge() {
  return (
    <ImageBackground
      source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCG03R-J3AOEaCVe7DOPDBsSzk1qBnJ_cSOKMi5AtWX-_YU-HZIisL7r7jIyUMnW7sBEmJ_4pRWir4wBA2cd2MjB4BYbuqmcc5fzNLckPRq-4RENObTC1rJo8Ryymqd22pKrVvKzL9g1TLvmUt9pDbtnrdon68H8nONY8hAYzUKzfJ26Nmu9bHt4EXj9P2Kg-HUmLt0kiBuZqOOXcn_ukIKBvAjTr5ZjNJVRiSQzsRmEfrv0SgAvPfujpNKhEnpFAlu6DaWPGehLbSj" }}
      style={styles.challengeContainer}
      imageStyle={{ borderRadius: 16 }}
    >
      <View style={styles.challengeOverlay}>
        <View style={styles.challengeBadge}>
          <Zap size={11} color="#b3caff" />
          <Text style={styles.challengeBadgeText}> ACTIVE CHALLENGE</Text>
        </View>
        <Text style={styles.challengeTitle}>Weekend Challenge</Text>
        <Text style={styles.challengeDesc}>
          Hoàn thành 5 khảo sát trong 48h để nhận{" "}
          <Text style={{ color: "#b3caff", fontWeight: "700" }}>Bonus 2000 XP</Text>.
        </Text>
        <TouchableOpacity style={styles.challengeBtn} activeOpacity={0.85}>
          <Text style={styles.challengeBtnText}>Join Challenge</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION HEADER
════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, count, countColor, countBg, countBorder, onViewAll }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null && (
          <View style={[styles.sectionCountBadge, {
            backgroundColor: countBg    || C.primaryLight,
            borderColor:     countBorder || C.primaryBorder,
          }]}>
            <Text style={[styles.sectionCountText, { color: countColor || C.primary }]}>{count}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.viewAllBtn} onPress={onViewAll} activeOpacity={0.8}>
        <Text style={styles.viewAllText}>Xem tất cả</Text>
        <ArrowRight size={12} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   DIVIDER
════════════════════════════════════════════════════════════════ */
function PublicDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerBadge}>
        <Globe size={10} color={C.textDim} />
        <Text style={styles.dividerText}> Công khai</Text>
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const navigation = useNavigation();
  const { getAllMyResponses } = useResponse();
  const { mySurveys, publicSurveys, fetchMySurveys, fetchPublicSurveys } = useSurvey();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Submission modal ──
  // { id: string, title: string } | null
  const [modalSurvey, setModalSurvey] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const responsesRes  = await getAllMyResponses().catch(() => null);
      const responsesList = responsesRes?.data ?? [];
      setDoneSurveyIds(new Set(responsesList.map(r => r.survey_id ?? r.surveyId)));
      await Promise.all([fetchMySurveys(1, 20), fetchPublicSurveys()]);
    } catch (err) {
      console.error("Dashboard fetchData error:", err);
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Handlers ──

  // Bắt đầu làm survey
  const handleStart = (id) => navigation.navigate("SurveyTake", { surveyId: id });

  // Xem kết quả → mở SubmissionModal (gọi API getMySubmission)
  const handleViewResult = (id, title) => setModalSurvey({ id, title });

  // "Xem tất cả" My Surveys → chuyển sang tab Khảo sát (OrdersTab = SurveysLayout)
  const handleViewAllMy = () =>
    navigation.navigate("MainApp", {
      screen: "OrdersTab",
      params: { initialTab: "mySurveys" },
    });

  // "Xem tất cả" Public Surveys → chuyển sang tab Khảo sát
  const handleViewAllPublic = () =>
    navigation.navigate("MainApp", {
      screen: "OrdersTab",
      params: { initialTab: "public" },
    });

  // Bấm vào MySurveyMiniCard → QuestionScreen
  const handleViewSurvey = (id) => navigation.navigate("QuestionScreen", { surveyId: id });

  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;
  const doneCount    = publicSurveys.filter(s =>  doneSurveyIds.has(s.id)).length;

  const previewMySurveys     = mySurveys.slice(0, 2);
  const previewPublicSurveys = publicSurveys.slice(0, 2);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Welcome ── */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Chào mừng trở lại! 👋</Text>
        <Text style={styles.welcomeSub}>
          Bạn đã hoàn thành{" "}
          <Text style={{ color: C.primary, fontWeight: "700" }}>
            {loading ? "..." : doneCount}
          </Text>{" "}
          khảo sát.
          {!loading && pendingCount > 0 && (
            <Text>
              {" "}Còn{" "}
              <Text style={{ color: C.text, fontWeight: "700" }}>{pendingCount}</Text>
              {" "}khảo sát đang chờ bạn.
            </Text>
          )}
        </Text>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatCard icon={ClipboardList} iconColor={C.primary} iconBg={C.primaryLight}
          label="Completed" value={doneCount} sub={`/ ${publicSurveys.length} tổng`} loading={loading} />
        <StatCard icon={FileText} iconColor="#f59e0b" iconBg="#fef3c7"
          label="Pending" value={String(pendingCount).padStart(2, "0")}
          sub="Chưa xong" subColor="#d97706" loading={loading} />
        <StatCard icon={Trophy} iconColor="#d97706" iconBg="#fef3c7"
          label="XP" value="12,450" sub="+250 hôm nay" subColor={C.success} loading={false} />
      </View>

      {/* ── My Surveys ── */}
      <View style={styles.section}>
        <SectionHeader
          title="My Surveys"
          count={mySurveys.length}
          onViewAll={handleViewAllMy}
        />
        {loading ? (
          <View style={styles.cardGrid}>
            <MiniCardSkeleton hasThumb /><MiniCardSkeleton hasThumb />
          </View>
        ) : mySurveys.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox size={32} color={C.textDim} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Chưa có survey nào</Text>
          </View>
        ) : (
          <View style={styles.cardGrid}>
            {previewMySurveys.map((survey, i) => (
              <MySurveyMiniCard
                key={survey.id}
                survey={survey}
                index={i}
                onPress={() => handleViewSurvey(survey.id)}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Divider ── */}
      <PublicDivider />

      {/* ── Public Surveys ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Khảo Sát"
          count={publicSurveys.length}
          countColor="#059669"
          countBg="#dcfce7"
          countBorder="#a7f3d0"
          onViewAll={handleViewAllPublic}
        />
        {loading ? (
          <View style={styles.cardGrid}>
            <MiniCardSkeleton /><MiniCardSkeleton />
          </View>
        ) : publicSurveys.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox size={32} color={C.textDim} strokeWidth={1.5} />
            <Text style={styles.emptyText}>Chưa có khảo sát công khai</Text>
          </View>
        ) : (
          <View style={styles.cardGrid}>
            {previewPublicSurveys.map(s => (
              <PublicSurveyMiniCard
                key={s.id}
                survey={s}
                done={doneSurveyIds.has(s.id)}
                onStart={handleStart}
                onViewResult={handleViewResult}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Recent Activity ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {MOCK_ACTIVITIES.map((a, i) => <ActivityItem key={i} {...a} />)}
        </View>
      </View>

      {/* ── Weekend Challenge ── */}
      <View style={[styles.section, { paddingBottom: 32 }]}>
        <WeekendChallenge />
      </View>

      {/* ── Submission Modal ── */}
      {modalSurvey && (
        <SubmissionModal
          surveyId={modalSurvey.id}
          surveyTitle={modalSurvey.title}
          onClose={() => setModalSurvey(null)}
        />
      )}
    </ScrollView>
  );
}

/* ════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 16, paddingTop: 24 },

  welcomeSection: { marginBottom: 24 },
  welcomeTitle:   { fontSize: 24, fontWeight: "800", color: C.text, marginBottom: 6, letterSpacing: -0.5 },
  welcomeSub:     { fontSize: 13, color: C.textSub, lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard:  { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, overflow: "hidden", position: "relative" },
  statCardGhostIcon: { position: "absolute", top: 8, right: 8, opacity: 0.05 },
  statIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statLabel:   { fontSize: 9, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: "600", marginBottom: 2 },
  statValue:   { fontSize: 22, fontWeight: "800", color: C.text, lineHeight: 26 },
  statSub:     { fontSize: 10, fontWeight: "600", marginTop: 3 },

  section:           { marginBottom: 24 },
  sectionHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle:      { fontSize: 13, fontWeight: "800", color: C.text },
  sectionCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  sectionCountText:  { fontSize: 10, fontWeight: "700" },
  viewAllBtn:        { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: C.primaryLight },
  viewAllText:       { fontSize: 11, fontWeight: "700", color: C.primary },

  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  miniCard:                { width: CARD_W, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  miniCardThumb:           { height: 90, alignItems: "center", justifyContent: "center", position: "relative" },
  miniCardThumbTopLeft:    { position: "absolute", top: 8, left: 8, flexDirection: "row", gap: 4, alignItems: "center" },
  miniCardThumbBottomRight:{ position: "absolute", bottom: 8, right: 8, flexDirection: "row", gap: 4 },
  thumbActionBtn: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" },
  miniCardBody:   { padding: 12, gap: 6 },
  miniCardTitle:  { fontSize: 12, fontWeight: "700", color: C.text, lineHeight: 18 },
  miniCardDesc:   { fontSize: 11, color: C.textSub, lineHeight: 16 },
  miniCardFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  miniCardDate:   { fontSize: 10, color: C.textDim },

  statusBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  statusBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },
  liveBadge:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(67,97,238,0.12)" },
  liveBadgeText:   { fontSize: 9, fontWeight: "700", color: C.primary },

  publicCard:        { width: CARD_W, borderRadius: 14, padding: 14, borderWidth: 1, gap: 6, overflow: "hidden", position: "relative" },
  publicCardDone:    { backgroundColor: C.surface, borderColor: "rgba(16,185,129,0.18)" },
  publicCardPending: { backgroundColor: C.surface, borderColor: C.border },
  publicCardTopBar:  { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: C.success },
  publicCardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  publicCardIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  publicCardBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, alignSelf: "flex-start" },
  publicCardBadgeText:{ fontSize: 9, fontWeight: "700" },
  publicCardTitle:   { fontSize: 12, fontWeight: "700", color: C.text, lineHeight: 18 },
  publicCardDesc:    { fontSize: 11, color: C.textSub, lineHeight: 16 },
  publicCardFooter:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  publicCardDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  publicCardDate:    { fontSize: 10, color: C.textDim },
  btnDoneSmall:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#a7f3d0" },
  btnDoneSmallText:  { fontSize: 10, fontWeight: "700", color: "#059669" },
  btnStartSmall:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, backgroundColor: C.primary },
  btnStartSmallText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  skeletonBox: { backgroundColor: "#f3f4f6", borderRadius: 5 },
  emptyState:  { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyText:   { fontSize: 12, color: C.textSub },

  divider:      { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 8, marginBottom: 20 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  dividerText:  { fontSize: 9, fontWeight: "700", color: C.textDim, textTransform: "uppercase", letterSpacing: 1 },

  activityList:    { gap: 7, marginTop: 10 },
  activityItem:    { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 11, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border },
  activityIconWrap:{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  activityTextWrap:{ flex: 1, minWidth: 0 },
  activityTitle:   { fontSize: 12, fontWeight: "700", color: C.text },
  activitySub:     { fontSize: 11, color: C.textSub, marginTop: 1 },
  activityXP:      { fontSize: 12, fontWeight: "700" },

  challengeContainer: { borderRadius: 16, overflow: "hidden", minHeight: 210 },
  challengeOverlay:   { flex: 1, backgroundColor: "rgba(0,30,80,0.78)", padding: 22, borderRadius: 16 },
  challengeBadge:     { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(67,97,238,0.22)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(67,97,238,0.32)", marginBottom: 12 },
  challengeBadgeText: { fontSize: 9, fontWeight: "700", color: "#b3caff", letterSpacing: 1 },
  challengeTitle:     { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 8, lineHeight: 26 },
  challengeDesc:      { fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 19, marginBottom: 16 },
  challengeBtn:       { backgroundColor: "#fff", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  challengeBtnText:   { fontSize: 13, fontWeight: "700", color: C.navy },
});