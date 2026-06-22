import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Rocket, ArrowRight, Star, Loader2, LayoutGrid, RefreshCw, Inbox, Globe,
  Trophy, Sparkles, CheckCircle2, Flame, Medal, CalendarDays, Zap} from "lucide-react";
import { useResponse } from "@/providers/ResponseProvider";
import { useSurvey } from "@/providers/SurveyProvider";
import AnimatedSurveyBackdrop from "@/components/AnimatedSurveyBackdrop";
import { ROUTERS } from "@/utils/constants";
import { SurveyCardHome, ShareModal, C } from "@/components/survey/SurveyCardHome";
import { SurveyCardSkeleton } from "@/utils/surveyHelpers";
import { useGamification } from "@/contexts/GamificationContext";

/* ── Expired Modal (for public surveys not completed) ─────────────── */
function ExpiredModal({ open, onClose, survey }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.5)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn .15s ease"}}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #e8ecf2",
        width: "100%", maxWidth: 400, overflow: "hidden",
        animation: "slideUp .2s cubic-bezier(.16,1,.3,1)",
        fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
        textAlign: "center", padding: "32px 24px"}}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Clock size={26} color="#ef4444" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Khảo sát đã kết thúc</h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
          Khảo sát <strong>"{survey?.title}"</strong> đã kết thúc và không còn nhận phản hồi.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "10px 32px",
            background: "#f4f6f8",
            border: "1px solid #e8ecf2", borderRadius: 10,
            color: "#64748b", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif"}}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

