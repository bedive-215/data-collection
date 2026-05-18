// src/components/survey/AiQuestionAssistant.jsx
// React Native AI Question Assistant — matches web AiQuestionAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, Animated, ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { Sparkles, Wand2, X, Check, AlertCircle, Copy } from "lucide-react-native";
import questionService from "../../services/questionService";

const TYPE_LABEL = {
  TEXT: "Ngắn",
  PARAGRAPH: "Đoạn",
  SINGLE_CHOICE: "Một lựa chọn",
  MULTIPLE_CHOICE: "Nhiều lựa chọn",
  DROPDOWN: "Dropdown",
  RATING: "Đánh giá",
  DATE: "Ngày",
  NUMBER: "Số",
  EMAIL: "Email",
};

export default function AiQuestionAssistant({
  open,
  onClose,
  surveyId,
  surveyTitle = "",
  surveyDescription = "",
  existingCount = 0,
  onApplied,
  C,
}) {
  const C_ = C ?? {
    surface: "#ffffff",
    surfaceHigh: "#f8fafc",
    primary: "#4f46e5",
    primaryGrad: "linear-gradient(135deg, #6366f1, #4f46e5)",
    primaryLight: "rgba(79,110,247,0.1)",
    primaryBorder: "rgba(99,102,241,0.3)",
    text: "#111827",
    textSub: "#64748b",
    textDim: "#94a3b8",
    error: "#ef4444",
    errorBg: "rgba(254,226,226,0.7)",
    success: "#10b981",
    successBg: "rgba(16,185,129,0.1)",
    bg: "#f0f4ff",
  };

  const [tab, setTab] = useState("parse");
  const [rawText, setRawText] = useState("");
  const [genTitle, setGenTitle] = useState(surveyTitle);
  const [genDesc, setGenDesc] = useState(surveyDescription);
  const [genCount, setGenCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (open) {
      setGenTitle(surveyTitle || "");
      setGenDesc(surveyDescription || "");
      setSuggestions([]);
      setErr("");
    }
  }, [open, surveyTitle, surveyDescription]);

  const resetPreview = () => {
    setSuggestions([]);
    setErr("");
  };

  const runAi = async () => {
    setErr("");
    setSuggestions([]);
    setLoading(true);
    try {
      const body =
        tab === "parse"
          ? { mode: "parse", rawText: rawText.trim() }
          : {
              mode: "generate",
              surveyTitle: genTitle.trim(),
              surveyDescription: genDesc.trim() || undefined,
              count: genCount,
            };
      const res = await questionService.aiSuggestQuestions(surveyId, body);
      const list = res?.data?.questions ?? [];
      if (!Array.isArray(list) || list.length === 0) {
        setErr("AI không trả về câu hỏi nào.");
        return;
      }
      setSuggestions(list);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Gọi AI thất bại";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (suggestions.length === 0) return;
    const base = existingCount;
    const payload = suggestions.map((q, i) => ({
      content: q.content,
      type: q.type,
      required: q.required !== false,
      order_index: base + i,
      settings: q.settings ?? undefined,
      options: q.options,
    }));
    try {
      await onApplied(payload);
      Alert.alert("Thành công", `Đã thêm ${payload.length} câu hỏi`);
      onClose();
      setSuggestions([]);
      setRawText("");
    } catch {
      // toast handled by provider
    }
  };

  if (!open) return null;

  const canRunParse = rawText.trim().length > 0;
  const canRunGen = genTitle.trim().length > 0;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.box}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: C_.primary }]}>
                <Sparkles size={18} color="#fff" />
              </View>
              <View>
                <Text style={styles.title}>Trợ lý AI</Text>
                <Text style={styles.subtitle}>Dán câu hỏi hoặc mô tả chủ đề — AI gợi ý</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={C_.textSub} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === "parse" && styles.tabActive]}
              onPress={() => { setTab("parse"); resetPreview(); }}
            >
              <Copy size={14} color={tab === "parse" ? C_.primary : C_.textSub} />
              <Text style={[styles.tabLabel, tab === "parse" && styles.tabLabelActive]}>Dán nội dung</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "generate" && styles.tabActive]}
              onPress={() => { setTab("generate"); resetPreview(); }}
            >
              <Wand2 size={14} color={tab === "generate" ? C_.primary : C_.textSub} />
              <Text style={[styles.tabLabel, tab === "generate" && styles.tabLabelActive]}>Từ tên khảo sát</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {tab === "parse" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Dán văn bản câu hỏi</Text>
                <Text style={styles.inputHint}>
                  Dán đánh số (1. 2. / Câu 1, Câu 2) hoặc từng dòng một. AI tách và gán loại câu hợp lý.
                </Text>
                <TextInput
                  multiline
                  value={rawText}
                  onChangeText={setRawText}
                  placeholder={"Ví dụ:\n1. Bạn có hài lòng với dịch vụ không?\n2. Điểm cần cải thiện?\n3. Khu vực của bạn: A) TP.HCM  B) Hà Nội  C) Khác"}
                  placeholderTextColor={C_.textDim}
                  style={styles.textArea}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên / chủ đề khảo sát *</Text>
                <TextInput
                  value={genTitle}
                  onChangeText={setGenTitle}
                  placeholder="VD: Khảo sát sự hài lòng khách hàng"
                  placeholderTextColor={C_.textDim}
                  style={styles.textInput}
                />

                <Text style={styles.inputLabel}>Mô tả thêm (tuỳ chọn)</Text>
                <TextInput
                  multiline
                  value={genDesc}
                  onChangeText={setGenDesc}
                  placeholder="Mô tả chi tiết hơn về khảo sát..."
                  placeholderTextColor={C_.textDim}
                  style={[styles.textInput, styles.textArea, { height: 80 }]}
                  textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>Số câu gợi ý: {genCount}</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderMin}>5</Text>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${((genCount - 5) / 10) * 100}%` }]} />
                  </View>
                  <Text style={styles.sliderMax}>15</Text>
                </View>
                <View style={styles.sliderBtns}>
                  {[5, 8, 10, 15].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setGenCount(n)}
                      style={[styles.sliderChip, genCount === n && styles.sliderChipActive]}
                    >
                      <Text style={[styles.sliderChipText, genCount === n && styles.sliderChipTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Error */}
            {err ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={C_.error} />
                <Text style={styles.errorText}>{err}</Text>
              </View>
            ) : null}

            {/* Suggestions Preview */}
            {suggestions.length > 0 ? (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>XEM TRƯỚC ({suggestions.length})</Text>
                {suggestions.map((q, i) => (
                  <View key={i} style={styles.previewItem}>
                    <View style={styles.previewNum}>
                      <Text style={styles.previewNumText}>{i + 1}</Text>
                    </View>
                    <View style={styles.previewContent}>
                      <Text style={styles.previewQuestion} numberOfLines={3}>
                        {q.content?.slice(0, 180)}{q.content?.length > 180 ? "…" : ""}
                      </Text>
                      <View style={styles.previewBadge}>
                        <Text style={styles.previewBadgeText}>
                          {TYPE_LABEL[q.type] || q.type}
                        </Text>
                      </View>
                      {q.options && q.options.length > 0 && (
                        <Text style={styles.previewOptions} numberOfLines={1}>
                          {q.options.map(o => o.label).join(" · ")}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Đóng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={runAi}
              disabled={loading || (tab === "parse" && !canRunParse) || (tab === "generate" && !canRunGen)}
              style={[
                styles.runBtn,
                (loading || (tab === "parse" && !canRunParse) || (tab === "generate" && !canRunGen))
                  ? styles.runBtnDisabled
                  : {},
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Sparkles size={15} color="#fff" />
              )}
              <Text style={styles.runBtnText}>
                {loading ? "Đang xử lý…" : "Chạy AI"}
              </Text>
            </TouchableOpacity>

            {suggestions.length > 0 && (
              <TouchableOpacity onPress={applyAll} style={styles.applyBtn}>
                <Check size={15} color="#fff" strokeWidth={2.5} />
                <Text style={styles.applyBtnText}>Thêm {suggestions.length} câu</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  box: {
    width: "94%",
    maxHeight: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f4f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: {
    borderColor: "rgba(99,102,241,0.35)",
    backgroundColor: "rgba(99,102,241,0.08)",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabLabelActive: {
    color: "#4f46e5",
  },
  body: {
    maxHeight: 380,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 2,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderMin: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  sliderMax: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  sliderTrack: {
    flex: 1,
    height: 5,
    backgroundColor: "#e8ecf0",
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 3,
  },
  sliderBtns: {
    flexDirection: "row",
    gap: 8,
  },
  sliderChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#f4f5f7",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  sliderChipActive: {
    backgroundColor: "rgba(79,110,247,0.1)",
    borderColor: "rgba(79,110,247,0.3)",
  },
  sliderChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  sliderChipTextActive: {
    color: "#4f46e5",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(254,226,226,0.7)",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginTop: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    flex: 1,
    lineHeight: 18,
  },
  preview: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  previewItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  previewNum: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#f4f5f7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  previewNumText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  previewContent: {
    flex: 1,
    gap: 5,
  },
  previewQuestion: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
  },
  previewBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4f46e5",
  },
  previewOptions: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  runBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  runBtnDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
    elevation: 0,
  },
  runBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
