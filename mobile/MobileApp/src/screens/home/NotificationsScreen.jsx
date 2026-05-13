
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, BellOff, CheckCheck, Mail, FileText, AlertCircle, Users, Sparkles, Trash2, Clock, X } from "lucide-react-native";
import { useNotification } from "../../providers/NotificationProvider";

const TYPE_CONFIG = {
  SURVEY_INVITATION: { icon: Mail, bg: "#eef0fd", color: "#4f46e5", label: "Loi moi" },
  SURVEY_RESPONSE: { icon: FileText, bg: "#d1fae5", color: "#059669", label: "Phan hoi" },
  SURVEY_EXPIRED: { icon: AlertCircle, bg: "#ffedd5", color: "#ea580c", label: "Het han" },
  SURVEY_TIMEOUT: { icon: AlertCircle, bg: "#ffedd5", color: "#ea580c", label: "Het han" },
  SURVEY_PUBLISHED: { icon: Sparkles, bg: "#ccfbf1", color: "#0d9488", label: "Cong khai" },
  SURVEY_CLOSED: { icon: AlertCircle, bg: "#fee2e2", color: "#dc2626", label: "Da dong" },
  NEW_PARTICIPANT: { icon: Users, bg: "#f3e8ff", color: "#9333ea", label: "Tham gia" },
  SYSTEM: { icon: Bell, bg: "#f1f5f9", color: "#475569", label: "He thong" }
};

const normalizeType = (type) => (type || "").toUpperCase();
const getConfig = (type) => TYPE_CONFIG[normalizeType(type)] || TYPE_CONFIG.SYSTEM;

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMs / 3600000);
  const d = Math.floor(diffMs / 86400000);
  if (m < 1) return "Vua xong";
  if (m < 60) return m + " phut truoc";
  if (h < 24) return h + " gio truoc";
  if (d < 7) return d + " ngay truoc";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
};

const getDisplayTitle = (n) => {
  if (n.title && n.title.trim()) return n.title;
  const labels = {
    SURVEY_TIMEOUT: "Khao sat da het han",
    SURVEY_EXPIRED: "Khao sat da het han",
    SURVEY_RESPONSE: "Co phan hoi moi",
    SURVEY_INVITATION: "Ban duoc moi tham gia",
    SURVEY_PUBLISHED: "Khao sat da cong khai",
    SURVEY_CLOSED: "Khao sat da dong",
    NEW_PARTICIPANT: "Co nguoi tham gia moi"
  };
  return labels[normalizeType(n.type)] || "Thong bao";
};

const getSurveyTitle = (n) => {
  const d = n.data || {};
  if (d.surveyTitle?.trim()) return d.surveyTitle;
  if (d.title?.trim()) return d.title;
  return null;
};

