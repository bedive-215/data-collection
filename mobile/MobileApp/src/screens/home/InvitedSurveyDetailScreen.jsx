/**
 * InvitedSurveyDetailScreen.jsx
 * Shows an invited survey based on role:
 * - editor    → redirects to SurveyStudio
 * - viewer    → shows read-only questions
 * - respondent → allows starting the survey
 */
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSurvey } from "../../providers/SurveyProvider";
import { useQuestion } from "../../providers/Questionprovider";
import { COLORS, STATUS_MAP } from "../../utils/constants";

function GlassCard({ children, style }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

function RoleBadge({ role }) {
  const themes = {
    editor:     { label: "Chỉnh sửa",    bg: "rgba(124,58,237,0.12)",  color: "#6d28d9" },
    viewer:     { label: "Xem câu hỏi", bg: "rgba(2,132,199,0.10)",   color: "#0369a1" },
    respondent: { label: "Làm khảo sát", bg: "rgba(5,150,105,0.10)",  color: "#047857" },
  };
  const t = themes[role] || themes.respondent;
  return (
    <View style={[styles.roleBadge, { backgroundColor: t.bg }]}>
      <Text style={[styles.roleBadgeText, { color: t.color }]}>{t.label}</Text>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingCenter}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Đang tải khảo sát...</Text>
    </View>
  );
}

