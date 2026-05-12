import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSurvey } from "@/providers/SurveyProvider";
import { useResponse } from "@/providers/ResponseProvider";
import {
  ChevronLeft, CheckCircle2, Loader2, AlertCircle,
  AlignLeft, FileText, Mail, Calendar, Hash, Star, CheckSquare, ChevronDown,
  Trophy, Home, Clock,
} from "lucide-react";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";

const TYPE_CONFIG = {
  TEXT: { label: "Văn bản ngắn", Icon: AlignLeft, color: "#4f6ef7", bg: "#eef2ff" },
  PARAGRAPH: { label: "Đoạn văn", Icon: FileText, color: "#7c3aed", bg: "#f5f3ff" },
  EMAIL: { label: "Email", Icon: Mail, color: "#0891b2", bg: "#ecfeff" },
  DATE: { label: "Ngày tháng", Icon: Calendar, color: "#b45309", bg: "#fffbeb" },
  NUMBER: { label: "Số", Icon: Hash, color: "#059669", bg: "#ecfdf5" },
  RATING: { label: "Đánh giá", Icon: Star, color: "#d97706", bg: "#fffbeb" },
  SINGLE_CHOICE: { label: "Một lựa chọn", Icon: CheckSquare, color: "#ea580c", bg: "#fff7ed" },
  MULTIPLE_CHOICE: { label: "Nhiều lựa chọn", Icon: CheckSquare, color: "#16a34a", bg: "#f0fdf4" },
  DROPDOWN: { label: "Danh sách thả", Icon: ChevronDown, color: "#6d28d9", bg: "#f5f3ff" },
};

const PAGE = {
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  primary: "#4f46e5",
  font: "'DM Sans','Inter',sans-serif",
};

function GlassPanel({ children, style = {}, delay = 0 }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.55)",
        borderRadius: 20,
        padding: 22,
        animation: `slideInUp 0.55s ease-out ${delay}s both`,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        boxShadow: "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.92) inset, 0 16px 40px rgba(79,70,229,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)";
      }}
    >
      {children}
    </div>
  );
}

