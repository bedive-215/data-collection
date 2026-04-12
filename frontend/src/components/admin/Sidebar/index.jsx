import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

// SVG Icons matching the screenshot exactly
const Icons = {
  terminal: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
      <rect x="2" y="3" width="20" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 9l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <rect x="3" y="3" width="8" height="8" rx="1"/>
      <rect x="13" y="3" width="8" height="8" rx="1"/>
      <rect x="3" y="13" width="8" height="8" rx="1"/>
      <rect x="13" y="13" width="8" height="8" rx="1"/>
    </svg>
  ),
  group: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
      <circle cx="17" cy="8" r="2.5"/>
      <path d="M21 20c0-2.761-1.791-5-4-5.5"/>
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M8 7h8M8 11h8M8 15h5"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  add_circle: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    </svg>
  ),
};

const navItems = [
  { label: "Dashboard", icon: "dashboard", path: ROUTERS.ADMIN.DASHBOARD },
  { label: "Users",     icon: "group",     path: ROUTERS.ADMIN.USERS },
  { label: "Questions", icon: "quiz",       path: ROUTERS.ADMIN.SURVEYS  },
  { label: "Settings",  icon: "settings",   path: ROUTERS.ADMIN.SETTINGS },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#131314] flex flex-col py-8 px-4 gap-y-2 text-sm antialiased border-r border-white/5 z-50">

      {/* ── Branding ── */}
      <div className="px-4 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#adc6ff] to-[#4b8eff] flex items-center justify-center flex-shrink-0 text-[#00285c]">
          {Icons.terminal}
        </div>
        <div>
          <p className="font-['Plus_Jakarta_Sans'] font-bold text-[#e5e2e3] leading-tight">
            Admin Portal
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#8b90a0]">
            System Controller
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out
                ${isActive
                  ? "bg-blue-500/10 text-blue-400 border-r-2 border-blue-400"
                  : "text-gray-500 hover:bg-white/5 hover:text-white"
                }`}
            >
              {Icons[item.icon]}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── CTA Button ── */}
      <div className="mt-auto px-2">
        <button className="w-full py-4 bg-gradient-to-r from-[#adc6ff] to-[#4b8eff] rounded-2xl text-[#00285c] font-['Plus_Jakarta_Sans'] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-[#adc6ff]/10">
          {Icons.add_circle}
          New Entry
        </button>
      </div>
    </aside>
  );
}