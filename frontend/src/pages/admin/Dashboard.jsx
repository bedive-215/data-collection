import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ClipboardList,
  HelpCircle,
  CheckSquare,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  Smartphone,
  Share2,
  Activity,
  Eye,
} from "lucide-react";
import { useAdminStats } from "@/providers/AdminStatsProvider";

const BAR_HEIGHTS = [50, 75, 38, 88, 62, 55, 94, 70, 48, 82];

const PLATFORMS = [
  { label: "Web Platform", pct: 54, color: "#F59E0B", bgColor: "rgba(245,158,11,0.1)", Icon: Globe },
  { label: "Mobile App", pct: 32, color: "#6366F1", bgColor: "rgba(99,102,241,0.1)", Icon: Smartphone },
  { label: "Social Media", pct: 14, color: "#10B981", bgColor: "rgba(16,185,129,0.1)", Icon: Share2 },
];

const LIVE_FEED = [
  {
    name: "Nguyễn Minh Quân",
    time: "2 phút trước",
    survey: "Trải nghiệm người dùng App v2.0",
    quote: "Giao diện mới rất mượt, nhưng tôi hy vọng có thêm tính năng lọc dữ liệu nhanh hơn.",
    accentColor: "#F59E0B",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=quan&backgroundColor=b6e3f4",
  },
  {
    name: "Lê Thị Thu Hà",
    time: "5 phút trước",
    survey: "Khảo sát Sản phẩm Mới",
    quote: "Giá cả khá cạnh tranh so với thị trường hiện tại. Tôi sẽ cân nhắc mua dùng thử.",
    accentColor: "#6366F1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ha&backgroundColor=ffd5dc",
  },
  {
    name: "Trần Đình Khoa",
    time: "12 phút trước",
    survey: "Đánh giá Dịch vụ CSKH",
    quote: "Nhân viên hỗ trợ rất nhiệt tình. Thời gian phản hồi chỉ mất 5 phút.",
    accentColor: "#10B981",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=khoa&backgroundColor=c0aede",
  },
];

const QUICK_STATS = [
  { label: "Người dùng mới", val: 24, change: "+12%", up: true, color: "#F59E0B" },
  { label: "Khảo sát hoàn thành", val: 156, change: "+8%", up: true, color: "#6366F1" },
  { label: "Tỷ lệ hoàn thành", val: "87%", change: "+3%", up: true, color: "#10B981" },
  { label: "Thời gian TB", val: "4.2p", change: "-15%", up: false, color: "#3B82F6" },
];

/* ──────────────────────────────────────────
   Helpers
────────────────────────────────────────── */
function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "var(--admin-surface-hover)" }}
    />
  );
}

