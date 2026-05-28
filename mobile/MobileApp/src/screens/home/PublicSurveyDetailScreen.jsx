/**
 * PublicSurveyDetailScreen.jsx
 * Preview a public survey before taking it — shows description, question count, time limit, etc.
 * Then allows user to start the survey.
 */
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Image,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSurvey } from "../../providers/SurveyProvider";
import { useQuestion } from "../../providers/Questionprovider";
import { useResponse } from "../../providers/ResponseProvider";
import { COLORS, STATUS_MAP } from "../../utils/constants";

const { width: SW } = Dimensions.get("window");

/* ── Status badge ── */
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

/* ── Glass card ── */
function GlassCard({ children, style }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

/* ── Meta item ── */
function MetaItem({ icon, label, value }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <View>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

/* ── Loading ── */
function LoadingScreen() {
  return (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Đang tải thông tin khảo sát...</Text>
    </View>
  );
}

/* ── Main ── */
export default function PublicSurveyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const surveyId = route.params?.surveyId;
  const forceResponse = route.params?.forceResponse; // skip API fetch, go straight to response

  const { fetchSurveyById, currentSurvey } = useSurvey();
  const { questions, fetchQuestionsBySurvey } = useQuestion();
  const { getMySubmission } = useResponse();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  // If forced to show response (survey already done), skip fetch entirely
  useEffect(() => {
    if (forceResponse) {
      navigation.replace("SurveyResponse", { surveyId });
      return;
    }
  }, [forceResponse, surveyId]);

  useEffect(() => {
    if (!surveyId || forceResponse) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError(null);
        await fetchSurveyById(surveyId);
        await fetchQuestionsBySurvey(surveyId);
      } catch (err) {
        if (!cancelled) {
          const status = err?.response?.status;
          if (status === 403 || status === 404 || status === 410) {
            // Survey expired/closed/forbidden — check if user already submitted
            try {
              const submission = await getMySubmission(surveyId);
              if (!cancelled && submission) {
                // User has a submission — show response instead
                navigation.replace("SurveyResponse", { surveyId });
                return;
              }
            } catch {}
          }
          setError("Không thể tải thông tin khảo sát.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [surveyId]);

  const survey = currentSurvey;

  // Check schedule
  useEffect(() => {
    if (!survey) return;
    const now = new Date();
    const start = survey.start_at ? new Date(survey.start_at) : null;
    const end = survey.end_at ? new Date(survey.end_at) : null;
    if (start && now < start) { setError("Khảo sát chưa bắt đầu. Vui lòng quay lại sau."); }
    else if (end && now > end) { setError("Khảo sát đã kết thúc. Cảm ơn bạn đã quan tâm!"); }
  }, [survey]);

  if (loading) return <LoadingScreen />;

  const thumbColor = COLORS.thumbColors[0];
  const accentColor = survey?.accent_color || COLORS.primary;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Khảo sát công khai</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO CARD ── */}
        <GlassCard style={styles.heroCard}>
          {/* Thumb */}
          <View style={[styles.heroThumb, { backgroundColor: `${accentColor}15` }]}>
            <View style={[styles.heroThumbIcon, { backgroundColor: `${accentColor}25` }]}>
              <Text style={styles.heroThumbEmoji}>📋</Text>
            </View>
            {survey?.status && (
              <View style={styles.heroStatusBadge}>
                <StatusBadge status={survey.status} />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{survey?.title || "Khảo sát"}</Text>
            {survey?.description && (
              <Text style={styles.heroDesc}>{survey.description}</Text>
            )}
          </View>
        </GlassCard>

        {/* ── ERROR STATE ── */}
        {!!error && (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryBtnText}>← Quay lại</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* ── SURVEY INFO ── */}
        {!error && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>Thông tin khảo sát</Text>
              <View style={styles.infoGrid}>
                <MetaItem
                  icon="📄"
                  label="Số câu hỏi"
                  value={`${questions.length} câu hỏi`}
                />
                {survey?.time_limit_seconds ? (
                  <MetaItem
                    icon="⏱"
                    label="Thời gian"
                    value={`${Math.floor(survey.time_limit_seconds / 60)} phút`}
                  />
                ) : null}
                {survey?.is_anonymous ? (
                  <MetaItem
                    icon="⚠️"
                    label="Chế độ"
                    value="Ẩn danh"
                  />
                ) : null}
                {survey?.start_at && (
                  <MetaItem
                    icon="🗓"
                    label="Bắt đầu"
                    value={new Date(survey.start_at).toLocaleDateString("vi-VN")}
                  />
                )}
                {survey?.end_at && (
                  <MetaItem
                    icon="🏁"
                    label="Kết thúc"
                    value={new Date(survey.end_at).toLocaleDateString("vi-VN")}
                  />
                )}
              </View>
            </GlassCard>

            {/* ── ACTION ── */}
            <GlassCard style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Text style={{ fontSize: 36 }}>🚀</Text>
              </View>
              <Text style={styles.actionTitle}>Sẵn sàng tham gia?</Text>
              <Text style={styles.actionDesc}>
                Nhấn "Bắt đầu" để làm khảo sát. Câu trả lời của bạn sẽ được ghi nhận khi bạn hoàn thành.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate("SurveyTake", { surveyId })}
              >
                <Text style={styles.primaryBtnText}>📋 Bắt đầu làm khảo sát</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryBtnText}>← Quay lại danh sách</Text>
              </TouchableOpacity>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.gray100,
    borderWidth: 1, borderColor: COLORS.gray200, alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontSize: 20, color: COLORS.text, fontWeight: "300", lineHeight: 24 },
  headerInfo: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 14 },

  glassCard: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    overflow: "hidden",
  },

  // Hero
  heroCard: { overflow: "hidden" },
  heroThumb: {
    height: 140, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  heroThumbIcon: {
    width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center",
  },
  heroThumbEmoji: { fontSize: 32 },
  heroStatusBadge: { position: "absolute", top: 12, left: 12 },
  heroContent: { padding: 20 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
  heroDesc: { fontSize: 14, color: COLORS.textSub, lineHeight: 22 },

  // Info
  infoCard: { padding: 18, gap: 14 },
  infoTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  infoGrid: { gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaIcon: { fontSize: 20 },
  metaLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textSub, marginBottom: 1 },
  metaValue: { fontSize: 13, fontWeight: "700", color: COLORS.text },

  // Action
  actionCard: { padding: 24, alignItems: "center", gap: 12 },
  actionIcon: { marginBottom: 4 },
  actionTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, textAlign: "center" },
  actionDesc: { fontSize: 13, color: COLORS.textSub, textAlign: "center", lineHeight: 20 },

  // Error
  errorCard: { padding: 24, alignItems: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: { fontSize: 14, color: COLORS.textSub, textAlign: "center", lineHeight: 22 },

  // Badge
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },

  // Buttons
  primaryBtn: {
    width: "100%", paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.white },
  secondaryBtn: { paddingVertical: 12, alignItems: "center" },
  secondaryBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.textSub },

  // Loading
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSub },
});
