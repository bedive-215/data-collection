/**
 * SurveyStudioScreen.jsx
 * React Native — SurveyMonkey-style studio with 3 tabs:
 *   Design  → Edit questions (QuestionScreen)
 *   Send    → Share / Invite / Participants
 *   Analyze → View analytics (SurveyAnalyticsScreen)
 */
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Dimensions, Alert,
  Modal, TextInput, Animated, Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSurvey } from "../../providers/SurveyProvider";
import { COLORS, STATUS_MAP } from "../../utils/constants";

const { width: SW } = Dimensions.get("window");

/* ════════════════════════════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   GLASS CARD
════════════════════════════════════════════════════════════════ */
function GlassCard({ children, style }) {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARE LINK MODAL
════════════════════════════════════════════════════════════════ */
function ShareLinkModal({ open, onClose, survey, onShare }) {
  const mountedRef = React.useRef(true);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!open) {
      setShareUrl(null); setCopied(false); setError("");
      setLoading(false);
      return;
    }
    // Give modal 1 tick to mount before firing API
    const id = setTimeout(() => {
      if (!survey?.id || !mountedRef.current) return;
      setLoading(true); setError("");
      onShare(survey.id)
        .then(result => {
          if (!mountedRef.current) return;
          const url = typeof result === "string"
            ? result
            : result?.url ?? result?.data?.url ?? null;
          if (url) setShareUrl(url);
          else setError("Không lấy được link.");
        })
        .catch(() => { if (mountedRef.current) setError("Tạo link thất bại."); })
        .finally(() => { if (mountedRef.current) setLoading(false); });
    }, 100);
    return () => clearTimeout(id);
  }, [open, survey?.id]);

  const handleCopy = () => {
    if (!shareUrl) return;
    try {
      const Clipboard = require("@react-native-clipboard/clipboard").default;
      Clipboard.setString(shareUrl);
    } catch { Alert.alert("Link", shareUrl); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRetry = () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    onShare(survey.id)
      .then(result => {
        if (!mountedRef.current) return;
        const url = typeof result === "string"
          ? result
          : result?.url ?? result?.data?.url ?? null;
        if (url) setShareUrl(url);
        else setError("Không lấy được link.");
      })
      .catch(() => { if (mountedRef.current) setError("Tạo link thất bại."); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chia sẻ khảo sát</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{survey?.title}</Text>
              <Text style={styles.infoBoxSub}>Tạo link để chia sẻ survey với mọi người</Text>
            </View>
            {!!error && !loading && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleRetry}>
                  <Text style={styles.retryBtn}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
            {loading ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={[styles.infoBoxSub, { marginTop: 10 }]}>Đang tạo link...</Text>
              </View>
            ) : shareUrl ? (
              <View style={styles.urlBox}>
                <Text style={styles.urlText} numberOfLines={3}>{shareUrl}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, copied && styles.copyBtnDone]}
                  onPress={handleCopy}
                >
                  <Text style={[styles.copyBtnText, copied && { color: COLORS.success }]}>
                    {copied ? "✓ Đã sao chép!" : "Sao chép link"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !error ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
                <Text style={styles.primaryBtnText}>🔗 Tạo link chia sẻ</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   INVITE MODAL
════════════════════════════════════════════════════════════════ */
function InviteModal({ open, onClose, survey, onInvite }) {
  const mountedRef = React.useRef(true);
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("respondent");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!open) {
      setEmails(""); setSuccess(false); setError(""); setSentCount(0); setRole("respondent");
      return;
    }
  }, [open]);

  const handleSubmit = () => {
    const list = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!list.length) { setError("Vui lòng nhập ít nhất 1 email."); return; }
    setLoading(true); setError(""); setSuccess(false);
    Promise.all(list.map(email => onInvite(survey.id, { email, role })))
      .then(() => {
        if (!mountedRef.current) return;
        setSentCount(list.length);
        setSuccess(true);
        setEmails("");
      })
      .catch(() => { if (mountedRef.current) setError("Mời không thành công."); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mời người tham gia</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {success && (
              <View style={styles.successRow}>
                <Text style={styles.successText}>✓ Đã gửi lời mời đến {sentCount} địa chỉ email.</Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>Vai trò</Text>
            <View style={styles.roleRow}>
              {[
                { value: "respondent", label: "✏️ Trả lời",   desc: "Làm khảo sát" },
                { value: "viewer",     label: "👁 Xem",        desc: "Chỉ xem câu hỏi" },
                { value: "editor",     label: "🛠 Làm bài",    desc: "Chỉnh sửa khảo sát" },
              ].map(r => {
                const isActive = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleBtn, isActive && styles.roleBtnActive]}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                      {isActive && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleBtnLabel, isActive && styles.roleBtnLabelActive]}>{r.label}</Text>
                      <Text style={styles.roleBtnDesc}>{r.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Địa chỉ email</Text>
            <TextInput
              style={[styles.textarea, !!error && styles.inputError]}
              value={emails}
              onChangeText={t => { setEmails(t); setError(""); }}
              placeholder={"example@email.com\nuser2@email.com"}
              placeholderTextColor={COLORS.textDim}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.primaryBtnSm, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.primaryBtnText}>✉ Gửi lời mời</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   PARTICIPANTS MODAL
════════════════════════════════════════════════════════════════ */
const AV_COLORS = [
  { bg: "#e0e7ff", color: "#3730a3" }, { bg: "#d1fae5", color: "#065f46" },
  { bg: "#fce7f3", color: "#9d174d" }, { bg: "#fef3c7", color: "#78350f" },
  { bg: "#f3e8ff", color: "#5b21b6" },
];
const ROLE_STYLE = {
  viewer:     { color: "#1d4ed8", bg: "#eff6ff" },
  respondent: { color: "#059669", bg: "#ecfdf5" },
  editor:     { color: "#7c3aed", bg: "#f5f3ff" },
};

function getInitials(name, email) {
  if (name) return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (email || "?")[0].toUpperCase();
}

function ParticipantsModal({ open, onClose, survey, onGetParticipants, onDeleteParticipant }) {
  const mountedRef = React.useRef(true);
  const [participants, setParticipants] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmPid, setConfirmPid] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Load participants — called only when modal first opens
  useEffect(() => {
    if (!open || !survey?.id) return;
    mountedRef.current = true;
    setLoading(true); setError(""); setSearch(""); setConfirmPid(null);
    onGetParticipants(survey.id, {})
      .then(res => {
        if (!mountedRef.current) return;
        setParticipants(res?.participants ?? []);
        setCount(res?.count ?? 0);
      })
      .catch(() => { if (mountedRef.current) setError("Không thể tải danh sách."); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => { mountedRef.current = false; };
  }, [open, survey?.id]); // intentionally NOT including onGetParticipants

  const handleDelete = (pid) => {
    if (!survey?.id) return;
    setDeleting(pid);
    onDeleteParticipant(survey.id, pid)
      .then(() => {
        if (!mountedRef.current) return;
        setParticipants(p => p.filter(x => x.participant_id !== pid));
        setCount(c => Math.max(0, c - 1));
        setConfirmPid(null);
      })
      .catch(() => { if (mountedRef.current) setDeleting(null); setConfirmPid(null); })
      .finally(() => { if (mountedRef.current) setDeleting(null); });
  };

  const handleReload = () => {
    if (!survey?.id) return;
    setLoading(true); setError("");
    onGetParticipants(survey.id, {})
      .then(res => {
        if (!mountedRef.current) return;
        setParticipants(res?.participants ?? []);
        setCount(res?.count ?? 0);
      })
      .catch(() => { if (mountedRef.current) setError("Không thể tải danh sách."); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  };

  const filtered = participants.filter(p => {
    const q = search.toLowerCase();
    return p.email?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q);
  });

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <TouchableOpacity style={[styles.modalBox, { maxWidth: SW - 40, maxHeight: "90%" }]} activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quản lý người tham gia</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.participantHeader}>
              <View style={[styles.infoBox, { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }]}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: COLORS.text }}>{count}</Text>
                <Text style={styles.infoBoxSub}>Tổng participants</Text>
              </View>
              <TouchableOpacity onPress={handleReload} disabled={loading} style={styles.reloadBtn}>
                {loading
                  ? <ActivityIndicator size="small" color={COLORS.textSub} />
                  : <Text style={styles.reloadBtnText}>↻ Tải lại</Text>}
              </TouchableOpacity>
            </View>

            {!!error && !loading && (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={handleReload}><Text style={styles.retryBtn}>Thử lại</Text></TouchableOpacity>
              </View>
            )}

            {/* Search */}
            <View style={styles.searchRow}>
              <Text style={{ color: COLORS.textDim, marginRight: 6 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo tên, email..."
                placeholderTextColor={COLORS.textDim}
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text style={{ color: COLORS.textDim }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <ScrollView style={{ maxHeight: 300, marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={[styles.infoBoxSub, { marginTop: 8 }]}>Đang tải...</Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 36 }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>👥</Text>
                  <Text style={styles.infoBoxSub}>{search ? `Không tìm thấy "${search}"` : "Chưa có người tham gia"}</Text>
                </View>
              ) : (
                filtered.map((p, i) => {
                  const av = AV_COLORS[i % AV_COLORS.length];
                  const deleteKey = p.participant_id ?? p.id;
                  const isConfirming = confirmPid === deleteKey;
                  const isDeleting = deleting === deleteKey;
                  const rs = ROLE_STYLE[p.role?.toLowerCase()] ?? { color: COLORS.primary, bg: COLORS.primaryLight };
                  return (
                    <View key={p.participant_id ?? p.id ?? i} style={[styles.participantRow, isConfirming && { backgroundColor: COLORS.errorBg }]}>
                      <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                        <Text style={[styles.avatarText, { color: av.color }]}>{getInitials(p.name, p.email)}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.participantName} numberOfLines={1}>{p.name || p.email}</Text>
                        {p.name && <Text style={styles.participantEmail} numberOfLines={1}>{p.email}</Text>}
                      </View>
                      {p.role && (
                        <View style={[styles.rolePill, { backgroundColor: rs.bg }]}>
                          <Text style={[styles.rolePillText, { color: rs.color }]}>{p.role}</Text>
                        </View>
                      )}
                      {isConfirming ? (
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmPid(null)}>
                            <Text style={styles.cancelBtnText}>Huỷ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.primaryBtn, styles.primaryBtnSm, { backgroundColor: COLORS.error }]}
                            onPress={() => handleDelete(deleteKey)}
                            disabled={isDeleting}
                          >
                            {isDeleting
                              ? <ActivityIndicator color={COLORS.white} size="small" />
                              : <Text style={styles.primaryBtnText}>Xoá</Text>}
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => setConfirmPid(deleteKey)}
                        >
                          <Text style={{ fontSize: 14, color: COLORS.textDim }}>🗑</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {!loading && !error && filtered.length > 0 && !!search && (
              <Text style={[styles.infoBoxSub, { textAlign: "center", marginTop: 6 }]}>
                {filtered.length} / {participants.length} người
              </Text>
            )}
            <View style={{ alignItems: "flex-end", marginTop: 10 }}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════
   SEND PANEL
════════════════════════════════════════════════════════════════ */
function SendPanel({ survey, onShare, onInvite, onPublish, onCloseSurvey, onGetParticipants, onDeleteParticipant }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);

  const isPublished = survey?.is_published;
  const isClosed = survey?.status === "CLOSED";

  const handlePublish = async () => {
    setPublishing(true);
    try { await onPublish(survey.id, { is_published: !isPublished }); }
    catch { Alert.alert("Lỗi", "Không thể cập nhật trạng thái."); }
    finally { setPublishing(false); }
  };

  const handleClose = async () => {
    Alert.alert("Đóng khảo sát", "Sau khi đóng, survey sẽ không nhận thêm câu trả lời. Tiếp tục?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đóng", style: "destructive", onPress: async () => {
        setClosing(true);
        try { await onCloseSurvey(survey.id); }
        catch { Alert.alert("Lỗi", "Không thể đóng khảo sát."); }
        finally { setClosing(false); }
      }},
    ]);
  };

  const ActionCard = ({ title, desc, icon, onPress, color = COLORS.primary, sub, disabled }) => (
    <TouchableOpacity
      style={[styles.actionCard, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View style={styles.actionCardInner}>
        <View style={[styles.actionIcon, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDesc}>{desc}</Text>
          {sub && (
            <View style={[styles.actionSubBadge, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.actionSubText, { color }]}>{sub}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 18, color: COLORS.textDim }}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.sendPanel} showsVerticalScrollIndicator={false}>
      <ActionCard
        title="Chia sẻ link"
        desc="Tạo link công khai để chia sẻ khảo sát với bất kỳ ai"
        icon="🔗"
        onPress={() => setShareOpen(true)}
        color={isPublished ? COLORS.success : COLORS.primary}
        sub={isPublished ? "Đang hoạt động" : "Chưa công khai"}
      />
      <ActionCard
        title="Mời qua email"
        desc="Gửi lời mời khảo sát trực tiếp đến email của người tham gia"
        icon="✉️"
        onPress={() => setInviteOpen(true)}
        color="#7c3aed"
      />
      <ActionCard
        title="Quản lý người tham gia"
        desc="Xem danh sách những người đã được mời tham gia khảo sát này"
        icon="👥"
        onPress={() => setParticipantsOpen(true)}
        color="#0891b2"
      />
      <ActionCard
        title={isPublished ? "Ẩn survey" : "Công khai survey"}
        desc={isPublished ? "Không ai khác có thể trả lời" : "Mọi người đều có thể trả lời"}
        icon={isPublished ? "🔒" : "🌐"}
        onPress={handlePublish}
        color={isPublished ? COLORS.warning : COLORS.success}
        disabled={isClosed || publishing}
      />
      {!isClosed && (
        <ActionCard
          title="Đóng survey"
          desc="Ngừng nhận câu trả lời. Hành động này không thể hoàn tác."
          icon="⏹"
          onPress={handleClose}
          color={COLORS.error}
          disabled={closing}
        />
      )}

      <ShareLinkModal open={shareOpen} onClose={() => setShareOpen(false)} survey={survey} onShare={onShare} />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} survey={survey} onInvite={onInvite} />
      <ParticipantsModal open={participantsOpen} onClose={() => setParticipantsOpen(false)} survey={survey} onGetParticipants={onGetParticipants} onDeleteParticipant={onDeleteParticipant} />
    </ScrollView>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB BAR
════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "design",   label: "Thiết kế",   icon: "✏️" },
  { id: "send",     label: "Gửi khảo sát", icon: "📤" },
  { id: "analyze",  label: "Phân tích",   icon: "📊" },
];

function TabBar({ active, onChange }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map(tab => {
        const is = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, is && styles.tabActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 15 }}>{tab.icon}</Text>
            <Text style={[styles.tabText, is && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export default function SurveyStudioScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const surveyId = route.params?.surveyId;

  const {
    fetchSurveyById, currentSurvey, publishSurvey,
    shareLink, inviteSurvey, closeSurvey,
    getParticipants, deleteParticipant,
  } = useSurvey();

  const [activeTab, setActiveTab] = useState("design");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    fetchSurveyById(surveyId).finally(() => setLoading(false));
  }, [surveyId]);

  const survey = currentSurvey;
  const statusInfo = STATUS_MAP[survey?.status] || STATUS_MAP.DRAFT;

  const handleGoDesign = () => {
    navigation.navigate("QuestionScreen", { surveyId });
  };

  const handleGoAnalytics = () => {
    navigation.navigate("SurveyAnalytics", { surveyId });
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        {/* Survey info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerThumb}>
            <Text style={styles.headerThumbIcon}>📋</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {loading ? "..." : (survey?.title || "Khảo sát")}
              </Text>
              {!loading && <StatusBadge status={survey?.status} />}
            </View>
            {!loading && survey?.description && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {survey.description}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ── TAB BAR ── */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ── CONTENT ── */}
      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải khảo sát...</Text>
          </View>
        )}

        {!loading && activeTab === "design" && (
          <ScrollView contentContainerStyle={styles.designTab} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.designCard}>
              <View style={styles.designIcon}>
                <Text style={{ fontSize: 36 }}>✏️</Text>
              </View>
              <Text style={styles.designTitle}>Thiết kế câu hỏi</Text>
              <Text style={styles.designDesc}>
                Thêm, chỉnh sửa, sắp xếp thứ tự và cấu hình câu hỏi cho khảo sát của bạn.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleGoDesign}>
                <Text style={styles.primaryBtnText}>📝 Mở trình thiết kế</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Quick info */}
            <GlassCard style={styles.quickInfo}>
              <Text style={styles.quickInfoTitle}>Thông tin survey</Text>
              <View style={styles.quickInfoRow}>
                <Text style={styles.quickInfoLabel}>Trạng thái</Text>
                <StatusBadge status={survey?.status} />
              </View>
              <View style={styles.quickInfoRow}>
                <Text style={styles.quickInfoLabel}>Công khai</Text>
                <View style={[styles.boolBadge, survey?.is_published ? styles.boolBadgeYes : styles.boolBadgeNo]}>
                  <Text style={[styles.boolBadgeText, { color: survey?.is_published ? COLORS.success : COLORS.textDim }]}>
                    {survey?.is_published ? "✓ Có" : "✗ Không"}
                  </Text>
                </View>
              </View>
              {survey?.start_at && (
                <View style={styles.quickInfoRow}>
                  <Text style={styles.quickInfoLabel}>Bắt đầu</Text>
                  <Text style={styles.quickInfoValue}>
                    {new Date(survey.start_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
              {survey?.end_at && (
                <View style={styles.quickInfoRow}>
                  <Text style={styles.quickInfoLabel}>Kết thúc</Text>
                  <Text style={styles.quickInfoValue}>
                    {new Date(survey.end_at).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
              {survey?.participant_count != null && (
                <View style={styles.quickInfoRow}>
                  <Text style={styles.quickInfoLabel}>Participants</Text>
                  <Text style={styles.quickInfoValue}>{survey.participant_count}</Text>
                </View>
              )}
            </GlassCard>
          </ScrollView>
        )}

        {!loading && activeTab === "send" && (
          <SendPanel
            survey={survey}
            onShare={shareLink}
            onInvite={inviteSurvey}
            onPublish={publishSurvey}
            onCloseSurvey={closeSurvey}
            onGetParticipants={getParticipants}
            onDeleteParticipant={deleteParticipant}
          />
        )}

        {!loading && activeTab === "analyze" && (
          <ScrollView contentContainerStyle={styles.designTab} showsVerticalScrollIndicator={false}>
            <GlassCard style={styles.designCard}>
              <View style={styles.designIcon}>
                <Text style={{ fontSize: 36 }}>📊</Text>
              </View>
              <Text style={styles.designTitle}>Phân tích kết quả</Text>
              <Text style={styles.designDesc}>
                Xem thống kê, biểu đồ, xu hướng phản hồi và phân tích chi tiết từng câu hỏi.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleGoAnalytics}>
                <Text style={styles.primaryBtnText}>📊 Mở phân tích</Text>
              </TouchableOpacity>
            </GlassCard>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.90)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: COLORS.gray200,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  backBtnText: { fontSize: 20, color: COLORS.text, fontWeight: "300", lineHeight: 24 },
  headerInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0 },
  headerThumb: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerThumbIcon: { fontSize: 16 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, flex: 1, minWidth: 0 },
  headerSub: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 4,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: "700", color: COLORS.textSub },
  tabTextActive: { color: COLORS.white },

  // Content
  content: { flex: 1 },

  // Loading
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  loadingText: { fontSize: 14, color: COLORS.textSub },

  // Design tab
  designTab: { padding: 16, gap: 14 },
  designCard: { alignItems: "center", padding: 24, gap: 12 },
  designIcon: { marginBottom: 4 },
  designTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  designDesc: { fontSize: 13, color: COLORS.textSub, textAlign: "center", lineHeight: 20 },
  quickInfo: { padding: 16, gap: 10 },
  quickInfoTitle: { fontSize: 13, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  quickInfoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quickInfoLabel: { fontSize: 12, color: COLORS.textSub },
  quickInfoValue: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  boolBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  boolBadgeYes: { backgroundColor: COLORS.successBg },
  boolBadgeNo: { backgroundColor: COLORS.gray100 },

  // Send panel
  sendPanel: { padding: 16, gap: 12 },
  actionCard: {
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.gray200, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  actionCardInner: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  actionTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 3 },
  actionDesc: { fontSize: 12, color: COLORS.textSub, lineHeight: 18 },
  actionSubBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start" },
  actionSubText: { fontSize: 11, fontWeight: "700" },

  // Glass card
  glassCard: {
    backgroundColor: COLORS.surface, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.glassBorder,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },

  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700" },

  // Buttons
  primaryBtn: {
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  primaryBtnSm: { paddingVertical: 9, paddingHorizontal: 16 },
  primaryBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.white },
  cancelBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
  cancelBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textSub },
  btnDisabled: { backgroundColor: "rgba(0,0,0,0.07)", shadowOpacity: 0, elevation: 0 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,17,23,0.55)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 460, backgroundColor: "rgba(255,255,255,0.96)", borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: COLORS.glassBorder, shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 10 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  modalTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  modalClose: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" },
  modalCloseText: { fontSize: 13, color: COLORS.textSub },
  modalBody: { padding: 18, gap: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },

  // Info box
  infoBox: { padding: 12, backgroundColor: "rgba(67,97,238,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(67,97,238,0.2)" },
  infoBoxTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  infoBoxSub: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },

  // Form
  textarea: { width: "100%", padding: 10, backgroundColor: "rgba(255,255,255,0.8)", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)", borderRadius: 10, fontSize: 13, color: COLORS.text, minHeight: 90 },
  inputError: { borderColor: COLORS.error },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textSub, textTransform: "uppercase", letterSpacing: 0.6 },
  roleRow: { gap: 8 },
  roleBtn: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  roleBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(67,97,238,0.07)",
  },
  roleBtnLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textSub },
  roleBtnLabelActive: { color: COLORS.primary },
  roleBtnDesc: { fontSize: 11, color: COLORS.textDim, marginTop: 1 },
  searchRow: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(0,0,0,0.07)" },
  searchInput: { flex: 1, fontSize: 12, color: COLORS.text },
  participantHeader: { flexDirection: "row", gap: 10, marginBottom: 12 },
  reloadBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
  reloadBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textSub },

  // Error/success
  errorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, borderRadius: 10, backgroundColor: COLORS.errorBg, borderWidth: 1, borderColor: COLORS.errorBorder },
  errorText: { fontSize: 12, color: COLORS.error, flex: 1 },
  retryBtn: { fontSize: 11, fontWeight: "700", color: COLORS.error, marginLeft: 8 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, backgroundColor: COLORS.successBg, borderWidth: 1, borderColor: COLORS.successBorder },
  successText: { fontSize: 12, fontWeight: "600", color: "#059669", flex: 1 },

  // URL box
  urlBox: { gap: 8 },
  urlText: { fontSize: 12, color: COLORS.text, padding: 10, backgroundColor: "rgba(248,250,255,0.8)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(67,97,238,0.2)" },
  copyBtn: { padding: 10, borderRadius: 10, backgroundColor: "rgba(67,97,238,0.08)", borderWidth: 1, borderColor: "rgba(67,97,238,0.3)", alignItems: "center" },
  copyBtnDone: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  copyBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  // Participants
  participantRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "700" },
  participantName: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  participantEmail: { fontSize: 11, color: COLORS.textSub },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  rolePillText: { fontSize: 10, fontWeight: "700" },

  // Radio button for role selection
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "rgba(0,0,0,0.2)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginRight: 10,
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(67,97,238,0.05)",
  },
  radioInner: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
