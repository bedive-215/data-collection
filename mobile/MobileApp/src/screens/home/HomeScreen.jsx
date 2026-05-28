// src/screens/home/HomeScreen.jsx
// Premium mobile dashboard — matching web Home.jsx design
import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Dimensions, RefreshControl, ActivityIndicator, Alert,
  Modal, Clipboard, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2, Clock, Zap, Trophy,
  Inbox, ArrowRight, Globe, Flame, Target,
  Sparkles, TrendingUp, Rocket, LayoutGrid,
  FileText, ClipboardList,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useResponse } from "../../providers/ResponseProvider";
import { useSurvey } from "../../providers/SurveyProvider";
import { CheckinBanner } from "../../components/gamification/CheckinBanner";
import { GamificationDashboard } from "../../components/gamification/GamificationDashboard";
import { SurveyCard } from "../../components/survey/SurveyCard";
import { SurveyCardHome, CARD_W } from "../../components/survey/SurveyCardHome";
import { COLORS } from "../../utils/constants";

const C = {
  ...COLORS,
  surface: "#ffffff",
  bg: "#f5f7fb",
  textSub: "#64748b",
  textDim: "#94a3b8",
};

const { width: SCREEN_W } = Dimensions.get("window");

const ACTIVITY_ICON_COLORS = [
  { iconBg: "#eef0fd", iconColor: C.primary  },
  { iconBg: "#fef3c7", iconColor: "#f59e0b"  },
  { iconBg: "#d1fae5", iconColor: C.success },
  { iconBg: "#fce7f3", iconColor: "#ec4899" },
];

/* ── Skeleton pulse ──────────────────────────────────────────── */
function usePulse() {
  const anim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return anim;
}

function SkeletonBox({ w = "100%", h = 12, radius = 5 }) {
  const opacity = usePulse();
  return (
    <Animated.View
      style={{
        width: w, height: h, borderRadius: radius,
        backgroundColor: "#f1f5f9", opacity,
      }}
    />
  );
}

/* ── Activity Card (bento item) ─────────────────────────────── */
function ActivityBento({ activity, index }) {
  const ac = ACTIVITY_ICON_COLORS[index % ACTIVITY_ICON_COLORS.length];
  return (
    <View style={actStyles.card}>
      <View style={[actStyles.iconBox, { backgroundColor: ac.iconBg }]}>
        <activity.Icon size={18} color={ac.iconColor} />
      </View>
      <View style={actStyles.textWrap}>
        <Text style={actStyles.title} numberOfLines={1}>{activity.title}</Text>
        <Text style={actStyles.sub}>{activity.sub}</Text>
      </View>
      <Text style={[actStyles.xp, { color: activity.xpColor }]}>{activity.xp}</Text>
    </View>
  );
}

const actStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
    color: C.textSub,
  },
  xp: {
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 0,
  },
});

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, bg, icon: Icon }) {
  return (
    <View style={statStyles.card}>
      {Icon && (
        <View style={[statStyles.iconBox, { backgroundColor: bg || "#eef0fd" }]}>
          <Icon size={18} color={color || C.primary} />
        </View>
      )}
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color: color || C.primary }]}>{value}</Text>
      {sub && <Text style={statStyles.sub}>{sub}</Text>}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: C.textSub,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  sub: {
    fontSize: 10,
    color: C.textDim,
    textAlign: "center",
  },
});

/* ── Section Header ──────────────────────────────────────────── */
function SectionHeader({ title, count, countColor, onViewAll, viewAllLabel }) {
  return (
    <View style={sectionStyles.header}>
      <View style={sectionStyles.left}>
        <Text style={sectionStyles.title}>{title}</Text>
        {count != null && (
          <View style={sectionStyles.countBadge}>
            <Text style={[sectionStyles.countText, { color: countColor || C.primary }]}>
              {count}
            </Text>
          </View>
        )}
      </View>
      {onViewAll && (
        <TouchableOpacity style={sectionStyles.viewAll} onPress={onViewAll} activeOpacity={0.8}>
          <Text style={sectionStyles.viewAllText}>{viewAllLabel || "Xem tất cả"}</Text>
          <ArrowRight size={11} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#eef0fd",
    borderWidth: 1,
    borderColor: "#c5cdfb",
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
  },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#eef0fd",
    borderWidth: 1,
    borderColor: "#c5cdfb",
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.primary,
  },
});

