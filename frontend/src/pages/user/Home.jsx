// ─── DashboardPage.jsx ────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ClipboardList, Clock, Zap,
  Trophy, FileText, Inbox, Users, MoreHorizontal,
  Download, ArrowRight, TrendingUp, BarChart2,
  AlertCircle, Rocket, ShoppingCart, Brain,
} from "lucide-react";
import surveyService from "@/services/surveyService";
import { useResponse } from "@/providers/ResponseProvider";

const activities = [
  { Icon: CheckCircle2, iconColor: "#4f6ef7", iconBg: "#eef2ff", title: "Health & Fitness Survey", sub: "Hoàn thành • 2 giờ trước", xp: "+250 XP", xpColor: "#22c55e" },
  { Icon: Trophy,       iconColor: "#f59e0b", iconBg: "#fef3c7", title: "Level 12 Reached",        sub: "Achievement • Hôm qua",   xp: "+500 XP", xpColor: "#d97706" },
  { Icon: CheckCircle2, iconColor: "#4f6ef7", iconBg: "#eef2ff", title: "Food Preference Study",   sub: "Hoàn thành • 1 ngày trước", xp: "+150 XP", xpColor: "#22c55e" },
];

const CARD_THEMES = [
  { accent: "#3b82f6", accentLight: "#eff6ff", accentMid: "#bfdbfe", Icon: BarChart2,    defaultStatus: "Đang diễn ra", statusColor: "#1d4ed8", statusBg: "#eff6ff", statusBorder: "#bfdbfe", draftBtn: false },
  { accent: "#16a34a", accentLight: "#f0fdf4", accentMid: "#bbf7d0", Icon: Brain,        defaultStatus: "Hoàn thành",   statusColor: "#15803d", statusBg: "#f0fdf4", statusBorder: "#bbf7d0", draftBtn: false },
  { accent: "#7c3aed", accentLight: "#f5f3ff", accentMid: "#ddd6fe", Icon: ShoppingCart, defaultStatus: "Nháp",         statusColor: "#6d28d9", statusBg: "#f5f3ff", statusBorder: "#ddd6fe", draftBtn: true  },
  { accent: "#ea580c", accentLight: "#fff7ed", accentMid: "#fed7aa", Icon: Rocket,       defaultStatus: "Đang diễn ra", statusColor: "#c2410c", statusBg: "#fff7ed", statusBorder: "#fed7aa", draftBtn: false },
];

