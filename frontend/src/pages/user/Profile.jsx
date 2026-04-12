// src/pages/user/Profile.jsx
// Premium Dark Profile based on Stitch Design
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineMapPin, HiOutlineShoppingBag, HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle, HiOutlinePencil, HiOutlineXMark, HiOutlineCheck } from "react-icons/hi2";

/* Avatar component tối ưu */
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

export default function Profile() {
  const {
    user,
    loading: contextLoading,
    error,
    fetchMyInfo,
    updateMyInfo,
  } = useUser();

  const { logout } = useAuth();
  const navigate = useNavigate();

  const [previewAvatar, setPreviewAvatar] = useState("/default-avatar.png");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    avatar: null,
  });

  // Load info
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
        full_name: user.full_name || user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || user.phone || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
    }
  }, [user]);

  const handleAvatarBroken = () => {
    setPreviewAvatar("/default-avatar.png");
  };

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
    try {
      await updateMyInfo(form);
      await fetchMyInfo();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setForm({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
      setPreviewAvatar(user.avatar || "/default-avatar.png");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  if (isInitialLoad && contextLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !user) {
    return <p className="text-red-500 text-center mt-10 bg-black min-h-screen pt-32">{error}</p>;
  }

  // Menu cards data
  const menuCards = [
    {
      href: "#personal-info",
      icon: HiOutlineUser,
      iconColor: "text-[#2997ff]",
      bgColor: "bg-[#2997ff]/10",
      title: "Thông tin cá nhân",
      desc: "Cập nhật họ tên, số điện thoại và địa chỉ email chính thức của bạn.",
      onClick: () => setIsEditing(true),
    },
    {
      href: "/user/addresses",
      icon: HiOutlineMapPin,
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
      title: "Sổ địa chỉ",
      desc: "Quản lý các địa chỉ giao hàng và nhận hóa đơn thanh toán.",
    },
    {
      href: "/user/orders",
      icon: HiOutlineShoppingBag,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      title: "Lịch sử mua hàng",
      desc: "Theo dõi đơn hàng, xem lại các hóa đơn và trạng thái vận chuyển.",
    },
    {
      href: "#security",
      icon: HiOutlineShieldCheck,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
      title: "Bảo mật",
      desc: "Đổi mật khẩu, thiết lập xác thực 2 lớp và quản lý các thiết bị đã đăng nhập.",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-12">
      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-gray-900/50 to-transparent rounded-full blur-3xl" />
      </div>

      <main className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Profile Header - Centered */}
        <header className="flex flex-col items-center mb-20 text-center">
          {/* Avatar with edit button */}
          <div className="relative mb-8">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full p-1.5 bg-white/5 backdrop-blur-2xl border border-white/10 ring-1 ring-white/20 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center overflow-hidden">
                <AvatarImage
                  src={previewAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  fallback="/default-avatar.png"
                  onBroken={handleAvatarBroken}
                />
              </div>
            </div>
            {isEditing && (
              <label className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#2997ff] text-white flex items-center justify-center border-4 border-black hover:scale-105 transition-transform cursor-pointer">
                <HiOutlinePencil className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleChooseAvatar} />
              </label>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            {form.full_name || user?.full_name || "User"}
          </h1>
          <p className="text-gray-400 font-medium">
            Thành viên Platinum • Tham gia từ 2023
          </p>
        </header>

        {/* Edit Form Modal Overlay */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-lg w-full animate-fadeIn">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Chỉnh sửa thông tin</h2>
                <button onClick={handleCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Họ và tên</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={onChangeInput}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2997ff] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={onChangeInput}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2997ff] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Số điện thoại</label>
                  <input
                    name="phone_number"
                    value={form.phone_number}
                    onChange={onChangeInput}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2997ff] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={onChangeInput}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2997ff] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={contextLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {contextLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiOutlineCheck className="w-5 h-5" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuCards.map((card, idx) => {
            const Icon = card.icon;
            const CardWrapper = card.onClick ? 'button' : Link;
            const wrapperProps = card.onClick
              ? { onClick: card.onClick, type: "button" }
              : { to: card.href };

            return (
              <CardWrapper
                key={idx}
                {...wrapperProps}
                className="group bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl transition-all duration-500 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1 relative overflow-hidden text-left w-full"
              >
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center mb-8 ${card.iconColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
                  <p className="text-gray-400 leading-relaxed max-w-sm">{card.desc}</p>
                </div>
                <div className="absolute right-8 bottom-8 text-white/20 group-hover:text-white/60 transition-colors">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </CardWrapper>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 transition-all text-gray-300 hover:text-white group"
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-semibold">Đăng xuất tài khoản</span>
          </button>
        </div>
      </main>
    </div>
  );
}
