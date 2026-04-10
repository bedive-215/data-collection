import React from "react";
import { Bell, Settings, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user } = useAuth();

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
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-blue-300 hover:bg-white/5 transition-all duration-200 active:scale-95">
          <Bell size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Notifications</span>
        </button>

        {/* Settings */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-blue-300 hover:bg-white/5 transition-all duration-200 active:scale-95">
          <Settings size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Avatar */}
        <div className="flex items-center gap-3 pl-1">
          <div className="h-9 w-9 rounded-full bg-[#353436] border border-[#414755] overflow-hidden p-0.5 flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || "User"}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff] text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
            )}
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-semibold text-[#e5e2e3] leading-tight">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-[10px] text-[#8b90a0]">{user?.email ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}