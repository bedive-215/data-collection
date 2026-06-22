import React, { useState } from "react";
import { Star, Flame, Trophy, Loader2, CheckCircle2, Calendar } from "lucide-react";

const STREAK_COLORS = {
  none: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", ring: "ring-amber-300" },
  active: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", ring: "ring-amber-400" },
  streak4: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", ring: "ring-orange-400" },
  streak7: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", ring: "ring-red-400" },
};

function getStreakStyle(streakCount) {
  if (!streakCount || streakCount === 0) return STREAK_COLORS.none;
  if (streakCount >= 7) return STREAK_COLORS.streak7;
  if (streakCount >= 4) return STREAK_COLORS.streak4;
  return STREAK_COLORS.active;
}

function getStreakEmoji(streakCount) {
  if (!streakCount || streakCount === 0) return Calendar;
  if (streakCount >= 7) return Flame;
  if (streakCount >= 4) return Flame;
  return Star;
}

function getBonusText(streakCount, multiplier) {
  if (!streakCount || streakCount === 0) return "+50 sao";
  if (streakCount >= 7) return "+100 sao (x2!)";
  if (streakCount >= 4) return "+75 sao (x1.5)";
  return `+${Math.floor(50 * multiplier)} sao`;
}

function getBonusColor(streakCount) {
  if (streakCount >= 7) return "text-red-600";
  if (streakCount >= 4) return "text-orange-600";
  return "text-amber-600";
}

export function CheckinButton({ status, onCheckin, loading = false }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [result, setResult] = useState(null);

  const { checked_in = false, current_streak = 0, current_multiplier = 1.0, next_bonus_tier = null } = status || {};

  const can_checkin = !checked_in;
  const streakStyle = getStreakStyle(current_streak);
  const StreakIcon = getStreakEmoji(current_streak);
  const bonusText = getBonusText(current_streak, current_multiplier);
  const bonusColor = getBonusColor(current_streak);

  const handleCheckin = async () => {
    try {
      const res = await onCheckin();
      setResult(res);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // Error handled by parent
    }
  };

  if (showSuccess && result) {
    return (
      <div className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 bg-green-50 border-green-300 text-green-800 transition-all duration-500">
        <CheckCircle2 size={36} className="text-green-500 mb-2" />
        <div className="font-bold text-lg">Điểm danh thành công!</div>
        <div className="flex items-center gap-1 text-2xl font-bold text-green-600 mt-1">
          +{result.stars_earned} <Star size={20} fill="currentColor" />
        </div>
        <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
          <Flame size={14} /> Streak: {result.streak_count} ngày
        </div>
        {result.is_new_streak_record && (
          <div className="mt-2 px-3 py-1 bg-green-200 rounded-full text-xs font-bold flex items-center gap-1">
            <Trophy size={12} /> Kỷ lục mới!
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 ${streakStyle.bg} ${streakStyle.border} transition-all duration-300 ${
        can_checkin
          ? `ring-2 ${streakStyle.ring} ring-opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]`
          : "opacity-75"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <StreakIcon size={24} className={streakStyle.text} />
        <div className="text-center">
          <div className={`font-bold text-base ${streakStyle.text}`}>
            {current_streak > 0 ? `Streak ${current_streak} ngày` : "Chưa điểm danh"}
          </div>
          {current_streak > 0 && (
            <div className={`text-xs font-semibold ${bonusColor}`}>Bonus x{current_multiplier}</div>
          )}
        </div>
      </div>

      <div
        className={`text-lg font-bold mb-3 px-4 py-1 rounded-full border ${
          can_checkin ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-gray-100 border-gray-300 text-gray-500"
        }`}
      >
        {bonusText}
      </div>

      {can_checkin ? (
        <button
          onClick={handleCheckin}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <CheckCircle2 size={16} /> Điểm danh ngay
            </span>
          )}
        </button>
      ) : (
        <div className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-center bg-green-100 border border-green-300 text-green-700 flex items-center justify-center gap-1">
          <CheckCircle2 size={14} /> Đã điểm danh hôm nay
        </div>
      )}

      {next_bonus_tier && can_checkin && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Còn {next_bonus_tier.days_needed} ngày nữa để đạt x{next_bonus_tier.next_multiplier}!
        </div>
      )}
    </div>
  );
}
