import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  Smartphone,
  Share2,
  Zap,
  Link,
  CloudLightning,
  PlusCircle,
} from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const STATS = [
  {
    label: "Dữ liệu Đã thu thập",
    value: "1.2M+",
    badge: { text: "12%", color: "text-emerald-400", Icon: TrendingUp },
    glow: "bg-blue-600/10",
  },
  {
    label: "Khảo sát Đang chạy",
    value: "48",
    badge: { text: "Tích cực", color: "text-slate-500", Icon: null },
    glow: "bg-indigo-600/10",
  },
  {
    label: "Tổng Phản hồi",
    value: "84.2k",
    badge: { text: "8.4k", color: "text-emerald-400", Icon: TrendingUp },
    glow: "bg-blue-700/10",
  },
  {
    label: "Tỷ lệ Hoàn tất",
    value: "76.4%",
    badge: { text: "0.2%", color: "text-amber-400", Icon: Minus },
    glow: "bg-purple-600/10",
  },
];

const BAR_HEIGHTS = [50, 75, 38, 88, 62, 55, 94, 70, 48, 82];

const PLATFORMS = [
  { label: "Web Platform", pct: 54, color: "bg-blue-600", Icon: Globe, iconColor: "text-blue-500" },
  { label: "Mobile App", pct: 32, color: "bg-violet-500", Icon: Smartphone, iconColor: "text-violet-400" },
  { label: "Social Media", pct: 14, color: "bg-sky-400", Icon: Share2, iconColor: "text-sky-400" },
];

const RESPONSES = [
  {
    name: "Nguyễn Minh Quân",
    time: "2 phút trước",
    survey: "Khảo sát: Trải nghiệm người dùng App v2.0",
    quote: "Giao diện mới rất mượt, nhưng tôi hy vọng có thêm tính năng lọc dữ liệu nhanh hơn.",
    accent: "border-blue-600",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC9QZSz9bmG32EyFbbIWk2LO4-xv1A1IIcYy6FBpaSEGBWALpfSh7qXFtwwQhZrCf8fqfrDYZFDOPVXsFb0n19KgQa2uz_sLjyTvp2AE8A9r4Y19qCZtQHiJPbLWp-Fm2Vg3RSasSPAkMRpT5vfYPXAIRHbCmJPVS9FWG5D6ySAHymXDtvZ2jTcxlJxqGFWZDkrKLzrROvDqsCH4MaaFudTswZOv9hzYjQAj6ZdJdpOvcQxG4TccMpAs3Ll57OpQelRkrM2q2gdKGI",
  },
  {
    name: "Lê Thị Thu Hà",
    time: "5 phút trước",
    survey: "Khảo sát: Khảo sát Sản phẩm Mới",
    quote: "Giá cả khá cạnh tranh so với thị trường hiện tại. Tôi sẽ cân nhắc mua dùng thử.",
    accent: "border-violet-500",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBsBn6aMgPqzD8QPZUwGqrM_lWv7wVzOhM2uRgZ2dTE6lSaEkf3bH7kr7DtW6qRJEO--QlLZTGJfwjqG-HA75vhx8BCZe3SMcHgZ06ONCXlp161reSdmoIyb2uzFPcNkJl2flz4417lbYH3EH1kYPHAJXelc358s96nkZFUw6DOekVYqJ7EoBF82P72eZ6gmoHYTL_oXrQy4EDTUy8VbD2KcRCTbKv4TuEtF39ZfDMTF9GY6nsDcSyNnDjtnBTtkW_o9dsCCT2CTEM",
  },
];

const CONNECTIONS = [
  {
    name: "Main Dashboard API",
    sub: "api.v1.collection.io",
    status: "Active",
    active: true,
    Icon: Zap,
    iconWrap: "bg-blue-500/15 text-blue-400",
  },
  {
    name: "Social Web Scraper",
    sub: "Chạy mỗi 15 phút",
    status: "Active",
    active: true,
    Icon: CloudLightning,
    iconWrap: "bg-violet-500/15 text-violet-400",
  },
  {
    name: "CRM Integration",
    sub: "Chờ cấu hình",
    status: "Idle",
    active: false,
    Icon: Link,
    iconWrap: "bg-slate-500/15 text-slate-400",
  },
];

