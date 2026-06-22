import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Medal, Trophy } from "lucide-react";
import surveyService from "@/services/surveyService";
import { SurveyCardHome } from "@/components/survey/SurveyCardHome";

function ActivityItem({ icon: Icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <span className={`text-sm font-bold ${xpColor}`}>{xp}</span>
    </div>
  );
}

function WeekendChallenge() {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={20} className="text-indigo-600" />
        <h3 className="text-lg font-bold text-indigo-900">Weekend Challenge</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Hoàn thành 5 khảo sát trong 48h để nhận <strong className="text-indigo-700">2000 XP</strong>
      </p>
      <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
        Join Challenge
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const res = await surveyService.getAllSurveys();
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
      icon: CheckCircle,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
      title: "Health & Fitness Survey",
      sub: "Hoàn thành • 2 giờ trước",
      xp: "+250 XP",
      xpColor: "text-indigo-600"},
    {
      icon: Medal,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      title: "Level 12 Reached",
      sub: "Achievement • Hôm qua",
      xp: "+500 XP",
      xpColor: "text-amber-600"},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-8 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Chào mừng trở lại</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <section className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Newest Surveys</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                surveys.map((s, i) => (
                  <SurveyCardHome
                    key={s.id}
                    survey={s}
                    index={i}
                    onClick={() => navigate(`/user/surveys/${s.id}/take`)}
                    type="public"
                    overrideStatus={s.status}
                  />
                ))
              )}
            </div>
          </section>

          <aside>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
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
