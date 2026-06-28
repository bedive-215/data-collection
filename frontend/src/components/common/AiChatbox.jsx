import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MessageCircle, X, Send, Loader2, Sparkles,
  Bot, User, FileText, CheckCircle2, TrendingUp, Users,
  Eye, Plus, ExternalLink, BarChart3, Clock, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { chatWithAI } from "@/services/aiChatService";
import { toast } from "react-toastify";

const MAX_HISTORY = 20;

const SUGGESTIONS = [
  "Liệt kê các khảo sát của tôi",
  "Tạo khảo sát mới cho tôi",
  "Xem thống kê khảo sát của tôi",
  "Tôi có bao nhiêu khảo sát đang hoạt động?",
];

const C = {
  primary: "#4f46e5",
  primaryLight: "rgba(79,70,229,0.12)",
  primaryGrad: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  surface: "rgba(255,255,255,0.88)",
  surfaceHigh: "rgba(255,255,255,0.96)",
  glassBorder: "rgba(255,255,255,0.5)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  error: "#ef4444",
  errorBg: "rgba(239,68,68,0.08)",
  font: "'DM Sans','Inter',sans-serif",
};

const STATUS_CONFIG = {
  ACTIVE: { label: "Đang mở", color: "#059669", bg: "rgba(16,185,129,0.12)" },
  DRAFT: { label: "Nháp", color: "#64748b", bg: "rgba(107,114,128,0.1)" },
  EXPIRED: { label: "Hết hạn", color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  CLOSED: { label: "Đã đóng", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  SCHEDULED: { label: "Lên lịch", color: "#d97706", bg: "rgba(245,158,11,0.1)" },
};

// ─── Survey Card (compact) ────────────────────────────────────────────────

function SurveyCard({ survey, onView, onStats }) {
  const status = STATUS_CONFIG[survey.status] || STATUS_CONFIG.DRAFT;
  const createdDate = survey.created_at
    ? new Date(survey.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })
    : "";

  return (
    <div style={{
      padding: "12px 14px",
      borderRadius: 14,
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.07)",

      marginBottom: 8,
      animation: "slideInUp 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: C.text,
            fontFamily: C.font, marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            <span dangerouslySetInnerHTML={{__html:survey.title}}/>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.textSub, fontFamily: C.font }}>
              <FileText size={11} /> {survey.question_count ?? 0} câu
            </span>
            {survey.response_count !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.textSub, fontFamily: C.font }}>
                <CheckCircle2 size={11} /> {survey.response_count ?? 0} phản hồi
              </span>
            )}
            {survey.participant_count !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.textSub, fontFamily: C.font }}>
                <Users size={11} /> {survey.participant_count ?? 0} người
              </span>
            )}
            {createdDate && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.textDim, fontFamily: C.font }}>
                <Clock size={11} /> {createdDate}
              </span>
            )}
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 999,
              color: status.color, background: status.bg,
              fontFamily: C.font, letterSpacing: "0.02em",
            }}>
              {status.label}
            </span>
            {survey.is_published && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: "2px 8px", borderRadius: 999,
                color: C.primary, background: C.primaryLight,
                fontFamily: C.font, marginLeft: 4,
              }}>
                Live
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => onView(survey.id)}
            title="Xem chi tiết"
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.8)",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: C.primary, transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.borderColor = "rgba(79,70,229,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
          >
            <Eye size={12} />
          </button>
          {survey.response_count !== undefined && (
            <button
              onClick={() => onStats(survey.id)}
              title="Xem thống kê"
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(255,255,255,0.8)",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: C.success, transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.successBg; e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
            >
              <BarChart3 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Panel ─────────────────────────────────────────────────────────

function StatsPanel({ survey }) {
  const status = STATUS_CONFIG[survey.status] || STATUS_CONFIG.DRAFT;
  const completion = survey.completion_rate;

  return (
    <div style={{
      padding: "14px",
      borderRadius: 14,
      background: "linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.06))",
      border: "1px solid rgba(79,70,229,0.15)",
      marginBottom: 8,
      animation: "slideInUp 0.2s ease",
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: C.font, marginBottom: 10 }}>
        📊 <span dangerouslySetInnerHTML={{__html:survey.title}}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Câu hỏi", value: survey.question_count ?? 0, icon: <FileText size={12} /> },
          { label: "Phản hồi", value: survey.response_count ?? 0, icon: <CheckCircle2 size={12} /> },
          { label: "Người tham gia", value: survey.participant_count ?? 0, icon: <Users size={12} /> },
        ].map((item) => (
          <div key={item.label} style={{
            padding: "8px 10px", borderRadius: 10,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.primary, fontFamily: C.font }}>
              {item.value}
            </div>
            <div style={{ fontSize: 10, color: C.textSub, fontFamily: C.font, marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {completion !== null && completion !== undefined && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub, fontFamily: C.font, marginBottom: 4 }}>
            <span>Tỷ lệ hoàn thành</span>
            <span style={{ fontWeight: 700, color: completion >= 70 ? C.success : C.error }}>{completion}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${completion}%`,
              background: completion >= 70 ? C.success : C.primary,
              borderRadius: 999, transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: status.color, background: status.bg, fontFamily: C.font }}>
          {status.label}
        </span>
        {survey.is_published && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: C.primary, background: C.primaryLight, fontFamily: C.font }}>
            🌐 Public
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: C.textDim,
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Success notification card ───────────────────────────────────────────

function SuccessCard({ message, survey }) {
  return (
    <div style={{
      padding: "14px",
      borderRadius: 14,
      background: C.successBg,
      border: "1px solid rgba(16,185,129,0.2)",
      marginBottom: 8,
      animation: "slideInUp 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <CheckCircle2 size={16} color={C.success} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", fontFamily: C.font }}>
          Thành công!
        </span>
      </div>
      <div style={{ fontSize: 12, color: C.textSub, fontFamily: C.font, lineHeight: 1.5 }}>
        {message}
      </div>
      {survey && (
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          <button
            onClick={() => window.location.href = `/user/my-surveys/${survey.id}`}
            style={{
              padding: "6px 12px", borderRadius: 8,
              border: "none", background: C.primary,
              color: "#fff", fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: C.font,
              display: "flex", alignItems: "center", gap: 4,

            }}
          >
            <Eye size={11} /> Xem khảo sát
          </button>
          {survey.created_count !== undefined && (
            <button
              onClick={() => window.location.href = `/user/my-surveys/${survey.survey_id || survey.id}`}
              style={{
                padding: "6px 12px", borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.1)",
                background: "#fff", color: C.text,
                fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: C.font,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <Plus size={11} /> Thêm câu hỏi
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Survey list card ────────────────────────────────────────────────────

function SurveyListCard({ surveys, onView, onStats }) {
  if (!surveys || surveys.length === 0) {
    return (
      <div style={{
        padding: "16px", borderRadius: 14, background: "rgba(0,0,0,0.03)",
        border: "1px dashed rgba(0,0,0,0.1)", textAlign: "center", marginBottom: 8,
      }}>
        <FileText size={20} color={C.textDim} style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 12, color: C.textSub, fontFamily: C.font }}>
          Bạn chưa có khảo sát nào. Hãy tạo khảo sát đầu tiên nhé!
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, fontFamily: C.font, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        📋 {surveys.length} khảo sát của bạn
      </div>
      {surveys.slice(0, 5).map((s) => (
        <SurveyCard key={s.id} survey={s} onView={onView} onStats={onStats} />
      ))}
      {surveys.length > 5 && (
        <div style={{ fontSize: 11, color: C.textSub, fontFamily: C.font, textAlign: "center", paddingTop: 4 }}>
          +{surveys.length - 5} khảo sát khác
        </div>
      )}
    </div>
  );
}

// ─── Main Chatbox ────────────────────────────────────────────────────────

export default function AiChatbox() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const addMessage = useCallback((role, content, timestamp, extra = {}) => {
    setMessages((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), role, content, timestamp, ...extra }];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  }, []);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput("");
    setError("");
    addMessage("user", trimmed, new Date().toISOString());
    setLoading(true);
    scrollToBottom();

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
      setError(msg);
      toast.error(msg);
      addMessage("assistant", `❌ ${msg}`, new Date().toISOString());
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (text) => {
    if (!isOpen) setIsOpen(true);
    setTimeout(() => sendMessage(text), 300);
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  const handleViewSurvey = (surveyId) => {
    setIsOpen(false);
    document.body.style.overflow = "";
    navigate(`/user/my-surveys/${surveyId}`);
  };

  const handleSurveyStats = (surveyId) => {
    setIsOpen(false);
    document.body.style.overflow = "";
    navigate(`/user/surveys/${surveyId}/analytics`);
  };

  // Parse action from message (simple heuristic — check if message mentions survey data)
  const parseInlineSurveyData = (msg) => {
    // The backend sends rich replies — frontend just renders them
    // Inline survey cards will be handled by special message types
    return null;
  };

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
  };

  const handleOpen = () => {
    document.body.style.overflow = "hidden";
    setIsOpen(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-7px); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
      `}</style>

      {/* ── Floating button ── */}
      <button
        onClick={() => { isOpen ? handleClose() : handleOpen(); }}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9998,
          width: 60, height: 60, borderRadius: "50%", border: "none",
          background: C.primaryGrad, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.25s ease",
          animation: isOpen ? "none" : "float 3s ease-in-out infinite",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";

        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";

        }}
        title="EchoAI Assistant"
        aria-label="Mở EchoAI Assistant"
      >
        {isOpen ? (
          <X size={24} color="#fff" strokeWidth={2.5} />
        ) : (
          <>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: C.primary, animation: "pulse-ring 2s ease-out infinite",
            }} />
            <Sparkles size={24} color="#fff" strokeWidth={2} style={{ position: "relative", zIndex: 1 }} />
          </>
        )}
      </button>

      {/* ── Chat window ── */}
      {isOpen && createPortal(
        <div style={{
          position: "fixed", bottom: 96, right: 24, zIndex: 9999,
          width: 390, maxWidth: "calc(100vw - 48px)",
          height: 580,
          display: "flex", flexDirection: "column",
          background: C.surface,
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
          border: `1px solid ${C.glassBorder}`,
          borderRadius: 24,

          overflow: "hidden",
          animation: "slideInUp 0.3s cubic-bezier(.16,1,.3,1)",
        }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 16px",
            background: C.primaryGrad,
            flexShrink: 0,
            position: "relative", overflow: "hidden",
          }}>
            <div aria-hidden style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "linear-gradient(105deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
            }} />

            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, position: "relative", zIndex: 1,
            }}>
              <Bot size={20} color="#fff" strokeWidth={2} />
            </div>

            <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: C.font }}>
                EchoAI Assistant
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: C.font }}>
                AI thông minh · có thể tạo survey
              </div>
            </div>

            <button
              onClick={handleClose}
              title="Đóng"
              style={{
                width: 32, height: 32, borderRadius: 9,
                border: "none", background: "rgba(255,255,255,0.2)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", color: "rgba(255,255,255,0.8)",
                fontSize: 11, fontWeight: 700, fontFamily: C.font,
                flexShrink: 0, position: "relative", zIndex: 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 2,
            background: "rgba(248,250,252,0.5)",
            maxHeight: "calc(580px - 56px - 64px - 62px)",
            overflowX: "hidden",
          }}>
            {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 12px 24px" }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: C.primaryLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px",
                    }}>
                      <Sparkles size={24} color={C.primary} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: C.font, marginBottom: 5 }}>
                      Xin chào! Mình là EchoAI 👋
                    </div>
                    <div style={{ fontSize: 12, color: C.textSub, fontFamily: C.font, lineHeight: 1.55, marginBottom: 16 }}>
                      Mình có thể giúp bạn tạo khảo sát, thêm câu hỏi,<br />xem thống kê và tư vấn thiết kế khảo sát hiệu quả.
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestion(s)}
                          style={{
                            padding: "7px 14px", borderRadius: 999,
                            border: `1px solid rgba(79,70,229,0.25)`,
                            background: C.primaryLight, color: C.primary,
                            fontSize: 12, fontWeight: 600, fontFamily: C.font,
                            cursor: "pointer", transition: "all 0.15s",
                            maxWidth: 280, width: "100%",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(79,70,229,0.2)";
                            e.currentTarget.style.transform = "scale(1.02)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = C.primaryLight;
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const isError = msg.content?.startsWith("❌");
                  const action = msg.action;
                  const actionData = action?.data;
                  const hasSurveyList = actionData?.surveys;
                  const hasAnalytics = actionData?.action === "ANALYTICS";
                  const hasCreateOrAdd = actionData?.action === "CREATED" || actionData?.action === "QUESTIONS_ADDED";

                  return (
                    <div key={msg.id}>
                      <div style={{
                        display: "flex", flexDirection: isUser ? "row-reverse" : "row",
                        alignItems: "flex-end", gap: 7, marginBottom: 4,
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: isUser ? "rgba(16,185,129,0.12)" : C.primaryLight,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {isUser
                            ? <User size={11} color="#059669" />
                            : <Bot size={11} color={C.primary} />
                          }
                        </div>

                        {/* Bubble */}
                        <div style={{ maxWidth: "74%" }}>
                          <div style={{
                            padding: "9px 13px",
                            borderRadius: isUser
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            background: isUser
                              ? C.primaryGrad
                              : isError
                                ? C.errorBg
                                : "#fff",
                            border: isUser ? "none" : isError ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(0,0,0,0.07)",

                            color: isUser ? "#fff" : isError ? "#b91c1c" : C.text,
                            fontSize: 13, lineHeight: 1.5,
                            fontFamily: C.font, wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }}>
                            {msg.content}
                          </div>

                          {/* Action buttons */}
                          {action && action.surveyId && !isUser && (
                            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                              <button
                                onClick={() => handleViewSurvey(action.surveyId)}
                                style={{
                                  padding: "5px 12px", borderRadius: 8,
                                  border: "none", background: C.primary,
                                  color: "#fff", fontSize: 11, fontWeight: 700,
                                  cursor: "pointer", fontFamily: C.font,
                                  display: "flex", alignItems: "center", gap: 4,

                                }}
                              >
                                <Eye size={11} /> Xem khảo sát
                              </button>
                              <button
                                onClick={() => handleSurveyStats(action.surveyId)}
                                style={{
                                  padding: "5px 12px", borderRadius: 8,
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  background: "#fff", color: C.text,
                                  fontSize: 11, fontWeight: 700,
                                  cursor: "pointer", fontFamily: C.font,
                                  display: "flex", alignItems: "center", gap: 4,
                                }}
                              >
                                <BarChart3 size={11} /> Thống kê
                              </button>
                            </div>
                          )}

                          {/* Survey list preview */}
                          {hasSurveyList && !isUser && (
                            <div style={{ marginTop: 8 }}>
                              {actionData.surveys.slice(0, 3).map((s) => (
                                <div key={s.id} style={{
                                  padding: "8px 10px", borderRadius: 10,
                                  background: "rgba(79,70,229,0.05)",
                                  border: "1px solid rgba(79,70,229,0.12)",
                                  marginBottom: 4, display: "flex",
                                  alignItems: "center", justifyContent: "space-between",
                                }}>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: C.font }}>
                                      <span dangerouslySetInnerHTML={{__html:s.title}}/>
                                    </div>
                                    <div style={{ fontSize: 10, color: C.textSub, fontFamily: C.font, marginTop: 2 }}>
                                      {s.question_count} câu · {s.response_count} phản hồi
                                    </div>
                                  </div>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    padding: "2px 8px", borderRadius: 999,
                                    background: STATUS_CONFIG[s.status]?.bg || "rgba(0,0,0,0.06)",
                                    color: STATUS_CONFIG[s.status]?.color || C.textSub,
                                    fontFamily: C.font,
                                  }}>
                                    {STATUS_CONFIG[s.status]?.label || s.status}
                                  </span>
                                </div>
                              ))}
                              {actionData.total > 3 && (
                                <div style={{ fontSize: 11, color: C.textSub, fontFamily: C.font, textAlign: "center", marginTop: 4 }}>
                                  +{actionData.total - 3} khảo sát khác
                                </div>
                              )}
                            </div>
                          )}

                          {/* Analytics card */}
                          {hasAnalytics && !isUser && (
                            <div style={{
                              marginTop: 8, padding: "12px",
                              borderRadius: 12,
                              background: "rgba(79,70,229,0.05)",
                              border: "1px solid rgba(79,70,229,0.12)",
                            }}>
                              <div style={{ fontSize: 11, color: C.textSub, fontFamily: C.font, marginBottom: 8 }}>
                                📊 Thống kê
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                                {[
                                  { label: "Câu hỏi", value: actionData.question_count },
                                  { label: "Phản hồi", value: actionData.response_count },
                                  { label: "Người tham gia", value: actionData.participant_count },
                                ].map((item) => (
                                  <div key={item.label} style={{
                                    padding: "6px 8px", borderRadius: 8,
                                    background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
                                    textAlign: "center",
                                  }}>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: C.primary, fontFamily: C.font }}>
                                      {item.value ?? 0}
                                    </div>
                                    <div style={{ fontSize: 10, color: C.textSub, fontFamily: C.font }}>{item.label}</div>
                                  </div>
                                ))}
                              </div>
                              {actionData.completion_rate !== null && (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub, fontFamily: C.font, marginBottom: 4 }}>
                                    <span>Tỷ lệ hoàn thành</span>
                                    <span style={{ fontWeight: 700, color: actionData.completion_rate >= 70 ? C.success : C.error }}>
                                      {actionData.completion_rate}%
                                    </span>
                                  </div>
                                  <div style={{ height: 5, borderRadius: 999, background: "rgba(0,0,0,0.08)" }}>
                                    <div style={{
                                      height: "100%", width: `${actionData.completion_rate}%`,
                                      background: actionData.completion_rate >= 70 ? C.success : C.primary,
                                      borderRadius: 999,
                                    }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Created/Added success card */}
                          {hasCreateOrAdd && !isUser && (
                            <div style={{
                              marginTop: 8, padding: "12px",
                              borderRadius: 12, background: C.successBg,
                              border: "1px solid rgba(16,185,129,0.2)",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <CheckCircle2 size={14} color={C.success} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#059669", fontFamily: C.font }}>
                                  {actionData.action === "CREATED" ? "Đã tạo khảo sát!" : `Đã thêm ${actionData.created_count} câu hỏi!`}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: C.textSub, fontFamily: C.font, marginBottom: 8 }}>
                                {actionData.message}
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => handleViewSurvey(actionData.id)}
                                  style={{
                                    padding: "5px 12px", borderRadius: 8,
                                    border: "none", background: C.primary,
                                    color: "#fff", fontSize: 11, fontWeight: 700,
                                    cursor: "pointer", fontFamily: C.font,
                                    display: "flex", alignItems: "center", gap: 4,
                                  }}
                                >
                                  <Eye size={11} /> Mở khảo sát
                                </button>
                                <button
                                  onClick={() => {
                                    navigate(`/user/surveys/${actionData.id}/analytics`);
                                    setIsOpen(false);
                                  }}
                                  style={{
                                    padding: "5px 12px", borderRadius: 8,
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    background: "#fff", color: C.text,
                                    fontSize: 11, fontWeight: 700,
                                    cursor: "pointer", fontFamily: C.font,
                                    display: "flex", alignItems: "center", gap: 4,
                                  }}
                                >
                                  <BarChart3 size={11} /> Thống kê
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: C.primaryLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Bot size={11} color={C.primary} />
                    </div>
                    <div style={{
                      padding: "10px 16px", borderRadius: "18px 18px 18px 4px",
                      background: "#fff", border: "1px solid rgba(0,0,0,0.07)",

                    }}>
                      <TypingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: "10px 14px 12px",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(12px)",
                borderTop: "1px solid rgba(0,0,0,0.06)",
                display: "flex", gap: 8, alignItems: "flex-end",
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhắn cho EchoAI..."
                  rows={1}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 16,
                    border: `1.5px solid rgba(0,0,0,0.1)`,
                    fontSize: 13, fontFamily: C.font, color: C.text,
                    background: "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(8px)",
                    outline: "none", resize: "none", maxHeight: 100,
                    overflowY: "auto", lineHeight: 1.4,
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = C.primary;

                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(0,0,0,0.1)";

                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: 14, border: "none",
                    background: loading || !input.trim()
                      ? "rgba(0,0,0,0.06)"
                      : C.primaryGrad,
                    color: loading || !input.trim() ? C.textDim : "#fff",
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,

                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && input.trim()) {
                      e.currentTarget.style.transform = "scale(1.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  aria-label="Gửi tin nhắn"
                >
                  {loading
                    ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Send size={16} />
                  }
                </button>
              </div>
        </div>,
        document.body
      )}
    </>
  );
}
