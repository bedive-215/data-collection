// ─── SurveyResponsePage.native.jsx ────────────────────────────────────────
// React Native version
// Deps: lucide-react-native, @react-navigation/native, react-native-safe-area-context

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import { useSurvey } from "@/providers/SurveyProvider";
// import { useResponse } from "@/providers/ResponseProvider";

/* ─── Lucide icons ─────────────────────────────────────────── */
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
  bg:       "#f1f5fb",
  surface:  "#ffffff",
  primary:  "#4f46e5",
  text:     "#0f172a",
  textSub:  "#64748b",
  textDim:  "#94a3b8",
  success:  "#059669",
  successBg:"#d1fae5",
  error:    "#b91c1c",
  errorBg:  "#fee2e2",
  gold:     "#d97706",
};

/* ─── Question type config ─────────────────────────────────── */
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản ngắn",    icon: "AlignLeft",    color: "#4f6ef7", bg: "#eef2ff" },
  PARAGRAPH:       { label: "Đoạn văn",         icon: "FileText",     color: "#7c3aed", bg: "#f5f3ff" },
  EMAIL:           { label: "Email",             icon: "Mail",         color: "#0891b2", bg: "#ecfeff" },
  DATE:            { label: "Ngày tháng",        icon: "Calendar",     color: "#b45309", bg: "#fffbeb" },
  NUMBER:          { label: "Số",                icon: "Hash",         color: "#059669", bg: "#ecfdf5" },
  RATING:          { label: "Đánh giá",          icon: "Star",         color: "#d97706", bg: "#fffbeb" },
  SINGLE_CHOICE:   { label: "Một lựa chọn",      icon: "CheckSquare",  color: "#ea580c", bg: "#fff7ed" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn",    icon: "CheckSquare",  color: "#16a34a", bg: "#f0fdf4" },
  DROPDOWN:        { label: "Danh sách thả",     icon: "ChevronDown",  color: "#6d28d9", bg: "#f5f3ff" },
};

/* ─── Mock data (xoá khi kết nối provider thật) ────────────── */
const MOCK_SURVEY = {
  id: "s1",
  title: "Khảo sát sự hài lòng khách hàng Q2",
  description: "Đánh giá mức độ hài lòng của khách hàng về sản phẩm và dịch vụ trong quý 2 năm 2024.",
};

const MOCK_RESPONSE = {
  submitted_at: "2024-05-15T10:30:00Z",
  answers: [
    { type: "TEXT",            question: "Tên của bạn là gì?",              answer: "Nguyễn Văn A" },
    { type: "EMAIL",           question: "Địa chỉ email của bạn?",          answer: "nguyenvana@email.com" },
    { type: "RATING",          question: "Bạn đánh giá sản phẩm thế nào?",  answer: "4/5" },
    { type: "MULTIPLE_CHOICE", question: "Tính năng nào bạn thích nhất?",   answer: ["Giao diện đẹp", "Dễ sử dụng", "Tốc độ nhanh"] },
    { type: "PARAGRAPH",       question: "Góp ý thêm của bạn?",             answer: "Sản phẩm rất tốt, tuy nhiên cần cải thiện thêm về tính năng báo cáo." },
    { type: "SINGLE_CHOICE",   question: "Bạn sẽ giới thiệu cho bạn bè?",   answer: "Có" },
  ],
};

/* ─── Animated background blobs ───────────────────────────── */
function AnimatedBackdrop() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (anim, duration, reverse = false) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      ).start();
    loop(anim1, 3000);
    loop(anim2, 4000, true);
  }, []);

  const ty1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const ty2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[ss.blob, { top: -60, right: -60, width: 220, height: 220, backgroundColor: "rgba(79,70,229,0.08)", transform: [{ translateY: ty1 }] }]} />
      <Animated.View style={[ss.blob, { bottom: 40, left: -40, width: 160, height: 160, backgroundColor: "rgba(16,185,129,0.07)", transform: [{ translateY: ty2 }] }]} />
      <Animated.View style={[ss.blob, { top: "40%", right: -20, width: 100, height: 100, backgroundColor: "rgba(217,119,6,0.07)", transform: [{ translateY: ty1 }] }]} />
    </View>
  );
}

