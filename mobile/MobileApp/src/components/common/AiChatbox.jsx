// src/components/common/AiChatbox.jsx
// React Native EchoAI Chatbox — matches web AiChatbox.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, Animated, ScrollView, ActivityIndicator, Dimensions,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { Sparkles, X, Send, Bot, User, Eye, BarChart3 } from "lucide-react-native";
import { chatWithAI } from "../../services/aiChatService";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const MAX_HISTORY = 20;
const WINDOW_H = SCREEN_H * 0.62;
const WINDOW_W = Math.min(SCREEN_W - 32, 390);

const SUGGESTIONS = [
  "Liệt kê các khảo sát của tôi",
  "Tạo khảo sát mới cho tôi",
  "Xem thống kê khảo sát của tôi",
  "Tôi có bao nhiêu khảo sát đang hoạt động?",
];

const C_ = {
  primary: "#4f46e5",
  primaryLight: "rgba(79,70,229,0.12)",
  primaryGrad: "#4f46e5",
  surface: "#ffffff",
  surfaceBg: "rgba(248,250,252,0.7)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  error: "#ef4444",
  errorBg: "rgba(254,226,226,0.8)",
  bubbleUser: "#4f46e5",
  bubbleBot: "#ffffff",
  border: "rgba(0,0,0,0.08)",
  inputBg: "#f8fafc",
};

const STATUS_CONFIG = {
  ACTIVE: { label: "Đang mở", color: "#059669", bg: "rgba(16,185,129,0.12)" },
  DRAFT: { label: "Nháp", color: "#64748b", bg: "rgba(107,114,128,0.1)" },
  EXPIRED: { label: "Hết hạn", color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  CLOSED: { label: "Đã đóng", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  SCHEDULED: { label: "Lên lịch", color: "#d97706", bg: "rgba(245,158,11,0.1)" },
};

// ── Typing dots ──────────────────────────────────────────────────────
function TypingDots() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8 }}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: C_.textDim,
            opacity: new Animated.Value(1),
          }}
        />
      ))}
    </View>
  );
}

