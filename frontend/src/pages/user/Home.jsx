// ─── DashboardPage.jsx ────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ClipboardList, Clock, Zap,
  Trophy, FileText, Inbox,
} from "lucide-react";
import surveyService from "@/services/surveyService";
import { useResponse } from "@/providers/ResponseProvider";

const activities = [
  { Icon: CheckCircle2, iconColor: "text-[#4f6ef7]", iconBg: "bg-[#eef2ff]", title: "Health & Fitness Survey", sub: "Hoàn thành • 2 giờ trước", xp: "+250 XP", xpColor: "text-[#22c55e]" },
  { Icon: Trophy,       iconColor: "text-[#f59e0b]", iconBg: "bg-[#fdf3e7]", title: "Level 12 Reached",       sub: "Achievement • Hôm qua",   xp: "+500 XP", xpColor: "text-[#d4a017]" },
  { Icon: CheckCircle2, iconColor: "text-[#4f6ef7]", iconBg: "bg-[#eef2ff]", title: "Food Preference Study", sub: "Hoàn thành • 1 ngày trước", xp: "+150 XP", xpColor: "text-[#22c55e]" },
];

/* ── SurveyCard ─────────────────────────────────────────────────── */
function SurveyCard({ id, title, desc, createdAt, done, onStart }) {
  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <div className={`group transition-all duration-200 p-6 rounded-2xl border cursor-pointer hover:-translate-y-0.5 hover:shadow-md
      ${done
        ? "bg-[#f0fdf4] border-[#bbf7d0] hover:bg-[#dcfce7]"
        : "bg-[#f8f9ff] border-gray-100 hover:bg-[#eef2ff]"
      }`}
    >
      <div className="flex justify-between items-start mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200
          ${done ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#eef2ff] text-[#4f6ef7]"}`}
        >
          {done ? <CheckCircle2 size={24} /> : <FileText size={24} />}
        </div>

        {done ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] uppercase tracking-wider">
            <CheckCircle2 size={10} />
            Đã hoàn thành
          </span>
        ) : (
          <span className="text-[10px] font-bold px-3 py-1 bg-gray-100 rounded-full text-gray-500 tracking-wider uppercase">
            Survey
          </span>
        )}
      </div>

      <h3 className="text-[15px] font-bold mb-2 text-gray-800 line-clamp-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-5 line-clamp-2 leading-relaxed">{desc}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Clock size={14} />
          <span>{displayDate}</span>
        </div>

        {done ? (
          <span className="px-5 py-2 bg-[#dcfce7] text-[#16a34a] font-bold rounded-xl text-sm border border-[#bbf7d0]">
            Hoàn thành ✓
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(id); }}
            className="px-5 py-2 bg-gradient-to-r from-[#6a8fff] to-[#4f6ef7] text-white font-bold rounded-xl text-sm active:scale-95 transition-all hover:opacity-90"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function SurveyCardSkeleton() {
  return (
    <div className="bg-[#f8f9ff] p-6 rounded-2xl border border-gray-100 animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="h-5 w-20 rounded-full bg-gray-200" />
      </div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
      <div className="h-3 bg-gray-200 rounded mb-1 w-full" />
      <div className="h-3 bg-gray-200 rounded mb-5 w-2/3" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-8 w-20 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

/* ── ActivityItem ───────────────────────────────────────────────── */
function ActivityItem({ Icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  return (
    <div className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-[#e8eeff] hover:translate-x-0.5 transition-all duration-200 cursor-pointer">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <span className={`text-sm font-bold ${xpColor} whitespace-nowrap`}>{xp}</span>
    </div>
  );
}

/* ── WeekendChallenge ───────────────────────────────────────────── */
function WeekendChallenge() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-7 group cursor-pointer">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-50"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCG03R-J3AOEaCVe7DOPDBsSzk1qBnJ_cSOKMi5AtWX-_YU-HZIisL7r7jIyUMnW7sBEmJ_4pRWir4wBA2cd2MjB4BYbuqmcc5fzNLckPRq-4RENObTC1rJo8Ryymqd22pKrVvKzL9g1TLvmUt9pDbtnrdon68H8nONY8hAYzUKzfJ26Nmu9bHt4EXj9P2Kg-HUmLt0kiBuZqOOXcn_ukIKBvAjTr5ZjNJVRiSQzsRmEfrv0SgAvPfujpNKhEnpFAlu6DaWPGehLbSj"
          alt="Weekend challenge background"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#002d64]/80 to-transparent" />
      </div>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4f6ef7]/20 backdrop-blur-md border border-[#4f6ef7]/30 mb-4">
          <Zap size={13} className="text-[#b3caff]" />
          <span className="text-[10px] font-bold text-[#b3caff] uppercase tracking-widest">Active Challenge</span>
        </div>
        <h3 className="text-2xl font-black text-white leading-tight mb-3">Weekend Challenge</h3>
        <p className="text-white/80 text-sm mb-5 max-w-[200px] leading-relaxed">
          Hoàn thành 5 khảo sát bất kỳ trong 48h tới để nhận{" "}
          <span className="text-[#b3caff] font-bold">Bonus 2000 XP</span>.
        </p>
        <button className="w-full py-2.5 bg-white text-[#1a1a2e] font-bold rounded-xl hover:bg-[#b3caff] transition-colors text-sm">
          Join Challenge
        </button>
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
      setLoading(true);
      setError(null);

      const [surveysRes, responsesRes] = await Promise.all([
        surveyService.getAllSurveys(),
        getAllMyResponses().catch(() => null),
      ]);

      setSurveys(surveysRes.data?.surveys ?? []);

      // ── FIX: backend trả { data: [...] }, phải lấy .data ──
      const responsesList = responsesRes?.data ?? [];
      const ids = new Set(
        responsesList.map((r) => r.survey_id ?? r.surveyId)
      );
      setDoneSurveyIds(ids);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Không thể tải danh sách khảo sát.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStart = (surveyId) => navigate(`/user/survey/${surveyId}`);

  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;

  return (
    <main className="max-w-7xl mx-auto px-8 py-12 bg-[#f4f5f7] min-h-screen">

      {/* Welcome Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">
          Chào mừng trở lại!
        </h1>
        <p className="text-gray-500 text-lg">
          Bạn đã hoàn thành{" "}
          <span className="text-[#4f6ef7] font-semibold">85%</span>{" "}
          mục tiêu tuần này. Chỉ còn 3 khảo sát nữa để nhận phần thưởng lớn.
        </p>
      </header>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white hover:bg-[#f0f4ff] transition-all duration-200 p-6 rounded-xl relative overflow-hidden group border border-gray-100 hover:shadow-sm cursor-pointer">
          <div className="absolute top-0 right-0 p-4 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity">
            <ClipboardList size={56} className="text-[#4f6ef7]" />
          </div>
          <p className="text-gray-500 font-medium mb-1 text-sm">Surveys completed</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {loading ? "—" : doneCount}
            </span>
            <span className="text-sm text-[#4f6ef7] font-semibold">đã hoàn thành</span>
          </div>
        </div>

        <div className="bg-white hover:bg-[#f0f4ff] transition-all duration-200 p-6 rounded-xl border border-gray-100 hover:shadow-sm cursor-pointer">
          <p className="text-gray-500 font-medium mb-1 text-sm">Pending</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {loading ? "—" : String(pendingCount).padStart(2, "0")}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#eef2ff] text-[#4f6ef7] font-bold">
              Priority
            </span>
          </div>
        </div>

        <div className="bg-white hover:bg-[#f0f4ff] transition-all duration-200 p-6 rounded-xl border border-[#b3caff]/30 hover:shadow-sm cursor-pointer">
          <p className="text-gray-500 font-medium mb-1 text-sm">Rewards / XP</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-[#d4a017]">12,450</span>
            <div className="h-2 w-2 rounded-full bg-[#4f6ef7] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Surveys – 2/3 */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-7">
            <h2 className="text-xl font-bold text-gray-800">
              Newest Surveys
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({surveys.length})
                </span>
              )}
            </h2>
            <button className="text-[#4f6ef7] text-sm font-semibold hover:underline">
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading && (
              <><SurveyCardSkeleton /><SurveyCardSkeleton />
                <SurveyCardSkeleton /><SurveyCardSkeleton /></>
            )}

            {!loading && error && (
              <div className="col-span-2 flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
                <span className="text-4xl">⚠️</span>
                <p className="text-sm">{error}</p>
                <button onClick={fetchData} className="text-[#4f6ef7] text-sm font-semibold hover:underline">
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && surveys.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
                <Inbox size={48} strokeWidth={1.5} />
                <p className="text-sm">Chưa có khảo sát nào.</p>
              </div>
            )}

            {!loading && !error && surveys.map((s) => (
              <SurveyCard
                key={s.id}
                id={s.id}
                title={s.title}
                desc={s.description}
                createdAt={s.createdAt}
                done={doneSurveyIds.has(s.id)}
                onStart={handleStart}
              />
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-5 text-gray-800">Recent Activity</h2>
            <div className="space-y-3">
              {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
            </div>
          </div>
          <WeekendChallenge />
        </aside>
      </div>
    </main>
  );
}