import { Medal, Flame, ClipboardList, Target, Globe, Star, Trophy } from "lucide-react";

export const RANK_INFO = {
  BRONZE: {
    label: "Đồng",
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
    badge: "bg-amber-500",
    progress: "bg-gradient-to-r from-amber-400 to-amber-600",
    shadow: "shadow-amber-200",
    icon: Medal,
    iconProps: { className: "text-amber-600", size: 16 },
  },
  SILVER: {
    label: "Bạc",
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-300",
    badge: "bg-gray-500",
    progress: "bg-gradient-to-r from-gray-400 to-gray-600",
    shadow: "shadow-gray-200",
    icon: Medal,
    iconProps: { className: "text-gray-500", size: 16 },
  },
  GOLD: {
    label: "Vàng",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    badge: "bg-yellow-500",
    progress: "bg-gradient-to-r from-yellow-400 to-yellow-600",
    shadow: "shadow-yellow-200",
    icon: Medal,
    iconProps: { className: "text-yellow-600", size: 16 },
  },
  PLATINUM: {
    label: "Bạch Kim",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-300",
    badge: "bg-slate-500",
    progress: "bg-gradient-to-r from-slate-400 to-slate-600",
    shadow: "shadow-slate-200",
    icon: Medal,
    iconProps: { className: "text-slate-500", size: 16 },
  },
  DIAMOND: {
    label: "Kim Cương",
    color: "text-sky-700",
    bg: "bg-sky-100",
    border: "border-sky-300",
    badge: "bg-sky-500",
    progress: "bg-gradient-to-r from-sky-400 to-sky-600",
    shadow: "shadow-sky-200",
    icon: Medal,
    iconProps: { className: "text-sky-600", size: 16 },
  },
};

export const TIER_INFO = RANK_INFO;

export const CATEGORY_LABELS = {
  STREAK: "Streak",
  SURVEY_CREATION: "Tạo khảo sát",
  PARTICIPATION: "Tham gia",
  SOCIAL: "Cộng đồng",
  SPECIAL: "Đặc biệt",
  RANK: "Rank",
};

export const CATEGORY_CONFIG = {
  STREAK: { icon: Flame, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  SURVEY_CREATION: { icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  PARTICIPATION: { icon: Target, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  SOCIAL: { icon: Globe, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  SPECIAL: { icon: Star, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  RANK: { icon: Trophy, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
};

export function getRankStyle(rankName) {
  return RANK_INFO[rankName] || RANK_INFO.BRONZE;
}

export function getRankLabel(rankName) {
  return RANK_INFO[rankName]?.label || "Đồng";
}