/* ── SurveyCard ─────────────────────────────────────────────────── */
function SurveyCard({ id, title, desc, createdAt, questionsCount, responseCount, timeLeft, done, onStart, themeIndex }) {
  const [hovered, setHovered] = useState(false);
  const t = CARD_THEMES[themeIndex % CARD_THEMES.length];
  const { Icon } = t;

  const displayDate  = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";
  const accent       = done ? "#16a34a" : t.accent;
  const accentLight  = done ? "#f0fdf4" : t.accentLight;
  const accentMid    = done ? "#bbf7d0" : t.accentMid;
  const statusLabel  = done ? "Hoàn thành"  : t.defaultStatus;
  const statusColor  = done ? "#15803d"     : t.statusColor;
  const statusBg     = done ? "#f0fdf4"     : t.statusBg;
  const statusBorder = done ? "#bbf7d0"     : t.statusBorder;
  const isDraft      = !done && t.draftBtn;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${hovered ? accentMid : "#e5e7eb"}`,
        borderTop: `3px solid ${accent}`,
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.09)" : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 0" }}>
        {/* Outline icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          border: `1.5px solid ${hovered ? accent : "#d1d5db"}`,
          background: hovered ? accentLight : "#f9fafb",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.25s ease", flexShrink: 0,
        }}>
          <Icon size={19} strokeWidth={1.5} color={hovered ? accent : "#9ca3af"} style={{ transition: "color 0.25s ease" }} />
        </div>

        {/* Status badge */}
        <span style={{
          padding: "3px 10px", borderRadius: 99,
          background: statusBg, border: `1px solid ${statusBorder}`,
          color: statusColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 18px 18px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.45, marginBottom: 7,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {title}
        </h3>

        <p style={{
          fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 14,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {desc}
        </p>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
          {responseCount !== undefined && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 12 }}>
              <Users size={12} strokeWidth={1.5} />
              {Number(responseCount).toLocaleString()} phản hồi
            </span>
          )}
          {timeLeft && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 12 }}>
              <Clock size={12} strokeWidth={1.5} />
              {timeLeft}
            </span>
          )}
          {questionsCount !== undefined && !timeLeft && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 12 }}>
              <FileText size={12} strokeWidth={1.5} />
              {questionsCount} câu hỏi
            </span>
          )}
          {displayDate && !responseCount && !questionsCount && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 12 }}>
              <Clock size={12} strokeWidth={1.5} />
              {displayDate}
            </span>
          )}
        </div>

        <div style={{ height: 1, background: "#f3f4f6", marginBottom: 16 }} />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {done ? (
            <>
              <button onClick={(e) => e.stopPropagation()} style={outlineBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
              >Xem kết quả</button>
              <IconBtn><Download size={13} strokeWidth={1.5} color="#6b7280" /></IconBtn>
            </>
          ) : isDraft ? (
            <button style={{ ...outlineBtnStyle, flex: 1, color: accent, borderColor: accentMid }}
              onMouseEnter={(e) => { e.currentTarget.style.background = accentLight; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
            >Tiếp tục chỉnh sửa</button>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); onStart(id); }} style={{ ...primaryBtnStyle(accent), flex: 1 }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >Bắt đầu</button>
              <IconBtn><MoreHorizontal size={13} strokeWidth={1.5} color="#6b7280" /></IconBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const outlineBtnStyle = {
  flex: 1, padding: "8px 12px", background: "#f9fafb", color: "#374151",
  border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 12, fontWeight: 600,
  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s",
};
const primaryBtnStyle = (bg) => ({
  padding: "8px 12px", background: bg, color: "#fff", border: "none",
  borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "opacity 0.15s",
});
function IconBtn({ children }) {
  const [h, setH] = useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
      background: h ? "#f3f4f6" : "#f9fafb", border: `1px solid ${h ? "#d1d5db" : "#e5e7eb"}`,
      borderRadius: 9, cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function SurveyCardSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", borderTop: "3px solid #e5e7eb", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f3f4f6" }} />
        <div style={{ width: 76, height: 22, borderRadius: 99, background: "#f3f4f6" }} />
      </div>
      <div style={{ height: 14, background: "#f3f4f6", borderRadius: 6, marginBottom: 7, width: "72%" }} />
      <div style={{ height: 11, background: "#f3f4f6", borderRadius: 6, marginBottom: 5 }} />
      <div style={{ height: 11, background: "#f3f4f6", borderRadius: 6, width: "52%", marginBottom: 18 }} />
      <div style={{ height: 1, background: "#f3f4f6", marginBottom: 14 }} />
      <div style={{ height: 34, background: "#f3f4f6", borderRadius: 9 }} />
    </div>
  );
}

/* ── ActivityItem ───────────────────────────────────────────────── */
function ActivityItem({ Icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
      borderRadius: 12, background: h ? "#f0f4ff" : "#f9fafb",
      border: `1px solid ${h ? "#bfdbfe" : "#f1f5f9"}`,
      transition: "all 0.18s ease", cursor: "pointer",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, border: `1px solid ${iconColor}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} strokeWidth={1.5} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{sub}</p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: xpColor, whiteSpace: "nowrap" }}>{xp}</span>
    </div>
  );
}

/* ── WeekendChallenge ───────────────────────────────────────────── */
function WeekendChallenge() {
  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", padding: "22px 22px 22px", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <img style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.45)" }}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG03R-J3AOEaCVe7DOPDBsSzk1qBnJ_cSOKMi5AtWX-_YU-HZIisL7r7jIyUMnW7sBEmJ_4pRWir4wBA2cd2MjB4BYbuqmcc5fzNLckPRq-4RENObTC1rJo8Ryymqd22pKrVvKzL9g1TLvmUt9pDbtnrdon68H8nONY8hAYzUKzfJ26Nmu9bHt4EXj9P2Kg-HUmLt0kiBuZqOOXcn_ukIKBvAjTr5ZjNJVRiSQzsRmEfrv0SgAvPfujpNKhEnpFAlu6DaWPGehLbSj"
          alt="" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(0,31,77,0.9),rgba(0,45,100,0.55))" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 12 }}>
          <Zap size={10} strokeWidth={1.5} color="#bfdbfe" />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#bfdbfe", letterSpacing: "0.08em", textTransform: "uppercase" }}>Active Challenge</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>Weekend Challenge</h3>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Hoàn thành 5 khảo sát trong 48h tới để nhận{" "}
          <span style={{ color: "#bfdbfe", fontWeight: 700 }}>Bonus 2000 XP</span>.
        </p>
        <button style={{ width: "100%", padding: "10px", background: "#fff", color: "#1e3a8a", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#dbeafe"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
        >Join Challenge</button>
      </div>
    </div>
  );
}