// ── Survey compact card ───────────────────────────────────────────────
function SurveyCard({ survey, onView, onStats }) {
  const status = STATUS_CONFIG[survey.status] || STATUS_CONFIG.DRAFT;
  const qCount = survey.question_count ?? survey.questionCount ?? 0;
  const rCount = survey.response_count ?? survey.responseCount ?? 0;
  const pCount = survey.participant_count ?? survey.participantCount ?? 0;

  return (
    <View style={styles.sCard}>
      <View style={styles.sCardLeft}>
        <Text style={styles.sCardTitle} numberOfLines={1}>{survey.title}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          <Text style={styles.sCardStat}>{qCount} câu</Text>
          {rCount > 0 && <Text style={styles.sCardStat}>{rCount} phản hồi</Text>}
          {pCount > 0 && <Text style={styles.sCardStat}>{pCount} người</Text>}
        </View>
        <View style={[styles.sCardBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.sCardBadgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.sCardActions}>
        <TouchableOpacity style={styles.sCardBtn} onPress={() => onView(survey.id)}>
          <Eye size={12} color={C_.primary} />
        </TouchableOpacity>
        {rCount > 0 && (
          <TouchableOpacity style={[styles.sCardBtn, { marginTop: 4 }]} onPress={() => onStats(survey.id)}>
            <BarChart3 size={12} color={C_.success} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Success card ──────────────────────────────────────────────────────
function SuccessCard({ message, survey, onView }) {
  return (
    <View style={styles.successCard}>
      <View style={styles.successHeader}>
        <Text style={{ fontSize: 14, color: "#059669" }}>✓ Thành công!</Text>
      </View>
      <Text style={styles.successMsg}>{message}</Text>
      {survey && (
        <TouchableOpacity style={styles.successBtn} onPress={() => onView(survey.id)}>
          <Text style={styles.successBtnText}>Mở khảo sát</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Survey list card ─────────────────────────────────────────────────
function SurveyListCard({ surveys, onView, onStats }) {
  if (!surveys || surveys.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyCardText}>Bạn chưa có khảo sát nào.</Text>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.cardLabel}>{surveys.length} khảo sát</Text>
      {surveys.slice(0, 5).map((s) => (
        <SurveyCard key={s.id} survey={s} onView={onView} onStats={onStats} />
      ))}
      {surveys.length > 5 && (
        <Text style={styles.cardMore}>+{surveys.length - 5} khảo sát khác</Text>
      )}
    </View>
  );
}

// ── Message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, onViewSurvey, onStats }) {
  const isUser = msg.role === "user";
  const isError = msg.content?.startsWith("❌");
  const action = msg.action;
  const actionData = action?.data;

  const bubbleStyle = isUser
    ? styles.bubbleUser
    : isError
      ? [styles.bubbleBot, styles.bubbleError]
      : styles.bubbleBot;

  const textStyle = isUser
    ? styles.bubbleTextUser
    : isError
      ? styles.bubbleTextError
      : styles.bubbleTextBot;

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {/* Avatar */}
      <View style={[styles.avatar, isUser ? styles.avatarUser : styles.avatarBot]}>
        {isUser
          ? <User size={11} color="#059669" />
          : <Bot size={11} color={C_.primary} />}
      </View>

      <View style={[styles.bubbleWrap, isUser && { alignItems: "flex-end" }]}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{msg.content}</Text>
        </View>

        {/* Action: View survey */}
        {action?.surveyId && !isUser && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onViewSurvey(action.surveyId)}>
              <Eye size={11} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Xem khảo sát</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnOutline} onPress={() => onStats(action.surveyId)}>
              <BarChart3 size={11} color={C_.text} />
              <Text style={styles.actionBtnOutlineText}>Thống kê</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action: Survey list */}
        {actionData?.surveys && !isUser && (
          <View style={styles.surveyListWrap}>
            {actionData.surveys.slice(0, 3).map((s) => (
              <SurveyCard key={s.id} survey={s} onView={onViewSurvey} onStats={onStats} />
            ))}
            {actionData.total > 3 && (
              <Text style={styles.cardMore}>+{actionData.total - 3} khảo sát khác</Text>
            )}
          </View>
        )}

        {/* Action: Analytics */}
        {actionData?.action === "ANALYTICS" && !isUser && (
          <View style={styles.analyticsCard}>
            <Text style={styles.cardLabel}>Thống kê</Text>
            <View style={styles.analyticsGrid}>
              {[
                { label: "Câu hỏi", value: actionData.question_count ?? 0 },
                { label: "Phản hồi", value: actionData.response_count ?? 0 },
                { label: "Người tham gia", value: actionData.participant_count ?? 0 },
              ].map((item) => (
                <View key={item.label} style={styles.analyticsCell}>
                  <Text style={styles.analyticsVal}>{item.value}</Text>
                  <Text style={styles.analyticsLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action: Created/Added success */}
        {(actionData?.action === "CREATED" || actionData?.action === "QUESTIONS_ADDED") && !isUser && (
          <SuccessCard
            message={actionData.message || "Đã xong!"}
            survey={actionData}
            onView={onViewSurvey}
          />
        )}
      </View>
    </View>
  );
}

// ── Main Chatbox ──────────────────────────────────────────────────────
export default function AiChatbox({ navigation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  const addMessage = useCallback((role, content, timestamp, extra = {}) => {
    setMessages((prev) => {
      const next = [
        ...prev,
        { id: Date.now() + Math.random(), role, content, timestamp, ...extra },
      ];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput("");
    setLoading(true);

    addMessage("user", trimmed, new Date().toISOString());

    try {
      const history = messages.slice(-MAX_HISTORY).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatWithAI(trimmed, history);
      const reply = res?.data?.reply || "Xin lỗi, mình chưa nhận được phản hồi từ AI.";
      const action = res?.data?.action;

      addMessage("assistant", reply, res?.data?.timestamp || new Date().toISOString(), { action });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Kết nối AI thất bại";
      addMessage("assistant", `❌ ${msg}`, new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (text) => {
    setIsOpen(true);
    setTimeout(() => sendMessage(text), 350);
  };

  const clearChat = () => setMessages([]);

  const navigateToSurvey = (surveyId) => {
    setIsOpen(false);
    navigation?.navigate("SurveyStudio", { surveyId });
  };

  const navigateToStats = (surveyId) => {
    setIsOpen(false);
    navigation?.navigate("SurveyResponse", { surveyId });
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <TouchableOpacity
        style={[styles.fab, !isOpen && styles.fabFloat]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <Sparkles size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── Chat Modal ── */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />

          {/* Window */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.windowOuter}
          >
            <View style={styles.window}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerAvatar}>
                    <Bot size={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>EchoAI Assistant</Text>
                    <Text style={styles.headerSub}>AI thông minh · có thể tạo survey</Text>
                  </View>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.headerBtn} onPress={clearChat}>
                    <X size={15} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerBtn} onPress={() => setIsOpen(false)}>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>−</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages */}
              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Empty state / welcome */}
                {messages.length === 0 && (
                  <View style={styles.welcome}>
                    <View style={styles.welcomeIcon}>
                      <Sparkles size={26} color={C_.primary} />
                    </View>
                    <Text style={styles.welcomeTitle}>Xin chào! Mình là EchoAI 👋</Text>
                    <Text style={styles.welcomeSub}>
                      Mình có thể giúp bạn tạo khảo sát, thêm câu hỏi,{'\n'}xem thống kê và tư vấn thiết kế khảo sát hiệu quả.
                    </Text>
                    <View style={styles.suggestions}>
                      {SUGGESTIONS.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={styles.suggestionChip}
                          onPress={() => handleSuggestion(s)}
                        >
                          <Text style={styles.suggestionChipText}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Message list */}
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onViewSurvey={navigateToSurvey}
                    onStats={navigateToStats}
                  />
                ))}

                {/* Typing indicator */}
                {loading && (
                  <View style={[styles.msgRow, { alignItems: "flex-start" }]}>
                    <View style={styles.avatarBot}>
                      <Bot size={11} color={C_.primary} />
                    </View>
                    <View style={[styles.bubbleBot, { paddingVertical: 10 }]}>
                      <TypingDots />
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Nhắn cho EchoAI..."
                  placeholderTextColor={C_.textDim}
                  multiline
                  maxLength={2000}
                  editable={!loading}
                  onSubmitEditing={() => sendMessage()}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!input.trim() || loading) && styles.sendBtnDisabled,
                  ]}
                  onPress={() => sendMessage()}
                  disabled={!input.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={17} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C_.primaryGrad,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 998,
  },
  fabFloat: {},

  // ── Overlay
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 100,
    paddingRight: 12,
  },
  windowOuter: {
    width: WINDOW_W,
    maxHeight: WINDOW_H,
  },
  window: {
    width: "100%",
    height: WINDOW_H,
    backgroundColor: C_.surface,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: C_.primaryGrad,
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  headerSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  headerBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Messages
  messages: {
    flex: 1,
    backgroundColor: C_.surfaceBg,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 0,
  },

  // ── Welcome
  welcome: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  welcomeIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C_.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C_.text,
    marginBottom: 6,
    textAlign: "center",
  },
  welcomeSub: {
    fontSize: 12,
    color: C_.textSub,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
  },
  suggestions: {
    width: "100%",
    gap: 6,
  },
  suggestionChip: {
    width: "100%",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.25)",
    backgroundColor: C_.primaryLight,
    alignItems: "center",
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: C_.primary,
    textAlign: "center",
  },

  // ── Message row
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
    gap: 7,
  },
  msgRowUser: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarUser: {
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  avatarBot: {
    backgroundColor: C_.primaryLight,
  },
  bubbleWrap: {
    maxWidth: "74%",
    gap: 4,
  },
  bubbleBot: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    backgroundColor: C_.bubbleBot,
    borderWidth: 1,
    borderColor: C_.border,
  },
  bubbleError: {
    backgroundColor: C_.errorBg,
    borderColor: "rgba(239,68,68,0.2)",
  },
  bubbleUser: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    backgroundColor: C_.bubbleUser,
  },
  bubbleTextBot: {
    fontSize: 13,
    color: C_.text,
    lineHeight: 19,
  },
  bubbleTextError: {
    fontSize: 13,
    color: "#b91c1c",
    lineHeight: 19,
  },
  bubbleTextUser: {
    fontSize: 13,
    color: "#fff",
    lineHeight: 19,
  },

  // ── Actions
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: C_.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C_.border,
    backgroundColor: "#fff",
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: "700",
    color: C_.text,
  },
  surveyListWrap: {
    marginTop: 4,
    gap: 6,
  },

  // ── Analytics card
  analyticsCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C_.primaryLight,
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.15)",
  },
  analyticsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  analyticsCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C_.border,
  },
  analyticsVal: {
    fontSize: 16,
    fontWeight: "800",
    color: C_.primary,
  },
  analyticsLabel: {
    fontSize: 10,
    color: C_.textSub,
    marginTop: 2,
    textAlign: "center",
  },

  // ── Success card
  successCard: {
    marginTop: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C_.successBg,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  successMsg: {
    fontSize: 12,
    color: C_.textSub,
    lineHeight: 18,
  },
  successBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: C_.primary,
    alignItems: "center",
  },
  successBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Survey card (compact)
  sCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C_.border,
    marginBottom: 6,
  },
  sCardLeft: {
    flex: 1,
    gap: 4,
  },
  sCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: C_.text,
  },
  sCardStat: {
    fontSize: 10,
    color: C_.textSub,
  },
  sCardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: 2,
  },
  sCardBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sCardActions: {
    flexShrink: 0,
  },
  sCardBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: C_.border,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Labels / shared
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C_.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardMore: {
    fontSize: 11,
    color: C_.textSub,
    textAlign: "center",
    marginTop: 4,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderWidth: 1,
    borderColor: C_.border,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 12,
    color: C_.textSub,
  },

  // ── Input
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: C_.border,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: C_.inputBg,
    borderWidth: 1.5,
    borderColor: C_.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: C_.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C_.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: C_.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
    elevation: 0,
  },
});
