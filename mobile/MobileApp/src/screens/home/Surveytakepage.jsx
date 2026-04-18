// ─── SurveyTakePage.native.jsx ────────────────────────────────────
// Dependencies:
//   npm install lucide-react-native react-native-svg

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  AlignLeft,
  CheckSquare,
  Send,
  Home,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useQuestion } from "../../providers/Questionprovider";
import { useResponse } from "../../providers/Responseprovider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Colors ───────────────────────────────────────────────────────
const C = {
  primary:     "#4f6ef7",
  primaryLight:"#eef2ff",
  primaryBorder:"#c7d2fe",
  orange:      "#ea580c",
  orangeLight: "#fff7ed",
  orangeBorder:"#fed7aa",
  green:       "#16a34a",
  greenLight:  "#f0fdf4",
  greenBorder: "#bbf7d0",
  greenDark:   "#14532d",
  red:         "#ef4444",
  bg:          "#f4f5f7",
  white:       "#ffffff",
  gray50:      "#fafafa",
  gray100:     "#f3f4f6",
  gray200:     "#e5e7eb",
  gray300:     "#d1d5db",
  gray400:     "#9ca3af",
  gray500:     "#6b7280",
  gray700:     "#374151",
  gray900:     "#111827",
};

// ─── Type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản",        Icon: AlignLeft,   color: C.primary, bg: C.primaryLight, border: C.primaryBorder },
  SINGLE_CHOICE:   { label: "Một lựa chọn",   Icon: CircleDot,   color: C.orange,  bg: C.orangeLight,  border: C.orangeBorder  },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", Icon: CheckSquare, color: C.green,   bg: C.greenLight,   border: C.greenBorder   },
};

// ─── ProgressBar ──────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  const barWidth = ((current / total) * (SCREEN_WIDTH - 32 - 32));

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>Câu hỏi {current} / {total}</Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: barWidth }]} />
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < current  ? styles.progressDotDone : styles.progressDotEmpty,
              i === current - 1 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────
