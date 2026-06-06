import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Venus, Loader2, Check } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { ROUTERS } from "@/utils/constants";

const C = {
  surface: "rgba(255,255,255,0.78)",
  surfaceHigh: "rgba(255,255,255,0.92)",
  glassBorder: "rgba(255,255,255,0.55)",
  primary: "#4f46e5",
  primaryGrad: "linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #4338ca 100%)",
  text: "#0f172a",
  textSub: "#64748b",
  textDim: "#94a3b8",
  font: "'DM Sans','Inter',system-ui,sans-serif",
};

const glassCard = {
  background: C.surface,
  backdropFilter: "blur(22px) saturate(180%)",
  WebkitBackdropFilter: "blur(22px) saturate(180%)",
  border: `1px solid ${C.glassBorder}`,
  borderRadius: 22,
  boxShadow: "0 2px 0 rgba(255,255,255,0.88) inset, 0 12px 32px rgba(15,23,42,0.07)",
};

const GENDER_OPTIONS = [
  {
    value: "MALE",
    label: "Nam",
    desc: "Tôi xác định là nam giới",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
  },
  {
    value: "FEMALE",
    label: "Nữ",
    desc: "Tôi xác định là nữ giới",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.1)",
    border: "rgba(236,72,153,0.25)",
  },
  {
    value: "OTHER",
    label: "Khác",
    desc: "Tôi xác định theo cách khác",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
  },
];

export default function GenderSetup() {
  const { updateMyInfo, user } = useUser();
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Nếu đã có gender rồi thì redirect luôn, không cần cập nhật gì
  useEffect(() => {
    if (user?.gender) {
      navigate(ROUTERS.USER.HOME, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async () => {
    if (!selected) {
      setError("Vui lòng chọn giới tính của bạn.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updateMyInfo({ gender: selected });
      // Đảm bảo user state đã cập nhật trước khi điều hướng
      await new Promise((r) => setTimeout(r, 150));
      navigate(ROUTERS.USER.HOME);
    } catch (e) {
      setError(e?.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 40%, #fce7f3 100%)",
        fontFamily: C.font,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Header icon */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #e0e7ff, #ddd6fe)",
              border: "3px solid rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 12px 40px rgba(99,102,241,0.2)",
            }}
          >
            <Venus size={32} color="#6366f1" strokeWidth={1.5} />
          </div>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 900,
              color: C.text,
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
            }}
          >
            Hoàn thiện hồ sơ
          </h1>
          <p style={{ color: C.textSub, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            Vui lòng chọn giới tính để hoàn tất đăng ký và sử dụng đầy đủ tính năng khảo sát.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            ...glassCard,
            padding: "32px 28px",
            borderTop: "4px solid #6366f1",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.textSub,
              margin: "0 0 18px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Giới tính của bạn là gì?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = selected === opt.value;
              return (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 18px",
                    borderRadius: 16,
                    cursor: "pointer",
                    border: `2px solid ${isSelected ? opt.border : "rgba(15,23,42,0.08)"}`,
                    background: isSelected ? opt.bg : "rgba(255,255,255,0.6)",
                    transition: "all 0.2s",
                    boxShadow: isSelected ? `0 4px 20px ${opt.border}30` : "none",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setSelected(opt.value)}
                    style={{ display: "none" }}
                  />
                  {/* Indicator */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? opt.color : "rgba(15,23,42,0.2)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: opt.color,
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: isSelected ? opt.color : C.text,
                        margin: 0,
                        marginBottom: 3,
                        transition: "color 0.2s",
                      }}
                    >
                      {opt.label}
                    </p>
                    <p style={{ fontSize: 12, color: C.textSub, margin: 0 }}>{opt.desc}</p>
                  </div>

                  {/* Check mark */}
                  {isSelected && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: opt.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </label>
              );
            })}
          </div>

          {error && (
            <p
              style={{
                fontSize: 13,
                color: "#dc2626",
                background: "rgba(254,226,226,0.85)",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px 20px",
              borderRadius: 14,
              border: "none",
              background: loading
                ? "rgba(148,163,184,0.4)"
                : selected
                ? C.primaryGrad
                : "rgba(148,163,184,0.3)",
              fontWeight: 700,
              fontSize: 15,
              color: selected ? "#fff" : C.textSub,
              fontFamily: C.font,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: selected && !loading ? "0 4px 16px rgba(79,70,229,0.35)" : "none",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 0.9s linear infinite" }} />
                Đang lưu...
              </>
            ) : (
              "Tiếp tục"
            )}
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.textDim,
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Thông tin này được sử dụng để phân tích dữ liệu khảo sát
          <br />và cải thiện trải nghiệm cá nhân hóa cho bạn.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
