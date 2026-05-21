import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Pencil,
  ClipboardList,
  Compass,
  Shield,
  LogOut,
  X,
  Check,
  Loader2,
  Camera,
  Mail,
  Phone,
  Cake,
  Venus,
} from "lucide-react";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import { ROUTERS, APP_BRAND } from "@/utils/constants";
import { userService } from "@/services/userService";

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

const AvatarImage = React.memo(function AvatarImage({
  src,
  alt = "Avatar",
  className = "",
  fallback = "/default-avatar.png",
  onBroken = null,
}) {
  const imgRef = useRef(null);
  const lastSrcRef = useRef(null);

  useEffect(() => {
    const final = src && typeof src === "string" && src.trim() !== "" ? src.trim() : fallback;
    if (lastSrcRef.current === final) return;
    lastSrcRef.current = final;
    const img = imgRef.current;
    if (!img) return;
    const handleError = () => {
      if (onBroken) onBroken(img.src);
      img.onerror = null;
      img.src = fallback;
    };
    img.onerror = handleError;
    img.src = final;
    return () => {
      img.onerror = null;
    };
  }, [src, fallback, onBroken]);

  return <img ref={imgRef} alt={alt} className={className} />;
});

function inputStyle(focused) {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${focused ? "rgba(99,102,241,0.45)" : "rgba(15,23,42,0.08)"}`,
    background: "rgba(255,255,255,0.65)",
    color: C.text,
    fontSize: 14,
    fontFamily: C.font,
    outline: "none",
    transition: "border-color .15s, box-shadow .15s",
    boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
  };
}

export default function Profile() {
  const { user, loading: contextLoading, error, fetchMyInfo, updateMyInfo } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [previewAvatar, setPreviewAvatar] = useState("/default-avatar.png");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    avatar: null,
  });

  useEffect(() => {
    const load = async () => {
      await fetchMyInfo();
      setIsInitialLoad(false);
    };
    load();
  }, [fetchMyInfo]);

  useEffect(() => {
    if (user) {
      setPreviewAvatar(user.avatar || "/default-avatar.png");
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        gender: user.gender || "",
        avatar: null,
      });
    }
  }, [user]);

  const handleAvatarBroken = () => setPreviewAvatar("/default-avatar.png");

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChooseAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, avatar: file }));
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setSaveError(null);
    try {
      if (form.avatar instanceof File) {
        await userService.updateAvatar(form.avatar);
      }
      const payload = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender,
      };
      await updateMyInfo(payload);
      await fetchMyInfo();
      setForm((prev) => ({ ...prev, avatar: null }));
      setIsEditing(false);
    } catch (e) {
      setSaveError(e?.response?.data?.message || "Cập nhật thất bại, thử lại sau.");
      console.error(e);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        gender: user.gender || "",
        avatar: null,
      });
      setPreviewAvatar(user.avatar || "/default-avatar.png");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTERS.PUBLIC.LOGIN);
    } catch (e) {
      console.error(e);
    }
  };

  if (isInitialLoad && contextLoading) {
    return (
      <div
        style={{ minHeight: "100vh", background: "transparent", fontFamily: C.font, position: "relative" }}
      >
        <AnimatedSurveyBackdrop />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
          <div style={{ ...glassCard, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader2 size={36} color={C.primary} style={{ animation: "spin 0.9s linear infinite" }} />
            <p style={{ margin: 0, color: C.textSub, fontSize: 14, fontWeight: 600 }}>Đang tải hồ sơ…</p>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", fontFamily: C.font, position: "relative" }}>
        <AnimatedSurveyBackdrop />
        <div style={{ position: "relative", zIndex: 1, padding: "48px 18px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...glassCard, padding: 32 }}>
            <p style={{ color: "#dc2626", margin: 0, fontSize: 15, fontWeight: 600 }}>{error}</p>
            <button
              type="button"
              onClick={() => fetchMyInfo()}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: C.primaryGrad,
                color: "#fff",
                fontWeight: 700,
                fontFamily: C.font,
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = form.full_name?.trim() || user?.full_name || "Tài khoản";
  const displayEmail = user?.email || form.email || "";

  const menuCards = [
    {
      key: "edit",
      icon: Pencil,
      title: "Chỉnh sửa hồ sơ",
      desc: "Họ tên, số điện thoại, ngày sinh và ảnh đại diện.",
      iconBg: "rgba(99,102,241,0.12)",
      iconColor: C.primary,
      onClick: () => setIsEditing(true),
    },
    {
      key: "mine",
      icon: ClipboardList,
      title: "Khảo sát của tôi",
      desc: "Tạo và quản lý biểu mẫu khảo sát của bạn.",
      iconBg: "rgba(16,185,129,0.12)",
      iconColor: "#059669",
      to: ROUTERS.USER.MY_SURVEYS,
    },
    {
      key: "explore",
      icon: Compass,
      title: "Khảo sát công khai",
      desc: "Khám phá và tham gia các khảo sát đang mở.",
      iconBg: "rgba(14,165,233,0.12)",
      iconColor: "#0284c7",
      to: ROUTERS.USER.SURVEYS,
    },
    {
      key: "security",
      icon: Shield,
      title: "Bảo mật tài khoản",
      desc: "Đặt lại mật khẩu qua email nếu bạn quên mật khẩu.",
      iconBg: "rgba(244,63,94,0.1)",
      iconColor: "#e11d48",
      to: ROUTERS.PUBLIC.FORGOT_PASSWORD,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "transparent", fontFamily: C.font, position: "relative", overflowX: "hidden" }}>
      <AnimatedSurveyBackdrop />
      <div style={{ position: "relative", zIndex: 1, padding: "20px 18px 48px", maxWidth: 1260, margin: "0 auto" }}>
        {/* Hero */}
        <header
          style={{
            ...glassCard,
            padding: "32px 28px",
            marginBottom: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            borderTop: `4px solid ${C.primary}`,
          }}
        >
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div
              style={{
                width: 132,
                height: 132,
                borderRadius: "50%",
                padding: 4,
                background: "linear-gradient(135deg, #a5b4fc, #6366f1, #7c3aed)",
                boxShadow: "0 12px 40px rgba(79,70,229,0.25)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: C.surfaceHigh,
                  border: "3px solid rgba(255,255,255,0.95)",
                }}
              >
                <AvatarImage
                  src={previewAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                  fallback="/default-avatar.png"
                  onBroken={handleAvatarBroken}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Đổi ảnh đại diện"
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #fff",
                background: C.primaryGrad,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
              }}
            >
              <Camera size={18} strokeWidth={2.25} />
            </button>
          </div>

          <h1 style={{ margin: "0 0 8px", fontSize: "clamp(1.65rem, 4vw, 2.25rem)", fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>
            {displayName}
          </h1>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: C.textSub, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <Mail size={15} strokeWidth={2} style={{ opacity: 0.7 }} />
            {displayEmail || "—"}
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: C.textDim, textTransform: "uppercase" }}>
            {APP_BRAND.name} · Thành viên
          </p>
          {user?.gender && (
            <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Venus size={13} strokeWidth={2} />
              {user.gender === "MALE" ? "Nam" : user.gender === "FEMALE" ? "Nữ" : "Khác"}
            </p>
          )}
        </header>

        {/* Edit modal */}
        {isEditing && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(15,23,42,0.45)",
              backdropFilter: "blur(8px)",
            }}
            onClick={handleCancel}
            role="presentation"
          >
            <div
              style={{
                ...glassCard,
                maxWidth: 480,
                width: "100%",
                padding: "26px 24px 24px",
                borderTop: `4px solid ${C.primary}`,
                maxHeight: "min(90vh, 640px)",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-edit-title"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 12 }}>
                <h2 id="profile-edit-title" style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>
                  Chỉnh sửa thông tin
                </h2>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: `1px solid rgba(15,23,42,0.08)`,
                    background: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    color: C.textSub,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <label style={{ display: "block", marginBottom: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                  <User size={14} /> Họ và tên
                </span>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={onChangeInput}
                  onFocus={() => setFocusedField("full_name")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Nguyễn Văn A"
                  style={inputStyle(focusedField === "full_name")}
                />
              </label>

              <label style={{ display: "block", marginBottom: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                  <Mail size={14} /> Email
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  readOnly
                  disabled
                  style={{
                    ...inputStyle(false),
                    opacity: 0.72,
                    cursor: "not-allowed",
                    background: "rgba(148,163,184,0.15)",
                  }}
                />
                <span style={{ fontSize: 11, color: C.textDim, marginTop: 6, display: "block" }}>
                  Email dùng để đăng nhập — liên hệ quản trị nếu cần đổi.
                </span>
              </label>

              <label style={{ display: "block", marginBottom: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                  <Phone size={14} /> Số điện thoại
                </span>
                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={onChangeInput}
                  onFocus={() => setFocusedField("phone_number")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="0901234567"
                  style={inputStyle(focusedField === "phone_number")}
                />
              </label>

              <label style={{ display: "block", marginBottom: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                  <Cake size={14} /> Ngày sinh
                </span>
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={onChangeInput}
                  onFocus={() => setFocusedField("date_of_birth")}
                  onBlur={() => setFocusedField(null)}
                  style={inputStyle(focusedField === "date_of_birth")}
                />
              </label>

              <label style={{ display: "block", marginBottom: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 6 }}>
                  <Venus size={14} /> Giới tính
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "MALE", label: "Nam" },
                    { value: "FEMALE", label: "Nữ" },
                    { value: "OTHER", label: "Khác" },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "10px 8px",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1px solid ${form.gender === opt.value ? "rgba(99,102,241,0.5)" : "rgba(15,23,42,0.08)"}`,
                        background: form.gender === opt.value ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.5)",
                        color: form.gender === opt.value ? "#6366f1" : C.textSub,
                        fontWeight: form.gender === opt.value ? 700 : 500,
                        fontSize: 13,
                        transition: "all 0.15s",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={opt.value}
                        checked={form.gender === opt.value}
                        onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                        style={{ display: "none" }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </label>

              <label
                htmlFor="profile-avatar-input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px dashed rgba(99,102,241,0.35)`,
                  background: "rgba(99,102,241,0.06)",
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                <Camera size={20} color={C.primary} strokeWidth={2} />
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Ảnh đại diện</div>
                  <div style={{ fontSize: 12, color: C.textSub }}>PNG, JPG — chạm để chọn (tuỳ chọn)</div>
                </div>
                <input id="profile-avatar-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleChooseAvatar} />
              </label>

              {saveError && (
                <p
                  style={{
                    margin: "0 0 16px",
                    fontSize: 13,
                    color: "#b91c1c",
                    background: "rgba(254,226,226,0.85)",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  {saveError}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: `1px solid rgba(15,23,42,0.1)`,
                    background: "rgba(255,255,255,0.75)",
                    fontWeight: 700,
                    fontSize: 14,
                    color: C.textSub,
                    fontFamily: C.font,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={contextLoading}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: contextLoading ? "rgba(148,163,184,0.4)" : C.primaryGrad,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#fff",
                    fontFamily: C.font,
                    cursor: contextLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: contextLoading ? "none" : "0 4px 16px rgba(79,70,229,0.35)",
                  }}
                >
                  {contextLoading ? (
                    <Loader2 size={18} style={{ animation: "spin 0.9s linear infinite" }} />
                  ) : (
                    <>
                      <Check size={18} strokeWidth={2.5} /> Lưu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {menuCards.map((card) => {
            const Icon = card.icon;
            const inner = (
              <>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: card.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                    color: card.iconColor,
                  }}
                >
                  <Icon size={24} strokeWidth={2} />
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: C.text }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.55, maxWidth: 280 }}>{card.desc}</p>
              </>
            );

            const cardStyle = {
              ...glassCard,
              padding: "24px 22px",
              textAlign: "left",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              border: `1px solid ${C.glassBorder}`,
              transition: "transform .2s, box-shadow .2s, border-color .2s",
            };

            if (card.onClick) {
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={card.onClick}
                  style={{ ...cardStyle, width: "100%", font: "inherit", display: "block" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 0 rgba(255,255,255,0.95) inset, 0 18px 44px rgba(79,70,229,0.12)";
                    e.currentTarget.style.borderColor = "rgba(129,140,248,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = glassCard.boxShadow;
                    e.currentTarget.style.borderColor = C.glassBorder;
                  }}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={card.key}
                to={card.to}
                style={{ ...cardStyle, display: "block" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 0 rgba(255,255,255,0.95) inset, 0 18px 44px rgba(79,70,229,0.12)";
                  e.currentTarget.style.borderColor = "rgba(129,140,248,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = glassCard.boxShadow;
                  e.currentTarget.style.borderColor = C.glassBorder;
                }}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: 36, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              borderRadius: 999,
              border: `1px solid rgba(244,63,94,0.25)`,
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(12px)",
              color: "#e11d48",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: C.font,
              cursor: "pointer",
              boxShadow: "0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 24px rgba(15,23,42,0.06)",
            }}
          >
            <LogOut size={18} strokeWidth={2.25} />
            Đăng xuất
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
