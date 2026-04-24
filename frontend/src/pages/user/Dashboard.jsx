// ─── DashboardPage.jsx ────────────────────────────────────────────

import { useEffect, useState } from "react";
import  surveyService  from "@/services/surveyService";

// ── SurveyCard ──────────────────────────────────────────────────────
function SurveyCard({ icon, iconColor, iconBg, tag, title, desc, duration }) {
  return (
    <div className="group bg-surface-container hover:bg-surface-bright transition-all duration-300 p-6 rounded-2xl border border-outline-variant/5">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-surface-container-highest rounded-full text-on-surface-variant tracking-wider uppercase">
          {tag}
        </span>
      </div>

      <h3 className="text-xl font-bold mb-2 text-on-surface font-headline">{title}</h3>
      <p className="text-on-surface-variant text-sm mb-6 line-clamp-2">{desc}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>{duration}</span>
        </div>

        <button className="px-6 py-2 bg-gradient-to-r from-primary-dim to-primary text-on-primary font-bold rounded-xl text-sm active:scale-95 transition-all">
          Start
        </button>
      </div>
    </div>
  );
}

// ── ActivityItem ────────────────────────────────────────────────────
function ActivityItem({ icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
        <span className={`material-symbols-outlined ${iconColor} text-xl`}>
          {icon}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant">{sub}</p>
      </div>
      <span className={`text-sm font-bold ${xpColor}`}>{xp}</span>
    </div>
  );
}

// ── WeekendChallenge ────────────────────────────────────────────────
function WeekendChallenge() {
  return (
    <div className="relative overflow-hidden rounded-3xl p-8 group bg-surface-container">
      <h3 className="text-xl font-bold mb-3">Weekend Challenge</h3>
      <p className="text-sm mb-4">
        Hoàn thành 5 khảo sát trong 48h để nhận <b>2000 XP</b>
      </p>

      <button className="w-full py-3 bg-primary text-white rounded-xl font-bold">
        Join Challenge
      </button>
    </div>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= API CALL =================
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);

        const res = await surveyService.getAllSurveys();

        // API: { message, count, surveys }
        setSurveys(res.data.surveys || []);
      } catch (err) {
        console.error("Fetch surveys error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  const activities = [
    {
      icon: "check_circle",
      iconColor: "text-primary",
      iconBg: "bg-primary/20",
      title: "Health & Fitness Survey",
      sub: "Hoàn thành • 2 giờ trước",
      xp: "+250 XP",
      xpColor: "text-primary",
    },
    {
      icon: "military_tech",
      iconColor: "text-tertiary",
      iconBg: "bg-tertiary/20",
      title: "Level 12 Reached",
      sub: "Achievement • Hôm qua",
      xp: "+500 XP",
      xpColor: "text-tertiary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-8 py-12">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold">Chào mừng trở lại 👋</h1>
        </header>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* SURVEYS */}
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Newest Surveys</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <p>Loading...</p>
              ) : (
                surveys.map((s) => (
                  <SurveyCard
                    key={s.id}
                    icon="description"
                    iconColor="text-primary"
                    iconBg="bg-primary/10"
                    tag="Survey"
                    title={s.title}
                    desc={s.description}
                    duration="5 phút"
                  />
                ))
              )}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside>
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activities.map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))}
            </div>

            <div className="mt-6">
              <WeekendChallenge />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}