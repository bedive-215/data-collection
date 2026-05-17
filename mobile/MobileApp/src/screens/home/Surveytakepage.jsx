/**
 * SurveyTakePage.native.jsx
 * React Native version of SurveyTakePage — no mock data
 *
 * Dependencies (install as needed):
 *   npm install @react-navigation/native react-native-linear-gradient
 *   react-native-vector-icons lucide-react-native
 *   @react-native-async-storage/async-storage
 *
 * Providers assumed (same interface as web):
 *   useQuestion, useResponse, useOption, useSurvey
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
  Image,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Replace these with your actual providers ────────────────────────────────
import { useQuestion } from "../../providers/QuestionProvider";
import { useResponse } from "../../providers/ResponseProvider";
import { useOption } from "../../providers/OptionProvider";
import { useSurvey } from "../../providers/SurveyProvider";

// ─── Navigation ───────────────────────────────────────────────────────────────
// Using React Navigation. Adjust if you use a different router.
import { useNavigation, useRoute } from "@react-navigation/native";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  primary:   "#4f46e5",
  primaryBg: "#eef2ff",
  success:   "#16a34a",
  successBg: "#f0fdf4",
  warn:      "#d97706",
  warnBg:    "#fffbeb",
  danger:    "#ef4444",
  dangerBg:  "#fef2f2",
  gray50:    "#f9fafb",
  gray100:   "#f3f4f6",
  gray200:   "#e5e7eb",
  gray400:   "#9ca3af",
  gray500:   "#6b7280",
  gray700:   "#374151",
  gray900:   "#111827",
  white:     "#ffffff",
  card:      "rgba(255,255,255,0.92)",
};

// ─── Type Config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  TEXT:            { label: "Văn bản ngắn",        color: "#4f6ef7", bg: "#eef2ff", border: "#c7d2fe" },
  PARAGRAPH:       { label: "Đoạn văn",             color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  EMAIL:           { label: "Email",                color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  DATE:            { label: "Ngày tháng",           color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  NUMBER:          { label: "Số",                   color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  RATING:          { label: "Xếp hạng",             color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  SINGLE_CHOICE:   { label: "Một lựa chọn",         color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn",       color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  DROPDOWN:        { label: "Danh sách thả",         color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  LINEAR_SCALE:    { label: "Phạm vi tuyến tính",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  TIME:            { label: "Giờ",                  color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeOption(opt, index = 0) {
  const display =
    (typeof opt.label === "string" && opt.label.trim()) ||
    (typeof opt.content === "string" && opt.content.trim()) ||
    (typeof opt.value === "string" && opt.value.trim()) ||
    `Lựa chọn ${index + 1}`;
  return {
    id: opt.id || opt.option_id,
    content: display,
    order_index: opt.order_index ?? index,
    image_url: opt.image_url || null,
    media_type: opt.media_type || null,
  };
}

function resolveOptions(question, optionsMap) {
  const raw = optionsMap?.[question.id];
  let list;
  if (Array.isArray(raw)) list = raw;
  else if (raw && Array.isArray(raw.data)) list = raw.data;
  else if (raw && Array.isArray(raw.options)) list = raw.options;
  else if (Array.isArray(question.options)) list = question.options;
  else list = [];
  return list
    .map(normalizeOption)
    .filter((o) => o.content !== "")
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function fmtTime(secs) {
  if (!secs && secs !== 0) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Câu hỏi {current} / {total}</Text>
        <Text style={styles.progressPct}>{pct}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.progressDots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < current && styles.progressDotActive,
              i === current - 1 && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── RatingInput ──────────────────────────────────────────────────────────────
function RatingInput({ settings, value, onChange }) {
  const min = settings?.min ?? 1;
  const max = settings?.max ?? 5;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View>
      <View style={styles.ratingRow}>
        {steps.map((star) => {
          const active = star <= (value ?? 0);
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              activeOpacity={0.7}
              style={styles.starBtn}
            >
              <Text style={[styles.star, active && styles.starActive]}>★</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {value != null && (
        <Text style={styles.ratingLabel}>
          Bạn chọn:{" "}
          <Text style={{ color: C.warn, fontWeight: "700" }}>
            {value} / {max}
          </Text>
        </Text>
      )}
    </View>
  );
}

// ─── DropdownInput ────────────────────────────────────────────────────────────
function DropdownInput({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownBtn, open && styles.dropdownBtnOpen]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownLeft}>
          {selected?.image_url && (
            <Image
              source={{ uri: selected.image_url }}
              style={styles.optionImg}
            />
          )}
          <Text
            style={[
              styles.dropdownBtnText,
              !selected && styles.dropdownPlaceholder,
            ]}
          >
            {selected ? selected.content : "Chọn một lựa chọn..."}
          </Text>
        </View>
        <Text style={[styles.dropdownChevron, open && styles.dropdownChevronOpen]}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownList}>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.id)}
              renderItem={({ item: opt }) => {
                const sel = opt.id === value;
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, sel && styles.dropdownItemSel]}
                    onPress={() => { onChange(opt.id); setOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownLeft}>
                      {opt.image_url && (
                        <Image
                          source={{ uri: opt.image_url }}
                          style={styles.optionImg}
                        />
                      )}
                      <Text
                        style={[
                          styles.dropdownItemText,
                          sel && styles.dropdownItemTextSel,
                        ]}
                      >
                        {opt.content}
                      </Text>
                    </View>
                    {sel && <Text style={{ color: "#6d28d9", fontSize: 16 }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── DatePicker (simple text on RN — use a picker lib if needed) ──────────────
function DateInput({ value, onChange, settings }) {
  // For full native date picking, replace with @react-native-community/datetimepicker
  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={C.gray400}
        value={value ?? ""}
        onChangeText={(t) => onChange(t)}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      {(settings?.min_date || settings?.max_date) && (
        <Text style={styles.hintText}>
          {settings.min_date && `Từ: ${settings.min_date}`}
          {settings.min_date && settings.max_date && " — "}
          {settings.max_date && `Đến: ${settings.max_date}`}
        </Text>
      )}
    </View>
  );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({ question, answer, onChange }) {
  const cfg = TYPE_CONFIG[question.type] ?? TYPE_CONFIG.TEXT;
  const { label, color, bg, border } = cfg;
  const opts = question.options ?? [];
  const settings = question.settings ?? {};
  const placeholder = question.placeholder || "";
  const description = question.description || null;

  const toggleMulti = (optId) => {
    const current = answer instanceof Set ? new Set(answer) : new Set();
    if (current.has(optId)) current.delete(optId);
    else current.add(optId);
    onChange(question.id, current);
  };

  return (
    <View style={styles.card}>
      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.typeBadgeText, { color }]}>
          {label}
          {question.required ? " *" : ""}
        </Text>
      </View>

      {/* Question title */}
      <Text style={styles.questionTitle}>{question.content}</Text>

      {/* Description */}
      {description && <Text style={styles.description}>{description}</Text>}

      {/* Media */}
      {question.media_url &&
        (question.media_type === "video" ? (
          <Text style={styles.videoNote}>[Video: {question.media_url}]</Text>
        ) : (
          <Image
            source={{ uri: question.media_url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        ))}

      {/* TEXT */}
      {question.type === "TEXT" && (
        <TextInput
          style={styles.input}
          placeholder={placeholder || "Nhập câu trả lời ngắn..."}
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(t) => onChange(question.id, t)}
          maxLength={settings.max_chars || undefined}
          returnKeyType="done"
        />
      )}

      {/* PARAGRAPH */}
      {question.type === "PARAGRAPH" && (
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={placeholder || "Nhập đoạn văn trả lời..."}
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(t) => onChange(question.id, t)}
          maxLength={settings.max_chars || undefined}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      )}

      {/* EMAIL */}
      {question.type === "EMAIL" && (
        <TextInput
          style={styles.input}
          placeholder={placeholder || "example@email.com"}
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(t) => onChange(question.id, t)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
      )}

      {/* DATE */}
      {question.type === "DATE" && (
        <DateInput
          value={answer}
          onChange={(v) => onChange(question.id, v)}
          settings={settings}
        />
      )}

      {/* NUMBER */}
      {question.type === "NUMBER" && (
        <TextInput
          style={styles.input}
          placeholder={
            settings.min !== undefined && settings.max !== undefined
              ? `Nhập số từ ${settings.min} đến ${settings.max}`
              : "Nhập số..."
          }
          placeholderTextColor={C.gray400}
          value={answer != null ? String(answer) : ""}
          onChangeText={(t) => onChange(question.id, t)}
          keyboardType="numeric"
          returnKeyType="done"
        />
      )}

      {/* RATING */}
      {question.type === "RATING" && (
        <RatingInput
          settings={settings}
          value={answer}
          onChange={(v) => onChange(question.id, v)}
        />
      )}

      {/* SINGLE_CHOICE */}
      {question.type === "SINGLE_CHOICE" && (
        opts.length > 0 ? (
          <View style={styles.optionList}>
            {opts.map((opt) => {
              const sel = opt.id === answer;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.choiceBtn, sel && styles.choiceBtnSel]}
                  onPress={() => onChange(question.id, opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, sel && styles.radioSel]}>
                    {sel && <View style={styles.radioDot} />}
                  </View>
                  {opt.image_url && (
                    <Image source={{ uri: opt.image_url }} style={styles.optionImg} />
                  )}
                  <Text style={[styles.choiceText, sel && styles.choiceTextSel]}>
                    {opt.content}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.loadingText}>Đang tải lựa chọn...</Text>
        )
      )}

      {/* MULTIPLE_CHOICE */}
      {question.type === "MULTIPLE_CHOICE" && (
        opts.length > 0 ? (
          <View style={styles.optionList}>
            {opts.map((opt) => {
              const sel = answer instanceof Set ? answer.has(opt.id) : false;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.choiceBtn, sel && styles.choiceBtnMultiSel]}
                  onPress={() => toggleMulti(opt.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, sel && styles.checkboxSel]}>
                    {sel && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  {opt.image_url && (
                    <Image source={{ uri: opt.image_url }} style={styles.optionImg} />
                  )}
                  <Text style={[styles.choiceText, sel && styles.choiceTextMultiSel]}>
                    {opt.content}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.loadingText}>Đang tải lựa chọn...</Text>
        )
      )}

      {/* DROPDOWN */}
      {question.type === "DROPDOWN" && (
        opts.length > 0 ? (
          <DropdownInput
            options={opts}
            value={answer}
            onChange={(val) => onChange(question.id, val)}
          />
        ) : (
          <Text style={styles.loadingText}>Đang tải lựa chọn...</Text>
        )
      )}

      {/* LINEAR_SCALE */}
      {question.type === "LINEAR_SCALE" && (() => {
        const min = settings?.min ?? 1;
        const max = settings?.max ?? 5;
        const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
        return (
          <View style={styles.linearWrap}>
            {(settings.min_label || settings.max_label) && (
              <View style={styles.linearLabels}>
                <Text style={styles.linearLabel}>{settings.min_label || `Từ ${min}`}</Text>
                <Text style={styles.linearLabel}>{settings.max_label || `Đến ${max}`}</Text>
              </View>
            )}
            <View style={styles.linearRow}>
              {steps.map((v) => {
                const sel = answer === v;
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => onChange(question.id, v)}
                    style={[styles.linearBtn, sel && styles.linearBtnSel]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.linearBtnText, sel && styles.linearBtnTextSel]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })()}

      {/* TIME */}
      {question.type === "TIME" && (
        <TextInput
          style={styles.input}
          placeholder={placeholder || "HH:MM"}
          placeholderTextColor={C.gray400}
          value={answer ?? ""}
          onChangeText={(t) => onChange(question.id, t)}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          returnKeyType="done"
        />
      )}
    </View>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────
function SuccessScreen({ onGoHome, thankYouMessage, logoUrl, redirectUrl }) {
  const [countdown, setCountdown] = useState(5);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!redirectUrl) return;
    const timer = setTimeout(() => Linking.openURL(redirectUrl), 5000);
    const iv = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(iv); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { clearTimeout(timer); clearInterval(iv); };
  }, [redirectUrl]);

  const message =
    thankYouMessage ||
    "Câu trả lời của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian hoàn thành khảo sát này.";

  return (
    <View style={styles.fullCenter}>
      <Animated.View
        style={[
          styles.successCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {logoUrl && (
          <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />
        )}
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Gửi thành công! 🎉</Text>
        <Text style={styles.successMsg}>{message}</Text>

        {redirectUrl && (
          <View style={styles.redirectBox}>
            <Text style={styles.redirectText}>Đang chuyển hướng đến trang đích...</Text>
            <Text style={styles.redirectUrl} numberOfLines={1}>{redirectUrl}</Text>
            <Text style={styles.redirectCountdown}>Tự động chuyển sau {countdown}s</Text>
          </View>
        )}

        <View style={styles.divider} />
        <TouchableOpacity style={styles.primaryBtn} onPress={onGoHome} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>🏠 Về trang chủ</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── NotStarted / Expired Screen ──────────────────────────────────────────────
function StatusScreen({ status, survey, onGoHome }) {
  const isNotStarted = status === "not_started";
  const startDate = survey?.start_at
    ? new Date(survey.start_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <View style={styles.fullCenter}>
      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusIcon,
            { backgroundColor: isNotStarted ? "#dbeafe" : "#fef3c7" },
          ]}
        >
          <Text style={styles.statusIconText}>{isNotStarted ? "🗓" : "⏰"}</Text>
        </View>
        <Text style={styles.statusTitle}>
          {isNotStarted ? "Khảo sát chưa bắt đầu" : "Khảo sát đã kết thúc"}
        </Text>
        <Text style={styles.statusMsg}>
          {isNotStarted
            ? `Khảo sát này sẽ mở vào ngày ${startDate}. Hãy quay lại sau nhé!`
            : "Khảo sát này đã kết thúc. Cảm ơn bạn đã quan tâm!"}
        </Text>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.primaryBtn} onPress={onGoHome} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>🏠 Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── IntroScreen ──────────────────────────────────────────────────────────────
function IntroScreen({ survey, questionsCount, onStart, onBack, starting }) {
  const accent = survey?.accent_color || C.primary;

  return (
    <View style={styles.fullCenter}>
      <View style={styles.introCard}>
        {survey?.logo_url && (
          <Image source={{ uri: survey.logo_url }} style={styles.logo} resizeMode="contain" />
        )}
        <View style={[styles.introIcon, { backgroundColor: `${accent}22`, borderColor: `${accent}33` }]}>
          <Text style={styles.introIconText}>📋</Text>
        </View>
        <Text style={styles.introTitle}>{survey?.title || "Khảo sát"}</Text>
        {survey?.description && (
          <Text style={styles.introDesc}>{survey.description}</Text>
        )}
        {survey?.time_limit_seconds && (
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>
              ⏱ Thời gian: {Math.floor(survey.time_limit_seconds / 60)} phút
            </Text>
          </View>
        )}
        <View style={styles.introMeta}>
          <Text style={styles.introMetaText}>📄 {questionsCount} câu hỏi</Text>
          {survey?.is_anonymous && (
            <Text style={styles.introMetaText}>⚠️ Khảo sát ẩn danh</Text>
          )}
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: starting ? C.gray200 : accent },
            starting && styles.btnDisabled,
          ]}
          onPress={onStart}
          disabled={starting}
          activeOpacity={0.85}
        >
          {starting ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={styles.primaryBtnText}>📋 Bắt đầu làm khảo sát</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main SurveyTakePage ──────────────────────────────────────────────────────
export default function SurveyTakePage() {
  const navigation = useNavigation();
  const route = useRoute();
  const surveyId = route.params?.surveyId;

  const { questions, fetchQuestionsBySurvey, loading: qLoading } = useQuestion();
  const { options, fetchOptions } = useOption();
  const { startSurvey, submitSurvey, submitting } = useResponse();
  const { fetchSurveyById, currentSurvey } = useSurvey();

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const autoSaveRef = useRef(null);

  // ── Check schedule ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSurvey) return;
    const now = new Date();
    const start = currentSurvey.start_at ? new Date(currentSurvey.start_at) : null;
    const end = currentSurvey.end_at ? new Date(currentSurvey.end_at) : null;
    if (start && now < start) setSurveyStatus("not_started");
    else if (end && now > end) setSurveyStatus("expired");
    else setSurveyStatus("active");
  }, [currentSurvey]);

  // ── Fetch survey ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!surveyId) return;
    fetchSurveyById(surveyId);
  }, [surveyId]);

  // ── Fetch questions + options ───────────────────────────────────────────────
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
        await Promise.all(choiceQs.map((q) => fetchOptions(q.id, surveyId)));
      } finally {
        setOptionsLoading(false);
      }
    });
  }, [surveyId]);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentSurvey?.time_limit_seconds || submitted || timeUp) return;
    setTimeLeft(currentSurvey.time_limit_seconds);
    const iv = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(iv); setTimeUp(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [currentSurvey?.time_limit_seconds, submitted]);

  // ── Auto-save ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!surveyId || submitted || !Object.keys(answers).length) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      const payload = buildPayload(answers);
      if (!payload.length) return;
      try {
        const token = await AsyncStorage.getItem("access_token");
        await fetch(`/api/v1/responses/${surveyId}/autosave`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers: payload }),
        });
      } catch (e) {
        console.warn("[Auto-save]", e);
      }
    }, 30000);
    return () => clearTimeout(autoSaveRef.current);
  }, [answers, surveyId, submitted]);

  // ── Merge options ───────────────────────────────────────────────────────────
  const sorted = [...questions]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((q) => ({ ...q, options: resolveOptions(q, options) }));

  // ── Conditional visibility ──────────────────────────────────────────────────
  const visibleQuestions = sorted.filter((q) => {
    if (!q.condition) return true;
    const { source_question_id, operator, value } = q.condition;
    const ans = answers[source_question_id];
    if (ans === undefined) return false;
    switch (operator) {
      case "equals":       return String(ans) === String(value);
      case "not_equals":  return String(ans) !== String(value);
      case "contains":     return String(ans).includes(String(value));
      case "not_contains": return !String(ans).includes(String(value));
      case "greater":      return Number(ans) > Number(value);
      case "less":         return Number(ans) < Number(value);
      case "answered":     return ans !== undefined && ans !== null && ans !== "";
      case "not_answered": return ans === undefined || ans === null || ans === "";
      case "is_selected":  return ans instanceof Set ? ans.has(value) : ans === value;
      default: return true;
    }
  });

  const total = visibleQuestions.length;
  const current = visibleQuestions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = total - 1 === currentIndex;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const canProceed = useCallback(() => {
    if (!current) return false;
    if (!current.required) return true;
    const ans = answers[current.id];
    const s = current.settings ?? {};
    switch (current.type) {
      case "TEXT":
      case "PARAGRAPH": {
        const t = typeof ans === "string" ? ans.trim() : "";
        if (s.min_chars && t.length < s.min_chars) return false;
        if (s.max_chars && t.length > s.max_chars) return false;
        return t.length > 0;
      }
      case "EMAIL":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          typeof ans === "string" ? ans.trim() : ""
        );
      case "DATE":    return typeof ans === "string" && ans.length > 0;
      case "NUMBER": {
        if (ans === "" || ans == null) return false;
        const n = Number(ans);
        if (isNaN(n)) return false;
        if (s.min !== undefined && n < s.min) return false;
        if (s.max !== undefined && n > s.max) return false;
        return true;
      }
      case "RATING":
      case "LINEAR_SCALE":   return ans != null;
      case "SINGLE_CHOICE":
      case "DROPDOWN":       return !!ans;
      case "MULTIPLE_CHOICE": return ans instanceof Set && ans.size > 0;
      default: return true;
    }
  }, [current, answers]);

  const getValidationHint = () => {
    if (!current?.required) return null;
    const ans = answers[current.id];
    const s = current.settings ?? {};
    if (
      current.type === "EMAIL" &&
      typeof ans === "string" &&
      ans.length > 0 &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ans.trim())
    )
      return "Email không hợp lệ";
    if (current.type === "NUMBER" && ans !== "" && ans != null) {
      const n = Number(ans);
      if (!isNaN(n)) {
        if (s.min !== undefined && n < s.min) return `Giá trị tối thiểu là ${s.min}`;
        if (s.max !== undefined && n > s.max) return `Giá trị tối đa là ${s.max}`;
      }
    }
    if (
      (current.type === "TEXT" || current.type === "PARAGRAPH") &&
      typeof ans === "string" &&
      s.max_chars &&
      ans.length > s.max_chars
    )
      return `Tối đa ${s.max_chars} ký tự`;
    return null;
  };

  function buildPayload(allAnswers) {
    const r = [];
    sorted.forEach((q) => {
      const val = allAnswers[q.id];
      if (["TEXT", "PARAGRAPH", "EMAIL", "TIME", "FILE_UPLOAD"].includes(q.type)) {
        if (typeof val === "string" && val.trim())
          r.push({ question_id: q.id, answer_text: val.trim() });
      } else if (["NUMBER", "RATING", "LINEAR_SCALE"].includes(q.type)) {
        if (val != null && !isNaN(Number(val)))
          r.push({ question_id: q.id, answer_number: Number(val) });
      } else if (["SINGLE_CHOICE", "DROPDOWN"].includes(q.type)) {
        if (val) r.push({ question_id: q.id, option_id: val });
      } else if (q.type === "MULTIPLE_CHOICE") {
        const sel = val instanceof Set ? [...val] : [];
        if (sel.length > 0) r.push({ question_id: q.id, option_ids: sel });
      } else if (q.type === "DATE") {
        if (val) r.push({ question_id: q.id, answer_text: val });
      }
    });
    return r;
  }

  const handleSubmit = async () => {
    if (!canProceed() || submitting) return;
    try {
      await submitSurvey(surveyId, { answers: buildPayload(answers) });
      setSubmitted(true);
    } catch (err) {
      console.error("[Submit]", err);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await startSurvey(surveyId);
      setStarted(true);
    } catch (err) {
      console.error("[Start]", err);
    } finally {
      setStarting(false);
    }
  };

  const goHome = () => navigation.navigate("UserHome");
  const goBack = () => navigation.goBack();

  // ── Render states ───────────────────────────────────────────────────────────

  if (surveyStatus === "not_started" || surveyStatus === "expired") {
    return (
      <StatusScreen
        status={surveyStatus}
        survey={currentSurvey}
        onGoHome={goHome}
      />
    );
  }

  if (surveyStatus === "active" && !started) {
    return (
      <IntroScreen
        survey={currentSurvey}
        questionsCount={questions.length}
        onStart={handleStart}
        onBack={goBack}
        starting={starting}
      />
    );
  }

  if (submitted || timeUp) {
    return (
      <SuccessScreen
        onGoHome={goHome}
        thankYouMessage={currentSurvey?.thank_you_message}
        logoUrl={currentSurvey?.logo_url}
        redirectUrl={currentSurvey?.thank_you_redirect_url}
      />
    );
  }

  const loading = qLoading || optionsLoading;
  const hint = getValidationHint();
  const proceed = canProceed();
  const timeWarning = timeLeft !== null && timeLeft <= 60;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f0f2ff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentSurvey?.title || "Làm khảo sát"}
            </Text>
            {currentSurvey?.description ? (
              <Text style={styles.headerSub} numberOfLines={1}>
                {currentSurvey.description}
              </Text>
            ) : null}
          </View>
          {timeLeft !== null && (
            <View style={[styles.timerBadge, timeWarning && styles.timerBadgeWarn]}>
              <Text
                style={[styles.timerText, timeWarning && styles.timerTextWarn]}
              >
                ⏱ {fmtTime(timeLeft)}
              </Text>
            </View>
          )}
        </View>

        {/* ── Loading ── */}
        {loading && (
          <View style={styles.centeredPad}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.loadingText}>
              {qLoading ? "Đang tải câu hỏi..." : "Đang tải lựa chọn..."}
            </Text>
          </View>
        )}

        {/* ── Empty ── */}
        {!loading && total === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Khảo sát này chưa có câu hỏi nào.</Text>
          </View>
        )}

        {/* ── Main ── */}
        {!loading && total > 0 && current && (
          <>
            <ProgressBar current={currentIndex + 1} total={total} />
            <QuestionCard
              key={current.id}
              question={current}
              answer={answers[current.id]}
              onChange={handleChange}
            />

            {current.required && !proceed && (
              <Text style={styles.requiredHint}>
                {hint ?? "* Câu hỏi này bắt buộc phải trả lời"}
              </Text>
            )}

            <View style={styles.navRow}>
              {currentSurvey?.allow_back !== false && !isFirst && (
                <TouchableOpacity
                  style={styles.backNavBtn}
                  onPress={() => setCurrentIndex((i) => i - 1)}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backNavBtnText}>‹ Quay lại</Text>
                </TouchableOpacity>
              )}

              {!isLast ? (
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    !proceed && styles.nextBtnDisabled,
                  ]}
                  onPress={() => {
                    if (proceed) setCurrentIndex((i) => i + 1);
                  }}
                  disabled={!proceed}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.nextBtnText,
                      !proceed && styles.nextBtnTextDisabled,
                    ]}
                  >
                    Câu tiếp theo ›
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!proceed || submitting) && styles.nextBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!proceed || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <Text style={styles.nextBtnText}>✉ Nộp khảo sát</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  backBtnText: { fontSize: 22, color: C.gray700, lineHeight: 26 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 11, color: C.gray400, marginTop: 2 },
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  timerBadgeWarn: { backgroundColor: C.dangerBg, borderColor: "#fecaca" },
  timerText: { fontSize: 13, fontWeight: "800", color: C.success, fontVariant: ["tabular-nums"] },
  timerTextWarn: { color: C.danger },

  // ── Progress ──────────────────────────────────────────────────────────────
  progressWrap: { marginBottom: 20 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: "600", color: C.gray500 },
  progressPct: { fontSize: 12, fontWeight: "700", color: C.primary },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(15,23,42,0.08)",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 99,
  },
  progressDots: { flexDirection: "row", gap: 5, marginTop: 8, justifyContent: "center", flexWrap: "wrap" },
  progressDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: "rgba(15,23,42,0.1)" },
  progressDotActive: { backgroundColor: C.primary },
  progressDotCurrent: { width: 20 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  questionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.gray900,
    lineHeight: 24,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: C.gray500,
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 12,
  },
  mediaImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 14 },
  videoNote: { fontSize: 12, color: C.gray400, marginBottom: 12, fontStyle: "italic" },

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: C.gray200,
    borderRadius: 12,
    fontSize: 14,
    color: C.gray900,
    backgroundColor: "#fafafa",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  hintText: { fontSize: 12, color: C.gray400, marginTop: 6 },

  // ── Rating ────────────────────────────────────────────────────────────────
  ratingRow: { flexDirection: "row", gap: 4, flexWrap: "wrap", marginBottom: 6 },
  starBtn: { padding: 2 },
  star: { fontSize: 30, color: "#d1d5db" },
  starActive: { color: "#f59e0b" },
  ratingLabel: { fontSize: 13, color: C.gray500 },

  // ── Choices ───────────────────────────────────────────────────────────────
  optionList: { gap: 10 },
  choiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: C.gray200,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  choiceBtnSel: { borderColor: C.primary, backgroundColor: C.primaryBg },
  choiceBtnMultiSel: { borderColor: C.success, backgroundColor: C.successBg },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSel: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSel: { borderColor: C.success, backgroundColor: C.success },
  checkmark: { color: C.white, fontSize: 12, fontWeight: "700" },
  choiceText: { fontSize: 14, color: C.gray700, flex: 1 },
  choiceTextSel: { color: "#3730a3", fontWeight: "600" },
  choiceTextMultiSel: { color: "#14532d", fontWeight: "600" },
  optionImg: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: C.gray200 },
  loadingText: { fontSize: 13, color: C.gray400, fontStyle: "italic" },

  // ── Dropdown ──────────────────────────────────────────────────────────────
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderWidth: 1.5,
    borderColor: C.gray200,
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  dropdownBtnOpen: { borderColor: "#6d28d9" },
  dropdownLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  dropdownBtnText: { fontSize: 14, fontWeight: "600", color: C.gray900 },
  dropdownPlaceholder: { color: C.gray400, fontWeight: "400" },
  dropdownChevron: { fontSize: 16, color: C.gray500 },
  dropdownChevronOpen: { transform: [{ rotate: "180deg" }] },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  dropdownList: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.gray200,
    maxHeight: 300,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
    gap: 10,
  },
  dropdownItemSel: { backgroundColor: "#f5f3ff" },
  dropdownItemText: { fontSize: 14, color: C.gray700 },
  dropdownItemTextSel: { color: "#6d28d9", fontWeight: "700" },

  // ── Linear scale ──────────────────────────────────────────────────────────
  linearWrap: { gap: 8 },
  linearLabels: { flexDirection: "row", justifyContent: "space-between" },
  linearLabel: { fontSize: 11, color: C.gray500 },
  linearRow: { flexDirection: "row", gap: 6, justifyContent: "center", flexWrap: "wrap" },
  linearBtn: {
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.gray200,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  linearBtnSel: { borderColor: "#7c3aed", backgroundColor: "#f5f3ff" },
  linearBtnText: { fontSize: 15, color: C.gray700 },
  linearBtnTextSel: { color: "#6d28d9", fontWeight: "700" },

  // ── Nav row ───────────────────────────────────────────────────────────────
  navRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  backNavBtn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backNavBtnText: { fontSize: 14, fontWeight: "600", color: C.gray700 },
  nextBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtnDisabled: { backgroundColor: "rgba(15,23,42,0.08)" },
  nextBtnText: { fontSize: 14, fontWeight: "700", color: C.white },
  nextBtnTextDisabled: { color: C.gray400 },
  submitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.success,
    alignItems: "center",
    justifyContent: "center",
  },
  requiredHint: {
    fontSize: 12,
    color: C.danger,
    marginTop: 10,
  },

  // ── Loading / empty ───────────────────────────────────────────────────────
  centeredPad: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  emptyText: { fontSize: 15, color: "#64748b" },

  // ── Full center screens ───────────────────────────────────────────────────
  fullCenter: {
    flex: 1,
    backgroundColor: "#f0f2ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // ── Success ───────────────────────────────────────────────────────────────
  successCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 32,
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successIconText: { fontSize: 36, color: C.success },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.gray900,
    marginBottom: 10,
    textAlign: "center",
  },
  successMsg: {
    fontSize: 14,
    color: C.gray500,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  redirectBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 12,
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    gap: 4,
  },
  redirectText: { fontSize: 12, color: "#2563eb" },
  redirectUrl: { fontSize: 11, color: C.gray500 },
  redirectCountdown: { fontSize: 12, color: "#2563eb", fontWeight: "700" },

  // ── Status screen ─────────────────────────────────────────────────────────
  statusCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 32,
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 28,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusIconText: { fontSize: 36 },
  statusTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.gray900,
    marginBottom: 10,
    textAlign: "center",
  },
  statusMsg: {
    fontSize: 14,
    color: C.gray500,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },

  // ── Intro ─────────────────────────────────────────────────────────────────
  introCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 32,
    width: "100%",
    maxWidth: 520,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  introIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  introIconText: { fontSize: 30 },
  introTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.gray900,
    marginBottom: 8,
    textAlign: "center",
  },
  introDesc: {
    fontSize: 14,
    color: C.gray500,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  timeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: C.warnBg,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 16,
  },
  timeBadgeText: { fontSize: 13, fontWeight: "600", color: "#92400e" },
  introMeta: { gap: 6, alignItems: "center", marginBottom: 24 },
  introMetaText: { fontSize: 13, color: C.gray500 },

  // ── Shared ────────────────────────────────────────────────────────────────
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: C.gray100,
    width: "100%",
    marginBottom: 20,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },
  btnDisabled: { backgroundColor: C.gray200, shadowOpacity: 0 },
  backLink: { marginTop: 10 },
  backLinkText: { fontSize: 13, color: C.gray400 },
});