import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import {
  Users, ClipboardList, HelpCircle, CheckSquare,
  RefreshCw, TrendingUp, Activity, Clock, CheckCircle,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useAdminStats } from "@/providers/AdminStatsProvider";
import { adminTheme } from "@/styles/designSystem";

const STAT_CARDS = [
  { label: "Tổng Người dùng", key: "totalUsers", icon: Users, color: "#3B82F6" },
  { label: "Tổng Khảo sát", key: "totalSurveys", icon: ClipboardList, color: "#3B82F6" },
  { label: "Tổng Câu hỏi", key: "totalQuestions", icon: HelpCircle, color: "#10B981" },
  { label: "Tổng Lựa chọn", key: "totalOptions", icon: CheckSquare, color: "#60A5FA" },
];

const STATUS_COLORS = { active: "#3B82F6", expired: "#EF4444", upcoming: "#F59E0B", draft: "#9CA3AF" };

const QUESTION_TYPE_LABELS = {
  TEXT: "Văn bản", PARAGRAPH: "Đoạn văn", EMAIL: "Email",
  SINGLE_CHOICE: "Một lựa chọn", MULTIPLE_CHOICE: "Nhiều lựa chọn",
  DROPDOWN: "Dropdown", RATING: "Đánh giá", NUMBER: "Số", DATE: "Ngày"
};

const QUESTION_TYPE_COLORS = {
  TEXT: "#EC4899", PARAGRAPH: "#EF4444", EMAIL: "#F59E0B",
  SINGLE_CHOICE: "#3B82F6", MULTIPLE_CHOICE: "#60A5FA",
  DROPDOWN: "#8B5CF6", RATING: "#10B981", NUMBER: "#06B6D4", DATE: "#F97316"
};