function SuccessScreen({ onGoHome }) {
  return (
    <View style={styles.successContainer}>
      <View style={styles.successCard}>
        <View style={styles.successIconWrap}>
          <CheckCircle2 size={40} color={C.green} />
        </View>

        <Text style={styles.successTitle}>Gửi thành công! 🎉</Text>
        <Text style={styles.successDesc}>
          Câu trả lời của bạn đã được ghi nhận.{"\n"}
          Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.
        </Text>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.btnHome} onPress={onGoHome} activeOpacity={0.85}>
          <Home size={16} color={C.white} />
          <Text style={styles.btnHomeText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── CheckboxIcon (thay SVG inline) ──────────────────────────────
function CheckboxIcon() {
  return (
    <View style={styles.checkboxTick}>
      <Text style={{ color: C.white, fontSize: 11, fontWeight: "700", lineHeight: 14 }}>✓</Text>
    </View>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────
function QuestionCard({ question, answer, onChange }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, color, bg, border } = cfg;
  const [focused, setFocused] = useState(false);

  const sorted = [...(question.options ?? [])].sort((a, b) =>
    (a.content ?? "").localeCompare(b.content ?? "")
  );

  const toggleMulti = (optId) => {
    const current = answer instanceof Set ? new Set(answer) : new Set();
    if (current.has(optId)) current.delete(optId); else current.add(optId);
    onChange(question.id, current);
  };

  return (
    <View style={styles.questionCard}>
      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: bg, borderColor: border }]}>
        <Icon size={11} color={color} />
        <Text style={[styles.typeBadgeText, { color }]}> {label}</Text>
        {question.required && <Text style={styles.requiredStar}>*</Text>}
      </View>

      {/* Question content */}
      <Text style={styles.questionContent}>{question.content}</Text>

      {/* TEXT */}
      {question.type === "TEXT" && (
        <TextInput
          style={[styles.textInput, focused && styles.textInputFocused]}
          placeholder="Nhập câu trả lời của bạn..."
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(val) => onChange(question.id, val)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}

      {/* SINGLE CHOICE */}
      {question.type === "SINGLE_CHOICE" && sorted.length > 0 && (
        <View style={{ gap: 10 }}>
          {sorted.map((opt) => {
            const selected = answer === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => onChange(question.id, opt.id)}
                activeOpacity={0.8}
                style={[styles.optionBtn, selected && styles.optionBtnSelectedSingle]}
              >
                {/* Radio */}
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelectedSingle]}>
                  {opt.content}
                </Text>
                {selected && <CheckCircle2 size={16} color={C.primary} style={{ marginLeft: "auto" }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* MULTIPLE CHOICE */}
      {question.type === "MULTIPLE_CHOICE" && sorted.length > 0 && (
        <View>
          <Text style={styles.multiHint}>Có thể chọn nhiều đáp án</Text>
          <View style={{ gap: 10 }}>
            {sorted.map((opt) => {
              const selected = answer instanceof Set && answer.has(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => toggleMulti(opt.id)}
                  activeOpacity={0.8}
                  style={[styles.optionBtn, selected && styles.optionBtnSelectedMulti]}
                >
                  {/* Checkbox */}
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <CheckboxIcon />}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelectedMulti]}>
                    {opt.content}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── SurveyTakePage ───────────────────────────────────────────────
export default function SurveyTakePage() {
  // ✅ useRoute thay useParams, useNavigation thay useNavigate
  const route      = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params ?? {};

  const { questions, fetchQuestionsBySurvey, loading } = useQuestion();
  const { submitSurvey, submitting } = useResponse();

  const [answers, setAnswers]         = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted]     = useState(false);

  useEffect(() => {
    if (surveyId) fetchQuestionsBySurvey(surveyId);
  }, [surveyId]);

  const sorted  = [...questions].sort((a, b) => a.order_index - b.order_index);
  const total   = sorted.length;
  const current = sorted[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === total - 1;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    if (!current) return false;
    if (!current.required) return true;
    const ans = answers[current.id];
    if (current.type === "TEXT")            return typeof ans === "string" && ans.trim().length > 0;
    if (current.type === "SINGLE_CHOICE")   return !!ans;
    if (current.type === "MULTIPLE_CHOICE") return ans instanceof Set && ans.size > 0;
    return true;
  };

  // ✅ Build payload & gọi API — giống hệt file gốc
  const handleSubmit = async () => {
    if (!canProceed() || submitting) return;

    const formattedAnswers = [];
    sorted.forEach((q) => {
      const val = answers[q.id];
      if (q.type === "TEXT") {
        formattedAnswers.push({ question_id: q.id, answer_text: val || null, option_id: null });
      }
      if (q.type === "SINGLE_CHOICE") {
        formattedAnswers.push({ question_id: q.id, answer_text: null, option_id: val || null });
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const selected = val instanceof Set ? [...val] : [];
        selected.forEach((optId) => {
          formattedAnswers.push({ question_id: q.id, answer_text: null, option_id: optId });
        });
      }
    });

    try {
      await submitSurvey(surveyId, { answers: formattedAnswers });
      setSubmitted(true);
    } catch {
      // toast đã xử lý trong ResponseProvider
    }
  };

  // ✅ navigation.navigate thay navigate("/user/home")
  if (submitted) {
    return <SuccessScreen onGoHome={() => navigation.navigate("UserHome")} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <ChevronLeft size={18} color={C.gray700} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Làm khảo sát</Text>
            <Text style={styles.pageSubtitle} numberOfLines={1}>{surveyId}</Text>
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
          </View>
        )}

        {/* Empty */}
        {!loading && total === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Khảo sát này chưa có câu hỏi nào.</Text>
          </View>
        )}

        {/* Main */}
        {!loading && total > 0 && (
          <>
            <ProgressBar current={currentIndex + 1} total={total} />

            <QuestionCard
              key={current.id}
              question={current}
              answer={answers[current.id]}
              onChange={handleChange}
            />

            {current.required && !canProceed() && (
              <Text style={styles.requiredWarning}>* Câu hỏi này bắt buộc phải trả lời</Text>
            )}

            {/* Nav buttons */}
            <View style={styles.navRow}>
              {!isFirst && (
                <TouchableOpacity
                  style={styles.btnBack}
                  onPress={() => setCurrentIndex((i) => i - 1)}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <ChevronLeft size={16} color={C.gray700} />
                  <Text style={styles.btnBackText}>Quay lại</Text>
                </TouchableOpacity>
              )}

              {!isLast ? (
                <TouchableOpacity
                  style={[styles.btnNext, !canProceed() && styles.btnDisabled]}
                  onPress={() => { if (canProceed()) setCurrentIndex((i) => i + 1); }}
                  disabled={!canProceed()}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.btnNextText, !canProceed() && styles.btnDisabledText]}>
                    Câu tiếp theo
                  </Text>
                  <ChevronRight size={16} color={canProceed() ? C.white : C.gray400} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.btnSubmit, (!canProceed() || submitting) && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={!canProceed() || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color={C.white} />
                      <Text style={styles.btnSubmitText}>Đang gửi...</Text>
                    </>
                  ) : (
                    <>
                      <Send size={15} color={(!canProceed() || submitting) ? C.gray400 : C.white} />
                      <Text style={[styles.btnSubmitText, (!canProceed() || submitting) && styles.btnDisabledText]}>
                        Nộp khảo sát
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },

  // Header
  pageHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 17, fontWeight: "700", color: C.gray900 },
  pageSubtitle: { fontSize: 11, color: C.gray400, fontFamily: "monospace" },

  // Progress
  progressWrap: { marginBottom: 24 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: C.gray500 },
  progressPct: { fontSize: 13, fontWeight: "700", color: C.primary },
  progressTrack: { height: 6, backgroundColor: C.gray200, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: C.primary, borderRadius: 99 },
  progressDots: { flexDirection: "row", gap: 6, marginTop: 10, justifyContent: "center", flexWrap: "wrap" },
  progressDot: { height: 8, borderRadius: 99 },
  progressDotDone: { width: 8, backgroundColor: C.primary },
  progressDotEmpty: { width: 8, backgroundColor: C.gray200 },
  progressDotActive: { width: 20 },

  // Question card
  questionCard: { backgroundColor: C.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.gray200, marginBottom: 4 },
  typeBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  requiredStar: { color: C.red, marginLeft: 2, fontSize: 11, fontWeight: "700" },
  questionContent: { fontSize: 17, fontWeight: "700", color: C.gray900, lineHeight: 26, marginBottom: 20 },

  // Text input
  textInput: { borderWidth: 1.5, borderColor: C.gray200, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, minHeight: 100, textAlignVertical: "top" },
  textInputFocused: { borderColor: C.primary },

  // Options
  multiHint: { fontSize: 12, color: C.gray400, marginBottom: 10 },
  optionBtn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.gray200, backgroundColor: C.gray50 },
  optionBtnSelectedSingle: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optionBtnSelectedMulti:  { borderColor: C.green,   backgroundColor: C.greenLight  },
  optionText: { fontSize: 14, color: C.gray700, flex: 1 },
  optionTextSelectedSingle: { fontWeight: "600", color: "#1e3a8a" },
  optionTextSelectedMulti:  { fontWeight: "600", color: C.greenDark },

  // Radio
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.gray300, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  // Checkbox
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: C.gray300, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  checkboxSelected: { backgroundColor: C.green, borderColor: C.green },
  checkboxTick: { alignItems: "center", justifyContent: "center" },

  // Required warning
  requiredWarning: { fontSize: 12, color: C.red, marginTop: 10 },

  // Nav
  navRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  btnBack: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: C.white, borderRadius: 12, borderWidth: 1.5, borderColor: C.gray200 },
  btnBackText: { fontSize: 14, fontWeight: "600", color: C.gray700 },
  btnNext: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, backgroundColor: C.primary, borderRadius: 12 },
  btnNextText: { fontSize: 14, fontWeight: "700", color: C.white },
  btnSubmit: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, backgroundColor: C.green, borderRadius: 12 },
  btnSubmitText: { fontSize: 14, fontWeight: "700", color: C.white },
  btnDisabled: { backgroundColor: C.gray200 },
  btnDisabledText: { color: C.gray400 },

  // Loading / Empty
  loadingState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 14 },
  loadingText: { fontSize: 14, color: C.gray400 },
  emptyState: { backgroundColor: C.white, borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: C.gray200 },
  emptyText: { fontSize: 15, color: C.gray400 },

  // Success
  successContainer: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  successCard: { backgroundColor: C.white, borderRadius: 24, padding: 40, width: "100%", maxWidth: 400, alignItems: "center", borderWidth: 1, borderColor: C.gray200 },
  successIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.gray900, marginBottom: 10, textAlign: "center" },
  successDesc: { fontSize: 14, color: C.gray500, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  divider: { height: 1, backgroundColor: C.gray100, width: "100%", marginBottom: 24 },
  btnHome: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: C.primary, borderRadius: 12, width: "100%" },
  btnHomeText: { fontSize: 15, fontWeight: "700", color: C.white },
});