/* ── DashboardPage ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { getAllMyResponses } = useResponse();

  const [surveys, setSurveys]             = useState([]);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [surveysRes, responsesRes] = await Promise.all([
        surveyService.getAllSurveys(),
        getAllMyResponses().catch(() => null),
      ]);
      setSurveys(surveysRes.data?.surveys ?? []);
      const ids = new Set((responsesRes?.data ?? []).map((r) => r.survey_id ?? r.surveyId));
      setDoneSurveyIds(ids);
    } catch (err) {
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStart = (surveyId) => navigate(`/user/survey/${surveyId}`);
  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="max-w-7xl mx-auto px-8 py-12">

      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 7 }}>Chào mừng trở lại! 👋</h1>
        <p style={{ color: "#64748b", fontSize: 15 }}>
          Bạn đã hoàn thành <span style={{ color: "#4f6ef7", fontWeight: 700 }}>85%</span> mục tiêu tuần này.
        </p>
      </header>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Surveys completed", value: loading ? "—" : doneCount, sub: "đã hoàn thành", subColor: "#4f6ef7", Icon: ClipboardList, iColor: "#4f6ef7", iBg: "#eef2ff" },
          { label: "Pending", value: loading ? "—" : String(pendingCount).padStart(2,"0"), badge: "Priority", Icon: AlertCircle, iColor: "#ea580c", iBg: "#fff7ed" },
          { label: "Rewards / XP", value: "12,450", vColor: "#b45309", dot: true, Icon: TrendingUp, iColor: "#d97706", iBg: "#fef3c7" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iBg, border: `1.5px solid ${s.iColor}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={19} strokeWidth={1.5} color={s.iColor} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{s.label}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: s.vColor ?? "#0f172a", lineHeight: 1 }}>{s.value}</span>
                {s.sub && <span style={{ fontSize: 11, color: s.subColor, fontWeight: 600 }}>{s.sub}</span>}
                {s.badge && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#fff7ed", color: "#c2410c", fontWeight: 700, border: "1px solid #fed7aa" }}>{s.badge}</span>}
                {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <section className="lg:col-span-2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
              Newest Surveys
              {!loading && <span style={{ fontSize: 13, fontWeight: 400, color: "#94a3b8", marginLeft: 7 }}>({surveys.length})</span>}
            </h2>
            <button style={{ display: "flex", alignItems: "center", gap: 4, color: "#4f6ef7", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              View all <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
            {loading && [0,1,2,3].map((i) => <SurveyCardSkeleton key={i} />)}

            {!loading && error && (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "#94a3b8", gap: 10 }}>
                <span style={{ fontSize: 32 }}>⚠️</span>
                <p style={{ fontSize: 14 }}>{error}</p>
                <button onClick={fetchData} style={{ color: "#4f6ef7", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Thử lại</button>
              </div>
            )}

            {!loading && !error && surveys.length === 0 && (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", color: "#94a3b8", gap: 10 }}>
                <Inbox size={42} strokeWidth={1.5} />
                <p style={{ fontSize: 14 }}>Chưa có khảo sát nào.</p>
              </div>
            )}

            {!loading && !error && surveys.map((s, idx) => (
              <SurveyCard key={s.id} id={s.id} title={s.title} desc={s.description}
                createdAt={s.createdAt} questionsCount={s.questionsCount}
                responseCount={s.responseCount} timeLeft={s.timeLeft}
                done={doneSurveyIds.has(s.id)} onStart={handleStart} themeIndex={idx} />
            ))}
          </div>
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
            </div>
          </div>
          <WeekendChallenge />
        </aside>
      </div>
    </main>
  );
}