function StatCard({ label, value, icon, color, bgColor, change, up, loading }) {
  return (
    <div
      className="p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between mb-4">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--admin-text-dim)" }}
        >
          {label}
        </p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bgColor }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-end justify-between">
        {loading ? (
          <SkeletonBlock className="h-9 w-24" />
        ) : (
          <p
            className="text-3xl font-extrabold"
            style={{ color: "var(--admin-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {value}
          </p>
        )}

        {change && (
          <span
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-1"
            style={{
              background: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: up ? "#10B981" : "#EF4444",
            }}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [chartView, setChartView] = useState("week");

  const {
    dashboard,
    surveyByDay,
    loading,
    fetchDashboard,
    fetchSurveyByDay,
  } = useAdminStats();

  useEffect(() => {
    fetchDashboard();
    fetchSurveyByDay();
  }, []);

  const overview = dashboard?.overview ?? null;

  const barData = (() => {
    if (!surveyByDay || surveyByDay.length === 0) return BAR_HEIGHTS;
    const counts = surveyByDay.map((d) => Number(d.count));
    const max = Math.max(...counts, 1);
    return counts.map((c) => Math.max(8, Math.round((c / max) * 94)));
  })();

  const dateLabels = (() => {
    if (!surveyByDay || surveyByDay.length === 0)
      return ["01 Thg 10", "10 Thg 10", "20 Thg 10", "30 Thg 10"];
    const picks = [
      0,
      Math.floor(surveyByDay.length / 3),
      Math.floor((2 * surveyByDay.length) / 3),
      surveyByDay.length - 1,
    ];
    return picks.map((i) => {
      const d = new Date(surveyByDay[i]?.date ?? "");
      return isNaN(d)
        ? surveyByDay[i]?.date ?? ""
        : `${d.getDate()} Thg ${d.getMonth() + 1}`;
    });
  })();

  const STATS = [
    {
      label: "Tổng Người dùng",
      value: loading ? null : overview?.totalUsers?.toLocaleString() ?? "—",
      icon: <Users size={18} style={{ color: "#F59E0B" }} />,
      color: "#F59E0B",
      bgColor: "rgba(245,158,11,0.1)",
    },
    {
      label: "Tổng Khảo sát",
      value: loading ? null : overview?.totalSurveys?.toLocaleString() ?? "—",
      icon: <ClipboardList size={18} style={{ color: "#6366F1" }} />,
      color: "#6366F1",
      bgColor: "rgba(99,102,241,0.1)",
    },
    {
      label: "Tổng Câu hỏi",
      value: loading ? null : overview?.totalQuestions?.toLocaleString() ?? "—",
      icon: <HelpCircle size={18} style={{ color: "#10B981" }} />,
      color: "#10B981",
      bgColor: "rgba(16,185,129,0.1)",
    },
    {
      label: "Tổng Lựa chọn",
      value: loading ? null : overview?.totalOptions?.toLocaleString() ?? "—",
      icon: <CheckSquare size={18} style={{ color: "#8B5CF6" }} />,
      color: "#8B5CF6",
      bgColor: "rgba(139,92,246,0.1)",
    },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2
            className="text-3xl font-extrabold mb-1"
            style={{ color: "var(--admin-text)", letterSpacing: "-0.02em" }}
          >
            Tổng quan Hệ thống
          </h2>
          <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
            Theo dõi hiệu suất thu thập dữ liệu theo thời gian thực
          </p>
        </div>
        <button
          onClick={() => { fetchDashboard(); fetchSurveyByDay(); }}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            color: "var(--admin-text-sub)",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {STATS.map(({ label, value, icon, color, bgColor }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            color={color}
            bgColor={bgColor}
            loading={loading}
          />
        ))}
      </div>

      {/* ── Row 1: Chart + Platform ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div
          className="lg:col-span-2 p-7 rounded-2xl"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: "var(--admin-text)" }}
              >
                Hiệu suất Khảo sát
              </h3>
              <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
                {surveyByDay.length > 0
                  ? `Biểu đồ ${surveyByDay.length} ngày gần nhất`
                  : "Biểu đồ phản hồi hàng ngày"}
              </p>
            </div>
            <div className="flex gap-2">
              {["week", "month"].map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={
                    chartView === v
                      ? { background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }
                      : { background: "transparent", color: "var(--admin-text-dim)", border: "1px solid var(--admin-border)" }
                  }
                >
                  {v === "week" ? "Tuần" : "Tháng"}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div
            className="h-60 flex items-end gap-1.5 relative"
            style={{ paddingBottom: 24 }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-full"
                  style={{ borderTop: i > 0 ? "1px dashed var(--admin-border)" : "none", height: "20%" }}
                />
              ))}
            </div>

            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-lg animate-pulse"
                    style={{
                      height: `${30 + Math.random() * 50}%`,
                      background: "var(--admin-surface-hover)",
                    }}
                  />
                ))
              : barData.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-lg transition-all duration-300 hover:brightness-125 group/bar relative cursor-pointer"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, rgba(245,158,11,0.3), #F59E0B)`,
                      boxShadow: h >= 90 ? "0 0 20px rgba(245,158,11,0.2)" : "none",
                    }}
                  >
                    {surveyByDay[i] && (
                      <div
                        className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold z-10 whitespace-nowrap"
                        style={{
                          background: "var(--admin-surface)",
                          border: "1px solid var(--admin-border)",
                          color: "var(--admin-text)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        }}
                      >
                        <span style={{ color: "#F59E0B" }}>{surveyByDay[i].count}</span> khảo sát
                      </div>
                    )}
                  </div>
                ))}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between mt-3">
            {dateLabels.map((d, i) => (
              <span
                key={`${d}-${i}`}
                className="text-[10px] font-medium uppercase"
                style={{ color: "var(--admin-text-dim)", letterSpacing: "0.05em" }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Platform Distribution */}
        <div
          className="p-7 rounded-2xl"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <h3
            className="text-lg font-bold mb-6"
            style={{ color: "var(--admin-text)" }}
          >
            Phân phối Nền tảng
          </h3>

          <div className="flex flex-col justify-center flex-1 gap-5">
            {PLATFORMS.map(({ label, pct, color, bgColor, Icon }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: bgColor }}
                    >
                      <Icon size={15} style={{ color }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--admin-text-sub)" }}>
                      {label}
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>
                    {pct}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--admin-bg-secondary)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(to right, ${color}, ${color}99)` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-8 pt-5"
            style={{ borderTop: "1px solid var(--admin-border)" }}
          >
            {loading ? (
              <SkeletonBlock className="h-4 w-48 mx-auto" />
            ) : (
              <p className="text-xs text-center" style={{ color: "var(--admin-text-dim)" }}>
                Dữ liệu từ{" "}
                <span style={{ color: "var(--admin-primary)", fontWeight: 700 }}>
                  {overview?.totalSurveys ?? "—"}
                </span>{" "}
                khảo sát •{" "}
                <span style={{ color: "var(--admin-text-sub)", fontWeight: 700 }}>
                  {overview?.totalQuestions ?? "—"}
                </span>{" "}
                câu hỏi
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Live Feed + Quick Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Live Responses */}
        <div
          className="lg:col-span-3 p-7 rounded-2xl"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex justify-between items-center mb-5">
            <h3
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: "var(--admin-text)" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#EF4444", animation: "pulse-glow 2s infinite" }}
              />
              Phản hồi Trực tiếp
            </h3>
            <a
              href="#"
              className="text-xs font-semibold transition-colors"
              style={{ color: "#F59E0B" }}
            >
              Xem tất cả →
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {LIVE_FEED.map(({ name, time, survey, quote, accentColor, avatar }) => (
              <div
                key={name}
                className="p-4 rounded-xl flex gap-4 transition-all duration-200"
                style={{
                  background: "var(--admin-bg-secondary)",
                  border: "1px solid var(--admin-border)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${accentColor}40`;
                  e.currentTarget.style.background = "var(--admin-surface-hover)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--admin-border)";
                  e.currentTarget.style.background = "var(--admin-bg-secondary)";
                }}
              >
                <img
                  src={avatar}
                  alt={name}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  style={{ border: `2px solid ${accentColor}40` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>
                      {name}
                    </p>
                    <span
                      className="text-[10px] flex-shrink-0 ml-2 flex items-center gap-1"
                      style={{ color: "var(--admin-text-dim)" }}
                    >
                      <Activity size={10} />
                      {time}
                    </span>
                  </div>
                  <p
                    className="text-[11px] mb-2 truncate"
                    style={{ color: "var(--admin-text-dim)" }}
                  >
                    {survey}
                  </p>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: "var(--admin-bg)",
                      borderLeft: `3px solid ${accentColor}`,
                    }}
                  >
                    <p className="text-sm italic" style={{ color: "var(--admin-text-sub)", lineHeight: 1.5 }}>
                      "{quote}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Quick Stats + Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Quick Stats */}
          <div
            className="p-6 rounded-2xl"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              className="text-base font-bold mb-4"
              style={{ color: "var(--admin-text)" }}
            >
              Thống kê Nhanh
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_STATS.map(({ label, val, change, up, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl"
                  style={{
                    background: "var(--admin-bg-secondary)",
                    border: "1px solid var(--admin-border)",
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-wider mb-2 font-bold"
                    style={{ color: "var(--admin-text-dim)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xl font-extrabold mb-1"
                    style={{ color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {val}
                  </p>
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: up ? "#10B981" : "#EF4444" }}
                  >
                    {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Activity */}
          <div
            className="p-6 rounded-2xl flex-1"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              className="text-base font-bold mb-4"
              style={{ color: "var(--admin-text)" }}
            >
              Hoạt động Hệ thống
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { icon: <Zap size={13} />, text: "API response time: 12ms", sub: "2 phút trước", color: "#10B981" },
                { icon: <Users size={13} />, text: "3 người dùng mới đăng ký", sub: "5 phút trước", color: "#F59E0B" },
                { icon: <ClipboardList size={13} />, text: "Khảo sát mới được tạo", sub: "12 phút trước", color: "#6366F1" },
                { icon: <Eye size={13} />, text: "100 lượt xem trang chủ", sub: "15 phút trước", color: "#3B82F6" },
              ].map(({ icon, text, sub, color }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: "var(--admin-bg-secondary)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    <span style={{ color }}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--admin-text)" }}>
                      {text}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--admin-text-dim)" }}>
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: "var(--admin-bg-secondary)",
                border: "1px dashed var(--admin-border)",
                color: "var(--admin-text-dim)",
              }}
            >
              <PlusCircle size={14} />
              Xem thêm hoạt động
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
