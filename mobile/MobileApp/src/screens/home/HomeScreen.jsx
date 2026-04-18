// ─── DashboardPage.native.jsx ─────────────────────────────────────
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import {
  CheckCircle2,
  Clock,
  Zap,
  Trophy,
  FileText,
  Inbox,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

// ✅ Import đúng như file gốc
import surveyService from "../../services/surveyService";
import { useResponse } from "../../providers/Responseprovider";

// ─── Colors ───────────────────────────────────────────────────────
const COLORS = {
  primary: "#4f6ef7",
  primaryLight: "#eef2ff",
  primaryMid: "#b3caff",
  green: "#22c55e",
  greenLight: "#dcfce7",
  greenBorder: "#bbf7d0",
  greenDark: "#16a34a",
  amber: "#d4a017",
  amberBg: "#fdf3e7",
  amberIcon: "#f59e0b",
  bg: "#f4f5f7",
  white: "#ffffff",
  gray50: "#f8f9ff",
  gray100: "#f0f0f0",
  gray200: "#e2e2e2",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray800: "#1f2937",
  navy: "#1a1a2e",
};

// ─── Static data ──────────────────────────────────────────────────
const activities = [
  {
    Icon: CheckCircle2,
    iconColor: COLORS.primary,
    iconBg: COLORS.primaryLight,
    title: "Health & Fitness Survey",
    sub: "Hoàn thành • 2 giờ trước",
    xp: "+250 XP",
    xpColor: COLORS.green,
  },
  {
    Icon: Trophy,
    iconColor: COLORS.amberIcon,
    iconBg: COLORS.amberBg,
    title: "Level 12 Reached",
    sub: "Achievement • Hôm qua",
    xp: "+500 XP",
    xpColor: COLORS.amber,
  },
  {
    Icon: CheckCircle2,
    iconColor: COLORS.primary,
    iconBg: COLORS.primaryLight,
    title: "Food Preference Study",
    sub: "Hoàn thành • 1 ngày trước",
    xp: "+150 XP",
    xpColor: COLORS.green,
  },
];

// ─── SurveyCard ───────────────────────────────────────────────────
function SurveyCard({ id, title, desc, createdAt, done, onStart }) {
  const displayDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN")
    : "";

  return (
    <View style={[styles.surveyCard, done ? styles.surveyCardDone : styles.surveyCardPending]}>
      <View style={styles.surveyCardHeader}>
        <View style={[styles.surveyCardIcon, { backgroundColor: done ? COLORS.greenLight : COLORS.primaryLight }]}>
          {done
            ? <CheckCircle2 size={24} color={COLORS.greenDark} />
            : <FileText size={24} color={COLORS.primary} />
          }
        </View>
        {done ? (
          <View style={styles.badgeDone}>
            <CheckCircle2 size={10} color={COLORS.greenDark} />
            <Text style={styles.badgeDoneText}> Đã hoàn thành</Text>
          </View>
        ) : (
          <View style={styles.badgeSurvey}>
            <Text style={styles.badgeSurveyText}>SURVEY</Text>
          </View>
        )}
      </View>

      <Text style={styles.surveyTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.surveyDesc} numberOfLines={2}>{desc}</Text>

      <View style={styles.surveyCardFooter}>
        <View style={styles.surveyDate}>
          <Clock size={14} color={COLORS.gray400} />
          <Text style={styles.surveyDateText}>{displayDate}</Text>
        </View>
        {done ? (
          <View style={styles.btnDone}>
            <Text style={styles.btnDoneText}>Hoàn thành ✓</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnStart} onPress={() => onStart(id)} activeOpacity={0.85}>
            <Text style={styles.btnStartText}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── SurveyCardSkeleton ───────────────────────────────────────────
function SurveyCardSkeleton() {
  return (
    <View style={[styles.surveyCard, styles.surveyCardPending]}>
      <View style={styles.surveyCardHeader}>
        <View style={[styles.skeletonBox, { width: 48, height: 48, borderRadius: 12 }]} />
        <View style={[styles.skeletonBox, { width: 80, height: 20, borderRadius: 10 }]} />
      </View>
      <View style={[styles.skeletonBox, { height: 14, width: "75%", marginBottom: 8 }]} />
      <View style={[styles.skeletonBox, { height: 12, width: "100%", marginBottom: 4 }]} />
      <View style={[styles.skeletonBox, { height: 12, width: "60%", marginBottom: 20 }]} />
      <View style={styles.surveyCardFooter}>
        <View style={[styles.skeletonBox, { height: 12, width: 64 }]} />
        <View style={[styles.skeletonBox, { height: 36, width: 80, borderRadius: 12 }]} />
      </View>
    </View>
  );
}

// ─── ActivityItem ─────────────────────────────────────────────────
function ActivityItem({ Icon, iconColor, iconBg, title, sub, xp, xpColor }) {
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.activityText}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activitySub}>{sub}</Text>
      </View>
      <Text style={[styles.activityXP, { color: xpColor }]}>{xp}</Text>
    </View>
  );
}

// ─── WeekendChallenge ─────────────────────────────────────────────
function WeekendChallenge() {
  return (
    <ImageBackground
      source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCG03R-J3AOEaCVe7DOPDBsSzk1qBnJ_cSOKMi5AtWX-_YU-HZIisL7r7jIyUMnW7sBEmJ_4pRWir4wBA2cd2MjB4BYbuqmcc5fzNLckPRq-4RENObTC1rJo8Ryymqd22pKrVvKzL9g1TLvmUt9pDbtnrdon68H8nONY8hAYzUKzfJ26Nmu9bHt4EXj9P2Kg-HUmLt0kiBuZqOOXcn_ukIKBvAjTr5ZjNJVRiSQzsRmEfrv0SgAvPfujpNKhEnpFAlu6DaWPGehLbSj" }}
      style={styles.challengeContainer}
      imageStyle={styles.challengeImage}
    >
      <View style={styles.challengeOverlay}>
        <View style={styles.challengeBadge}>
          <Zap size={13} color="#b3caff" />
          <Text style={styles.challengeBadgeText}> ACTIVE CHALLENGE</Text>
        </View>
        <Text style={styles.challengeTitle}>Weekend Challenge</Text>
        <Text style={styles.challengeDesc}>
          Hoàn thành 5 khảo sát bất kỳ trong 48h tới để nhận{" "}
          <Text style={{ color: "#b3caff", fontWeight: "700" }}>Bonus 2000 XP</Text>.
        </Text>
        <TouchableOpacity style={styles.challengeBtn} activeOpacity={0.85}>
          <Text style={styles.challengeBtnText}>Join Challenge</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────
export default function DashboardPage() {
  const navigation = useNavigation();

  // ✅ Dùng đúng hook từ ResponseProvider — giống hệt file gốc
  const { getAllMyResponses } = useResponse();

  const [surveys, setSurveys]             = useState([]);
  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Gọi API giống hệt file gốc
      const [surveysRes, responsesRes] = await Promise.all([
        surveyService.getAllSurveys(),
        getAllMyResponses().catch(() => null),
      ]);

      setSurveys(surveysRes.data?.surveys ?? []);

      // ✅ FIX giống file gốc: backend trả { data: [...] }
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

  // ✅ navigation.navigate thay cho useNavigate của web
  const handleStart = (surveyId) =>
    navigation.navigate("UserSurvey", { surveyId });

  const pendingCount = surveys.filter((s) => !doneSurveyIds.has(s.id)).length;
  const doneCount    = surveys.filter((s) =>  doneSurveyIds.has(s.id)).length;

  const renderSurveys = () => {
    if (loading) {
      return (
        <View style={styles.surveyGrid}>
          <SurveyCardSkeleton /><SurveyCardSkeleton />
          <SurveyCardSkeleton /><SurveyCardSkeleton />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={fetchData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (surveys.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Inbox size={48} color={COLORS.gray400} strokeWidth={1.5} />
          <Text style={styles.emptyText}>Chưa có khảo sát nào.</Text>
        </View>
      );
    }
    return (
      <View style={styles.surveyGrid}>
        {surveys.map((s) => (
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
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chào mừng trở lại!</Text>
        <Text style={styles.headerSub}>
          Bạn đã hoàn thành{" "}
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>85%</Text>{" "}
          mục tiêu tuần này. Chỉ còn 3 khảo sát nữa để nhận phần thưởng lớn.
        </Text>
      </View>

      {/* Bento Grid */}
      <View style={styles.bentoGrid}>
        <View style={[styles.bentoCard, { flex: 1 }]}>
          <Text style={styles.bentoLabel}>Surveys completed</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={styles.bentoValue}>{loading ? "—" : doneCount}</Text>
            <Text style={styles.bentoBadge}>đã hoàn thành</Text>
          </View>
        </View>

        <View style={[styles.bentoCard, { flex: 1 }]}>
          <Text style={styles.bentoLabel}>Pending</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={styles.bentoValue}>
              {loading ? "—" : String(pendingCount).padStart(2, "0")}
            </Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityBadgeText}>Priority</Text>
            </View>
          </View>
        </View>

        <View style={[styles.bentoCard, { flex: 1 }]}>
          <Text style={styles.bentoLabel}>Rewards / XP</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={[styles.bentoValue, { color: COLORS.amber }]}>12,450</Text>
            <View style={styles.pulseDot} />
          </View>
        </View>
      </View>

      {/* Surveys Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Newest Surveys
            {!loading && <Text style={styles.sectionCount}> ({surveys.length})</Text>}
          </Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {renderSurveys()}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={{ gap: 10, marginTop: 16 }}>
          {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
        </View>
      </View>

      {/* Weekend Challenge */}
      <View style={[styles.section, { paddingBottom: 32 }]}>
        <WeekendChallenge />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  container: { paddingHorizontal: 16, paddingTop: 24 },

  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: COLORS.gray800, marginBottom: 6, letterSpacing: -0.5 },
  headerSub: { fontSize: 15, color: COLORS.gray500, lineHeight: 22 },

  bentoGrid: { flexDirection: "row", gap: 10, marginBottom: 28 },
  bentoCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: "#e5e7eb" },
  bentoLabel: { fontSize: 12, color: COLORS.gray500, fontWeight: "500", marginBottom: 4 },
  bentoValue: { fontSize: 22, fontWeight: "700", color: COLORS.gray800 },
  bentoBadge: { fontSize: 11, color: COLORS.primary, fontWeight: "600" },
  priorityBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  priorityBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: "700" },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.gray800 },
  sectionCount: { fontSize: 13, fontWeight: "400", color: COLORS.gray400 },
  viewAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },

  surveyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  surveyCard: { borderRadius: 18, padding: 16, borderWidth: 1, width: "100%" },
  surveyCardPending: { backgroundColor: COLORS.gray50, borderColor: "#e5e7eb" },
  surveyCardDone: { backgroundColor: "#f0fdf4", borderColor: COLORS.greenBorder },
  surveyCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  surveyCardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeDone: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.greenLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.greenBorder },
  badgeDoneText: { fontSize: 10, fontWeight: "700", color: COLORS.greenDark, textTransform: "uppercase", letterSpacing: 0.5 },
  badgeSurvey: { backgroundColor: COLORS.gray100, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeSurveyText: { fontSize: 10, fontWeight: "700", color: COLORS.gray500, letterSpacing: 0.5 },
  surveyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.gray800, marginBottom: 6 },
  surveyDesc: { fontSize: 13, color: COLORS.gray500, lineHeight: 19, marginBottom: 16 },
  surveyCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  surveyDate: { flexDirection: "row", alignItems: "center", gap: 5 },
  surveyDateText: { fontSize: 12, color: COLORS.gray400 },
  btnDone: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.greenLight, borderRadius: 12, borderWidth: 1, borderColor: COLORS.greenBorder },
  btnDoneText: { fontSize: 13, fontWeight: "700", color: COLORS.greenDark },
  btnStart: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primary, borderRadius: 12 },
  btnStartText: { fontSize: 13, fontWeight: "700", color: COLORS.white },

  skeletonBox: { backgroundColor: COLORS.gray200, borderRadius: 6, marginBottom: 4 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 13, color: COLORS.gray400 },
  retryText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },

  activityItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, backgroundColor: "#f9fafb", borderWidth: 0.5, borderColor: "#e5e7eb" },
  activityIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  activityText: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: "600", color: COLORS.gray800 },
  activitySub: { fontSize: 11, color: COLORS.gray400, marginTop: 1 },
  activityXP: { fontSize: 13, fontWeight: "700" },

  challengeContainer: { borderRadius: 24, overflow: "hidden", minHeight: 220 },
  challengeImage: { borderRadius: 24 },
  challengeOverlay: { flex: 1, backgroundColor: "rgba(0,45,100,0.72)", padding: 24, borderRadius: 24 },
  challengeBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(79,110,247,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(79,110,247,0.3)", marginBottom: 14 },
  challengeBadgeText: { fontSize: 10, fontWeight: "700", color: "#b3caff", letterSpacing: 1 },
  challengeTitle: { fontSize: 22, fontWeight: "900", color: COLORS.white, marginBottom: 10 },
  challengeDesc: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 18, maxWidth: 220 },
  challengeBtn: { backgroundColor: COLORS.white, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  challengeBtnText: { fontSize: 14, fontWeight: "700", color: COLORS.navy },
});