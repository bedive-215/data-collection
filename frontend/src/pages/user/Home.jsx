// ─── DashboardPage.jsx ────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ClipboardList, Clock, Zap,
  Trophy, FileText, Inbox, ArrowRight,
  Globe, Share2, Mail,
} from "lucide-react";
import { useResponse } from "@/providers/ResponseProvider";
import { useSurvey } from "@/providers/SurveyProvider";

/* ════════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════════ */
const C = {
  bg:           "#f7f8fc",
  surface:      "#ffffff",
  surfaceHigh:  "#f4f5f9",
  border:       "rgba(0,0,0,0.07)",
  primary:      "#4361ee",
  primaryLight: "#eef0fd",
  primaryBorder:"#c5cdfb",
  text:         "#0f1117",
  textSub:      "#6b7280",
  textDim:      "#9ca3af",
  error:        "#ef4444",
  success:      "#10b981",
  warning:      "#f59e0b",
  font:         "'DM Sans', 'Inter', sans-serif",
  thumbGrads: [
    "linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 100%)",
    "linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)",
    "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)",
    "linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)",
    "linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)",
    "linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%)",
  ],
};

const STATUS_MAP = {
  ACTIVE:    { label:"Đang mở",  color:"#059669", bg:"#d1fae5" },
  DRAFT:     { label:"Nháp",     color:C.textSub, bg:"#f3f4f6" },
  EXPIRED:   { label:"Hết hạn",  color:"#dc2626", bg:"#fee2e2" },
  SCHEDULED: { label:"Lên lịch", color:"#d97706", bg:"#fef3c7" },
  CLOSED:    { label:"Đã đóng",  color:"#6b7280", bg:"#f3f4f6" },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:999, color:s.color, background:s.bg, letterSpacing:"0.03em", fontFamily:C.font }}>
      {s.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   MY SURVEY MINI CARD
════════════════════════════════════════════════════════════════ */
function MySurveyMiniCard({ survey, index, onClick }) {
  const thumb = C.thumbGrads[index % C.thumbGrads.length];
  const isClosed = survey.status === "CLOSED";
  const isPublished = survey.is_published;

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all .22s cubic-bezier(0.23,1,0.32,1)",
        opacity: isClosed ? 0.72 : 1,
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(67,97,238,.1), 0 2px 10px rgba(0,0,0,.05)"; e.currentTarget.style.borderColor = "rgba(67,97,238,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{ height: 90, background: isClosed ? "linear-gradient(135deg,#f1f5f9,#e2e8f0)" : thumb, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={30} color="rgba(67,97,238,.18)" strokeWidth={1.5} />
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
          <StatusBadge status={survey.status} />
          {isPublished && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, color: "#4361ee", background: "rgba(67,97,238,0.12)", display: "flex", alignItems: "center", gap: 3, fontFamily: C.font }}>
              <Globe size={7} /> Live
            </span>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 4 }}>
          <button onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,.85)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.7)"; }}
          ><Share2 size={10} color={C.textSub} /></button>
          <button onClick={e => e.stopPropagation()} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid rgba(255,255,255,.6)", background: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,.85)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.7)"; }}
          ><Mail size={10} color={C.textSub} /></button>
        </div>
      </div>
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3, lineHeight: 1.45, fontFamily: C.font, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{survey.title}</h3>
          <p style={{ fontSize: 11, color: C.textSub, lineHeight: 1.55, fontFamily: C.font, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 8 }}>{survey.description || "Không có mô tả"}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.textDim, fontFamily: C.font }}>
          <Clock size={10} />
          {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PUBLIC SURVEY MINI CARD
════════════════════════════════════════════════════════════════ */
function PublicSurveyMiniCard({ survey, done, onStart, onViewSubmission }) {
  return (
    <div
      onClick={() => done && onViewSubmission(survey.id, survey.title)}
      style={{
        background: C.surface,
        border: `1px solid ${done ? "rgba(16,185,129,0.18)" : C.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        cursor: done ? "pointer" : "default",
        transition: "all .2s cubic-bezier(0.23,1,0.32,1)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = done ? "0 10px 28px rgba(16,185,129,.1)" : "0 10px 28px rgba(67,97,238,.08)"; e.currentTarget.style.borderColor = done ? "rgba(16,185,129,.28)" : "rgba(67,97,238,.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = done ? "rgba(16,185,129,0.18)" : C.border; }}
    >
      {done && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, #10b981, #34d399)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#ecfdf5" : C.primaryLight, flexShrink: 0 }}>
          {done
            ? <CheckCircle2 size={16} color="#10b981" strokeWidth={1.8} />
            : <FileText size={16} color={C.primary} strokeWidth={1.8} />
          }
        </div>
        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 9, fontWeight: 700, letterSpacing: "0.03em", background: done ? "#dcfce7" : C.surfaceHigh, color: done ? "#059669" : C.textDim, border: `1px solid ${done ? "#a7f3d0" : C.border}`, fontFamily: C.font }}>
          {done ? "Đã xong" : "Survey"}
        </span>
      </div>
      <div>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3, lineHeight: 1.45, fontFamily: C.font, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{survey.title}</h3>
        <p style={{ fontSize: 11, color: C.textSub, lineHeight: 1.55, fontFamily: C.font, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{survey.description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.textDim, fontFamily: C.font }}>
          <Clock size={10} />
          {survey.created_at ? new Date(survey.created_at).toLocaleDateString("vi-VN") : ""}
        </div>
        {done
          ? <span style={{ padding: "4px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#059669", border: "1px solid #a7f3d0", fontFamily: C.font }}>Xem →</span>
          : <button onClick={e => { e.stopPropagation(); onStart(survey.id); }} style={{ padding: "4px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, color: "#fff", background: C.primary, border: "none", cursor: "pointer", fontFamily: C.font, transition: "opacity .12s" }} onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>Bắt đầu →</button>
        }
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════════════ */
function MiniCardSkeleton({ hasThumb }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", animation: "pulse 1.5s ease-in-out infinite" }}>
      {hasThumb && <div style={{ height: 90, background: "#f3f4f6" }} />}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {!hasThumb && <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f3f4f6" }} />}
        <div style={{ height: 11, background: "#f3f4f6", borderRadius: 5, width: "70%" }} />
        <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, width: "100%" }} />
        <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, width: "55%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ height: 10, width: 48, background: "#f3f4f6", borderRadius: 5 }} />
          <div style={{ height: 26, width: 70, background: "#f3f4f6", borderRadius: 7 }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STAT CARD
════════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub, subColor, loading }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "18px 20px", cursor: "pointer", transition: "all .18s",
      display: "flex", flexDirection: "column", gap: 10,
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(67,97,238,.2)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(67,97,238,.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: 12, right: 14, opacity: 0.06 }}>
        <Icon size={44} color={iconColor} />
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.textSub, fontFamily: C.font, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: C.font, lineHeight: 1 }}>
          {loading ? <span style={{ fontSize: 20, color: C.textDim }}>—</span> : value}
        </div>
        {sub && <div style={{ fontSize: 11, color: subColor || C.textSub, marginTop: 4, fontFamily: C.font, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ACTIVITY ITEM
════════════════════════════════════════════════════════════════ */
const MOCK_ACTIVITIES = [
  { Icon: CheckCircle2, iconColor: C.primary, iconBg: C.primaryLight, title: "Health & Fitness Survey", sub: "Hoàn thành · 2 giờ trước", xp: "+250 XP", xpColor: "#10b981" },
  { Icon: Trophy,       iconColor: "#f59e0b", iconBg: "#fef3c7",       title: "Level 12 Reached",       sub: "Achievement · Hôm qua",   xp: "+500 XP", xpColor: "#d97706" },
  { Icon: CheckCircle2, iconColor: C.primary, iconBg: C.primaryLight,  title: "Food Preference Study",  sub: "Hoàn thành · 1 ngày trước", xp: "+150 XP", xpColor: "#10b981" },
];

function ActivityItem({ Icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px", borderRadius: 11,
      background: C.surfaceHigh, border: `1px solid ${C.border}`,
      cursor: "pointer", transition: "all .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = C.primaryLight; e.currentTarget.style.borderColor = "rgba(67,97,238,.18)"; e.currentTarget.style.transform = "translateX(2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.surfaceHigh; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateX(0)"; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: C.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 11, color: C.textSub, fontFamily: C.font }}>{sub}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: xpColor, whiteSpace: "nowrap", fontFamily: C.font }}>{xp}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   WEEKEND CHALLENGE
════════════════════════════════════════════════════════════════ */
function WeekendChallenge() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <img
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.48)", transition: "transform .6s ease" }}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG03R-J3AOEaCVe7DOPDBsSzk1qBnJ_cSOKMi5AtWX-_YU-HZIisL7r7jIyUMnW7sBEmJ_4pRWir4wBA2cd2MjB4BYbuqmcc5fzNLckPRq-4RENObTC1rJo8Ryymqd22pKrVvKzL9g1TLvmUt9pDbtnrdon68H8nONY8hAYzUKzfJ26Nmu9bHt4EXj9P2Kg-HUmLt0kiBuZqOOXcn_ukIKBvAjTr5ZjNJVRiSQzsRmEfrv0SgAvPfujpNKhEnpFAlu6DaWPGehLbSj"
          alt=""
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,30,80,.85) 0%, transparent 100%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, padding: "22px 20px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: "rgba(67,97,238,.25)", border: "1px solid rgba(67,97,238,.35)", marginBottom: 12, backdropFilter: "blur(8px)" }}>
          <Zap size={11} color="#b3caff" />
          <span style={{ fontSize: 9, fontWeight: 700, color: "#b3caff", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: C.font }}>Active Challenge</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.2, fontFamily: C.font }}>Weekend Challenge</h3>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginBottom: 14, lineHeight: 1.6, fontFamily: C.font }}>
          Hoàn thành 5 khảo sát trong 48h để nhận <span style={{ color: "#b3caff", fontWeight: 700 }}>Bonus 2000 XP</span>.
        </p>
        <button style={{ width: "100%", padding: "9px 0", background: "#fff", color: "#1a1a2e", fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 12, fontFamily: C.font, transition: "background .15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#b3caff"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          Join Challenge
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION HEADER
════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, count, countColor, countBg, countBorder, onViewAll }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: C.font }}>{title}</span>
        {count != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: countBg || C.primaryLight, color: countColor || C.primary, border: `1px solid ${countBorder || C.primaryBorder}`, fontFamily: C.font }}>{count}</span>
        )}
      </div>
      <button onClick={onViewAll} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: C.primary, background: "none", border: "none", cursor: "pointer", fontFamily: C.font, padding: "4px 8px", borderRadius: 7, transition: "background .12s" }}
        onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        Xem tất cả <ArrowRight size={12} />
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { getAllMyResponses } = useResponse();

  // ── Lấy cả mySurveys, publicSurveys, và các fetch functions từ provider ──
  const {
    mySurveys,
    publicSurveys,
    fetchMySurveys,
    fetchPublicSurveys,
  } = useSurvey();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch responses để biết user đã làm survey nào
      const responsesRes = await getAllMyResponses().catch(() => null);
      const responsesList = responsesRes?.data ?? [];
      setDoneSurveyIds(new Set(responsesList.map(r => r.survey_id ?? r.surveyId)));

      // Fetch cả my surveys lẫn public surveys song song
      await Promise.all([
        fetchMySurveys(1, 20),
        fetchPublicSurveys(),
      ]);

    } catch (err) {
      console.error("Dashboard fetchData error:", err);
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line

  const handleStart = (id) => navigate(`/user/survey/${id}`);

  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;
  const doneCount    = publicSurveys.filter(s =>  doneSurveyIds.has(s.id)).length;

  // Chỉ hiển thị tối đa 2 card mỗi section trên dashboard
  const previewMySurveys     = mySurveys.slice(0, 2);
  const previewPublicSurveys = publicSurveys.slice(0, 2);

  return (
    <main style={{ minHeight: "100vh", background: C.bg, fontFamily: C.font, padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Welcome ── */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 6px", fontFamily: C.font, letterSpacing: "-0.02em" }}>Chào mừng trở lại! 👋</h1>
        <p style={{ fontSize: 13, color: C.textSub, margin: 0, fontFamily: C.font, lineHeight: 1.6 }}>
          Bạn đã hoàn thành <strong style={{ color: C.primary }}>{loading ? "..." : doneCount}</strong> khảo sát.
          {!loading && pendingCount > 0 && <> Còn <strong style={{ color: C.text }}>{pendingCount}</strong> khảo sát đang chờ bạn.</>}
        </p>
      </header>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard
          icon={ClipboardList} iconColor={C.primary} iconBg={C.primaryLight}
          label="Surveys completed" value={doneCount}
          sub={`/ ${publicSurveys.length} tổng`} subColor={C.textSub}
          loading={loading}
        />
        <StatCard
          icon={FileText} iconColor="#f59e0b" iconBg="#fef3c7"
          label="Pending" value={String(pendingCount).padStart(2, "0")}
          sub="Chưa hoàn thành" subColor="#d97706"
          loading={loading}
        />
        <StatCard
          icon={Trophy} iconColor="#d97706" iconBg="#fef3c7"
          label="Rewards / XP" value="12,450"
          sub="+250 XP hôm nay" subColor="#10b981"
          loading={false}
        />
      </div>

      {/* ── Main 2-col ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* Left: surveys */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* My Surveys */}
          <section>
            <SectionHeader
              title="My Surveys"
              count={mySurveys.length}
              onViewAll={() => navigate("/user/my-surveys")}
            />
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MiniCardSkeleton hasThumb /><MiniCardSkeleton hasThumb />
              </div>
            ) : mySurveys.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.textSub }}>
                <Inbox size={32} color={C.textDim} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12, fontFamily: C.font }}>Chưa có survey nào</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {previewMySurveys.map((survey, i) => (
                  <MySurveyMiniCard
                    key={survey.id}
                    survey={survey}
                    index={i}
                    onClick={() => navigate(`/user/my-surveys/${survey.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${C.border}, ${C.border}, transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 12px", borderRadius: 999, border: `1px solid ${C.border}`, background: "#fff" }}>
              <Globe size={10} color={C.textDim} />
              <span style={{ fontSize: 9, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: C.font }}>Công khai</span>
            </div>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, ${C.border}, ${C.border}, transparent)` }} />
          </div>

          {/* Public Surveys */}
          <section>
            <SectionHeader
              title="Khảo Sát"
              count={publicSurveys.length}
              countColor="#059669"
              countBg="#dcfce7"
              countBorder="#a7f3d0"
              onViewAll={() => navigate("/user/surveys")}
            />
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <MiniCardSkeleton /><MiniCardSkeleton />
              </div>
            ) : publicSurveys.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.textSub }}>
                <Inbox size={32} color={C.textDim} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 12, fontFamily: C.font }}>Chưa có khảo sát công khai</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {previewPublicSurveys.map(s => (
                  <PublicSurveyMiniCard
                    key={s.id}
                    survey={s}
                    done={doneSurveyIds.has(s.id)}
                    onStart={handleStart}
                    onViewSubmission={() => navigate("/user/surveys")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24 }}>
          <section>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 12, fontFamily: C.font }}>Recent Activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {MOCK_ACTIVITIES.map((a, i) => <ActivityItem key={i} {...a} />)}
            </div>
          </section>
          <WeekendChallenge />
        </aside>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.7;}50%{opacity:1;} }
      `}</style>
    </main>
  );
}