/* ─── FadeIn wrapper ───────────────────────────────────────── */
function FadeIn({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 480, delay: delay * 1000, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 480, delay: delay * 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/* ─── Glass card ───────────────────────────────────────────── */
function GlassCard({ children, style, delay = 0 }) {
  return (
    <FadeIn delay={delay}>
      <View style={[ss.glassCard, style]}>{children}</View>
    </FadeIn>
  );
}

/* ─── Answer card ──────────────────────────────────────────── */
function AnswerCard({ answer, index }) {
  const cfg = TYPE_CONFIG[answer.type] || TYPE_CONFIG.TEXT;

  return (
    <GlassCard delay={0.1 + index * 0.05} style={ss.answerCard}>
      {/* Header */}
      <View style={ss.answerHeader}>
        <View style={[ss.typeIcon, { backgroundColor: cfg.bg }]}>
          <Icon name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ss.questionText}>{answer.question}</Text>
          <Text style={ss.typeLabel}>{cfg.label}</Text>
        </View>
      </View>

      {/* Answer body */}
      <View style={[ss.answerBody, { backgroundColor: cfg.bg, borderLeftColor: cfg.color }]}>
        {Array.isArray(answer.answer) ? (
          answer.answer.length > 0 ? (
            <View style={ss.tagsWrap}>
              {answer.answer.map((item, i) => (
                <View key={i} style={[ss.tag, { borderColor: cfg.color }]}>
                  <Text style={[ss.tagText, { color: cfg.color }]}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={ss.emptyAnswer}>(Không chọn)</Text>
          )
        ) : (
          <Text style={ss.answerValue}>{answer.answer || "(Trống)"}</Text>
        )}
      </View>
    </GlassCard>
  );
}

/* ─── Loading screen ───────────────────────────────────────── */
function LoadingScreen() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <SafeAreaView style={ss.centerScreen}>
      <AnimatedBackdrop />
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Icon name="Loader2" size={44} color={C.primary} />
      </Animated.View>
      <Text style={ss.loadingText}>Đang tải dữ liệu...</Text>
    </SafeAreaView>
  );
}

/* ─── Error screen ─────────────────────────────────────────── */
function ErrorScreen({ message, onBack }) {
  return (
    <SafeAreaView style={[ss.centerScreen, { justifyContent: "flex-start", padding: 20 }]}>
      <AnimatedBackdrop />
      <TouchableOpacity onPress={onBack} style={ss.backBtn}>
        <Icon name="ChevronLeft" size={16} color={C.primary} />
        <Text style={ss.backBtnText}>Quay lại</Text>
      </TouchableOpacity>
      <GlassCard style={{ marginTop: 16 }}>
        <View style={ss.errorRow}>
          <View style={ss.errorIcon}>
            <Icon name="AlertCircle" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ss.errorTitle}>Không tải được</Text>
            <Text style={ss.errorMsg}>{message || "Không thể tải được câu trả lời của bạn"}</Text>
          </View>
        </View>
      </GlassCard>
    </SafeAreaView>
  );
}

/* ─── Main page ────────────────────────────────────────────── */
export default function SurveyResponsePage() {
  // Thay bằng provider thật khi tích hợp:
  // const route = useRoute();
  // const { surveyId } = route.params;
  // const navigation = useNavigation();
  // const { fetchSurveyById } = useSurvey();
  // const { getMySubmission } = useResponse();

  const surveyId = "s1"; // mock
  const [loading,  setLoading]  = useState(true);
  const [survey,   setSurvey]   = useState(null);
  const [response, setResponse] = useState(null);
  const [error,    setError]    = useState(null);

  const handleBack = () => {
    // navigation.navigate("Home");
    console.log("Navigate to home");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Thật: const surveyRes  = await fetchSurveyById(surveyId);
        // Thật: const responseRes = await getMySubmission(surveyId);
        await new Promise(r => setTimeout(r, 800)); // giả lập delay
        setSurvey(MOCK_SURVEY);
        setResponse(MOCK_RESPONSE);
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [surveyId]);

  if (loading)                        return <LoadingScreen />;
  if (error || !survey || !response)  return <ErrorScreen message={error} onBack={handleBack} />;

  const submittedDate = response.submitted_at
    ? new Date(response.submitted_at).toLocaleDateString("vi-VN")
    : "Không rõ";

  return (
    <SafeAreaView style={ss.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <AnimatedBackdrop />

      <ScrollView
        style={ss.scroll}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity onPress={handleBack} style={ss.backBtn}>
          <Icon name="ChevronLeft" size={16} color={C.primary} />
          <Text style={ss.backBtnText}>Quay lại</Text>
        </TouchableOpacity>

        {/* ── Survey hero card ── */}
        <FadeIn delay={0}>
          <View style={ss.heroCard}>
            {/* Decorative blob inside card */}
            <View style={ss.heroBlobTR} />
            <View style={ss.heroBlobBL} />

            <View style={{ position: "relative" }}>
              {/* Completed badge */}
              <View style={ss.completedRow}>
                <View style={ss.completedIcon}>
                  <Icon name="CheckCircle2" size={24} color={C.primary} />
                </View>
                <Text style={ss.completedLabel}>ĐÃ HOÀN THÀNH</Text>
              </View>

              {/* Title */}
              <Text style={ss.heroTitle}>{survey.title}</Text>

              {/* Description */}
              {!!survey.description && (
                <Text style={ss.heroDesc}>{survey.description}</Text>
              )}

              {/* Meta row */}
              <View style={ss.metaRow}>
                <View style={ss.metaItem}>
                  <Icon name="Clock" size={16} color={C.primary} />
                  <Text style={ss.metaText}>{submittedDate}</Text>
                </View>
                <View style={ss.metaItem}>
                  <Icon name="Trophy" size={16} color={C.gold} />
                  <Text style={[ss.metaText, { color: C.gold, fontWeight: "700" }]}>+250 XP</Text>
                </View>
              </View>
            </View>
          </View>
        </FadeIn>

        {/* ── Answers section ── */}
        <FadeIn delay={0.1}>
          <Text style={ss.sectionTitle}>Câu trả lời của bạn</Text>
        </FadeIn>

        {response.answers?.map((answer, idx) => (
          <AnswerCard key={idx} answer={answer} index={idx} />
        ))}

        {/* ── Success footer ── */}
        <GlassCard
          delay={0.3}
          style={ss.successCard}
        >
          <View style={ss.successIconWrap}>
            <View style={ss.successIconCircle}>
              <Icon name="CheckCircle2" size={32} color={C.success} />
            </View>
          </View>
          <Text style={ss.successTitle}>Cảm ơn bạn đã hoàn thành khảo sát!</Text>
          <Text style={ss.successSub}>Câu trả lời của bạn đã được lưu vào hệ thống.</Text>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
const ss = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: C.textSub,
  },

  // Back button
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },

  // Hero card
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
    position: "relative",
  },
  heroBlobTR: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(79,70,229,0.07)",
  },
  heroBlobBL: {
    position: "absolute",
    bottom: -24,
    left: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(79,70,229,0.05)",
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  completedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(79,70,229,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.18)",
  },
  completedLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: C.textSub,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    lineHeight: 30,
    marginBottom: 10,
  },
  heroDesc: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: C.textSub,
  },

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
    marginBottom: 14,
    letterSpacing: 0.3,
  },

  // Glass card
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  // Answer card
  answerCard: {
    padding: 16,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  typeLabel: {
    fontSize: 12,
    color: C.textDim,
  },
  answerBody: {
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: "500",
    color: C.text,
    lineHeight: 22,
  },
  emptyAnswer: {
    fontSize: 13,
    color: C.textDim,
    fontStyle: "italic",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Success footer
  successCard: {
    backgroundColor: "rgba(236,253,245,0.9)",
    borderColor: "rgba(16,185,129,0.3)",
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 24,
    marginTop: 6,
  },
  successIconWrap: {
    marginBottom: 14,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.success,
    textAlign: "center",
  },
  successSub: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.error,
    marginBottom: 6,
  },
  errorMsg: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 20,
  },

  // Backdrop blob
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
});