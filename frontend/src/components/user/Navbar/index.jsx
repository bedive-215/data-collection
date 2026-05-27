import { useState, useEffect, useRef } from "react";
import { useUser } from "../../../providers/UserProvider";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Compass,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  UserRound,
  X,
  Trophy,
  Star,
  Award,
  BarChart3,
} from "lucide-react";
import { ROUTERS, APP_BRAND } from "@/utils/constants";
import { NotificationPanel } from "../../common/Notification";
import { useGamification } from "@/contexts/GamificationContext";

const font = "'DM Sans', 'Inter', system-ui, sans-serif";

function UserAvatar({ avatar, size = 32 }) {
  if (avatar) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          ring: "2px solid white",
          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.15)",
        }}
      >
        <img
          src={avatar}
          alt=""
          width={size}
          height={size}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.4,
        fontWeight: "bold",
        color: "white",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
      }}
    >
      <UserRound size={Math.round(size * 0.52)} strokeWidth={2} />
    </div>
  );
}

function NavLink({ to, matchPrefix, children }) {
  const { pathname } = useLocation();
  const active = matchPrefix
    ? pathname === to || pathname.startsWith(`${to}/`)
    : pathname === to;

  return (
    <Link
      to={to}
      style={{ fontFamily: font }}
      className={[
        "text-[0.8125rem] font-semibold tracking-tight px-3.5 py-2 rounded-full no-underline transition-all duration-200 whitespace-nowrap",
        active
          ? "text-indigo-700 bg-indigo-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-indigo-200/90"
          : "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function XpDot() {
  return (
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
  );
}

function UserDropdown({ user, displayName, onLogout, onClose }) {
  const navigate = useNavigate();
  const label = displayName || user?.full_name || user?.email || "Account";
  const email = user?.email || "";

  const row =
    "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-[0.8125rem] font-medium text-slate-700 no-underline border-0 bg-transparent cursor-pointer hover:bg-slate-100/90 transition-colors";

  return (
    <div
      style={{ fontFamily: font }}
      className="absolute top-[calc(100%+10px)] right-0 min-w-[220px] z-50 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl py-1.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3.5 pt-2 pb-3 border-b border-slate-100 mb-1">
        <strong className="text-[0.9rem] font-bold text-slate-900 block truncate">{label}</strong>
        {email && <span className="text-[0.72rem] text-slate-500 truncate block mt-0.5">{email}</span>}
        {(user?.xp != null || user?.level != null) && (
          <div className="inline-flex items-center gap-1.5 mt-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[0.68rem] font-bold px-2.5 py-1 rounded-full">
            <XpDot />
            {user.xp != null ? `${user.xp.toLocaleString()} XP` : ""}
            {user.xp != null && user.level != null ? " · " : ""}
            {user.level != null ? `Cấp ${user.level}` : ""}
          </div>
        )}
      </div>

      <div className="px-1.5 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => {
            navigate(ROUTERS.USER.PROFILE);
            onClose();
          }}
          className={row}
        >
          <UserRound size={17} className="text-slate-400 shrink-0" strokeWidth={2} />
          Hồ sơ cá nhân
        </button>
        <Link to={ROUTERS.USER.SURVEYS} onClick={onClose} className={row}>
          <Compass size={17} className="text-slate-400 shrink-0" strokeWidth={2} />
          Khảo sát công khai
        </Link>
        <Link to={ROUTERS.USER.MY_SURVEYS} onClick={onClose} className={row}>
          <ClipboardList size={17} className="text-slate-400 shrink-0" strokeWidth={2} />
          Khảo sát của tôi
        </Link>
        <Link to="/user/wallet" onClick={onClose} className={row}>
          <Star size={17} className="text-amber-500 shrink-0" strokeWidth={2} />
          💰 Ví Sao
        </Link>
        <Link to="/user/leaderboard" onClick={onClose} className={row}>
          <Trophy size={17} className="text-indigo-500 shrink-0" strokeWidth={2} />
          🏆 Xếp hạng
        </Link>
        <Link to="/user/achievements" onClick={onClose} className={row}>
          <Award size={17} className="text-purple-500 shrink-0" strokeWidth={2} />
          🏅 Huy hiệu
        </Link>
        <Link to={ROUTERS.USER.ANALYSIS_HUB} onClick={onClose} className={row}>
          <BarChart3 size={17} className="text-indigo-500 shrink-0" strokeWidth={2} />
          📊 Phân tích
        </Link>
      </div>

      <div className="h-px bg-slate-100 my-1.5 mx-2" />

      <div className="px-1.5 pb-0.5">
        <button type="button" onClick={onLogout} className={`${row} text-rose-600 hover:bg-rose-50`}>
          <LogOut size={17} className="text-rose-500 shrink-0" strokeWidth={2} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

function MobileDrawer({ open, onClose, user, displayName, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const label = displayName || user?.full_name || user?.email || "Account";

  const links = [
    { label: "Trang chủ", to: ROUTERS.USER.HOME, icon: Home },
    { label: "Khám phá", to: ROUTERS.USER.SURVEYS, icon: Compass },
    { label: "Của tôi", to: ROUTERS.USER.MY_SURVEYS, icon: ClipboardList },
    { label: "💰 Ví Sao", to: "/user/wallet", icon: Star },
    { label: "🏆 Xếp hạng", to: "/user/leaderboard", icon: Trophy },
    { label: "🏅 Huy hiệu", to: "/user/achievements", icon: Award },
    { label: "📊 Phân tích", to: ROUTERS.USER.ANALYSIS_HUB, icon: BarChart3 },
  ];

  return (
    <div
      style={{ fontFamily: font }}
      className={`fixed inset-0 z-40 flex flex-col transition-[opacity,visibility] duration-200 md:hidden ${
        open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      <button
        type="button"
        aria-label="Đóng menu"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm border-0 cursor-pointer"
        onClick={onClose}
      />
      <div
        className={`relative ml-auto h-full w-[min(100%,20rem)] bg-white/95 backdrop-blur-2xl border-l border-slate-200/80 shadow-[-12px_0_40px_rgba(15,23,42,0.12)] flex flex-col pt-[calc(env(safe-area-inset-top)+5.5rem)] pb-8 px-4 gap-1 overflow-y-auto transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            navigate(ROUTERS.USER.PROFILE);
            onClose();
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 mb-3 text-left hover:border-indigo-200/80 transition-colors w-full cursor-pointer"
        >
          <UserAvatar avatar={user?.avatar} size={44} />
          <div className="overflow-hidden min-w-0">
            <strong className="text-[0.95rem] font-extrabold text-slate-900 block truncate">{label}</strong>
            {(user?.xp != null || user?.level != null) && (
              <span className="text-[0.72rem] text-slate-500 block">
                {user.level != null ? `Cấp ${user.level}` : ""}
                {user.level != null && user.xp != null ? " · " : ""}
                {user.xp != null ? `${user.xp.toLocaleString()} XP` : ""}
              </span>
            )}
            <span className="text-[0.72rem] text-indigo-600 font-semibold mt-0.5 block">Hồ sơ →</span>
          </div>
        </button>

        {links.map(({ label, to, icon: Icon }) => {
          const active =
            pathname === to || (to === ROUTERS.USER.MY_SURVEYS && pathname.startsWith(`${ROUTERS.USER.MY_SURVEYS}/`)) ||
            (to === ROUTERS.USER.ANALYSIS_HUB && pathname.startsWith("/user/analysis"));
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={[
                "no-underline flex items-center gap-3 font-semibold px-4 py-3.5 rounded-2xl transition-colors text-[0.95rem]",
                active
                  ? "text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100"
                  : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              <Icon size={20} strokeWidth={2} className={active ? "text-indigo-600" : "text-slate-400"} />
              {label}
            </Link>
          );
        })}

        <div className="h-px bg-slate-200/80 my-3" />

        <button
          type="button"
          onClick={onLogout}
          className="no-underline flex items-center gap-3 font-bold text-rose-600 px-4 py-3.5 rounded-2xl hover:bg-rose-50 transition-colors w-full border-0 bg-transparent cursor-pointer text-left text-[0.95rem]"
        >
          <LogOut size={20} strokeWidth={2} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

function Hamburger({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl border-0 bg-slate-100/80 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
      aria-label={open ? "Đóng menu" : "Mở menu"}
      aria-expanded={open}
    >
      {open ? <X size={22} strokeWidth={2.25} /> : <Menu size={22} strokeWidth={2.25} />}
    </button>
  );
}

export default function Navbar() {
  const { user } = useUser();
  const { user: authUser, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName =
    (user?.full_name && String(user.full_name).trim()) ||
    (authUser?.full_name && String(authUser.full_name).trim()) ||
    user?.email ||
    authUser?.email ||
    "Account";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
  }, [drawerOpen]);

  useEffect(() => {
    setDropdownOpen(false);
    setDrawerOpen(false);
  }, [location.pathname]);

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
      await authLogout();
      setDrawerOpen(false);
      setDropdownOpen(false);
      navigate(ROUTERS.PUBLIC.LOGIN);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div
        style={{ fontFamily: font }}
        className={`sticky top-0 z-50 transition-[padding] duration-300 ${scrolled ? "pt-2 px-[18px]" : "pt-3 px-[18px]"}`}
      >
        <nav
          className={[
            "flex items-center justify-between gap-3 sm:gap-4 h-[3.5rem] sm:h-16 px-3 sm:px-5 rounded-[1.125rem] max-w-[1260px] w-full mx-auto border transition-[box-shadow,border-color,background] duration-300",
            "bg-white/72 backdrop-blur-xl backdrop-saturate-150",
            "border-white/80 shadow-[0_2px_0_rgba(255,255,255,0.9)_inset,0_8px_32px_-8px_rgba(15,23,42,0.08)]",
            scrolled
              ? "shadow-[0_2px_0_rgba(255,255,255,0.95)_inset,0_16px_40px_-10px_rgba(79,70,229,0.12)] border-indigo-100/90"
              : "",
          ].join(" ")}
        >
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link
              to={ROUTERS.USER.HOME}
              className="flex items-center gap-2.5 sm:gap-3 no-underline group shrink-0"
            >
              <span className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-white/90 group-hover:scale-[1.03] transition-transform">
                <LayoutGrid size={18} strokeWidth={2.25} className="sm:w-[19px] sm:h-[19px]" />
              </span>
              <span className="flex flex-col min-w-0 leading-tight">
                <span
                  className="text-[1.05rem] sm:text-[1.15rem] font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent"
                  style={{ fontFamily: font }}
                >
                  {APP_BRAND.name}
                </span>
                <span className="hidden sm:block text-[0.65rem] font-semibold text-slate-400 tracking-wide uppercase truncate max-w-[14rem]">
                  {APP_BRAND.tagline}
                </span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/80 ring-1 ring-slate-200/60">
              <NavLink to={ROUTERS.USER.HOME}>Trang chủ</NavLink>
              <NavLink to={ROUTERS.USER.SURVEYS}>Khám phá</NavLink>
              <NavLink to={ROUTERS.USER.MY_SURVEYS} matchPrefix>
                Của tôi
              </NavLink>
              <NavLink to="/user/wallet">💰 Ví Sao</NavLink>
              <NavLink to="/user/leaderboard">🏆 Xếp hạng</NavLink>
              <NavLink to="/user/achievements">🏅 Huy hiệu</NavLink>
              <NavLink to={ROUTERS.USER.ANALYSIS_HUB}>📊 Phân tích</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <NotificationPanel />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className={[
                  "flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full border cursor-pointer transition-all outline-none",
                  dropdownOpen
                    ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100"
                    : "bg-slate-100/90 border-slate-200/80 hover:border-indigo-200 hover:bg-white",
                ].join(" ")}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <span className="hidden sm:inline text-[0.8rem] font-semibold text-slate-800 max-w-[140px] lg:max-w-[220px] truncate" title={displayName}>
                  {displayName}
                </span>
                <UserAvatar avatar={user?.avatar} size={30} />
                <ChevronDown
                  size={16}
                  strokeWidth={2.25}
                  className={`text-slate-400 mr-0.5 transition-transform hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {dropdownOpen && (
                <UserDropdown
                  user={user}
                  displayName={displayName}
                  onLogout={handleLogout}
                  onClose={() => setDropdownOpen(false)}
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
        displayName={displayName}
        onLogout={handleLogout}
      />
    </>
  );
}