/* ── Hero Welcome ────────────────────────────────────────────── */
function WelcomeHero({ userName, total, done, pending, loading }) {
  return (
    <View style={heroStyles.container}>
      <View style={heroStyles.textWrap}>
        <Text style={heroStyles.greeting}>Chào mừng trở lại! 👋</Text>
        <Text style={heroStyles.sub}>
          Bạn đã hoàn thành{" "}
          <Text style={heroStyles.highlight}>
            {loading ? "..." : done}
          </Text>{" "}
          khảo sát.
          {!loading && pending > 0 && (
            <Text>
              {" "}Còn{" "}
              <Text style={heroStyles.highlightDark}>{pending}</Text>{" "}
              đang chờ bạn.
            </Text>
          )}
        </Text>
      </View>
      <View style={heroStyles.avatar}>
        <Text style={heroStyles.avatarText}>{(userName || "?")[0].toUpperCase()}</Text>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  textWrap: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "900",
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 12,
    color: C.textSub,
    lineHeight: 18,
  },
  highlight: {
    color: C.primary,
    fontWeight: "700",
  },
  highlightDark: {
    color: C.text,
    fontWeight: "700",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eef0fd",
    borderWidth: 2,
    borderColor: "#c5cdfb",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "900",
    color: C.primary,
  },
});

/* ── Divider ─────────────────────────────────────────────────── */
function PublicDivider({ label = "Khảo sát công khai" }) {
  return (
    <View style={divStyles.container}>
      <View style={divStyles.line} />
      <View style={divStyles.badge}>
        <Globe size={10} color={C.textDim} />
        <Text style={divStyles.label}> {label}</Text>
      </View>
      <View style={divStyles.line} />
    </View>
  );
}

const divStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e8ecf0",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e8ecf0",
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: C.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});

