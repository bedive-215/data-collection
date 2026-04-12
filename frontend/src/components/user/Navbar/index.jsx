import { useState, useEffect, useRef } from "react";
import { useUser } from "../../../providers/UserProvider";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

// ── icons ──────────────────────────────────────────────────────────
const IconBell = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const IconUser = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
);

const IconProfile = () => (
  <svg className="w-[15px] h-[15px] text-[#adaaab]" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
  </svg>
);

const IconGrid = () => (
  <svg className="w-[15px] h-[15px] text-[#adaaab]" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
  </svg>
);

const IconSettings = () => (
  <svg className="w-[15px] h-[15px] text-[#adaaab]" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
  </svg>
);

const IconLogout = ({ className = "w-[15px] h-[15px]" }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
  </svg>
);

// ── Avatar helper ────────────────────────────────────────────────────
function UserAvatar({ avatar, size = 30 }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt="avatar"
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0 shadow-[0_0_10px_rgba(132,173,255,0.18)]"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-[#84adff] to-[#0070ea] grid place-items-center flex-shrink-0 shadow-[0_0_10px_rgba(132,173,255,0.18)] text-white"
    >
      <IconUser size={size * 0.6} />
    </div>
  );
}

// ── NavLink ─────────────────────────────────────────────────────────
function NavLink({ href, children }) {
  const { pathname } = useLocation();
  const active = pathname === href;

  return (
    <Link
      to={href}
      className={[
        "font-['Plus_Jakarta_Sans'] text-[.8rem] font-semibold tracking-[-0.01em] px-[.9rem] whitespace-nowrap transition-colors duration-200 no-underline",
        active
          ? "text-[#84adff] border-b-2 border-[#84adff] py-[.45rem] rounded-none"
          : "text-[#adaaab] py-[.45rem] rounded-full hover:text-white hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

// ── XpDot ───────────────────────────────────────────────────────────
function XpDot() {
  return (
    <span className="w-[6px] h-[6px] rounded-full bg-[#84adff] inline-block animate-pulse" />
  );
}

// ── UserDropdown ────────────────────────────────────────────────────
function UserDropdown({ user, onLogout, onClose }) {
  const navigate = useNavigate();
  const displayName = user?.full_name || user?.email || "Người dùng";
  const email       = user?.email || "";

  const handleGoToProfile = () => {
    navigate(ROUTERS.USER.PROFILE);
    onClose();
  };

  return (
    <div className="absolute top-[calc(100%+10px)] right-0 min-w-[210px] bg-[#1a191b] border border-[rgba(132,173,255,0.12)] rounded-2xl p-2 shadow-[0_16px_48px_rgba(0,0,0,.55),0_0_30px_rgba(0,91,193,.1)] z-50">
      {/* User info */}
      <div className="px-[.8rem] pt-[.65rem] pb-[.85rem] border-b border-white/5 mb-[.4rem]">
        <strong className="font-['Plus_Jakarta_Sans'] text-[.9rem] font-bold block truncate">{displayName}</strong>
        <span className="text-[.72rem] text-[#adaaab] truncate block">{email}</span>
        {(user?.xp != null || user?.level != null) && (
          <div className="inline-flex items-center gap-[.35rem] bg-[rgba(132,173,255,.1)] border border-[rgba(132,173,255,.2)] text-[#84adff] text-[.68rem] font-bold px-[.6rem] py-[.2rem] rounded-full mt-[.3rem]">
            <XpDot />
            {user.xp != null ? `${user.xp.toLocaleString()} XP` : ""}
            {user.xp != null && user.level != null ? " · " : ""}
            {user.level != null ? `Level ${user.level}` : ""}
          </div>
        )}
      </div>

      <button
        onClick={handleGoToProfile}
        className="flex items-center gap-[.6rem] px-[.8rem] py-[.55rem] rounded-[10px] text-[.8rem] font-medium text-white w-full border-none bg-transparent cursor-pointer hover:bg-white/[0.06] transition-colors text-left"
      >
        <IconProfile />
        Hồ sơ cá nhân
      </button>

      <Link
        to={ROUTERS.USER.SURVEYS}
        onClick={onClose}
        className="flex items-center gap-[.6rem] px-[.8rem] py-[.55rem] rounded-[10px] text-[.8rem] font-medium text-white no-underline hover:bg-white/[0.06] transition-colors"
      >
        <IconGrid />
        My Surveys
      </Link>

      <Link
        to="#"
        onClick={onClose}
        className="flex items-center gap-[.6rem] px-[.8rem] py-[.55rem] rounded-[10px] text-[.8rem] font-medium text-white no-underline hover:bg-white/[0.06] transition-colors"
      >
        <IconSettings />
        Cài đặt
      </Link>

      <div className="h-px bg-white/5 my-[.4rem]" />

      <button
        onClick={onLogout}
        className="flex items-center gap-[.6rem] px-[.8rem] py-[.55rem] rounded-[10px] text-[.8rem] font-medium text-[#ff716c] w-full border-none bg-transparent cursor-pointer hover:bg-white/[0.06] transition-colors"
      >
        <IconLogout className="w-[15px] h-[15px] text-[#ff716c]" />
        Đăng xuất
      </button>
    </div>
  );
}

// ── MobileDrawer ────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, user, onLogout }) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const displayName = user?.full_name || user?.email || "Người dùng";

  const handleGoToProfile = () => {
    navigate(ROUTERS.USER.PROFILE);
    onClose();
  };

  const mobileLinks = [
    {
      label: "Home",
      to: ROUTERS.USER.HOME,
      icon: <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2H4V4zm0 6h6v7H4v-6zm8 0h5v7h-5v-7z"/></svg>,
    },
    {
      label: "Surveys",
      to: ROUTERS.USER.SURVEYS,
      icon: <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>,
    },
    {
      label: "My Responses",
      to: "#",
      icon: <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>,
    },
    {
      label: "Analytics",
      to: "#",
      icon: <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>,
    },
    {
      label: "Settings",
      to: "#",
      icon: <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>,
    },
  ];

  return (
    <div
      className={`fixed inset-0 bg-[rgba(11,11,12,.97)] backdrop-blur-2xl z-40 flex flex-col gap-[.3rem] overflow-y-auto transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      style={{ padding: "calc(72px + 3rem) 2rem 2rem" }}
    >
      <button
        onClick={handleGoToProfile}
        className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#1a191b] border border-white/5 mb-2 w-full text-left hover:border-[rgba(132,173,255,.2)] transition-colors cursor-pointer"
      >
        <UserAvatar avatar={user?.avatar} size={44} />
        <div className="overflow-hidden">
          <strong className="font-['Plus_Jakarta_Sans'] text-base font-extrabold block truncate">{displayName}</strong>
          {(user?.xp != null || user?.level != null) && (
            <span className="text-[.75rem] text-[#adaaab]">
              {user.level != null ? `Level ${user.level}` : ""}
              {user.level != null && user.xp != null ? " · " : ""}
              {user.xp != null ? `${user.xp.toLocaleString()} XP` : ""}
            </span>
          )}
          <span className="text-[.72rem] text-[#84adff] mt-0.5 block">Xem hồ sơ →</span>
        </div>
      </button>

      {mobileLinks.map(({ label, to, icon }) => {
        const isActive = pathname === to;
        return (
          <Link
            key={label}
            to={to}
            onClick={onClose}
            className={`no-underline flex items-center gap-3 font-['Plus_Jakarta_Sans'] text-[1.1rem] font-bold px-5 py-[.9rem] rounded-2xl transition-colors
              ${isActive ? "text-[#84adff] bg-[rgba(132,173,255,.1)]" : "text-[#adaaab] hover:text-white hover:bg-white/5"}`}
          >
            {icon}
            {label}
          </Link>
        );
      })}

      <div className="h-px bg-white/[0.06] my-3" />

      <button
        onClick={onLogout}
        className="no-underline flex items-center gap-3 font-['Plus_Jakarta_Sans'] text-[1.1rem] font-bold text-[#ff716c] px-5 py-[.9rem] rounded-2xl hover:bg-white/5 transition-colors w-full border-none bg-transparent cursor-pointer"
      >
        <IconLogout className="w-5 h-5" />
        Đăng xuất
      </button>
    </div>
  );
}

// ── Hamburger ───────────────────────────────────────────────────────
function Hamburger({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex md:hidden flex-col gap-[4.5px] cursor-pointer p-1.5 border-none bg-transparent"
      aria-label="Menu"
    >
      <span className={`block w-5 h-0.5 rounded bg-[#adaaab] transition-all duration-250 ${open ? "translate-y-[6.5px] rotate-45 !bg-[#84adff]" : ""}`} />
      <span className={`block w-5 h-0.5 rounded bg-[#adaaab] transition-all duration-250 ${open ? "opacity-0" : ""}`} />
      <span className={`block w-5 h-0.5 rounded bg-[#adaaab] transition-all duration-250 ${open ? "-translate-y-[6.5px] -rotate-45 !bg-[#84adff]" : ""}`} />
    </button>
  );
}

// ── Navbar (main export) ─────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const [scrolled, setScrolled]         = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user?.full_name || user?.email || "Người dùng";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
  }, [drawerOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setDrawerOpen(false);
      setDropdownOpen(false);
      navigate(ROUTERS.PUBLIC.LOGIN);
    } catch (e) {
      console.error(e);
    }
  };

  const closeDropdown = () => setDropdownOpen(false);

  return (
    <>
      <div className={`sticky top-0 z-50 transition-[padding] duration-300 ${scrolled ? "pt-2 px-8" : "pt-4 px-8"}`}>
        <nav
          className={`h-[72px] flex items-center justify-between px-7 rounded-[20px] max-w-[1280px] mx-auto
            bg-[rgba(26,25,27,0.65)] backdrop-blur-2xl
            border border-[rgba(132,173,255,0.08)]
            transition-[box-shadow,border-color] duration-300
            ${scrolled
              ? "shadow-[0_24px_48px_rgba(0,91,193,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] !border-[rgba(132,173,255,0.14)]"
              : "shadow-[0_20px_40px_rgba(0,91,193,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]"
            }`}
        >
          {/* LEFT */}
          <div className="flex items-center gap-8">
            <Link
              to={ROUTERS.USER.HOME}
              className="font-['Plus_Jakarta_Sans'] text-[1.25rem] font-extrabold tracking-[-0.04em] no-underline whitespace-nowrap flex-shrink-0"
              style={{ background: "linear-gradient(90deg,#84adff,#0070ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              InsightPulse
            </Link>

            <div className="hidden md:flex items-center gap-[.15rem]">
              <NavLink href={ROUTERS.USER.HOME}>Home</NavLink>
              <NavLink href={ROUTERS.USER.SURVEYS}>Surveys</NavLink>
              <NavLink href="#">My Responses</NavLink>
              <NavLink href="#">Analytics</NavLink>
              <NavLink href="#">Settings</NavLink>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="relative w-[38px] h-[38px] grid place-items-center border-none rounded-[10px] bg-transparent text-[#adaaab] cursor-pointer transition-colors hover:text-[#84adff] hover:bg-[rgba(132,173,255,.1)] active:scale-95 hidden md:grid">
              <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#84adff] border-[1.5px] border-[#0e0e0f] shadow-[0_0_6px_rgba(132,173,255,0.18)]" />
              <IconBell />
            </button>

            {/* User pill */}
            <div
              ref={dropdownRef}
              className="flex items-center gap-[.55rem] pl-[.85rem] pr-[.35rem] py-[.35rem] rounded-full bg-[#262627] border border-white/5 cursor-pointer relative transition-colors hover:bg-[#201f21] hover:border-[rgba(132,173,255,.18)] active:scale-[.97]"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <span className="font-['Plus_Jakarta_Sans'] text-[.8rem] font-semibold text-white whitespace-nowrap max-w-[120px] truncate">
                {displayName}
              </span>
              <UserAvatar avatar={user?.avatar} size={30} />
              {dropdownOpen && (
                <UserDropdown
                  user={user}
                  onLogout={handleLogout}
                  onClose={closeDropdown}
                />
              )}
            </div>

            <Hamburger open={drawerOpen} onClick={() => setDrawerOpen((v) => !v)} />
          </div>
        </nav>
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}