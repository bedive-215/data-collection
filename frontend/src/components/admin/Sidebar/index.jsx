import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Bell,
  Settings,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import { ROUTERS } from "@/utils/constants";

/* ────────────────────────────────────────────────────────────
   NAV ITEMS
──────────────────────────────────────────────────────────── */
const navItems = [
  { id: "dashboard",    label: "Tổng quan",     icon: LayoutDashboard, path: ROUTERS.ADMIN.DASHBOARD },
  { id: "users",        label: "Người dùng",      icon: Users,           path: ROUTERS.ADMIN.USERS },
  { id: "surveys",      label: "Khảo sát",      icon: HelpCircle,      path: ROUTERS.ADMIN.SURVEYS },
  { id: "notifications", label: "Thông báo",  icon: Bell,            path: "/admin/notifications" },
  { id: "settings",     label: "Cài đặt",       icon: Settings,        path: ROUTERS.ADMIN.SETTINGS },
];

/* ────────────────────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="h-screen w-64 fixed left-0 top-0 flex flex-col z-50"
      style={{ background: "var(--admin-bg-secondary)", borderRight: "1px solid var(--admin-border)" }}
    >
      {/* ───────── BRANDING ───────── */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          {/* Logo mark */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",

            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <p
              className="font-bold leading-tight"
              style={{ color: "var(--admin-text)", fontSize: 16 }}
            >
              Trang quản trị
            </p>
            <p
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--admin-text-dim)", marginTop: 2 }}
            >
              Trung tâm điều khiển
            </p>
          </div>
        </div>
      </div>

      {/* ───────── SECTION LABEL ───────── */}
      <div className="px-5 mb-2">
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--admin-text-dim)", letterSpacing: "0.1em" }}
        >
          Menu chính
        </p>
      </div>

      {/* ───────── NAVIGATION ───────── */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.path}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative"
              style={{
                background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                color: isActive ? "var(--admin-primary)" : "var(--admin-text-sub)",
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                  style={{ background: "var(--admin-primary)" }}
                />
              )}

              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                className="flex-shrink-0 transition-all"
              />

              <span className="font-semibold text-sm flex-1">{item.label}</span>

              {isActive && (
                <ChevronRight
                  size={14}
                  className="opacity-60"
                  style={{ color: "var(--admin-primary)" }}
                />
              )}

              {/* Hover background */}
              {!isActive && (
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "var(--admin-surface-hover)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ───────── BOTTOM SECTION ───────── */}
      <div className="px-3 pb-6 pt-4" style={{ borderTop: "1px solid var(--admin-border)" }}>
        {/* Stats summary */}
        <div
          className="px-4 py-3 rounded-xl mb-3"
          style={{ background: "var(--admin-surface)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "var(--admin-text-sub)" }}>
              System Status
            </span>
            <span
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: "var(--admin-success)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--admin-success)" }}
              />
              Online
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center py-1.5 rounded-lg" style={{ background: "var(--admin-bg-secondary)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--admin-primary)" }}>99.9%</p>
              <p className="text-[9px]" style={{ color: "var(--admin-text-dim)" }}>Uptime</p>
            </div>
            <div className="text-center py-1.5 rounded-lg" style={{ background: "var(--admin-bg-secondary)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>12ms</p>
              <p className="text-[9px]" style={{ color: "var(--admin-text-dim)" }}>Latency</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #3B82F6, #2563EB)",
            color: "#FFF",

          }}
        >
          <PlusCircle size={16} strokeWidth={2.5} />
          <span>Quick Create</span>
        </button>
      </div>
    </aside>
  );
}