function SurveyResponsePage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const { fetchSurveyById } = useSurvey();
  const { getMySubmission } = useResponse();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const surveyRes = await fetchSurveyById(surveyId);
        setSurvey(surveyRes);

        const responseRes = await getMySubmission(surveyId);
        setResponse(responseRes);
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [surveyId]);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", position: "relative", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: PAGE.font }}>
        <AnimatedSurveyBackdrop />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Loader2 size={44} style={{ animation: "spin 1s linear infinite", color: PAGE.primary, marginBottom: 14 }} />
          <p style={{ color: PAGE.textSub, fontSize: 14, fontWeight: 600 }}>Đang tải dữ liệu...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </main>
    );
  }

  if (error || !survey || !response) {
    return (
      <main style={{ minHeight: "100vh", background: "transparent", position: "relative", padding: "28px 20px", fontFamily: PAGE.font }}>
        <AnimatedSurveyBackdrop />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <button
            type="button"
            onClick={() => navigate("/user/home")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 11,
              background: "rgba(255,255,255,0.82)", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer",
              marginBottom: 18, fontSize: 13, fontWeight: 700, color: PAGE.primary,
            }}
          >
            <ChevronLeft size={16} /> Quay lại
          </button>
          <GlassPanel>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg,#f87171,#ef4444)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <AlertCircle size={28} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", color: "#b91c1c", fontWeight: 800, fontSize: 16 }}>Không tải được</h3>
                <p style={{ margin: 0, color: PAGE.textSub, fontSize: 13, lineHeight: 1.55 }}>
                  {error || "Không thể tải được câu trả lời của bạn"}
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "transparent",
        fontFamily: PAGE.font,
        padding: "24px 20px 48px",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <AnimatedSurveyBackdrop />

      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <button
          type="button"
          onClick={() => navigate("/user/home")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 11,
            background: "rgba(255,255,255,0.82)", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer",
            marginBottom: 20, fontSize: 13, fontWeight: 700, color: PAGE.primary,
          }}
        >
          <ChevronLeft size={16} /> Quay lại
        </button>

        <div
          style={{
            background: "linear-gradient(148deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.52) 52%, rgba(238,242,255,0.72) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 22,
            padding: "28px 28px 26px",
            color: PAGE.text,
            position: "relative",
            overflow: "hidden",
            animation: "slideInUp 0.55s ease-out",
            border: "1px solid rgba(255,255,255,0.82)",
            boxShadow: "0 2px 0 rgba(255,255,255,0.95) inset, 0 20px 48px rgba(15,23,42,0.08), 0 40px 80px rgba(79,70,229,0.08)",
            marginBottom: 22,
            transition: "box-shadow 0.25s ease, transform 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.98) inset, 0 24px 56px rgba(79,70,229,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 0 rgba(255,255,255,0.95) inset, 0 20px 48px rgba(15,23,42,0.08), 0 40px 80px rgba(79,70,229,0.08)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, rgba(255,255,255,0.2), transparent)",
              borderRadius: "50%",
              opacity: 0.5,
              animation: "float 6s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: "150px",
              height: "150px",
              background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent)",
              borderRadius: "50%",
              opacity: 0.5,
              animation: "float 8s ease-in-out infinite reverse",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(79,70,229,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(79,70,229,0.2)",
                }}
              >
                <CheckCircle2 size={26} color={PAGE.primary} />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: PAGE.textSub,
                }}
              >
                Đã hoàn thành
              </span>
            </div>

            <h2
              style={{
                fontSize: "clamp(22px, 4vw, 30px)",
                fontWeight: 900,
                marginBottom: 12,
                marginTop: 0,
                lineHeight: 1.2,
                color: PAGE.text,
              }}
            >
              {survey.title}
            </h2>

            <p
              style={{
                fontSize: 14,
                marginBottom: 18,
                marginTop: 0,
                lineHeight: 1.6,
                color: PAGE.textSub,
              }}
            >
              {survey.description}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", color: PAGE.textSub }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color={PAGE.primary} />
                <span style={{ fontSize: 13 }}>
                  {response.submitted_at
                    ? new Date(response.submitted_at).toLocaleDateString("vi-VN")
                    : "Không rõ"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={18} color="#d97706" />
                <span style={{ fontSize: 13 }}>+250 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div style={{ marginBottom: 48 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: PAGE.text,
              marginBottom: 16,
              marginTop: 0,
              letterSpacing: "0.02em",
            }}
          >
            Câu trả lời của bạn
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {response.answers?.map((answer, idx) => {
              const config = TYPE_CONFIG[answer.type];
              const Icon = config?.Icon;

              return (
                <GlassPanel key={idx} delay={0.1 + idx * 0.05}>
                  <div style={{ display: "flex", gap: 12, marginBottom: "1rem" }}>
                    {Icon && (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: config.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={24} color={config.color} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: "0 0 4px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: PAGE.text,
                        }}
                      >
                        {answer.question}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: PAGE.textDim }}>
                        {config?.label}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      background: config?.bg,
                      padding: "14px",
                      borderRadius: 12,
                      borderLeft: `4px solid ${config?.color}`,
                    }}
                  >
                    {Array.isArray(answer.answer) ? (
                      answer.answer.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {answer.answer.map((item, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-block",
                                padding: "8px 14px",
                                background: "#fff",
                                border: `1px solid ${config?.color}`,
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                color: config?.color,
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 13, color: PAGE.textDim, fontStyle: "italic" }}>
                          (Không chọn)
                        </p>
                      )
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 500,
                          color: PAGE.text,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {answer.answer || "(Trống)"}
                      </p>
                    )}
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </div>

        {/* Success Message */}
        <GlassPanel
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            textAlign: "center",
          }}
          delay={0.3}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 50,
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={32} color="#059669" />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 16, color: "#059669", fontWeight: 600 }}>
            Cảm ơn bạn đã hoàn thành khảo sát!
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b7280" }}>
            Câu trả lời của bạn đã được lưu vào hệ thống.
          </p>
        </GlassPanel>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotateGradient {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        * {
          box-sizing: border-box;
        }

        button {
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>
    </main>
  );
}

export default SurveyResponsePage;
