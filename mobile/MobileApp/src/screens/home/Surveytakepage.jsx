// ─── SurveyTakePage.native.jsx ────────────────────────────────────────────────
// Port của web SurveyTakePage.jsx sang React Native
// Giữ nguyên: normalizeOption, resolveOptions, buildPayload, canProceed
// UI khớp web: gradient progress, RatingInput stars, DropdownInput, type badges
//
// Dependencies:
//   npm install lucide-react-native react-native-svg
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import {
  AlignLeft,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CheckSquare,
  CircleDot,
  FileText,
  Hash,
  Home,
  Mail,
  Send,
  Star,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import { useQuestion } from "../../providers/Questionprovider";
import { useResponse } from "../../providers/Responseprovider";
import { useOption }   from "../../providers/OptionProvider";

const { width: SW } = Dimensions.get("window");

// ─── Design tokens (mirror web) ──────────────────────────────────────────────
const C = {
  primary:       "#4f6ef7",
  primaryLight:  "#eef2ff",
  primaryBorder: "#c7d2fe",
  primaryDark:   "#1e3a8a",
  purple:        "#7c3aed",
  purpleLight:   "#f5f3ff",
  purpleBorder:  "#ddd6fe",
  cyan:          "#0891b2",
  cyanLight:     "#ecfeff",
  cyanBorder:    "#a5f3fc",
  amber:         "#b45309",
  amberLight:    "#fffbeb",
  amberBorder:   "#fde68a",
  yellow:        "#d97706",
  yellowBorder:  "#fcd34d",
  emerald:       "#059669",
  emeraldLight:  "#ecfdf5",
  emeraldBorder: "#a7f3d0",
  orange:        "#ea580c",
  orangeLight:   "#fff7ed",
  orangeBorder:  "#fed7aa",
  green:         "#16a34a",
  greenLight:    "#f0fdf4",
  greenBorder:   "#bbf7d0",
  greenDark:     "#14532d",
  violet:        "#6d28d9",
  violetLight:   "#f5f3ff",
  violetBorder:  "#ddd6fe",
  red:           "#ef4444",
  bg:            "#f4f5f7",
  white:         "#ffffff",
  gray50:        "#fafafa",
  gray100:       "#f3f4f6",
  gray200:       "#e5e7eb",
  gray300:       "#d1d5db",
  gray400:       "#9ca3af",
  gray500:       "#6b7280",
  gray700:       "#374151",
  gray900:       "#111827",
};

// ─── Type config (mirror web) ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản ngắn",   Icon: AlignLeft,   color: C.primary, bg: C.primaryLight, border: C.primaryBorder },
  PARAGRAPH:       { label: "Đoạn văn",       Icon: FileText,    color: C.purple,  bg: C.purpleLight,  border: C.purpleBorder  },
  EMAIL:           { label: "Email",           Icon: Mail,        color: C.cyan,    bg: C.cyanLight,    border: C.cyanBorder    },
  DATE:            { label: "Ngày tháng",      Icon: Calendar,    color: C.amber,   bg: C.amberLight,   border: C.amberBorder   },
  NUMBER:          { label: "Số",              Icon: Hash,        color: C.emerald, bg: C.emeraldLight, border: C.emeraldBorder },
  RATING:          { label: "Đánh giá",        Icon: Star,        color: C.yellow,  bg: C.amberLight,   border: C.yellowBorder  },
  SINGLE_CHOICE:   { label: "Một lựa chọn",   Icon: CircleDot,   color: C.orange,  bg: C.orangeLight,  border: C.orangeBorder  },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", Icon: CheckSquare, color: C.green,   bg: C.greenLight,   border: C.greenBorder   },
  DROPDOWN:        { label: "Danh sách thả",  Icon: ChevronDown, color: C.violet,  bg: C.violetLight,  border: C.violetBorder  },
};

