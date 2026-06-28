import React, { useState, useRef, useEffect } from "react";
import { Search, LogOut, User, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationPanel } from "../../common/Notification";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const firstChar = user?.full_name?.charAt(0)?.toUpperCase()
    ?? user?.name?.charAt(0)?.toUpperCase()
    ?? "A";

  return (
    <header
      className="w-full sticky top-0 z-40 flex items-center justify-between px-6 py-3"
      style={{
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--admin-border)",
      }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg transition-colors lg:hidden"
          style={{ color: "var(--admin-text-sub)" }}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            className="font-bold"
            style={{ color: "var(--admin-text)", fontSize: 17, lineHeight: 1.2 }}
          >
            Bảng điều khiển
          </h1>
          <p className="text-[11px]" style={{ color: "var(--admin-text-dim)" }}>
            Quản lý hệ thống khảo sát
          </p>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2">
        {/* Notification bell — dùng NotificationPanel component */}
        <NotificationPanel />

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: "var(--admin-border)" }} />

        {/* Avatar + Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl transition-all duration-200"
            style={{
              background: menuOpen ? "var(--admin-surface-hover)" : "transparent",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 12,
                color: "#FFF",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.full_name || "User"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                firstChar
              )}
            </div>

            <div className="hidden xl:block">
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--admin-text)" }}>
                {user?.full_name ?? user?.name ?? "Admin"}
              </p>
              <p className="text-[10px]" style={{ color: "var(--admin-text-dim)" }}>
                {user?.role ?? "admin"}
              </p>
            </div>

            <ChevronDown
              size={13}
              style={{ color: "var(--admin-text-dim)" }}
              className="transition-transform duration-200"
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl z-[100] animate-slide-up"
              style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",

              }}
            >
              {/* User info */}
              <div
                className="px-4 py-3.5"
                style={{ borderBottom: "1px solid var(--admin-border)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
                  {user?.full_name ?? user?.name ?? "Admin"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--admin-text-sub)" }}>
                  {user?.email ?? ""}
                </p>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-2"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    color: "var(--admin-primary)",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}
                >
                  {user?.role ?? "admin"}
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => { setMenuOpen(false); navigate("/admin/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--admin-text-sub)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--admin-text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-sub)"; }}
                >
                  <User size={15} style={{ color: "var(--admin-text-dim)" }} />
                  Thông tin tài khoản
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate("/admin/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--admin-text-sub)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--admin-surface-hover)"; e.currentTarget.style.color = "var(--admin-text)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-text-sub)"; }}
                >
                  <Search size={15} style={{ color: "var(--admin-text-dim)" }} />
                  Cài đặt
                </button>

                <div className="mx-3 my-1.5" style={{ borderTop: "1px solid var(--admin-border)" }} />

                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: "var(--admin-error)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
