// ─── EditorInviteModal.jsx ─── Modal popup when invited as editor ──
import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Edit3, X } from "lucide-react";

export default function EditorInviteModal({ survey, onClose }) {
  const navigate = useNavigate();
  if (!survey) return null;

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
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
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
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
                flexShrink: 0,
              }}
            >
              <Edit3 size={22} color="#d97706" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "var(--admin-text, #0f172a)" }}>
                Bạn được mời chỉnh sửa
              </h2>
              <p style={{ fontSize: 12, color: "var(--admin-text-sub, #64748b)", margin: "2px 0 0", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
                Quyền: <span style={{ fontWeight: 700, color: "#7c3aed" }}>Chỉnh sửa</span>
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
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 8px", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "var(--admin-text, #0f172a)" }}>
            {survey.title || "Khảo sát không tiêu đề"}
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
              { icon: "✏️", text: "Chỉnh sửa câu hỏi" },
              { icon: "⚙️", text: "Cài đặt khảo sát" },
              { icon: "👥", text: "Quản lý người tham gia" },
              { icon: "📤", text: "Gửi lời mời" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "var(--admin-text, #0f172a)" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleOpenStudio}
            style={{
              width: "100%", padding: "13px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
              boxShadow: "0 4px 14px rgba(67,97,238,0.30)",
            }}
          >
            <Edit3 size={16} /> Mở trang chỉnh sửa
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