/* ── Main Screen ─────────────────────────────────────────────── */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { getAllMyResponses } = useResponse();
  const { mySurveys, publicSurveys, fetchMySurveys, fetchPublicSurveys, shareLink, closeSurvey } = useSurvey();

  const [doneSurveyIds, setDoneSurveyIds] = useState(new Set());
  const [expiredSurveyIds, setExpiredSurveyIds] = useState(new Set());
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const isSurveyExpired = (survey) => {
    const now = new Date();
    if (survey.end_at) {
      const end = new Date(survey.end_at);
      if (now > end) return true;
    }
    if (survey.start_at) {
      const start = new Date(survey.start_at);
      if (now < start) return true;
    }
    return false;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const responsesRes = await getAllMyResponses().catch(() => null);
      const responsesList = Array.isArray(responsesRes) ? responsesRes : (responsesRes?.data ?? []);
      setDoneSurveyIds(new Set(responsesList.map(r => r.survey_id ?? r.survey?.id)));
      await Promise.all([
        fetchMySurveys(1, 20),
        fetchPublicSurveys(),
      ]);
    } catch (err) {
      console.error("HomeScreen fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  // After publicSurveys loads, check expiry (but not if already done)
  useEffect(() => {
    const expired = new Set();
    publicSurveys.forEach(s => {
      if (isSurveyExpired(s) && !doneSurveyIds.has(s.id)) {
        expired.add(s.id);
      }
    });
    setExpiredSurveyIds(expired);
  }, [publicSurveys, doneSurveyIds]);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const [shareModal, setShareModal] = useState({ visible: false, url: "", loading: false, id: null });
  const [loadingShare, setLoadingShare] = useState(false);

  // ── Handlers ──
  const handleStartSurvey = (id) => navigation.navigate("PublicSurveyDetail", { surveyId: id });
  const handleViewMySurvey = (id) => navigation.navigate("SurveyStudio", { surveyId: id });
  const handleViewAllMy = () => navigation.navigate("MainApp", { screen: "OrdersTab", params: { initialTab: "my" } });
  const handleViewAllPublic = () => navigation.navigate("MainApp", { screen: "OrdersTab", params: { initialTab: "public" } });
  const handleViewResult = (id) => navigation.navigate("SurveyResponse", { surveyId: id });
  const handleExpiredSurvey = (id) => {
    Alert.alert(
      "Khảo sát đã hết hạn",
      "Khảo sát này đã hết hạn và không thể tham gia.",
      [{ text: "Đóng", style: "cancel" }]
    );
  };

  const handleLockSurvey = (id) => {
    Alert.alert(
      "Khóa khảo sát",
      "Bạn có chắc muốn khóa khảo sát này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khóa",
          style: "destructive",
          onPress: async () => {
            try {
              await closeSurvey(id);
            } catch (err) {
              Alert.alert("Lỗi", "Không thể khóa khảo sát.");
            }
          },
        },
      ]
    );
  };

  const handleShareSurvey = async (id) => {
    setShareModal({ visible: true, url: "", loading: true, id });
    try {
      const url = await shareLink(id);
      console.log("DEBUG shareLink result:", JSON.stringify(url));
      if (url) {
        setShareModal(prev => ({ ...prev, url, loading: false }));
      } else {
        setShareModal(prev => ({ ...prev, url: "", loading: false }));
        Alert.alert("Lỗi", "Không tạo được link chia sẻ.");
      }
    } catch (err) {
      console.log("DEBUG shareLink error:", err);
      setShareModal(prev => ({ ...prev, url: "", loading: false }));
      Alert.alert("Lỗi", "Không tạo được link chia sẻ.");
    }
  };

  const pendingCount = publicSurveys.filter(s => !doneSurveyIds.has(s.id)).length;
  const doneCount    = publicSurveys.filter(s =>  doneSurveyIds.has(s.id)).length;
  const recentMy     = mySurveys.slice(0, 4);
  const recentPublic = publicSurveys.slice(0, 4);

  // ── Mock activities (matching web) ──
  const activities = [
    { Icon: CheckCircle2, iconBg: "#eef0fd", iconColor: C.primary,  title: "Health & Fitness Survey",  sub: "Hoàn thành · 2 giờ trước", xp: "+250 XP", xpColor: C.success },
    { Icon: Trophy,       iconBg: "#fef3c7", iconColor: "#f59e0b",  title: "Level 12 Reached",         sub: "Achievement · Hôm qua",       xp: "+500 XP", xpColor: "#f59e0b" },
    { Icon: CheckCircle2, iconBg: "#d1fae5", iconColor: C.success, title: "Food Preference Study",    sub: "Hoàn thành · 1 ngày trước",   xp: "+150 XP", xpColor: C.success },
  ];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {/* ── Welcome Hero ── */}
        <WelcomeHero
          userName="User"
          total={publicSurveys.length}
          done={doneCount}
          pending={pendingCount}
          loading={loading}
        />

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon={CheckCircle2}
            label="Hoàn thành"
            value={loading ? "—" : doneCount}
            sub={`/ ${publicSurveys.length} tổng`}
            color={C.primary}
            bg="#eef0fd"
          />
          <StatCard
            icon={Clock}
            label="Đang chờ"
            value={loading ? "—" : pendingCount}
            sub="Chưa xong"
            color="#f59e0b"
            bg="#fef3c7"
          />
          <StatCard
            icon={Trophy}
            label="XP"
            value="12,450"
            sub="+250 hôm nay"
            color="#f59e0b"
            bg="#fef3c7"
          />
        </View>

        {/* ── Checkin Banner ── */}
        <CheckinBanner />

        {/* ── Gamification Quick Stats ── */}
        <GamificationDashboard compact />

        {/* ── Gamification Dashboard ── */}
        <View style={styles.section}>
          <GamificationDashboard />
        </View>

        {/* ── My Surveys ── */}
        <View style={styles.section}>
          <SectionHeader
            title="My Surveys"
            count={mySurveys.length}
            onViewAll={handleViewAllMy}
          />
          {loading ? (
            <View style={styles.grid2}>
              {[0,1,2,3].map(i => (
                <View key={i} style={{ width: CARD_W }}>
                  <SkeletonBox h={196} radius={18} />
                </View>
              ))}
            </View>
          ) : mySurveys.length === 0 ? (
            <View style={styles.empty}>
              <Inbox size={28} color={COLORS.textDim} />
              <Text style={styles.emptyText}>Chưa có survey nào</Text>
            </View>
          ) : (
            <View style={styles.grid2}>
              {recentMy.map((survey, i) => (
                <View key={survey.id} style={{ width: CARD_W }}>
                  <SurveyCardHome
                    survey={survey}
                    index={i}
                    onClick={() => handleViewMySurvey(survey.id)}
                    type="my"
                    onLock={handleLockSurvey}
                    onShare={handleShareSurvey}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Public Divider ── */}
        <PublicDivider label="Khảo sát công khai" />

        {/* ── Public Surveys ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Khảo Sát"
            count={publicSurveys.length}
            countColor="#059669"
            onViewAll={handleViewAllPublic}
          />
          {loading ? (
            <View style={styles.surveyGrid}>
              {[0,1,2,3].map(i => <SkeletonBox key={i} h={130} radius={14} />)}
            </View>
          ) : publicSurveys.length === 0 ? (
            <View style={styles.empty}>
              <Inbox size={28} color={COLORS.textDim} />
              <Text style={styles.emptyText}>Chưa có khảo sát công khai</Text>
            </View>
          ) : (
            <View style={styles.surveyGrid}>
              {recentPublic.map((survey, i) => {
                const done = doneSurveyIds.has(survey.id);
                const expired = expiredSurveyIds.has(survey.id);
                return (
                  <View key={survey.id} style={styles.gridCardWrap}>
                    <SurveyCard
                      survey={survey}
                      done={done}
                      expired={expired}
                      index={i}
                      viewMode="grid"
                      onStart={handleStartSurvey}
                      onViewSubmission={handleViewResult}
                      onExpired={handleExpiredSurvey}
                      overrideStatus={done ? "COMPLETED" : expired ? "EXPIRED" : null}
                      onClick={() =>
                        done
                          ? handleViewResult(survey.id)
                          : expired
                          ? handleExpiredSurvey(survey.id)
                          : handleStartSurvey(survey.id)
                      }
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Recent Activity ── */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <SectionHeader title="Recent Activity" />
          {activities.map((a, i) => (
            <ActivityBento key={i} activity={a} index={i} />
          ))}
        </View>
      </ScrollView>

      {/* ── Share Modal ── */}
      <Modal visible={shareModal.visible} transparent animationType="fade" onRequestClose={() => setShareModal(v => ({ ...v, visible: false }))}>
        <View style={shareStyles.overlay}>
          <View style={shareStyles.box}>
            <View style={shareStyles.header}>
              <Text style={shareStyles.title}>Chia sẻ khảo sát</Text>
              <TouchableOpacity onPress={() => setShareModal(v => ({ ...v, visible: false }))} style={shareStyles.closeBtn}>
                <Text style={shareStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={shareStyles.body}>
              {shareModal.loading ? (
                <View style={shareStyles.loading}>
                  <ActivityIndicator size="large" color={C.primary} />
                  <Text style={shareStyles.loadingText}>Đang tạo link...</Text>
                </View>
              ) : shareModal.url ? (
                <>
                  <Text style={shareStyles.label}>Link chia sẻ:</Text>
                  <View style={shareStyles.urlBox}>
                    <Text style={shareStyles.urlText} numberOfLines={2}>{shareModal.url}</Text>
                  </View>
                  <TouchableOpacity
                    style={shareStyles.copyBtn}
                    onPress={() => {
                      Clipboard.setString(shareModal.url);
                      Alert.alert("Đã sao chép!", "Link đã được sao chép vào bộ nhớ tạm.");
                    }}
                  >
                    <Text style={shareStyles.copyBtnText}>Sao chép link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={shareStyles.openBtn}
                    onPress={() => Linking.openURL(shareModal.url)}
                  >
                    <Text style={shareStyles.openBtnText}>Mở trong trình duyệt</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={shareStyles.loading}>
                  <Text style={shareStyles.errorText}>Không tạo được link. Vui lòng thử lại.</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100, // tab bar clearance
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8ecf0",
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: "600",
  },
  surveyList: {
    gap: 10,
  },
  surveyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCardWrap: {
    width: (SCREEN_W - 28 - 10) / 2,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});

/* ── Share Modal Styles ────────────────────────────────────────── */
const shareStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  box: {
    width: "100%", backgroundColor: "#fff",
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#e8ecf0",
  },
  title: { fontSize: 16, fontWeight: "800", color: C.text },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f4f5f7", alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 16, color: C.textSub, fontWeight: "600" },
  body: { padding: 20, gap: 12 },
  loading: { alignItems: "center", paddingVertical: 24, gap: 10 },
  loadingText: { fontSize: 14, color: C.textSub },
  errorText: { fontSize: 14, color: C.error, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", color: C.textSub },
  urlBox: {
    backgroundColor: "#f8fafc", borderRadius: 12,
    borderWidth: 1, borderColor: "#e8ecf0",
    padding: 12,
  },
  urlText: { fontSize: 13, color: C.primary, fontWeight: "600", lineHeight: 20 },
  copyBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  copyBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  openBtn: {
    backgroundColor: "#f4f5f7", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#e8ecf0",
  },
  openBtnText: { fontSize: 15, fontWeight: "600", color: C.text },
});