// ── Shared glass card ──────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`bg-white/[0.04] backdrop-blur-md border border-white/5 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [chartView, setChartView] = useState("month");

  return (
    <div className="min-h-screen bg-[#0f121a] text-white p-10 font-['Inter',sans-serif]">

      {/* ── Header ── */}
      <header className="mb-10">
        <h2 className="font-['Manrope',sans-serif] text-4xl font-bold text-white mb-2 tracking-tight">
          Tổng quan Hệ thống
        </h2>
        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
          Theo dõi hiệu suất thu thập dữ liệu đa nền tảng và tương tác người dùng theo thời gian thực.
        </p>
      </header>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {STATS.map(({ label, value, badge, glow }) => (
          <GlassCard key={label} className="p-6 rounded-2xl relative overflow-hidden group">
            <div
              className={`absolute -right-4 -top-4 w-24 h-24 ${glow} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`}
            />
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest mb-4">
              {label}
            </p>
            <div className="flex items-end gap-2">
              <span className="font-['Manrope',sans-serif] text-3xl font-bold text-white">
                {value}
              </span>
              <span className={`text-xs font-medium mb-1.5 flex items-center gap-0.5 ${badge.color}`}>
                {badge.Icon && <badge.Icon size={14} />}
                {badge.text}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Row 1: Chart + Platform ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Chart */}
        <GlassCard className="lg:col-span-2 p-8 rounded-3xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-white mb-1">
                Hiệu suất Khảo sát
              </h3>
              <p className="text-slate-500 text-sm">Biểu đồ phản hồi hàng ngày trong 30 ngày qua</p>
            </div>
            <div className="flex gap-2">
              {["week", "month"].map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    chartView === v
                      ? "bg-blue-600/20 text-blue-500"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {v === "week" ? "Tuần" : "Tháng"}
                </button>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div className="h-64 flex items-end gap-1.5 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-full h-px bg-white/[0.06]" />
              ))}
            </div>
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md transition-all duration-300 hover:brightness-125"
                style={{
                  height: `${h}%`,
                  background: "linear-gradient(to top, rgba(0,73,219,0.4), #0049db)",
                  boxShadow: h === 94 ? "0 0 20px rgba(41,98,255,0.3)" : "none",
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {["01 Thg 10", "10 Thg 10", "20 Thg 10", "30 Thg 10"].map((d) => (
              <span key={d} className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                {d}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* Platform */}
        <GlassCard className="p-8 rounded-3xl flex flex-col">
          <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-white mb-6">
            Phân phối Nền tảng
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-6">
            {PLATFORMS.map(({ label, pct, color, Icon, iconColor }) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <span className={`text-slate-300 text-sm flex items-center gap-2 ${iconColor}`}>
                    <Icon size={16} />
                    <span className="text-slate-300">{label}</span>
                  </span>
                  <span className="text-white text-sm font-semibold">{pct}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs">Phân tích dựa trên 84.2k phiên phản hồi</p>
          </div>
        </GlassCard>
      </div>

      {/* ── Row 2: Live Feed + Connections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Live Responses */}
        <GlassCard className="lg:col-span-7 p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Phản hồi Trực tiếp
            </h3>
            <a href="#" className="text-xs text-blue-500 font-semibold hover:underline">
              Xem tất cả
            </a>
          </div>
          <div className="flex flex-col gap-4">
            {RESPONSES.map(({ name, time, survey, quote, accent, avatar }) => (
              <div
                key={name}
                className="p-4 bg-white/[0.03] rounded-2xl flex gap-4 border border-white/5 hover:border-blue-600/30 transition-colors"
              >
                <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 truncate">{survey}</p>
                  <div className={`bg-[#0f121a] p-3 rounded-xl border-l-2 ${accent}`}>
                    <p className="text-sm italic text-slate-300">"{quote}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Connections */}
        <GlassCard className="lg:col-span-5 p-8 rounded-3xl">
          <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-white mb-6">
            Kết nối Dữ liệu
          </h3>
          <div className="flex flex-col gap-3">
            {CONNECTIONS.map(({ name, sub, status, active, Icon, iconWrap }) => (
              <div
                key={name}
                className={`flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 transition-opacity ${
                  !active ? "opacity-55" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconWrap}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-[10px] text-slate-500">{sub}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                    active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}

            <button className="w-full mt-1 py-3.5 border border-dashed border-white/15 rounded-2xl text-slate-400 text-sm font-medium hover:bg-white/[0.03] hover:border-blue-600/40 transition-all flex items-center justify-center gap-2">
              <PlusCircle size={18} />
              Thêm Nguồn Dữ liệu mới
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}