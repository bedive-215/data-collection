import React, { useState, useRef, useEffect } from "react";
import { Bell, Settings, Search, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationPanel } from "../../common/Notification";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-[#131314]/60 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-8 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

      {/* ── Left: Title + Search ── */}
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold tracking-tighter text-blue-400 font-['Plus_Jakarta_Sans']">
          Obsidian Admin
        </h1>

        <div className="relative group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0]"
          />
          <input
            type="text"
            placeholder="Quick search..."
            className="bg-[#353436]/50 border-none rounded-full pl-9 pr-4 py-2 text-sm text-[#e5e2e3] focus:ring-1 focus:ring-[#adc6ff] w-64 transition-all duration-300 outline-none"
          />
        </div>
      </div>

      {/* ── Right: Icon buttons + Avatar ── */}
      <div className="flex items-center gap-2">

        {/* Notifications */}
        <NotificationPanel />

        {/* Settings */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-blue-300 hover:bg-white/5 transition-all duration-200 active:scale-95">
          <Settings size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Avatar with Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 pl-1 py-1 rounded-xl hover:bg-white/5 transition-all duration-200"
          >
            <div className="h-9 w-9 rounded-full bg-[#353436] border border-[#414755] overflow-hidden p-0.5 flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || "User"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff] text-xs font-bold">
                  {user?.full_name?.charAt(0)?.toUpperCase() ?? user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                </div>
              )}
            </div>
            <div className="hidden xl:block">
                    <p className="text-sm font-semibold text-[#e5e2e3] leading-tight">
                      {user?.full_name ?? user?.name ?? "Admin"}
                    </p>
              <p className="text-[10px] text-[#8b90a0]">{user?.role ?? "admin"}</p>
            </div>
            <ChevronDown size={14} className={`text-[#8b90a0] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a1b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-semibold text-[#e5e2e3]">{user?.full_name ?? user?.name ?? "Admin"}</p>
                <p className="text-xs text-[#8b90a0] truncate">{user?.email ?? ""}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); navigate("/admin/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#e5e2e3] hover:bg-white/5 transition-colors"
                >
                  <User size={16} className="text-[#8b90a0]" />
                  Thông tin tài khoản
                </button>

                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
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