const NotificationDetailModal = ({ notification, onClose }) => {
  if (!notification) return null;
  const config = getConfig(notification.type);
  const Icon = config.icon;
  const surveyTitle = getSurveyTitle(notification);
  return (
    <Modal visible animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Chi tiet thong bao</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}><X size={24} color="#64748b" /></TouchableOpacity>
          </View>
          <ScrollView style={modalStyles.content} showsVerticalScrollIndicator={false}>
            <View style={[modalStyles.iconContainer, { backgroundColor: config.bg }]}><Icon size={32} color={config.color} /></View>
            <Text style={modalStyles.title}>{getDisplayTitle(notification)}</Text>
            <View style={[modalStyles.badge, { backgroundColor: config.bg }]}><Text style={[modalStyles.badgeText, { color: config.color }]}>{config.label}</Text></View>
            {surveyTitle && <View style={modalStyles.field}><Text style={modalStyles.fieldLabel}>Khao sat</Text><Text style={modalStyles.fieldValue}>{surveyTitle}</Text></View>}
            {notification.message && <View style={modalStyles.field}><Text style={modalStyles.fieldLabel}>Noi dung</Text><Text style={modalStyles.fieldValue}>{notification.message}</Text></View>}
            {notification.createdAt && <View style={modalStyles.field}><Text style={modalStyles.fieldLabel}>Thoi gian</Text><Text style={modalStyles.fieldValue}>{formatTime(notification.createdAt)}</Text></View>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", paddingBottom: 34 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  iconContainer: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 12 },
  badge: { alignSelf: "center", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, marginBottom: 20 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  field: { marginBottom: 16, padding: 16, backgroundColor: "#f8fafc", borderRadius: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 4, textTransform: "uppercase" },
  fieldValue: { fontSize: 15, color: "#0f172a", lineHeight: 22 }
});

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => { fetchNotifications(); }, []);

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const handleClick = async (notification) => {
    if (!notification.read) await markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  const handleDelete = (notification) => {
    Alert.alert("Xoa thong bao", "Ban co chac muon xoa thong bao nay?", [
      { text: "Huy", style: "cancel" },
      { text: "Xoa", style: "destructive", onPress: () => deleteNotification(notification.id) }
    ]);
  };

  const handleMarkAllRead = () => {
    Alert.alert("Danh dau tat ca da doc", "Ban co chac?", [
      { text: "Huy", style: "cancel" },
      { text: "Xac nhan", onPress: () => markAllAsRead() }
    ]);
  };

  const filterOptions = [
    { value: "all", label: "Tat ca", count: notifications.length },
    { value: "unread", label: "Chua doc", count: unreadCount },
    { value: "read", label: "Da doc", count: notifications.length - unreadCount }
  ];

  const emptyMsg = {
    all: { title: "Chua co thong bao nao", sub: "Cac thong bao se xuat hien khi co hoat dong moi" },
    unread: { title: "Ban da doc het roi!", sub: "Khong con thong bao chua doc nao" },
    read: { title: "Chua doc thong bao nao", sub: "Hay doc mot so thong bao truoc" }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}><Bell size={24} color="#4f46e5" /></View>
          <View>
            <Text style={styles.headerTitle}>Thong bao</Text>
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount} chua doc</Text></View>}
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <CheckCheck size={16} color="#4f46e5" /><Text style={styles.markAllText}>Doc tat ca</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map(opt => (
            <TouchableOpacity key={opt.value} style={[styles.filterTab, filter === opt.value && styles.filterTabActive]} onPress={() => setFilter(opt.value)}>
              <Text style={[styles.filterText, filter === opt.value && styles.filterTextActive]}>{opt.label}</Text>
              {opt.count > 0 && <View style={[styles.filterBadge, filter === opt.value && styles.filterBadgeActive]}><Text style={[styles.filterBadgeText, filter === opt.value && styles.filterBadgeTextActive]}>{opt.count}</Text></View>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} colors={["#4f46e5"]} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}><BellOff size={64} color="#cbd5e1" /><Text style={styles.emptyTitle}>{emptyMsg[filter].title}</Text><Text style={styles.emptySub}>{emptyMsg[filter].sub}</Text></View>
        ) : filtered.map((notification) => {
          const config = getConfig(notification.type);
          const Icon = config.icon;
          const isUnread = !notification.read;
          const surveyTitle = getSurveyTitle(notification);
          return (
            <TouchableOpacity key={notification.id} style={[styles.card, isUnread && styles.cardUnread]} onPress={() => handleClick(notification)} activeOpacity={0.7}>
              <View style={[styles.leftAccent, { backgroundColor: config.color }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconBox, { backgroundColor: config.bg }]}><Icon size={20} color={config.color} /></View>
                  <View style={styles.cardInfo}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>{getDisplayTitle(notification)}</Text>
                      {isUnread && <View style={[styles.dot, { backgroundColor: config.color }]} />}
                    </View>
                    {surveyTitle && <Text style={styles.surveyTitle} numberOfLines={1}>{surveyTitle}</Text>}
                    <View style={styles.metaRow}>
                      <View style={[styles.typeBadge, { backgroundColor: config.bg }]}><Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text></View>
                      {notification.createdAt && <Text style={styles.timeText}>{formatTime(notification.createdAt)}</Text>}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(notification)}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedNotification && <NotificationDetailModal notification={selectedNotification} onClose={() => setSelectedNotification(null)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fc" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#eef0fd", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  badge: { backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: "flex-start", marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#d97706" },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#eef0fd", borderRadius: 10 },
  markAllText: { fontSize: 13, fontWeight: "600", color: "#4f46e5" },
  filterContainer: { backgroundColor: "#fff", paddingVertical: 12 },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterTab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#f1f5f9" },
  filterTabActive: { backgroundColor: "#4f46e5" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterTextActive: { color: "#fff" },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: "#e2e8f0" },
  filterBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterBadgeText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  filterBadgeTextActive: { color: "#fff" },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#64748b", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#94a3b8", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, flexDirection: "row", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardUnread: { backgroundColor: "#fafbff", shadowOpacity: 0.1, elevation: 4 },
  leftAccent: { width: 4 },
  cardContent: { flex: 1, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#475569", flex: 1 },
  cardTitleUnread: { color: "#0f172a", fontWeight: "700" },
  dot: { width: 8, height: 8, borderRadius: 999 },
  surveyTitle: { fontSize: 13, color: "#64748b", marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  timeText: { fontSize: 11, color: "#94a3b8" },
  deleteBtn: { padding: 4 }
});