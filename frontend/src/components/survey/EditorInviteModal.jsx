// ─── EditorInviteModal.jsx ─── Modal popup when invited as editor ──
import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Edit3, X, Clock } from "lucide-react";

export default function EditorInviteModal({ survey, onClose }) {
  const navigate = useNavigate();
  if (!survey) return null;

  const isExpired = survey.end_at && new Date(survey.end_at) < new Date();

  const handleOpenStudio = () => {
    onClose();
    navigate(`/user/my-surveys/${survey.id}/studio`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "var(--admin-surface, #fff)",
          border: "1px solid var(--admin-border, #e8ecf2)",

          borderRadius: 24,
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex items-start justify-between"
          style={{ borderBottom: "1px solid var(--admin-border, #e8ecf2)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: isExpired
                  ? "linear-gradient(135deg, #FEE2E2, #FECACA)"
                  : "linear-gradient(135deg, #EDE9FF, #DDD6FE)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isExpired ? <Clock size={22} color="#DC2626" /> : <Edit3 size={22} color="#5B4EE8" />}
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "var(--admin-text, #0f172a)" }}>
                {isExpired ? "Khảo sát đã kết thúc" : "Bạn được mời chỉnh sửa"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--admin-text-sub, #64748b)", margin: "2px 0 0", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                {isExpired ? (
                  <span style={{ color: "#DC2626", fontWeight: 600 }}>Đã hết hạn</span>
                ) : (
                  <>Quyền: <span style={{ fontWeight: 700, color: "#5B4EE8" }}>Chỉnh sửa</span></>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: "var(--admin-bg-secondary, #f4f6f8)",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}
          >
            <X size={16} color="var(--admin-text-sub, #64748b)" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {isExpired ? (
            <>
              <div style={{
                padding: 14, borderRadius: 12,
                background: "#FEF2F2", border: "1px solid #FECACA",
                marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <Clock size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                    Khảo sát đã hết hạn
                  </div>
                  <p style={{ fontSize: 12, color: "#7F1D1D", margin: "4px 0 0", lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                    Khảo sát này đã kết thúc. Chỉ có chủ sở hữu hoặc quản trị viên mới có thể gia hạn.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: "100%", padding: "13px",
                  background: "var(--admin-bg-secondary, #f4f6f8)",
                  color: "var(--admin-text-sub, #64748b)", border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                }}
              >
                Đóng
              </button>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "var(--admin-text, #0f172a)" }}>
                {survey.title ? <span dangerouslySetInnerHTML={{__html:survey.title}}/> : "Khảo sát không tiêu đề"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--admin-text-sub, #64748b)", margin: "0 0 20px", lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                Bạn có quyền chỉnh sửa câu hỏi, cài đặt và quản lý người tham gia của khảo sát này.
              </p>

              <div
                style={{
                  display: "grid", gap: 10,
                  padding: "14px",
                  borderRadius: 12,
                  background: "var(--admin-bg-secondary, #f4f6f8)",
                  border: "1px solid var(--admin-border, #e8ecf2)",
                  marginBottom: 20,
                }}
              >
                {[
                  "Chỉnh sửa câu hỏi", "Cài đặt khảo sát",
                  "Quản lý người tham gia", "Gửi lời mời",
                ].map((text, i) => (
                  <div key={i} style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "var(--admin-text, #0f172a)", fontWeight: 500 }}>
                    • {text}
                  </div>
                ))}
              </div>

              <button
                onClick={handleOpenStudio}
                style={{
                  width: "100%", padding: "13px",
                  background: "linear-gradient(135deg, #5B4EE8, #4D3FD6)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                }}
              >
                <Edit3 size={16} /> Mở trang chỉnh sửa
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