/* ── Extend Modal ─────────────────────────────────────────────────── */
function ExtendModal({ open, onClose, survey, onExtend }) {
  const [submitting, setSubmitting] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && survey?.end_at) {
      const d = new Date(survey.end_at);
      d.setDate(d.getDate() + 7);
      setNewDate(d.toISOString().slice(0, 16));
    }
    setError("");
  }, [open, survey]);

  const handleExtend = async () => {
    if (!newDate) { setError("Vui lòng chọn ngày"); return; }
    const selected = new Date(newDate);
    if (selected <= new Date()) { setError("Ngày phải lớn hơn hiện tại"); return; }
    setSubmitting(true);
    try {
      await onExtend(survey.id, newDate);
      onClose();
    } catch {
      setError("Gia hạn thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.5)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeIn .15s ease"}}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #e8ecf2",
        width: "100%", maxWidth: 420, overflow: "hidden",
        animation: "slideUp .2s cubic-bezier(.16,1,.3,1)",
        fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif"}}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px 0" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <RefreshCw size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Khảo sát đã hết hạn</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{survey?.title}</p>
          </div>
        </div>

        <div style={{ padding: "16px 24px 20px" }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
              Khảo sát này đã hết hạn và không thể nhận phản hồi mới.
            </p>
            {survey?.end_at && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>
                Ngày kết thúc cũ: {new Date(survey.end_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Ngày kết thúc mới</label>
            <input
              type="datetime-local"
              value={newDate}
              onChange={e => { setNewDate(e.target.value); setError(""); }}
              min={new Date().toISOString().slice(0, 16)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1.5px solid ${error ? "#fecaca" : "#e8ecf2"}`,
                background: "#fff", fontSize: 14, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", color: "#0f172a",
                outline: "none"}}
            />
            {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e8ecf2", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif" }}>
              Đóng
            </button>
            <button
              onClick={handleExtend}
              disabled={submitting}
              style={{
                flex: 1, padding: "10px 16px", borderRadius: 10,
                background: submitting ? "#94a3b8" : "linear-gradient(135deg,#f59e0b,#fbbf24)",
                border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6}}
            >
              {submitting
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang xử lý...</>
                : <><RefreshCw size={15} /> Gia hạn</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



function GlassmorphCard({ children, style = {}, delay = 0, hover = true }) {
  const base = {
    background: C.surface,
    backdropFilter: "blur(24px) saturate(190%)",
    WebkitBackdropFilter: "blur(24px) saturate(190%)",
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 22,
    padding: 24,
    animation: `slideInUp 0.8s ease-out ${delay}s both`,
    transition:"transform 0.28s ease, border-color 0.22s ease",
    ...style};
  return (
    <div
      style={base}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        
        e.currentTarget.style.borderColor = "rgba(129,140,248,0.35)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        
        e.currentTarget.style.borderColor = C.glassBorder;
      } : undefined}
    >
      {children}
    </div>
  );
}

function WelcomeHero({ loading, doneCount, pendingCount, totalCount, onOpenSurveys }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "28px 30px 30px",
        borderRadius: 28,
        overflow: "hidden",
        background: "linear-gradient(148deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.48) 55%, rgba(238,242,255,0.65) 100%)",
        backdropFilter: "blur(26px)",
        WebkitBackdropFilter: "blur(26px)",
        border: "1px solid rgba(255,255,255,0.82)",
        animation: "slideInUp 0.72s ease-out both",
        flex: "1 1 320px",
        minHeight: 220}}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 28 }}>
        <div
          style={{
            position: "absolute",
            top: "-60%",
            left: "-30%",
            width: "55%",
            height: "220%",
            background: "linear-gradient(118deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.15) 58%, transparent 100%)",
            animation: "shimmerSweep 7s ease-in-out infinite",
            transform: "rotate(-18deg)",
            willChange: "transform"}}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          width: 88,
          height: 88,
          borderRadius: 22,
          background: "linear-gradient(135deg, rgba(129,140,248,0.45), rgba(244,114,182,0.25))",
          opacity: 0.85,
          transform: "rotate(-16deg)",
          pointerEvents: "none",
          filter: "blur(1px)",
          animation: "floatAccent 10s ease-in-out infinite"}}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"}}
          >
            <LayoutGrid size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.textSub,
              fontFamily: C.font}}
          >
            Trang chủ
          </span>
        </div>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: "clamp(26px, 4vw, 34px)",
            fontWeight: 900,
            lineHeight: 1.15,
            fontFamily: C.font,
            background: "linear-gradient(120deg,#0f172a 0%,#4f46e5 42%,#db2777 88%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "titleAurora 8s ease-in-out infinite alternate"}}
        >
          Chào mừng trở lại
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: C.textSub, lineHeight: 1.55, maxWidth: 440, fontFamily: C.font }}>
          Theo dõi tiến độ khảo sát công khai, mở nhanh bản thảo của bạn và vào không gian khảo sát khi cần.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textDim, fontFamily: C.font }}>
            {loading ? "Đang tải…" : `${doneCount}/${totalCount} đã hoàn thành · ${pendingCount} còn lại`}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProgressHeroCard({ doneCount, pendingCount, totalCount, loading }) {
  return (
    <div
      style={{
        flex: "1 1 280px",
        maxWidth: 420,
        borderRadius: 26,
        padding: "28px 26px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        animation: "slideInUp 0.8s ease-out 0.08s both",
        background: "linear-gradient(148deg,#4361ee 0%,#6c7ef7 45%,#a855f7 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
        transition:"transform 0.28s ease",
        minHeight: 220}}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent)",
          borderRadius: "50%",
          opacity: 0.6,
          animation: "float 6s ease-in-out infinite"}}
      />
      <div
        style={{
          position: "absolute",
          bottom: -24,
          left: -24,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent)",
          borderRadius: "50%",
          opacity: 0.55,
          animation: "float 8s ease-in-out infinite reverse"}}
      />

      <div style={{ position: "relative", zIndex: 1, fontFamily: C.font }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Rocket size={26} color="rgba(255,255,255,0.95)" />
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.92 }}>
            Tiến độ công khai
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 900, marginBottom: 22, marginTop: 0, lineHeight: 1.15 }}>
          {loading ? "…" : `${doneCount}/${totalCount}`}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 11, opacity: 0.88, marginBottom: 4 }}>Đã xong</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{loading ? "—" : doneCount}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.14)", borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 11, opacity: 0.88, marginBottom: 4 }}>Chưa làm</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{loading ? "—" : pendingCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoCard({ children, size = "normal", style = {}, delay = 0 }) {
  return (
    <GlassmorphCard
      style={{
        gridColumn: size === "wide" ? "span 2" : "span 1",
        gridRow: size === "tall" ? "span 2" : "span 1",
        minHeight: size === "tall" ? "400px" : "auto",
        ...style}}
      delay={delay}
    >
      {children}
    </GlassmorphCard>
  );
}

function BentoStatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <BentoCard delay={delay}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", fontFamily: C.font }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${color}18, ${color}35)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            border: `1px solid ${color}28`}}
        >
          <Icon size={26} color={color} strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textSub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            {label}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8}}
          >
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>{sub}</div>}
        </div>
      </div>
    </BentoCard>
  );
}

function GamificationQuickStatsCard() {
  const { balance, loading } = useGamification();

  const stars = balance?.star_balance ?? 0;
  const streak = balance?.streak_count ?? 0;
  const RankIconComp = balance?.rank_info?.icon ? () => <span>{balance.rank_info.icon}</span> : Medal;
  const rankName = balance?.rank_info?.name;
  const rankLabel = rankName === "SILVER" ? "Bạc" : rankName === "GOLD" ? "Vàng" : rankName === "PLATINUM" ? "Bạch Kim" : rankName === "DIAMOND" ? "Kim Cương" : "Đồng";

  return (
    <BentoCard delay={0.2}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", fontFamily: C.font }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={18} color="#f59e0b" fill="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.textSub }}>Ví Sao</div>
            <div style={{ fontSize: 20, fontWeight: 900, background: "linear-gradient(135deg, #f59e0b, #d97706)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {loading ? "—" : stars.toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "6px 8px", background: "rgba(245,158,11,0.08)", borderRadius: 10, border: "1px solid rgba(245,158,11,0.15)" }}>
            <div style={{ fontSize: 14, fontWeight: 900, display: "flex", justifyContent: "center" }}>
              <RankIconComp size={20} className="text-amber-600" />
            </div>
            <div style={{ fontSize: 10, color: C.textSub, fontWeight: 600, marginTop: 2 }}>{rankLabel}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "6px 8px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)" }}>
            <div style={{ fontSize: 14, fontWeight: 900, display: "flex", justifyContent: "center" }}>
              <Flame size={18} className="text-red-500" />
            </div>
            <div style={{ fontSize: 10, color: C.textSub, fontWeight: 600, marginTop: 2 }}>{streak} ngày</div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

// ── CHECKIN BANNER ─────────────────────────────────────────────────────
// Full-width, prominent banner at top of Home page for quick daily check-in
function CheckinBanner() {
  const { balance, checkinStatus, loading, checkinLoading, doCheckin } = useGamification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [showDone, setShowDone] = useState(true);

  const streak = balance?.streak_count ?? 0;
  const canCheckin = checkinStatus?.can_checkin ?? false;
  const multiplier = checkinStatus?.current_multiplier ?? 1;
  const nextBonusTier = checkinStatus?.next_bonus_tier;

  const StreakIconComp = streak >= 7 ? Flame : streak >= 4 ? Flame : streak > 0 ? Sparkles : null;
  const starsToEarn = streak >= 7 ? 100 : streak >= 4 ? 75 : 50;

  const handleCheckin = async () => {
    try {
      const res = await doCheckin();
      setResult(res);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (_) {}
  };

  useEffect(() => {
    if (checkinStatus && !canCheckin) {
      setShowDone(true);
      const timer = setTimeout(() => setShowDone(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [checkinStatus, canCheckin]);

  if (checkinStatus === null) return null;

  if (showSuccess && result) {
    return (
      <div style={{
        borderRadius: 20, padding: "20px 24px", marginBottom: 20,
        background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
        border: "1.5px solid #34d399",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
        animation: "slideInUp 0.4s cubic-bezier(.16,1,.3,1)"}}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Sparkles size={40} className="text-green-600" />
          <div>
            <div style={{ fontFamily: C.font, fontWeight: 800, fontSize: 18, color: "#065f46" }}>
              Điểm danh thành công!
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.font, fontSize: 14, color: "#059669", marginTop: 2 }}>
              Chuỗi {result.streak_count} ngày
              {StreakIconComp && <StreakIconComp size={16} className="text-red-500" />}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: C.font, fontWeight: 900, fontSize: 36, color: "#065f46", lineHeight: 1 }}>
            +{result.stars_earned}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, fontFamily: C.font, fontSize: 13, color: "#059669", fontWeight: 600 }}>
            sao <Star size={12} fill="currentColor" />
          </div>
          {result.is_new_streak_record && (
            <div style={{ fontFamily: C.font, fontSize: 12, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
              <Trophy size={12} className="inline" /> Kỷ lục mới!
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!canCheckin) {
    if (!showDone) return null;
    return (
      <div style={{
        borderRadius: 20, padding: "18px 24px", marginBottom: 20,
        background: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
        border: "1.5px solid #6ee7b7",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
        fontFamily: C.font,
        animation: "slideInUp 0.35s cubic-bezier(.16,1,.3,1)",
        transition: "opacity 0.3s, transform 0.3s"}}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CheckCircle2 size={32} className="text-green-600" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#065f46" }}>Đã điểm danh hôm nay!</div>
            <div style={{ fontSize: 13, color: "#059669", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <span>Chuỗi {streak} ngày</span>
              {StreakIconComp && <StreakIconComp size={14} className="text-red-500" />}
              <span>· Hẹn gặp bạn ngày mai</span>
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 12, padding: "10px 16px"}}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#065f46" }}>
            {streak}
          </span>
          <span style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>ngày</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 20, padding: "18px 24px", marginBottom: 20,
      background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)",
      border: "1.5px solid rgba(245,158,11,0.4)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 14,
      fontFamily: C.font,
      position: "relative", overflow: "hidden"}}>
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 120, height: 120, borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        pointerEvents: "none"}} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CalendarDays size={36} className="text-amber-600" />
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: "#92400e" }}>Điểm danh hôm nay</div>
          <div style={{ fontSize: 13, color: "#b45309", marginTop: 2 }}>
            {streak > 0
              ? `Chuỗi ${streak} ngày → nhận +${starsToEarn} sao`
              : "Nhận ngay +50 sao khi điểm danh!"
            }
            {multiplier > 1 && (
              <span style={{ marginLeft: 6, fontWeight: 800, color: "#dc2626" }}>
                x{multiplier}
              </span>
            )}
          </div>
          {nextBonusTier && (
            <div style={{ fontSize: 11, color: "#d97706", marginTop: 3, fontWeight: 600 }}>
              Còn {nextBonusTier.days_needed} ngày nữa để đạt x{nextBonusTier.next_multiplier}!
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckin}
        disabled={checkinLoading}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 24px", borderRadius: 14,
          border: "none",
          background: checkinLoading
            ? "#9ca3af"
            : "linear-gradient(135deg, #f59e0b, #ea580c)",
          color: "#fff", fontFamily: C.font,
          fontSize: 14, fontWeight: 700,
          cursor: checkinLoading ? "not-allowed" : "pointer",
          opacity: checkinLoading ? 0.8 : 1,
          transition: "all 0.2s",
          flexShrink: 0}}
        onMouseEnter={(e) => {
          if (!checkinLoading) {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
            
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          
        }}
        onMouseDown={(e) => {
          if (!checkinLoading) e.currentTarget.style.transform = "translateY(0) scale(0.97)";
        }}
        onMouseUp={(e) => {
          if (!checkinLoading) e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
        }}
      >
        {checkinLoading ? (
          <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
        ) : (
          <><Zap size={16} /> Nhận +{starsToEarn} sao</>
        )}
      </button>
    </div>
  );
}

// ── STAT CARD COMPONENTS ────────────────────────────────────────────────



function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  if (Array.isArray(val.items)) return val.items;
  return [];
}

function SectionHeading({ children, style = {} }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0, fontFamily: C.font, ...style }}>
      {children}
    </h2>
  );
}

const primaryBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
  background: "linear-gradient(135deg,#4361ee,#6c7ef7)",
  border: "none",
  padding: "9px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontFamily: C.font,
  transition:"transform .15s"};

const successBtn = {
  ...primaryBtn,
  background: "linear-gradient(135deg,#10b981,#059669)"};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { getAllMyResponses } = useResponse();
  const { mySurveys, publicSurveys, fetchMySurveys, fetchPublicSurveys, shareLink, closeSurvey, updateSurvey } = useSurvey();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Share modal state
  const [shareModal, setShareModal] = useState({ open: false, surveyId: null, surveyTitle: "", shareUrl: "", loading: false, error: "" });
  const [extendModal, setExtendModal] = useState({ open: false, survey: null });
  const [expiredModal, setExpiredModal] = useState({ open: false, survey: null });

  const fetchData = async () => {
    try {
      setLoading(true);

      const responsesRes = await getAllMyResponses().catch(() => null);
      const responsesList = toArray(responsesRes);
      setDoneSurveyIds(new Set(responsesList.map((r) => r.survey_id ?? r.surveyId)));

      await Promise.all([fetchMySurveys(1, 20), fetchPublicSurveys()]);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const surveyPath = (id) => ROUTERS.USER.SURVEY_TAKE.replace(":surveyId", id);
  const responsePath = (id) => ROUTERS.USER.SURVEY_RESPONSE.replace(":surveyId", id);

  const handleStart = (id) => navigate(surveyPath(id));

  // Share: open modal (generate link on demand)
  const handleShare = useCallback((surveyId) => {
    const survey = mySurveys.find((s) => s.id === surveyId);
    setShareModal({ open: true, surveyId, surveyTitle: survey?.title || "", shareUrl: "", loading: false, error: "" });
  }, [mySurveys]);

  const handleGenerateLink = async () => {
    setShareModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const result = await shareLink(shareModal.surveyId);
      const url = typeof result === "string" ? result : result?.url ?? result?.data?.url ?? "";
      setShareModal((prev) => ({ ...prev, shareUrl: url, loading: false }));
    } catch {
      setShareModal((prev) => ({ ...prev, loading: false, error: "Tạo link thất bại. Vui lòng thử lại." }));
    }
  };

  // Lock: close survey and refresh immediately
  const handleLock = useCallback(async (surveyId) => {
    try {
      await closeSurvey(surveyId);
      setDoneSurveyIds((prev) => {
        const next = new Set(prev);
        next.add(surveyId);
        return next;
      });
      await fetchMySurveys(1, 20);
    } catch (err) {
      console.error("Lock error:", err);
    }
  }, [closeSurvey, fetchMySurveys]);

  const handleExtend = useCallback(async (surveyId, new_end_at) => {
    try {
      await updateSurvey(surveyId, { end_at: new_end_at });
      await fetchMySurveys(1, 20);
    } catch (err) {
      console.error("Extend error:", err);
    }
  }, [updateSurvey, fetchMySurveys]);

  const handleSaveEdit = useCallback(async (surveyId, formData) => {
    try {
      await updateSurvey(surveyId, formData);
      await fetchMySurveys(1, 20);
    } catch (err) {
      console.error("Edit error:", err);
    }
  }, [updateSurvey, fetchMySurveys]);

  const pendingCount = publicSurveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount = publicSurveys.filter((s) => doneSurveyIds.has(s.id)).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "transparent",
        fontFamily: C.font,
        padding: "16px 18px 48px",
        overflowX: "hidden",
        position: "relative"}}
    >
      <AnimatedSurveyBackdrop />

      <div style={{ maxWidth: 1260, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <CheckinBanner />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: 22,
            marginBottom: 36}}
        >
          <WelcomeHero
            loading={loading}
            doneCount={doneCount}
            pendingCount={pendingCount}
            totalCount={publicSurveys.length}
            onOpenSurveys={() => navigate(ROUTERS.USER.SURVEYS)}
          />
          <ProgressHeroCard
            doneCount={doneCount}
            pendingCount={pendingCount}
            totalCount={publicSurveys.length}
            loading={loading}
          />
        </div>

        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <SectionHeading>Khảo sát của tôi</SectionHeading>
            <button
              type="button"
              onClick={() => navigate(ROUTERS.USER.MY_SURVEYS)}
              style={primaryBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                
              }}
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <SurveyCardSkeleton key={i} />
              ))}
            </div>
          ) : mySurveys.length === 0 ? (
            <GlassmorphCard>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Inbox size={40} color={C.textDim} style={{ marginBottom: 16 }} />
                <p style={{ color: C.textSub, fontSize: 14, fontFamily: C.font }}>Chưa có khảo sát nào</p>
              </div>
            </GlassmorphCard>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {mySurveys.slice(0, 5).map((survey, i) => (
                <SurveyCardHome
                  key={survey.id}
                  survey={survey}
                  index={i}
                  onClick={() => navigate(`/user/my-surveys/${survey.id}/studio`)}
                  type="my"
                  onShare={handleShare}
                  onLock={handleLock}
                  onViewAnalytics={() => navigate(`/user/my-surveys/${survey.id}/studio?tab=analyze`)}
                  onSaveEdit={handleSaveEdit}
                  onExpiredClick={(s) => setExtendModal({ open: true, survey: s })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Khảo sát công khai */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <SectionHeading>Khám phá</SectionHeading>
            <button
              type="button"
              onClick={() => navigate(ROUTERS.USER.SURVEYS)}
              style={primaryBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                
              }}
            >
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <SurveyCardSkeleton key={i} />
              ))}
            </div>
          ) : publicSurveys.length === 0 ? (
            <GlassmorphCard>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Globe size={40} color={C.textDim} style={{ marginBottom: 16 }} />
                <p style={{ color: C.textSub, fontSize: 14, fontFamily: C.font }}>
                  Chưa có khảo sát công khai nào
                </p>
              </div>
            </GlassmorphCard>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {publicSurveys.slice(0, 5).map((survey, i) => (
                <SurveyCardHome
                  key={survey.id}
                  survey={survey}
                  index={i}
                  onClick={() => {
                    const isExpired = survey.end_at && new Date(survey.end_at) < new Date();
                    if (isExpired) {
                      setExpiredModal({ open: true, survey });
                      return;
                    }
                    if (doneSurveyIds.has(survey.id)) {
                      navigate(responsePath(survey.id));
                    } else {
                      handleStart(survey.id);
                    }
                  }}
                  type="public"
                  isDone={doneSurveyIds.has(survey.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      <ExtendModal
        open={extendModal.open}
        onClose={() => setExtendModal({ open: false, survey: null })}
        survey={extendModal.survey}
        onExtend={handleExtend}
      />

      <ExpiredModal
        open={expiredModal.open}
        onClose={() => setExpiredModal({ open: false, survey: null })}
        survey={expiredModal.survey}
      />

      <ShareModal
        open={shareModal.open}
        onClose={() => setShareModal((p) => ({ ...p, open: false }))}
        surveyTitle={shareModal.surveyTitle}
        shareUrl={shareModal.shareUrl}
        loading={shareModal.loading}
        error={shareModal.error}
        onGenerate={handleGenerateLink}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideInUp   { from { opacity:0; transform:translateY(36px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float       { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-14px) } }
        @keyframes pulse       { 0%,100% { opacity:.65 } 50% { opacity:1 } }
        @keyframes shimmerSweep{0%{transform:rotate(-18deg) translateX(-55%);}100%{transform:rotate(-18deg) translateX(155%);}}
        @keyframes floatAccent{0%,100%{transform:rotate(-16deg) translate(0,0);}50%{transform:rotate(-12deg) translate(-6px,8px);}}
        @keyframes titleAurora{0%{background-position:0% 50%;}100%{background-position:100% 50%;}}
        * { box-sizing:border-box }
        button { font-family:'Plus Jakarta Sans','DM Sans','Inter',sans-serif }
        @media (max-width: 960px) {
          .home-act-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .home-act-grid > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