// ─── normalizeOption (mirror web) ─────────────────────────────────────────────
function normalizeOption(opt, index = 0) {
  const display =
    (typeof opt.label   === "string" && opt.label.trim())   ||
    (typeof opt.content === "string" && opt.content.trim()) ||
    (typeof opt.value   === "string" && opt.value.trim())   ||
    `Lựa chọn ${index + 1}`;
  return {
    id:          opt.id || opt.option_id,
    content:     display,
    order_index: opt.order_index ?? index,
  };
}

// ─── resolveOptions (mirror web) ──────────────────────────────────────────────
function resolveOptions(question, optionsMap) {
  const raw = optionsMap?.[question.id];
  let list;
  if (Array.isArray(raw))                     list = raw;
  else if (raw && Array.isArray(raw.data))    list = raw.data;
  else if (raw && Array.isArray(raw.options)) list = raw.options;
  else if (Array.isArray(question.options))   list = question.options;
  else                                        list = [];
  return list
    .map(normalizeOption)
    .filter((o) => o.content !== "")
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct      = Math.round((current / total) * 100);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, { toValue: pct, duration: 400, useNativeDriver: false }).start();
  }, [pct]);

  const fillWidth = fillAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={s.progressWrap}>
      <View style={s.progressLabelRow}>
        <Text style={s.progressLabel}>Câu hỏi {current} / {total}</Text>
        <Text style={s.progressPct}>{pct}%</Text>
      </View>
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: fillWidth }]} />
      </View>
      <View style={s.progressDots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              s.progressDot,
              i < current       ? s.progressDotDone   : s.progressDotEmpty,
              i === current - 1 && s.progressDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────
function SuccessScreen({ onGoHome }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.successContainer}>
      <Animated.View style={[s.successCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.successIconWrap}>
          <CheckCircle2 size={40} color={C.green} />
        </View>
        <Text style={s.successTitle}>Gửi thành công! 🎉</Text>
        <Text style={s.successDesc}>
          Câu trả lời của bạn đã được ghi nhận.{"\n"}
          Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.
        </Text>
        <View style={s.divider} />
        <TouchableOpacity style={s.btnHome} onPress={onGoHome} activeOpacity={0.85}>
          <Home size={16} color={C.white} />
          <Text style={s.btnHomeText}>Về trang chủ</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── RatingInput (mirror web stars) ──────────────────────────────────────────
function RatingInput({ settings, value, onChange }) {
  const min   = settings?.min ?? 1;
  const max   = settings?.max ?? 5;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View>
      <View style={s.ratingRow}>
        {steps.map((star) => {
          const active = star <= (value ?? 0);
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              activeOpacity={0.7}
              style={s.starBtn}
            >
              <Star
                size={34}
                fill={active ? "#f59e0b" : "transparent"}
                color={active ? "#f59e0b" : C.gray300}
                strokeWidth={1.5}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {value != null && (
        <Text style={s.ratingHint}>
          Bạn chọn:{" "}
          <Text style={{ color: C.yellow, fontWeight: "700" }}>{value} / {max}</Text>
        </Text>
      )}
    </View>
  );
}

// ─── DropdownInput (bottom-sheet modal, mirror web) ───────────────────────────
function DropdownInput({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected        = options.find((o) => o.id === value);
  const rotateAnim      = useRef(new Animated.Value(0)).current;

  const toggleOpen = (next) => {
    setOpen(next);
    Animated.timing(rotateAnim, { toValue: next ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View>
      <TouchableOpacity
        onPress={() => toggleOpen(!open)}
        activeOpacity={0.85}
        style={[s.dropdownTrigger, open && s.dropdownTriggerOpen]}
      >
        <Text style={[s.dropdownTriggerText, !selected && s.dropdownPlaceholder]} numberOfLines={1}>
          {selected ? selected.content : "Chọn một lựa chọn..."}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={16} color={C.gray500} />
        </Animated.View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => toggleOpen(false)}>
        <TouchableWithoutFeedback onPress={() => toggleOpen(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={s.dropdownModal}>
                <View style={s.dropdownHandle} />
                <Text style={s.dropdownModalTitle}>Chọn một lựa chọn</Text>
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  {options.map((opt) => {
                    const sel = opt.id === value;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => { onChange(opt.id); toggleOpen(false); }}
                        activeOpacity={0.8}
                        style={[s.dropdownItem, sel && s.dropdownItemSelected]}
                      >
                        <Text style={[s.dropdownItemText, sel && s.dropdownItemTextSelected]}>
                          {opt.content}
                        </Text>
                        {sel && <CheckCircle2 size={15} color={C.violet} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({ question, answer, onChange }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { Icon, label, color, bg, border } = cfg;
  const [focusBorder, setFocusBorder] = useState(C.gray200);

  const opts     = question.options ?? [];
  const settings = question.settings ?? {};

  const toggleMulti = (optId) => {
    const curr = answer instanceof Set ? new Set(answer) : new Set();
    if (curr.has(optId)) curr.delete(optId); else curr.add(optId);
    onChange(question.id, curr);
  };

  return (
    <View style={s.questionCard}>
      {/* Type badge */}
      <View style={[s.typeBadge, { backgroundColor: bg, borderColor: border }]}>
        <Icon size={11} color={color} />
        <Text style={[s.typeBadgeText, { color }]}> {label}</Text>
        {question.required && <Text style={s.requiredStar}> *</Text>}
      </View>

      {/* Content */}
      <Text style={s.questionContent}>{question.content}</Text>

      {/* ── TEXT ── */}
      {question.type === "TEXT" && (
        <TextInput
          style={[s.textInput, { borderColor: focusBorder }]}
          placeholder="Nhập câu trả lời ngắn..."
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(v) => onChange(question.id, v)}
          onFocus={() => setFocusBorder(C.primary)}
          onBlur={() => setFocusBorder(C.gray200)}
          returnKeyType="done"
        />
      )}

      {/* ── PARAGRAPH ── */}
      {question.type === "PARAGRAPH" && (
        <TextInput
          style={[s.textInput, s.textArea, { borderColor: focusBorder }]}
          placeholder="Nhập đoạn văn trả lời của bạn..."
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(v) => onChange(question.id, v)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          onFocus={() => setFocusBorder(C.purple)}
          onBlur={() => setFocusBorder(C.gray200)}
        />
      )}

      {/* ── EMAIL ── */}
      {question.type === "EMAIL" && (
        <TextInput
          style={[s.textInput, { borderColor: focusBorder }]}
          placeholder="example@email.com"
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(v) => onChange(question.id, v)}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusBorder(C.cyan)}
          onBlur={() => setFocusBorder(C.gray200)}
        />
      )}

      {/* ── DATE ── */}
      {question.type === "DATE" && (
        <View>
          <TextInput
            style={[s.textInput, { borderColor: focusBorder }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.gray400}
            value={answer ?? ""}
            onChangeText={(v) => onChange(question.id, v)}
            onFocus={() => setFocusBorder(C.amber)}
            onBlur={() => setFocusBorder(C.gray200)}
          />
          {(settings.min_date || settings.max_date) && (
            <Text style={s.hintText}>
              {settings.min_date ? `Từ: ${settings.min_date}` : ""}
              {settings.min_date && settings.max_date ? " — " : ""}
              {settings.max_date ? `Đến: ${settings.max_date}` : ""}
            </Text>
          )}
        </View>
      )}

      {/* ── NUMBER ── */}
      {question.type === "NUMBER" && (
        <View>
          <TextInput
            style={[s.textInput, { borderColor: focusBorder }]}
            placeholder={
              settings.min !== undefined && settings.max !== undefined
                ? `Nhập số từ ${settings.min} đến ${settings.max}`
                : "Nhập số..."
            }
            placeholderTextColor={C.gray400}
            value={answer != null ? String(answer) : ""}
            onChangeText={(v) => onChange(question.id, v === "" ? "" : v)}
            keyboardType="numeric"
            onFocus={() => setFocusBorder(C.emerald)}
            onBlur={() => setFocusBorder(C.gray200)}
          />
          {(settings.min !== undefined || settings.max !== undefined) && (
            <Text style={s.hintText}>
              {settings.min !== undefined ? `Min: ${settings.min}` : ""}
              {settings.min !== undefined && settings.max !== undefined ? " · " : ""}
              {settings.max !== undefined ? `Max: ${settings.max}` : ""}
            </Text>
          )}
        </View>
      )}

      {/* ── RATING ── */}
      {question.type === "RATING" && (
        <RatingInput
          settings={settings}
          value={answer}
          onChange={(val) => onChange(question.id, val)}
        />
      )}

      {/* ── SINGLE_CHOICE ── */}
      {question.type === "SINGLE_CHOICE" && (
        opts.length > 0 ? (
          <View style={{ gap: 10 }}>
            {opts.map((opt) => {
              const selected = answer === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => onChange(question.id, opt.id)}
                  activeOpacity={0.8}
                  style={[s.optionBtn, selected && s.optionBtnSelectedSingle]}
                >
                  <View style={[s.radio, selected && s.radioSelected]}>
                    {selected && <View style={s.radioDot} />}
                  </View>
                  <Text style={[s.optionText, selected && s.optionTextSelectedSingle]} numberOfLines={3}>
                    {opt.content}
                  </Text>
                  {selected && <CheckCircle2 size={16} color={C.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={s.loadingOptions}>Đang tải lựa chọn...</Text>
        )
      )}

      {/* ── MULTIPLE_CHOICE ── */}
      {question.type === "MULTIPLE_CHOICE" && (
        opts.length > 0 ? (
          <View>
            <Text style={s.multiHint}>Có thể chọn nhiều đáp án</Text>
            <View style={{ gap: 10 }}>
              {opts.map((opt) => {
                const selected = answer instanceof Set && answer.has(opt.id);
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => toggleMulti(opt.id)}
                    activeOpacity={0.8}
                    style={[s.optionBtn, selected && s.optionBtnSelectedMulti]}
                  >
                    <View style={[s.checkbox, selected && s.checkboxSelected]}>
                      {selected && <Text style={s.checkMark}>✓</Text>}
                    </View>
                    <Text style={[s.optionText, selected && s.optionTextSelectedMulti]} numberOfLines={3}>
                      {opt.content}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <Text style={s.loadingOptions}>Đang tải lựa chọn...</Text>
        )
      )}

      {/* ── DROPDOWN ── */}
      {question.type === "DROPDOWN" && (
        opts.length > 0 ? (
          <DropdownInput
            options={opts}
            value={answer}
            onChange={(val) => onChange(question.id, val)}
          />
        ) : (
          <Text style={s.loadingOptions}>Đang tải lựa chọn...</Text>
        )
      )}
    </View>
  );
}

// ─── SurveyTakePage ───────────────────────────────────────────────────────────
export default function SurveyTakePage() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params ?? {};

  const { questions, fetchQuestionsBySurvey, loading } = useQuestion();
  const { options, fetchOptions }                       = useOption();
  const { submitSurvey, submitting }                    = useResponse();

  const [answers, setAnswers]               = useState({});
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [submitted, setSubmitted]           = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // ── Fetch questions → fetch options song song (mirror web) ──────────────────
  useEffect(() => {
    if (!surveyId) return;
    fetchQuestionsBySurvey(surveyId).then(async (list) => {
      if (!Array.isArray(list)) return;
      const choiceQs = list.filter((q) =>
        ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type)
      );
      if (!choiceQs.length) return;
      setOptionsLoading(true);
      try {
        await Promise.all(choiceQs.map((q) => fetchOptions(q.id)));
      } finally {
        setOptionsLoading(false);
      }
    });
  }, [surveyId]);

  // ── Merge + normalize options vào questions ──────────────────────────────────
  const sorted = [...questions]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((q) => ({ ...q, options: resolveOptions(q, options) }));

  const total   = sorted.length;
  const current = sorted[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === total - 1;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // ── canProceed — validate per type (mirror web) ──────────────────────────────
  const canProceed = () => {
    if (!current) return false;
    if (!current.required) return true;
    const ans      = answers[current.id];
    const settings = current.settings ?? {};

    switch (current.type) {
      case "TEXT":
      case "PARAGRAPH":
        return typeof ans === "string" && ans.trim().length > 0;
      case "EMAIL": {
        if (typeof ans !== "string" || !ans.trim()) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim());
      }
      case "DATE":
        return typeof ans === "string" && ans.length > 0;
      case "NUMBER": {
        if (ans === "" || ans == null) return false;
        const n = Number(ans);
        if (isNaN(n)) return false;
        if (settings.min !== undefined && n < settings.min) return false;
        if (settings.max !== undefined && n > settings.max) return false;
        return true;
      }
      case "RATING":
        return ans != null;
      case "SINGLE_CHOICE":
      case "DROPDOWN":
        return !!ans;
      case "MULTIPLE_CHOICE":
        return ans instanceof Set && ans.size > 0;
      default:
        return true;
    }
  };

  // ── getValidationHint ────────────────────────────────────────────────────────
  const getValidationHint = () => {
    if (!current || !current.required) return null;
    const ans      = answers[current.id];
    const settings = current.settings ?? {};
    if (current.type === "EMAIL" && typeof ans === "string" && ans.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim())) return "Email không hợp lệ";
    }
    if (current.type === "NUMBER" && ans !== "" && ans != null) {
      const n = Number(ans);
      if (!isNaN(n)) {
        if (settings.min !== undefined && n < settings.min) return `Giá trị tối thiểu là ${settings.min}`;
        if (settings.max !== undefined && n > settings.max) return `Giá trị tối đa là ${settings.max}`;
      }
    }
    return null;
  };

  // ── buildPayload — khớp backend ResponseService.submitSurvey() ──────────────
  //   TEXT / PARAGRAPH / EMAIL / DATE → answer_text
  //   NUMBER / RATING                 → answer_number: Number
  //   SINGLE_CHOICE / DROPDOWN        → option_id
  //   MULTIPLE_CHOICE                 → option_ids: string[]  (1 object duy nhất)
  const buildPayload = () => {
    const formattedAnswers = [];
    sorted.forEach((q) => {
      const val = answers[q.id];
      if (["TEXT", "PARAGRAPH", "EMAIL"].includes(q.type)) {
        if (typeof val === "string" && val.trim())
          formattedAnswers.push({ question_id: q.id, answer_text: val.trim() });
        return;
      }
      if (q.type === "DATE") {
        if (val) formattedAnswers.push({ question_id: q.id, answer_text: val });
        return;
      }
      if (q.type === "NUMBER") {
        if (val !== "" && val != null && !isNaN(Number(val)))
          formattedAnswers.push({ question_id: q.id, answer_number: Number(val) });
        return;
      }
      if (q.type === "RATING") {
        if (val != null) formattedAnswers.push({ question_id: q.id, answer_number: Number(val) });
        return;
      }
      if (q.type === "SINGLE_CHOICE" || q.type === "DROPDOWN") {
        if (val) formattedAnswers.push({ question_id: q.id, option_id: val });
        return;
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const selected = val instanceof Set ? [...val] : [];
        if (selected.length > 0)
          formattedAnswers.push({ question_id: q.id, option_ids: selected });
        return;
      }
    });
    return formattedAnswers;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canProceed() || submitting) return;
    try {
      await submitSurvey(surveyId, { answers: buildPayload() });
      setSubmitted(true);
    } catch (err) {
      console.error("[SurveyTakePage] submit error:", err);
    }
  };

  if (submitted) {
    return <SuccessScreen onGoHome={() => navigation.navigate("UserHome")} />;
  }

  const isPageLoading  = loading || optionsLoading;
  const validationHint = getValidationHint();
  const proceed        = canProceed();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.screen}>
        <ScrollView
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <View style={s.pageHeader}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <ChevronLeft size={18} color={C.gray700} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.pageTitle}>Làm khảo sát</Text>
              <Text style={s.pageSubtitle} numberOfLines={1}>{surveyId}</Text>
            </View>
          </View>

          {/* ── Loading ── */}
          {isPageLoading && (
            <View style={s.loadingState}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.loadingText}>
                {loading ? "Đang tải câu hỏi..." : "Đang tải lựa chọn..."}
              </Text>
            </View>
          )}

          {/* ── Empty ── */}
          {!isPageLoading && total === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>Khảo sát này chưa có câu hỏi nào.</Text>
            </View>
          )}

          {/* ── Main ── */}
          {!isPageLoading && total > 0 && (
            <>
              <ProgressBar current={currentIndex + 1} total={total} />

              <QuestionCard
                key={current.id}
                question={current}
                answer={answers[current.id]}
                onChange={handleChange}
              />

              {current.required && !proceed && (
                <Text style={s.requiredWarning}>
                  {validationHint ?? "* Câu hỏi này bắt buộc phải trả lời"}
                </Text>
              )}

              {/* ── Nav buttons ── */}
              <View style={s.navRow}>
                {!isFirst && (
                  <TouchableOpacity
                    style={s.btnBack}
                    onPress={() => setCurrentIndex((i) => i - 1)}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <ChevronLeft size={16} color={C.gray700} />
                    <Text style={s.btnBackText}>Quay lại</Text>
                  </TouchableOpacity>
                )}

                {!isLast ? (
                  <TouchableOpacity
                    style={[s.btnNext, !proceed && s.btnDisabled]}
                    onPress={() => { if (proceed) setCurrentIndex((i) => i + 1); }}
                    disabled={!proceed}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.btnNextText, !proceed && s.btnDisabledText]}>Câu tiếp theo</Text>
                    <ChevronRight size={16} color={proceed ? C.white : C.gray400} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.btnSubmit, (!proceed || submitting) && s.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={!proceed || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator size="small" color={C.white} />
                        <Text style={s.btnSubmitText}>Đang gửi...</Text>
                      </>
                    ) : (
                      <>
                        <Send size={15} color={(!proceed || submitting) ? C.gray400 : C.white} />
                        <Text style={[s.btnSubmitText, (!proceed || submitting) && s.btnDisabledText]}>
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
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },

  // Header
  pageHeader:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
  backBtn:      { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.gray200, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  pageTitle:    { fontSize: 17, fontWeight: "700", color: C.gray900 },
  pageSubtitle: { fontSize: 11, color: C.gray400, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },

  // Progress
  progressWrap:      { marginBottom: 24 },
  progressLabelRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel:     { fontSize: 13, fontWeight: "600", color: C.gray500 },
  progressPct:       { fontSize: 13, fontWeight: "700", color: C.primary },
  progressTrack:     { height: 6, backgroundColor: C.gray200, borderRadius: 99, overflow: "hidden" },
  progressFill:      { height: "100%", backgroundColor: C.primary, borderRadius: 99 },
  progressDots:      { flexDirection: "row", gap: 6, marginTop: 10, justifyContent: "center", flexWrap: "wrap" },
  progressDot:       { height: 8, borderRadius: 99 },
  progressDotDone:   { width: 8, backgroundColor: C.primary },
  progressDotEmpty:  { width: 8, backgroundColor: C.gray200 },
  progressDotActive: { width: 20 },

  // Question card
  questionCard:    {
    backgroundColor: C.white, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.gray200, marginBottom: 4,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  typeBadge:       { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  typeBadgeText:   { fontSize: 11, fontWeight: "700" },
  requiredStar:    { color: C.red, fontSize: 11, fontWeight: "700" },
  questionContent: { fontSize: 18, fontWeight: "700", color: C.gray900, lineHeight: 28, marginBottom: 20 },

  // Inputs
  textInput:  { borderWidth: 1.5, borderColor: C.gray200, borderRadius: 12, padding: 12, fontSize: 14, color: C.gray900, backgroundColor: C.gray50, minHeight: 48 },
  textArea:   { minHeight: 110, textAlignVertical: "top" },
  hintText:   { fontSize: 12, color: C.gray400, marginTop: 6 },

  // Rating
  ratingRow:  { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  starBtn:    { padding: 2 },
  ratingHint: { fontSize: 13, color: C.gray500, marginTop: 2 },

  // Dropdown
  dropdownTrigger:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 13, borderWidth: 1.5, borderColor: C.gray200, borderRadius: 12, backgroundColor: C.gray50 },
  dropdownTriggerOpen:      { borderColor: C.violet },
  dropdownTriggerText:      { fontSize: 14, color: C.gray900, fontWeight: "600", flex: 1, marginRight: 8 },
  dropdownPlaceholder:      { color: C.gray400, fontWeight: "400" },
  modalOverlay:             { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  dropdownModal:            { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "70%", paddingBottom: 36 },
  dropdownHandle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: C.gray300, alignSelf: "center", marginBottom: 14 },
  dropdownModalTitle:       { fontSize: 15, fontWeight: "700", color: C.gray900, marginBottom: 12, textAlign: "center" },
  dropdownItem:             { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 13, borderRadius: 10, borderBottomWidth: 1, borderBottomColor: C.gray100 },
  dropdownItemSelected:     { backgroundColor: C.violetLight },
  dropdownItemText:         { fontSize: 14, color: C.gray700, flex: 1 },
  dropdownItemTextSelected: { color: C.violet, fontWeight: "700" },

  // Option buttons
  multiHint:               { fontSize: 12, color: C.gray400, marginBottom: 10 },
  optionBtn:               { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.gray200, backgroundColor: C.gray50 },
  optionBtnSelectedSingle: { borderColor: C.primary, backgroundColor: C.primaryLight },
  optionBtnSelectedMulti:  { borderColor: C.green,   backgroundColor: C.greenLight   },
  optionText:              { fontSize: 14, color: C.gray700, flex: 1 },
  optionTextSelectedSingle:{ fontWeight: "600", color: C.primaryDark },
  optionTextSelectedMulti: { fontWeight: "600", color: C.greenDark   },
  loadingOptions:          { fontSize: 13, color: C.gray400, fontStyle: "italic" },

  // Radio
  radio:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.gray300, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: C.primary },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  // Checkbox
  checkbox:        { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: C.gray300, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  checkboxSelected:{ backgroundColor: C.green, borderColor: C.green },
  checkMark:       { color: C.white, fontSize: 12, fontWeight: "700", lineHeight: 15 },

  // Required warning
  requiredWarning: { fontSize: 12, color: C.red, marginTop: 10 },

  // Nav
  navRow:          { flexDirection: "row", gap: 12, marginTop: 20 },
  btnBack:         { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: C.white, borderRadius: 12, borderWidth: 1.5, borderColor: C.gray200 },
  btnBackText:     { fontSize: 14, fontWeight: "600", color: C.gray700 },
  btnNext:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, backgroundColor: C.primary, borderRadius: 12 },
  btnNextText:     { fontSize: 14, fontWeight: "700", color: C.white },
  btnSubmit:       { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, backgroundColor: C.green, borderRadius: 12 },
  btnSubmitText:   { fontSize: 14, fontWeight: "700", color: C.white },
  btnDisabled:     { backgroundColor: C.gray200 },
  btnDisabledText: { color: C.gray400 },

  // Loading / Empty
  loadingState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 14 },
  loadingText:  { fontSize: 14, color: C.gray400 },
  emptyState:   { backgroundColor: C.white, borderRadius: 20, padding: 48, alignItems: "center", borderWidth: 1, borderColor: C.gray200 },
  emptyText:    { fontSize: 15, color: C.gray400 },

  // Success
  successContainer: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  successCard:      {
    backgroundColor: C.white, borderRadius: 24, padding: 40,
    width: "100%", maxWidth: 440, alignItems: "center",
    borderWidth: 1, borderColor: C.gray200,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 32, elevation: 6,
  },
  successIconWrap:  { width: 80, height: 80, borderRadius: 40, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle:     { fontSize: 22, fontWeight: "800", color: C.gray900, marginBottom: 10, textAlign: "center" },
  successDesc:      { fontSize: 14, color: C.gray500, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  divider:          { height: 1, backgroundColor: C.gray100, width: "100%", marginBottom: 24 },
  btnHome:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, backgroundColor: C.primary, borderRadius: 12, width: "100%" },
  btnHomeText:      { fontSize: 15, fontWeight: "700", color: C.white },
});