export default function InvitedSurveyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const surveyId = route.params?.surveyId;

  const { fetchSurveyById, currentSurvey } = useSurvey();
  const { questions, fetchQuestionsBySurvey } = useQuestion();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!surveyId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchSurveyById(surveyId),
          fetchQuestionsBySurvey(surveyId),
        ]);
      } catch (err) {
        if (!cancelled) setError("Không tải được khảo sát.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [surveyId]);

  // Editor → redirect to studio (must stay above early return to preserve hook order)
  useEffect(() => {
    if (!loading && survey && role === "editor") {
      navigation.replace("SurveyStudio", { surveyId: survey.id });
    }
  }, [loading, survey, role]);

  if (loading) return <LoadingScreen />;

  const survey = currentSurvey;
  const role = survey?.role || "respondent";

  const accentColor = survey?.accent_color || COLORS.primary;
  const isExpired = survey?.end_at && new Date(survey.end_at) < new Date();
  const notStarted = survey?.start_at && new Date(survey.start_at) > new Date();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Khảo sát được mời</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD */}
        <GlassCard style={styles.heroCard}>
          <View style={[styles.heroThumb, { backgroundColor: `${accentColor}15` }]}>
            <View style={[styles.heroThumbIcon, { backgroundColor: `${accentColor}25` }]}>
              <Text style={styles.heroThumbEmoji}>📋</Text>
            </View>
            <View style={styles.heroBadges}>
              {survey?.status && (
                <View style={[styles.statusBadge, { backgroundColor: STATUS_MAP[survey.status]?.bg || "#f3f4f6" }]}>
                  <Text style={[styles.statusBadgeText, { color: STATUS_MAP[survey.status]?.color || "#6b7280" }]}>
                    {STATUS_MAP[survey.status]?.label || survey.status}
                  </Text>
                </View>
              )}
              <RoleBadge role={role} />
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{survey?.title || "Khảo sát"}</Text>
            {survey?.description && (
              <Text style={styles.heroDesc}>{survey.description}</Text>
            )}
          </View>
        </GlassCard>

        {/* ERROR / SCHEDULE STATE */}
        {error || notStarted || isExpired ? (
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>
              {error || notStarted ? "Khảo sát chưa bắt đầu." : "Khảo sát đã kết thúc."}
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryBtnText}>← Quay lại</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : null}

        {/* ── VIEWER MODE ── */}
        {role === "viewer" && !error && !notStarted && !isExpired && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>👁 Chế độ xem câu hỏi</Text>
              <Text style={styles.infoSub}>
                Bạn chỉ có thể xem các câu hỏi. Bạn không thể trả lời khảo sát này.
              </Text>
            </GlassCard>

            {questions.map((q, i) => (
              <GlassCard key={q.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Câu {i + 1}</Text>
                  {q.required && <Text style={styles.requiredTag}>* Bắt buộc</Text>}
                </View>
                <Text style={styles.questionText}>{q.content}</Text>
                {q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" ? (
                  <View style={styles.optionsList}>
                    {(q.options || []).map((opt) => (
                      <View key={opt.id} style={styles.readonlyOption}>
                        <View style={styles.optionDot} />
                        <Text style={styles.optionText}>{opt.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </GlassCard>
            ))}

            <GlassCard style={styles.viewOnlyBanner}>
              <Text style={styles.viewOnlyText}>
                👁 Bạn đang ở chế độ xem. Bạn không thể trả lời khảo sát này.
              </Text>
            </GlassCard>
          </>
        )}

        {/* ── RESPONDENT MODE ── */}
        {role === "respondent" && !error && !notStarted && !isExpired && (
          <>
            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>Thông tin khảo sát</Text>
              <View style={styles.infoGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📄</Text>
                  <View>
                    <Text style={styles.metaLabel}>Số câu hỏi</Text>
                    <Text style={styles.metaValue}>{questions.length} câu hỏi</Text>
                  </View>
                </View>
                {survey?.is_anonymous && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>⚠️</Text>
                    <View>
                      <Text style={styles.metaLabel}>Chế độ</Text>
                      <Text style={styles.metaValue}>Ẩn danh</Text>
                    </View>
                  </View>
                )}
                {survey?.start_at && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🗓</Text>
                    <View>
                      <Text style={styles.metaLabel}>Bắt đầu</Text>
                      <Text style={styles.metaValue}>
                        {new Date(survey.start_at).toLocaleDateString("vi-VN")}
                      </Text>
                    </View>
                  </View>
                )}
                {survey?.end_at && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>🏁</Text>
                    <View>
                      <Text style={styles.metaLabel}>Kết thúc</Text>
                      <Text style={styles.metaValue}>
                        {new Date(survey.end_at).toLocaleDateString("vi-VN")}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </GlassCard>

            {/* ACTION */}
            <GlassCard style={styles.actionCard}>
              <Text style={styles.actionIcon}>🚀</Text>
              <Text style={styles.actionTitle}>Sẵn sàng tham gia?</Text>
              <Text style={styles.actionDesc}>
                Nhấn "Bắt đầu" để làm khảo sát. Câu trả lời của bạn sẽ được ghi nhận khi hoàn thành.
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
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontSize: 20, color: COLORS.text, fontWeight: "300" },
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
    height: 120, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  heroThumbIcon: {
    width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  heroThumbEmoji: { fontSize: 28 },
  heroBadges: { position: "absolute", top: 10, left: 12, flexDirection: "row", gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  roleBadgeText: { fontSize: 11, fontWeight: "700" },
  heroContent: { padding: 20 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
  heroDesc: { fontSize: 14, color: COLORS.textSub, lineHeight: 22 },

  // Info
  infoCard: { padding: 18, gap: 14 },
  infoTitle: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  infoSub: { fontSize: 13, color: COLORS.textSub, lineHeight: 20 },
  infoGrid: { gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaIcon: { fontSize: 20 },
  metaLabel: { fontSize: 11, fontWeight: "600", color: COLORS.textSub, marginBottom: 1 },
  metaValue: { fontSize: 13, fontWeight: "700", color: COLORS.text },

  // Question (viewer mode)
  questionCard: { padding: 16, gap: 10 },
  questionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  questionNumber: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  requiredTag: { fontSize: 11, color: "#ef4444", fontWeight: "600" },
  questionText: { fontSize: 15, fontWeight: "600", color: COLORS.text, lineHeight: 22 },
  optionsList: { gap: 8, marginTop: 6 },
  readonlyOption: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.gray200, borderWidth: 1.5, borderColor: COLORS.gray300,
  },
  optionText: { fontSize: 14, color: COLORS.textSub },
  viewOnlyBanner: {
    padding: 16, alignItems: "center",
    backgroundColor: "rgba(2,132,199,0.06)", borderColor: "rgba(2,132,199,0.2)",
  },
  viewOnlyText: { fontSize: 13, color: "#0369a1", fontWeight: "600", textAlign: "center" },

  // Action
  actionCard: { padding: 24, alignItems: "center", gap: 12 },
  actionIcon: { fontSize: 36 },
  actionTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, textAlign: "center" },
  actionDesc: { fontSize: 13, color: COLORS.textSub, textAlign: "center", lineHeight: 20 },

  // Error
  errorCard: { padding: 24, alignItems: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: { fontSize: 14, color: COLORS.textSub, textAlign: "center", lineHeight: 22 },

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