function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="p-6 rounded-2xl relative overflow-hidden transition-all duration-300"
      style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
    >
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-3xl opacity-20"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--admin-text-dim)" }}>
          {label}
        </p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        {loading ? (
          <div className="h-9 w-24 animate-pulse rounded-lg" style={{ background: "var(--admin-surface-hover)" }} />
        ) : (
          <p className="text-3xl font-extrabold" style={{ color: "var(--admin-text)" }}>
            {value ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-semibold shadow-sm"
      style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
    >
      <p className="mb-1" style={{ color: "var(--admin-text-dim)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-xl text-xs font-semibold shadow-sm"
      style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", color: "var(--admin-text)" }}
    >
      <p>{d.label || d.name}: {d.count || d.value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState("week");
  const { fullDashboard, loading, fetchFullDashboard } = useAdminStats();

  useEffect(() => { fetchFullDashboard(period); }, [period]);

  const d = fullDashboard ?? {};
  const overview = d.overview ?? {};
  const surveyByDay = d.surveyByDay ?? [];
  const responseTrend = d.responseTrend ?? [];
  const surveyStatusDist = d.surveyStatusDistribution ?? [];
  const questionTypeDist = d.questionTypeDistribution ?? [];
  const recentResponses = d.recentResponses ?? [];
  const quickStats = d.quickStats ?? {};

  const surveyBarData = useMemo(() => {
    if (!surveyByDay.length) return [];
    return surveyByDay.map(s => ({ name: s.date, "Khảo sát": Number(s.count) }));
  }, [surveyByDay]);

  const responseLineData = useMemo(() => {
    if (!responseTrend.length) return [];
    return responseTrend.map(s => ({ name: s.date, "Phản hồi": Number(s.count) }));
  }, [responseTrend]);

  const totalSurveyCount = surveyStatusDist.reduce((a, c) => a + c.count, 0) || 1;

  const totalQuestionCount = questionTypeDist.reduce((a, c) => a + Number(c.count), 0) || 1;

  function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vài giây trước";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    return `${days} ngày trước`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold mb-1" style={{ color: "var(--admin-text)", letterSpacing: "-0.02em" }}>
            Tổng quan Hệ thống
          </h2>
          <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
            Theo dõi hiệu suất thu thập dữ liệu theo thời gian thực
          </p>
        </div>
        <button onClick={() => fetchFullDashboard(period)} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)", color: "var(--admin-text-sub)" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map(({ label, key, icon, color }) => (
          <StatCard key={key} label={label} value={overview[key]?.toLocaleString()} icon={icon} color={color} loading={loading} />
        ))}
      </div>

      {/* Row 1: Bar Chart + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Survey Trend Bar Chart */}
        <div className="lg:col-span-2 p-7 rounded-2xl" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--admin-text)" }}>Xu hướng Khảo sát</h3>
              <p className="text-sm" style={{ color: "var(--admin-text-sub)" }}>
                Số khảo sát được tạo theo thời gian
              </p>
            </div>
            <div className="flex gap-2">
              {[{ v: "week", l: "Tuần" }, { v: "month", l: "Tháng" }, { v: "year", l: "Năm" }].map(({ v, l }) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={period === v
                    ? { background: "rgba(59,130,246,0.15)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)" }
                    : { background: "transparent", color: "var(--admin-text-dim)", border: "1px solid var(--admin-border)" }
                  }
                >{l}</button>
              ))}
            </div>
          </div>
          <div className="h-64">
            {loading && !surveyBarData.length ? (
              <div className="h-full flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>
                <div className="animate-pulse">Đang tải...</div>
              </div>
            ) : surveyBarData.length === 0 ? (
              <div className="h-full flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={surveyBarData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--admin-text-dim)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--admin-text-dim)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Khảo sát" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {surveyBarData.map((_, i) => (
                      <Cell key={i} fill={i === surveyBarData.length - 1 ? "#3B82F6" : "rgba(59,130,246,0.4)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Survey Status Pie */}
        <div className="p-7 rounded-2xl flex flex-col" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--admin-text)" }}>Trạng thái Khảo sát</h3>
          {loading && !surveyStatusDist.length ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>
              <div className="animate-pulse">Đang tải...</div>
            </div>
          ) : surveyStatusDist.length === 0 ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>Chưa có dữ liệu</div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={surveyStatusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {surveyStatusDist.map((e) => (
                        <Cell key={e.status} fill={STATUS_COLORS[e.status] || "#9CA3AF"} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                {surveyStatusDist.map((e) => (
                  <div key={e.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[e.status] || "#9CA3AF" }} />
                      <span style={{ color: "var(--admin-text-sub)" }}>{e.label}</span>
                    </div>
                    <span className="font-bold" style={{ color: "var(--admin-text)" }}>
                      {e.count} ({Math.round((e.count / totalSurveyCount) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Response Line Chart + Question Type Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Response Trend Line Chart */}
        <div className="lg:col-span-2 p-7 rounded-2xl" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <h3 className="text-lg font-bold mb-1" style={{ color: "var(--admin-text)" }}>Xu hướng Phản hồi</h3>
          <p className="text-sm mb-6" style={{ color: "var(--admin-text-sub)" }}>
            Số lượng phản hồi đã gửi theo thời gian
          </p>
          <div className="h-64">
            {loading && !responseLineData.length ? (
              <div className="h-full flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>
                <div className="animate-pulse">Đang tải...</div>
              </div>
            ) : responseLineData.length === 0 ? (
              <div className="h-full flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseLineData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--admin-text-dim)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--admin-text-dim)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Phản hồi" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Question Type Pie */}
        <div className="p-7 rounded-2xl flex flex-col" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--admin-text)" }}>Loại Câu hỏi</h3>
          {loading && !questionTypeDist.length ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>
              <div className="animate-pulse">Đang tải...</div>
            </div>
          ) : questionTypeDist.length === 0 ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: "var(--admin-text-dim)" }}>Chưa có dữ liệu</div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={questionTypeDist} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                      {questionTypeDist.map((e) => (
                        <Cell key={e.type} fill={QUESTION_TYPE_COLORS[e.type] || "#9CA3AF"} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs max-h-32 overflow-y-auto">
                {questionTypeDist.map((e) => (
                  <div key={e.type} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: QUESTION_TYPE_COLORS[e.type] || "#9CA3AF" }} />
                    <span style={{ color: "var(--admin-text-sub)" }}>
                      {QUESTION_TYPE_LABELS[e.type] || e.type}: <strong style={{ color: "var(--admin-text)" }}>{e.count}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Recent Responses + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Responses */}
        <div className="lg:col-span-3 p-7 rounded-2xl" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#3B82F6", animation: "pulse-glow 2s infinite" }} />
              Phản hồi Gần đây
            </h3>
          </div>

          {loading && !recentResponses.length ? (
            <div className="flex items-center justify-center py-8" style={{ color: "var(--admin-text-dim)" }}>
              <div className="animate-pulse">Đang tải...</div>
            </div>
          ) : recentResponses.length === 0 ? (
            <div className="flex items-center justify-center py-8" style={{ color: "var(--admin-text-dim)" }}>
              Chưa có phản hồi nào
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentResponses.map((r) => (
                <div key={r.id} className="p-4 rounded-xl flex gap-4 transition-all duration-200"
                  style={{ background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F640"; e.currentTarget.style.background = "var(--admin-surface-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--admin-border)"; e.currentTarget.style.background = "var(--admin-bg-secondary)"; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6" }}
                  >
                    {r.avatar ? (
                      <img src={r.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : getInitials(r.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-sm font-bold" style={{ color: "var(--admin-text)" }}>{r.userName}</p>
                      <span className="text-[10px] flex-shrink-0 ml-2 flex items-center gap-1" style={{ color: "var(--admin-text-dim)" }}>
                        <Activity size={10} />
                        {timeAgo(r.submittedAt)}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--admin-text-dim)" }}>
                      Đã phản hồi: <span style={{ color: "var(--admin-text-sub)" }}>{r.surveyTitle}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-7 rounded-2xl" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
            <h3 className="text-lg font-bold mb-5" style={{ color: "var(--admin-text)" }}>
              Thống kê Nhanh
            </h3>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-3 rounded-xl animate-pulse" style={{ background: "var(--admin-surface-hover)" }}>
                    <div className="h-3 w-16 mb-2 rounded" style={{ background: "var(--admin-border)" }} />
                    <div className="h-6 w-12 rounded" style={{ background: "var(--admin-border)" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Người dùng mới (tuần)", value: quickStats.newUsersWeek, icon: Users, color: "#3B82F6" },
                  { label: "Người dùng mới (tháng)", value: quickStats.newUsersMonth, icon: TrendingUp, color: "#3B82F6" },
                  { label: "Phản hồi đã gửi", value: quickStats.completedResponses, icon: CheckCircle, color: "#10B981" },
                  { label: "Tỷ lệ hoàn thành", value: quickStats.completionRate != null ? `${quickStats.completionRate}%` : "—", icon: Clock, color: "#F59E0B" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: "var(--admin-bg-secondary)", border: "1px solid var(--admin-border)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-2 font-bold" style={{ color: "var(--admin-text-dim)" }}>{label}</p>
                    <p className="text-xl font-extrabold mb-1 flex items-center gap-2" style={{ color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <Icon size={14} />
                      {value ?? "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total stats summary */}
          <div className="p-7 rounded-2xl" style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}>
            <h3 className="text-base font-bold mb-4" style={{ color: "var(--admin-text)" }}>
              Tóm tắt Hệ thống
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { icon: <Users size={14} />, text: `${overview.totalUsers?.toLocaleString() ?? "—"} người dùng`, sub: `${overview.totalActiveUsers?.toLocaleString() ?? "—"} đang hoạt động`, color: "#3B82F6" },
                { icon: <ClipboardList size={14} />, text: `${overview.totalSurveys?.toLocaleString() ?? "—"} khảo sát`, sub: `${surveyStatusDist.find(s => s.status === "active")?.count ?? 0} đang hoạt động`, color: "#3B82F6" },
                { icon: <HelpCircle size={14} />, text: `${overview.totalQuestions?.toLocaleString() ?? "—"} câu hỏi`, sub: `${questionTypeDist.length} loại khác nhau`, color: "#10B981" },
              ].map(({ icon, text, sub, color }, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--admin-bg-secondary)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                    <span style={{ color }}>{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--admin-text)" }}>{text}</p>
                    <p className="text-[10px]" style={{ color: "var(--admin-text-dim)" }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
